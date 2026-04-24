import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', icon: '', label: 'Dashboard' },
  { path: '/documents', icon: '', label: 'Documents' },
  { path: '/chat',      icon: '', label: 'Sid AI' },
  { path: '/profile',  icon: '', label: 'Profile' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const plan = user?.plan || 'free'

  return (
    <>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 99, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">KnowBase AI</div>
          <div className="sidebar-logo-sub">AI Knowledge Assistant</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); onClose?.() }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="plan-badge">
            <strong>{plan === 'pro' ? 'Pro Plan' : 'Free Plan'}</strong>
            {plan === 'free' && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {user?.queries_today || 0}/20 queries today
              </span>
            )}
          </div>

          <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', padding: '0 4px' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '2px 4px' }}>
              {user?.email}
            </div>
          </div>

          <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--red-400)' }}>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
