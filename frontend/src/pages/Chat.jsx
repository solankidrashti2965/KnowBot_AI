import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/client'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

const SUGGESTIONS = [
  'Summarize this document',
  'What are the key points?',
  'What questions does this answer?',
  'Give me the main insights',
  'Explain the main topic simply',
]

function renderMarkdown(text) {
  // Simple markdown renderer for chat bubbles
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^\• (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export default function Chat() {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [docs, setDocs]           = useState([])
  const [selectedDocId, setSelectedDocId] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [listening, setListening] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const bottomRef  = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    // Load docs
    api.get('/documents/').then(r => setDocs(r.data.filter(d => d.status === 'ready')))
    // Load history
    api.get('/chat/history').then(r => {
      const hist = r.data.reverse().map(c => ([
        { role: 'user', content: c.message, id: c.id + '_u' },
        { role: 'ai', content: c.response, sources: c.sources, id: c.id + '_a' },
      ])).flat()
      setMessages(hist)
    }).finally(() => setHistoryLoading(false))

    // Check if coming from Documents page with a specific doc
    const docId = sessionStorage.getItem('chatDocId')
    if (docId) { setSelectedDocId(docId); sessionStorage.removeItem('chatDocId') }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return

    setMessages(prev => [...prev, { role: 'user', content: msg, id: Date.now() + '_u' }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chat/', {
        message: msg,
        document_ids: selectedDocId ? [selectedDocId] : null,
      })
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.data.response,
        sources: res.data.sources,
        id: res.data.id + '_a',
      }])
    } catch (err) {
      const detail = err.response?.data?.detail || 'Something went wrong'
      toast.error(detail)
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `Error: ${detail}`,
        sources: [],
        id: Date.now() + '_err',
      }])
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Voice input
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser'); return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend  = () => setListening(false)
    recognition.start()
    setListening(true)
  }, [])

  // Export chat as PDF
  const exportPDF = () => {
    if (!messages.length) { toast.error('No messages to export'); return }
    const doc = new jsPDF()
    doc.setFont('helvetica')
    doc.setFontSize(16)
    doc.text('Sid AI Export — KnowBase AI', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(new Date().toLocaleString(), 14, 28)
    doc.setTextColor(0, 0, 0)
    let y = 38
    messages.forEach(m => {
      const role = m.role === 'user' ? 'You' : 'Sid AI'
      const lines = doc.splitTextToSize(`[${role}]: ${m.content.replace(/<[^>]+>/g, '')}`, 180)
      if (y + lines.length * 6 > 280) { doc.addPage(); y = 20 }
      doc.setFontSize(10)
      doc.setFont('helvetica', m.role === 'user' ? 'bold' : 'normal')
      doc.text(lines, 14, y)
      y += lines.length * 6 + 6
    })
    doc.save('knowbase-chat.pdf')
    toast.success('Chat exported as PDF!')
  }

  const clearHistory = async () => {
    if (!confirm('Clear all chat history?')) return
    await api.delete('/chat/history')
    setMessages([])
    toast.success('Chat history cleared')
  }

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', padding: '24px 32px', gap: 0 }}>
        {/* Header */}
        <div className="flex-between mb-16">
          <div>
            <h1 className="page-title">Sid AI</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={exportPDF} title="Export as PDF">Export</button>
            <button className="btn btn-ghost btn-sm" onClick={clearHistory} title="Clear history">Clear</button>
          </div>
        </div>

        {/* Document filter */}
        {docs.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4 }}>Search in:</span>
            <button
              className={`chip ${!selectedDocId ? 'active' : ''}`}
              onClick={() => setSelectedDocId(null)}
              style={{
                cursor: 'pointer', border: !selectedDocId ? '1px solid var(--purple-500)' : undefined,
                color: !selectedDocId ? 'var(--purple-400)' : undefined,
              }}
            >
              All documents
            </button>
            {docs.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDocId(selectedDocId === d.id ? null : d.id)}
                className="chip"
                style={{
                  cursor: 'pointer',
                  border: selectedDocId === d.id ? '1px solid var(--purple-500)' : undefined,
                  color: selectedDocId === d.id ? 'var(--purple-400)' : undefined,
                  maxWidth: 180, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}
                title={d.original_name}
              >
                {d.original_name}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '8px 0',
          minHeight: 300, maxHeight: 'calc(100vh - 320px)',
        }}>
          {historyLoading ? (
            <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"></div>
              <h3>Start a conversation</h3>
              <p style={{ marginBottom: 24 }}>
                {docs.length ? 'Ask anything about your documents' : 'Upload a document first, then come back to chat!'}
              </p>
              {docs.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} className="btn btn-ghost btn-sm" onClick={() => sendMessage(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="chat-container">
              {messages.map(m => (
                <div key={m.id} className={`chat-message ${m.role === 'user' ? 'user' : ''}`}>
                  <div className={`chat-avatar ${m.role === 'ai' ? 'ai' : 'user-av'}`}>
                    {m.role === 'ai' ? 'S' : 'U'}
                  </div>
                  <div className={`chat-bubble ${m.role === 'ai' ? 'ai' : 'user-bubble'}`}>
                    {m.role === 'ai' ? (
                      <p dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                    ) : (
                      m.content
                    )}
                    {m.sources?.length > 0 && (
                      <div className="chat-sources">
                        {m.sources.map((s, i) => (
                          <span key={i} className="source-chip">
                            {s.document_name} · p.{s.page}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-message">
                  <div className="chat-avatar ai">S</div>
                  <div className="chat-bubble ai">
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Suggestions (shown when messages exist) */}
        {messages.length > 0 && docs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {SUGGESTIONS.slice(0, 3).map(s => (
              <button key={s} className="btn btn-ghost btn-sm" onClick={() => sendMessage(s)} disabled={loading}>{s}</button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="chat-input-bar">
          <textarea
            ref={textareaRef}
            id="chat-input"
            className="chat-textarea"
            placeholder={docs.length ? 'Ask anything about your documents… (Enter to send, Shift+Enter for new line)' : 'Upload documents first to start chatting…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
          />
          <button
            id="voice-input-btn"
            className="btn btn-ghost"
            style={{ padding: '0 10px', height: 38, borderRadius: 10, flexShrink: 0, color: listening ? 'var(--red-400)' : 'var(--text-muted)' }}
            onClick={startListening}
            disabled={loading}
            title="Voice input"
          >
            {listening ? 'Listen' : 'Voice'}
          </button>
          <button
            id="chat-send-btn"
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  )
}
