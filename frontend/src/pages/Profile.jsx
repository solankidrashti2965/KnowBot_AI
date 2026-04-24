import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, refreshUser, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [upgradingDemo, setUpgradingDemo] = useState(false)

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return }
    setSaving(true)
    try {
      await api.patch('/auth/me', { name: name.trim() })
      await refreshUser()
      toast.success('Name updated!')
    } catch {
      toast.error('Failed to update name')
    } finally { setSaving(false) }
  }

  // Demo upgrade — toggles plan in DB for presentation purposes
  const handleDemoUpgrade = async () => {
    setUpgradingDemo(true)
    try {
      await api.patch('/auth/me/plan', { plan: user?.plan === 'pro' ? 'free' : 'pro' })
      await refreshUser()
      toast.success(user?.plan === 'pro' ? 'Switched to Free plan' : '🎉 Upgraded to Pro!')
    } catch {
      toast.error('Demo upgrade failed — add /auth/me/plan endpoint to backend')
    } finally { setUpgradingDemo(false) }
  }

  const planColor = user?.plan === 'pro' ? 'var(--purple-400)' : 'var(--cyan-400)'
  const planLabel = user?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account and subscription</p>
        </div>

        <div className="grid-2" style={{ gap: 20, maxWidth: 900 }}>
          {/* Account Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, var(--purple-500), var(--cyan-500))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 6, background: `${planColor}15`, color: planColor,
                  border: `1px solid ${planColor}40`, borderRadius: 99,
                  padding: '2px 10px', fontSize: 12, fontWeight: 700,
                }}>
                  {planLabel}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveName}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  id="profile-name"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
              </div>
              <button
                id="save-profile-btn"
                type="submit"
                className="btn btn-primary"
                disabled={saving || name.trim() === user?.name}
              >
                {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Stats + Plan Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Usage Stats */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                Your Usage
              </div>
              {[
                { label: 'Member since', value: memberSince, icon: '📅' },
                { label: 'Documents uploaded', value: user?.total_docs ?? 0, icon: '📂' },
                { label: 'Queries today', value: `${user?.queries_today ?? 0}${user?.plan === 'free' ? ' / 20' : ' (unlimited)'}`, icon: '💬' },
                { label: 'Current plan', value: user?.plan === 'pro' ? 'Pro ⚡' : 'Free', icon: '⭐' },
              ].map(row => (
                <div key={row.label} className="flex-between" style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Plan Card */}
            <div className="card" style={{
              background: user?.plan === 'pro'
                ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))'
                : 'var(--bg-card)',
              border: user?.plan === 'pro' ? '1px solid var(--purple-500)' : '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                {user?.plan === 'pro' ? 'You are on Pro' : 'Upgrade to Pro'}
              </div>
              {user?.plan !== 'pro' ? (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                    Unlimited documents, unlimited queries, 50MB file uploads, lifetime chat history.
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {['Unlimited documents', 'Unlimited AI queries/day', '50MB file size limit', 'Lifetime chat history'].map(f => (
                      <li key={f} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--green-400)', fontWeight: 700 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    id="upgrade-btn"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleDemoUpgrade}
                    disabled={upgradingDemo}
                  >
                    {upgradingDemo ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Processing…</> : 'Upgrade to Pro — $12/mo'}
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                    Demo mode — toggles Pro instantly for presentation
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    You have unlimited access to all features. Thank you for supporting KnowBase AI!
                  </p>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleDemoUpgrade}
                    disabled={upgradingDemo}
                  >
                    Switch to Free (demo)
                  </button>
                </>
              )}
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red-400)', marginBottom: 12 }}>Account Actions</div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => { if (confirm('Sign out of KnowBase AI?')) logout() }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
