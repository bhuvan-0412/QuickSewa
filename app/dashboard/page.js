'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useLang } from '../lib/language'
import LangToggle from '../components/LangToggle'

const STATUS_COLOR = { open: '#dc2626', 'in-progress': '#d97706', resolved: '#16a34a' }
const SEVERITY_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }
const CATEGORY_EMOJI = {
  Pothole: '🕳️', Garbage: '🗑️', Streetlight: '💡',
  Waterlogging: '💧', Encroachment: '🚧', Other: '📌'
}

export default function Dashboard() {
  const { t } = useLang()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [error, setError] = useState(null)

  const statusLabel = {
    open: t.open,
    'in-progress': t.inProgress,
    resolved: t.resolved
  }

  function login() {
    if (password === 'officer123') setAuthed(true)
    else alert('Wrong password')
  }

  useEffect(() => {
    if (!authed) return
    fetchAll()
  }, [authed])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
      if (fetchError) throw fetchError

      // Sort automatically: urgent DESC, upvotes DESC
      const sorted = (data || []).sort((a, b) => {
        const aUrgent = a.urgent === true || a.urgent === 'true' ? 1 : 0
        const bUrgent = b.urgent === true || b.urgent === 'true' ? 1 : 0
        if (aUrgent !== bUrgent) {
          return bUrgent - aUrgent
        }
        return (b.upvotes || 0) - (a.upvotes || 0)
      })

      setComplaints(sorted)
    } catch (err) {
      console.error("Dashboard failed to fetch complaints:", err)
      setError("Failed to load complaints from the server.")
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', id)
      if (updateError) throw updateError
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    } catch (err) {
      console.error("Dashboard failed to update status:", err)
      alert("Failed to update status. Please try again.")
    }
  }

  function timeAgo(dateStr) {
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
    if (hrs < 1) return t.justNow
    if (hrs < 24) return `${hrs} ${t.hoursAgo}`
    return `${Math.floor(hrs / 24)} ${t.daysAgo}`
  }

  function slaLabel(dateStr, status) {
    if (status === 'resolved') return { text: t.resolved, color: '#16a34a' }
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
    const remaining = 72 - hrs
    if (remaining < 0) return { text: `${Math.abs(remaining)} ${t.hoursOverdue}`, color: '#dc2626' }
    if (remaining < 24) return { text: `${remaining} ${t.hoursRemaining}`, color: '#dc2626' }
    return { text: `${remaining} ${t.hoursRemaining}`, color: '#d97706' }
  }

  const filtered = filterStatus === 'all'
    ? complaints
    : complaints.filter(c => c.status === filterStatus)

  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  }

  if (!authed) {
    return (
      <main style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', padding: '2rem',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 100
        }}>
          <LangToggle />
        </div>

        <div style={{
          background: 'white', borderRadius: 20,
          padding: '2.5rem', maxWidth: 380, width: '100%',
          border: '1px solid #e5e7eb', textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>🏛️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#14532d', marginBottom: 6 }}>
            {t.officerLogin}
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: '1.5rem' }}>
            {t.officerDashboard}
          </p>
          <input
            type="password"
            placeholder={t.enterPassword}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{
              width: '100%', padding: '0.85rem 1rem',
              border: '1px solid #e5e7eb', borderRadius: 12,
              fontSize: 15, marginBottom: 12, color: '#111827',
              background: '#f9fafb'
            }}
          />
          <button
            onClick={login}
            style={{
              width: '100%', background: '#16a34a',
              color: 'white', padding: '0.9rem',
              borderRadius: 12, fontSize: 16, fontWeight: 700,
              minHeight: '48px', cursor: 'pointer', border: 'none'
            }}>
            {t.loginBtn}
          </button>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: '1rem' }}>
            {t.demoPassword}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '3rem' }}>

      <div style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ fontSize: 20, color: '#374151', minHeight: '48px', display: 'flex', alignItems: 'center' }}>←</Link>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#14532d', margin: 0 }}>
              {t.dashboardTitle}
            </h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{t.dashboardSub}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={fetchAll}
            style={{
              background: '#f0fdf4', color: '#15803d',
              padding: '0.5rem 1rem', borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              border: '1px solid #bbf7d0',
              minHeight: '48px', cursor: 'pointer'
            }}>
            {t.refresh}
          </button>
          <LangToggle />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, padding: '1.25rem 1.5rem'
      }}>
        {[
          { label: t.total, value: stats.total, color: '#374151' },
          { label: t.open, value: stats.open, color: '#dc2626' },
          { label: t.inProgress, value: stats.inProgress, color: '#d97706' },
          { label: t.resolved, value: stats.resolved, color: '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white', borderRadius: 14,
            padding: '1rem', border: '1px solid #e5e7eb', textAlign: 'center'
          }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2, margin: '2px 0 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 1.5rem', marginBottom: '1rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['all', 'open', 'in-progress', 'resolved'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 99, fontSize: 13, fontWeight: 500,
              border: filterStatus === s ? '2px solid #16a34a' : '1px solid #e5e7eb',
              background: filterStatus === s ? '#f0fdf4' : 'white',
              color: filterStatus === s ? '#15803d' : '#6b7280',
              cursor: 'pointer', minHeight: '36px',
              display: 'flex', alignItems: 'center'
            }}>
            {s === 'all' ? t.filterAll : (s === 'open' ? t.open : (s === 'in-progress' ? t.inProgress : t.resolved))}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error ? (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: 12, padding: '1rem', color: '#dc2626',
            textAlign: 'center', fontSize: 14, fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        ) : loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>{t.loading}</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>{t.noComplaints}</p>
        ) : (
          filtered.map(c => {
            const sla = slaLabel(c.created_at, c.status)
            return (
              <div key={c.id} style={{
                background: 'white', borderRadius: 16,
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', gap: 0 }}>
                  {c.photo_url && (
                    <img
                      src={c.photo_url}
                      alt=""
                      style={{ width: 90, height: 90, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ padding: '0.875rem 1rem', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[c.category] || '📌'}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                        {t.categories[c.category] || c.category}
                      </span>
                      
                      {/* urgent badge in red if urgent is true */}
                      {(c.urgent === true || c.urgent === 'true') && (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 800,
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5'
                        }}>
                          🚨 URGENT
                        </span>
                      )}

                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                        background: `${STATUS_COLOR[c.status]}15`,
                        color: STATUS_COLOR[c.status],
                        border: `1px solid ${STATUS_COLOR[c.status]}30`
                      }}>{statusLabel[c.status]}</span>

                      {/* confidence score as a small tag */}
                      {c.confidence !== undefined && c.confidence !== null && c.confidence > 0 && (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                          background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0'
                        }}>
                          🤖 {c.confidence}% Match
                        </span>
                      )}

                      {/* department tag */}
                      {c.department && (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                          background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe'
                        }}>
                          🏢 {c.department}
                        </span>
                      )}

                      {/* estimated repair cost */}
                      {c.estimated_repair && (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                          background: '#f8fafc', color: '#4b5563', border: '1px solid #e2e8f0'
                        }}>
                          🛠️ {c.estimated_repair}
                        </span>
                      )}
                    </div>

                    {c.title && (
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '4px 0 6px 0' }}>
                        {c.title}
                      </h3>
                    )}

                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4, margin: '0 0 4px 0' }}>
                      📍 {c.ward} · {timeAgo(c.created_at)} · 👍 {c.upvotes}
                    </p>
                    {c.description && (
                      <p style={{ fontSize: 13, color: '#374151', marginBottom: 4, lineHeight: 1.4, margin: '0 0 4px 0' }}>
                        {c.description}
                      </p>
                    )}
                    <p style={{ fontSize: 12, fontWeight: 600, color: sla.color, margin: 0 }}>
                      ⏱ {sla.text}
                    </p>
                  </div>
                </div>

                <div style={{
                  padding: '0.75rem 1rem',
                  borderTop: '1px solid #f3f4f6',
                  display: 'flex', gap: 8, flexWrap: 'wrap'
                }}>
                  {c.status !== 'in-progress' && c.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(c.id, 'in-progress')}
                      style={{
                        padding: '0.45rem 1rem', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                        minHeight: '36px', cursor: 'pointer'
                      }}>
                      {t.markInProgress}
                    </button>
                  )}
                  {c.status !== 'resolved' && (
                    <button
                      onClick={() => updateStatus(c.id, 'resolved')}
                      style={{
                        padding: '0.45rem 1rem', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                        minHeight: '36px', cursor: 'pointer'
                      }}>
                      {t.markResolved}
                    </button>
                  )}
                  {c.status === 'resolved' && (
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, padding: '0.45rem 0' }}>
                      {t.issueResolved}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

    </main>
  )
}