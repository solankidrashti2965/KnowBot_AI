import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Sidebar from '../components/Sidebar'
import api from '../api/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

function FileCard({ doc, onDelete, onChat }) {
  const fmtBytes = (b) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1024 / 1024).toFixed(1)} MB`
  }

  const timeAgo = doc.created_at
    ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })
    : ''

  return (
    <div className="file-card">
      <div className="file-card-icon"></div>
      <div className="file-card-info">
        <div className="file-card-name" title={doc.original_name}>{doc.original_name}</div>
        <div className="file-card-meta">
          {fmtBytes(doc.file_size)} · {doc.page_count > 0 ? `${doc.page_count} units · ` : ''} {doc.chunk_count} chunks · {timeAgo}
        </div>
        <div style={{ marginTop: 8 }}>
          <span className={`status-badge ${doc.status}`}>
            <span className="status-dot" /> {doc.status}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {doc.status === 'ready' && (
          <button className="btn btn-ghost btn-sm" onClick={() => onChat(doc.id)}>Chat</button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(doc.id)}>Delete</button>
      </div>
    </div>
  )
}

export default function Documents() {
  const [docs, setDocs]           = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const loadDocs = () => {
    api.get('/documents/')
      .then(r => setDocs(r.data))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDocs()
    // Poll every 4s for processing status updates
    const interval = setInterval(loadDocs, 4000)
    return () => clearInterval(interval)
  }, [])

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      setUploading(true)
      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success(`${file.name} uploaded! Processing…`)
        loadDocs()
      } catch (err) {
        toast.error(err.response?.data?.detail || `Failed to upload ${file.name}`)
      } finally {
        setUploading(false)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'text/plain': ['.txt', '.md'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true,
    disabled: uploading,
  })

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    try {
      await api.delete(`/documents/${docId}`)
      toast.success('Document deleted')
      setDocs(prev => prev.filter(d => d.id !== docId))
    } catch { toast.error('Failed to delete document') }
  }

  const handleChat = (docId) => {
    sessionStorage.setItem('chatDocId', docId)
    window.location.href = '/chat'
  }

  const readyCount      = docs.filter(d => d.status === 'ready').length
  const processingCount = docs.filter(d => d.status === 'processing').length

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Documents</h1>
            <p className="page-subtitle">
              {readyCount} ready · {processingCount} processing · Upload docs to start chatting
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="chip">{docs.length} / 5 free</span>
          </div>
        </div>

        {/* Upload Zone */}
        <div {...getRootProps()} className={`upload-zone mb-24 ${isDragActive ? 'drag-active' : ''}`}>
          <input {...getInputProps()} id="file-upload-input" />
          <div className="upload-zone-icon">
            {uploading ? <div className="spinner" /> : <span style={{ fontSize: 28 }}></span>}
          </div>
          <div className="upload-zone-title">
            {isDragActive ? 'Drop them here!' : uploading ? 'Uploading…' : 'Drag & drop files or images'}
          </div>
          <p className="upload-zone-sub">or click to browse · PDF, Word, PPT, Image, Text · Max 10MB</p>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="flex-center" style={{ height: 200 }}>
            <div className="spinner" />
          </div>
        ) : docs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {docs.map(doc => (
              <FileCard
                key={doc.id}
                doc={doc}
                onDelete={handleDelete}
                onChat={handleChat}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>No documents yet</h3>
            <p>Upload a PDF, Word, PPT, or Image to start chatting with your data!</p>
          </div>
        )}
      </main>
    </div>
  )
}
