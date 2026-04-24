import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Signup() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { signup } = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signup(name, email, password)
      toast.success('Account created! Welcome aboard')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"></div>
          <div className="auth-logo-text grad-text">KnowBase AI</div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start chatting with your documents for free</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              id="signup-name"
              type="text" className="form-input"
              placeholder="Jane Smith"
              value={name} onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              id="signup-email"
              type="email" className="form-input"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="signup-password"
              type="password" className="form-input"
              placeholder="Min. 6 characters"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button id="signup-submit" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</> : 'Create Free Account'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          By signing up you agree to our terms of service.
        </p>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: 6 }}>
          <Link to="/">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
