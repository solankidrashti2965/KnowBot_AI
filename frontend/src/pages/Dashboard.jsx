import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}20`, color }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 14px', fontSize: 13,
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ color: 'var(--purple-400)', fontWeight: 700 }}>{payload[0].value} queries</div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fmtBytes = (b) => {
    if (!b) return '0 B'
    if (b < 1024) return `${b} B`
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1024 / 1024).toFixed(1)} MB`
  }

  const queryPct = stats ? Math.min((stats.queries_today / (stats.queries_limit || 20)) * 100, 100) : 0

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here's your knowledge overview.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>
            Start Chatting
          </button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: 300 }}>
            <div className="spinner" />
          </div>
        ) : stats ? (
          <>
            {/* Stat cards */}
            <div className="dashboard-grid mb-24">
              <StatCard icon="" value={stats.total_docs} label="Documents" sub="Ready for chat" color="var(--purple-400)" />
              <StatCard icon="" value={stats.total_chats} label="Total Chats" sub="All time" color="var(--cyan-400)" />
              <StatCard icon="" value={stats.queries_today} label="Queries Today"
                sub={stats.queries_limit > 0 ? `of ${stats.queries_limit} limit` : 'Unlimited'}
                color="var(--orange-400)" />
              <StatCard icon="" value={fmtBytes(stats.storage_used)} label="Storage Used" sub={`${stats.plan} plan`} color="var(--green-400)" />
            </div>

            {/* Query limit bar (free plan) */}
            {stats.plan === 'free' && (
              <div className="card mb-24" style={{ padding: '20px 24px' }}>
                <div className="flex-between mb-8">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Daily Query Usage</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stats.queries_today} / {stats.queries_limit}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${queryPct}%` }} />
                </div>
                {queryPct >= 80 && (
                  <p style={{ fontSize: 12, color: 'var(--orange-400)', marginTop: 8 }}>
                    Almost at your daily limit. Upgrade to Pro for unlimited queries!
                  </p>
                )}
              </div>
            )}

            <div className="grid-2 mb-24">
              {/* Activity Chart */}
              <div className="chart-card">
                <div className="chart-title">Query Activity — Last 7 Days</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.chart_data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#6b6285', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b6285', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="queries" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gPurple)" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Documents */}
              <div className="chart-card">
                <div className="flex-between mb-16">
                  <div className="chart-title" style={{ marginBottom: 0 }}>Recent Documents</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/documents')}>View all →</button>
                </div>
                {stats.recent_docs?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.recent_docs.map((doc, i) => (
                      <div key={i} className="flex-between" style={{ padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 160 }}>{doc.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtBytes(doc.size)} · {doc.pages} pages</div>
                          </div>
                        </div>
                        <span className={`status-badge ${doc.status}`}>
                          <span className="status-dot" /> {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-state-icon"></div>
                    <h3>No documents yet</h3>
                    <button className="btn btn-primary btn-sm mt-8" onClick={() => navigate('/documents')}>Upload your first PDF</button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="chart-title">Quick Actions</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => navigate('/chat')}>Open Sid AI Chat</button>
                <button className="btn btn-ghost" onClick={() => navigate('/documents')}>Upload Documents</button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>Failed to load stats</h3>
            <p>Please check your connection and try again.</p>
          </div>
        )}
      </main>
    </div>
  )
}
