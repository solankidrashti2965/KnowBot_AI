import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const features = [
  { icon: '', title: 'RAG-Powered Chat', desc: 'Ask questions in natural language. Our AI retrieves the exact context from your documents and generates accurate, sourced answers.' },
  { icon: '', title: 'Multi-Document Upload', desc: 'Upload PDFs, research papers, notes, resumes. Your knowledge base grows with every document you add.' },
  { icon: '', title: 'Private & Secure', desc: 'Your data stays yours. All embeddings run locally on your machine. JWT-secured endpoints ensure only you access your documents.' },
  { icon: '', title: 'Usage Dashboard', desc: 'Track your chat history, document count, and query activity with beautiful charts — all in real time.' },
  { icon: '', title: 'Voice Input', desc: 'Too lazy to type? Use your voice. Speech-to-text powered by the browser Web Speech API — no extra setup.' },
  { icon: '', title: 'Export as PDF', desc: 'Save your entire Sid AI conversation as a beautifully formatted PDF — perfect for sharing or archiving insights.' },
]

const steps = [
  { step: '01', icon: '', title: 'Upload Your Documents', desc: 'Drag & drop any PDF — research papers, notes, resumes, textbooks. We parse and embed them instantly.' },
  { step: '02', icon: '', title: 'Ask Anything', desc: 'Type or speak your question. Our Sid AI searches through every page to find the most relevant answer.' },
  { step: '03', icon: '', title: 'Get Cited Answers', desc: 'Receive precise Sid AI-generated answers with source citations and exact page numbers — no hallucinations.' },
]

const techStack = [
  { label: 'Frontend', items: ['React 18', 'Vite', 'Recharts'] },
  { label: 'Backend', items: ['FastAPI', 'Motor', 'Pydantic'] },
  { label: 'AI / RAG', items: ['Llama 3 (Groq)', 'FAISS', 'LangChain'] },
  { label: 'Database', items: ['MongoDB Atlas', 'JWT Auth', 'bcrypt'] },
]

export default function Landing() {
  const canvasRef = useRef(null)

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width  = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const NUM = 55
    const particles = Array.from({ length: NUM }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = window.innerWidth
        if (p.x > window.innerWidth) p.x = 0
        if (p.y < 0) p.y = window.innerHeight
        if (p.y > window.innerHeight) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,214,98,${p.opacity})`
        ctx.fill()
      })
      // Draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(255,214,98,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-logo grad-text">KnowBase AI</div>
        <div className="landing-nav-links">
          <a href="#features" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>Features</a>
          <a href="#how-it-works" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>How it works</a>
          <a href="#pricing" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>Pricing</a>
          <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Animated particle canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
        />
        {/* Gradient orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(255,214,98,0.18) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none',
          animation: 'float 10s ease-in-out infinite reverse',
        }} />

        <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>

          <h1 className="hero-title">
            Chat With Your{' '}
            <span className="grad-text">Documents</span>{' '}
            Using AI
          </h1>
          <p className="hero-sub">
            Upload PDFs, ask anything, get instant AI answers with{' '}
            <strong style={{ color: 'var(--purple-400)' }}>page-level citations</strong>.
            Your personal ChatGPT — but for <em>your</em> private knowledge base.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg" style={{ minWidth: 200 }}>
              Start for Free — No card needed
            </Link>
            <Link to="/login" className="btn btn-ghost btn-lg">
              Sign In →
            </Link>
          </div>


        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-sub">A complete AI-powered knowledge management platform — built with a 100% free stack</p>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 48px', maxWidth: 960, margin: '0 auto' }} id="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-sub">Three steps to supercharge your knowledge in minutes</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 48 }}>
          {steps.map((s, i) => (
            <div key={s.step} style={{ position: 'relative', flex: '1 1 260px', maxWidth: 280 }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', right: -22, top: '30%',
                  fontSize: 20, color: 'var(--text-muted)', zIndex: 2,
                  display: 'none', // hidden on mobile
                }}>→</div>
              )}
              <div className="card" style={{ textAlign: 'left', height: '100%' }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: 'var(--purple-500)',
                  opacity: 0.5, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
                }}>Step {s.step}</div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* Pricing */}
      <section className="pricing-section" id="pricing">
        <h2 className="section-title">Simple Pricing</h2>
        <p className="section-sub">Start free. Upgrade when you need more.</p>
        <div className="pricing-grid">
          {/* Free */}
          <div className="pricing-card">
            <div className="pricing-plan">Free</div>
            <div className="pricing-price">$0 <span>/ month</span></div>
            <p className="pricing-desc">Perfect to get started — no credit card required</p>
            <ul className="pricing-features">
              <li>5 documents</li>
              <li>20 AI queries per day</li>
              <li>10 MB file size limit</li>
              <li>7-day chat history</li>
              <li>Voice input + PDF export</li>
            </ul>
            <Link to="/signup" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              Get Started Free
            </Link>
          </div>
          {/* Pro */}
          <div className="pricing-card popular">
            <div className="popular-badge">Most Popular</div>
            <div className="pricing-plan">Pro</div>
            <div className="pricing-price grad-text">$12 <span>/ month</span></div>
            <p className="pricing-desc">For power users & teams who need more</p>
            <ul className="pricing-features">
              <li>Unlimited documents</li>
              <li>Unlimited AI queries</li>
              <li>50 MB file size limit</li>
              <li>Lifetime chat history</li>
              <li>Voice input + PDF export</li>
            </ul>
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Start Pro Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '60px 48px', textAlign: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
          border: '1px solid var(--border)',
          borderRadius: 24, padding: '48px 32px', maxWidth: 700, margin: '0 auto',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200,
            background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, letterSpacing: -0.5 }}>
            Ready to chat with your documents?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 28, lineHeight: 1.6 }}>
            Join KnowBase AI — free forever, no credit card required.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        <div className="grad-text" style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>KnowBase AI</div>
        <p style={{ marginTop: 8 }}>© 2024 KnowBase AI. Open-source & free to self-host.</p>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 8px rgba(139,92,246,0.8); }
          50% { text-shadow: 0 0 20px rgba(255,214,98,0.5); }
        }
      `}</style>
    </div>
  )
}
