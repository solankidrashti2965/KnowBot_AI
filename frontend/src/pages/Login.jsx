import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"></div>
          <div className="auth-logo-text grad-text">KnowBase AI</div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your AI knowledge assistant</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              id="login-email"
              type="email" className="form-input"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password" className="form-input"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</> : 'Sign In →'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up free</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: 6 }}>
          <Link to="/">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
