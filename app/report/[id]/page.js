'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

const STATUS_COLOR = { open: '#dc2626', 'in-progress': '#d97706', resolved: '#16a34a' }
const STATUS_BG = { open: '#fef2f2', 'in-progress': '#fffbeb', resolved: '#f0fdf4' }
const STATUS_LABEL = { open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved' }
const SEVERITY_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }
const CATEGORY_EMOJI = {
  Pothole: '🕳️', Garbage: '🗑️', Streetlight: '💡',
  Waterlogging: '💧', Encroachment: '🚧', Other: '📌'
}

export default function ComplaintReport() {
  const params = useParams()
  const router = useRouter()
  const id = params.id

  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [upvoting, setUpvoting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchComplaint()
    }
  }, [id])

  async function fetchComplaint() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchError) throw fetchError
      setComplaint(data)
    } catch (err) {
      console.error('Failed to load complaint report:', err)
      setError('Unable to locate this complaint report. It may have been removed or does not exist.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpvote() {
    if (!complaint || upvoting) return
    setUpvoting(true)
    try {
      const updatedUpvotes = (complaint.upvotes || 0) + 1
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ upvotes: updatedUpvotes })
        .eq('id', complaint.id)
      if (updateError) throw updateError
      setComplaint(prev => ({ ...prev, upvotes: updatedUpvotes }))
    } catch (err) {
      console.error('Failed to register upvote:', err)
      alert('Could not update upvotes. Please try again.')
    } finally {
      setUpvoting(false)
    }
  }

  function handleShare() {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      const day = date.getDate()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      let hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`
    } catch (e) {
      return dateStr
    }
  }

  function getSlaStatus(dateStr, status) {
    if (status === 'resolved') {
      return { text: 'Resolved — SLA Closed', color: '#16a34a', bg: '#f0fdf4' }
    }
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
    const remaining = 72 - hrs
    if (remaining < 0) {
      return {
        text: `🚨 SLA Overdue by ${Math.abs(remaining)}h (Escalated to GHMC Supervisor)`,
        color: '#dc2626',
        bg: '#fef2f2'
      }
    }
    return {
      text: `⏱️ ${remaining}h remaining for resolution (On Track)`,
      color: '#d97706',
      bg: '#fffbeb'
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ fontSize: 16, color: '#6b7280' }}>Loading official grievance report...</p>
      </main>
    )
  }

  if (error || !complaint) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '2rem', maxWidth: 440, width: '100%', border: '1px solid #fca5a5', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#b91c1c', marginBottom: 12 }}>Report Not Found</h2>
          <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: '1.5rem' }}>{error || 'The requested complaint details could not be loaded.'}</p>
          <Link href="/map" style={{ display: 'block', background: '#16a34a', color: 'white', padding: '0.8rem', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Go back to Live Map
          </Link>
        </div>
      </main>
    )
  }

  const shortId = complaint.id.slice(0, 8).toUpperCase()
  const sla = getSlaStatus(complaint.created_at, complaint.status)

  return (
    <main style={{ minHeight: '100vh', background: '#f0fdf4', padding: '2rem 1rem', paddingBottom: '4rem' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      ` }} />

      {/* Control row */}
      <div className="no-print" style={{ maxWidth: 680, margin: '0 auto 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/map" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 600, textDecoration: 'none', fontSize: 15, padding: '8px 16px', background: 'white', borderRadius: 10, border: '1px solid #bbf7d0', minHeight: '48px' }}>
          ← Back to Live Map
        </Link>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleShare} style={{ background: 'white', border: '1px solid #bbf7d0', color: '#166534', fontWeight: 600, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 14, minHeight: '48px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            🔗 {copied ? 'Copied URL!' : 'Share URL'}
          </button>
          <button onClick={() => window.print()} style={{ background: '#16a34a', border: 'none', color: 'white', fontWeight: 700, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 14, minHeight: '48px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            🖨️ Print Document
          </button>
        </div>
      </div>

      {/* Main printable sheet */}
      <div className="print-card" style={{ maxWidth: 680, margin: '0 auto', background: 'white', border: '1px solid #bbf7d0', borderRadius: 24, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative Green Top Border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: '#16a34a' }} />

        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f0fdf4', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>📍</span>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#14532d', margin: 0, letterSpacing: '-0.5px' }}>QuickSewa</h1>
            </div>
            <p style={{ fontSize: 12, color: '#166534', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Greater Hyderabad Municipal Corporation</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Grievance ID</span>
            <span style={{ display: 'inline-block', background: '#f3f4f6', color: '#1f2937', fontWeight: 800, fontSize: 15, padding: '4px 10px', borderRadius: 8, fontFamily: 'monospace' }}>#{shortId}</span>
          </div>
        </div>

        {/* SLA Status Bar & RED urgent badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '2rem' }}>
          {complaint.urgent && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', margin: 0 }}>
                CRITICAL EMERGENCY — Immediate civic hazard detected.
              </p>
            </div>
          )}
          
          <div style={{ background: sla.bg, border: `1px solid ${sla.color}33`, borderRadius: 12, padding: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: sla.color, margin: 0 }}>{sla.text}</p>
          </div>
        </div>

        {/* Complaint Body Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {complaint.title && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                {complaint.title}
              </h2>
            </div>
          )}

          {/* Grid Layout of parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', background: '#f9fafb', padding: '1.25rem', borderRadius: 16, border: '1px solid #f3f4f6' }}>
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Category</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {CATEGORY_EMOJI[complaint.category] || '📌'} {complaint.category}
              </span>
            </div>
            
            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Status</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 12px', borderRadius: 99, fontWeight: 700,
                background: STATUS_BG[complaint.status] || '#f3f4f6',
                color: STATUS_COLOR[complaint.status] || '#6b7280',
                border: `1px solid ${(STATUS_COLOR[complaint.status])}30`
              }}>
                ● {STATUS_LABEL[complaint.status]}
              </span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Ward Location</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                📍 {complaint.ward}
              </span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Filed On</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                🕒 {formatDate(complaint.created_at)}
              </span>
            </div>

            {/* Department tag */}
            {complaint.department && (
              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>GHMC Department</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>
                  🏢 {complaint.department}
                </span>
              </div>
            )}

            {/* Estimated Repair Cost */}
            {complaint.estimated_repair && (
              <div>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>Estimated Repair Cost</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                  🛠️ {complaint.estimated_repair}
                </span>
              </div>
            )}
          </div>

          {/* AI Confidence gauge card */}
          {complaint.confidence !== undefined && complaint.confidence !== null && complaint.confidence > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #d1fae5', padding: '1rem', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                <span>AI Confidence Gauge</span>
                <span>{complaint.confidence}% accurate match</span>
              </div>
              <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${complaint.confidence}%`,
                  background: complaint.confidence >= 80 ? '#16a34a' : complaint.confidence >= 60 ? '#d97706' : '#dc2626',
                  borderRadius: 99
                }} />
              </div>
            </div>
          )}

          {/* Description */}
          {complaint.description && (
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Description</h3>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: 0, padding: '1rem', background: '#f8fafc', borderRadius: 12, borderLeft: '4px solid #16a34a' }}>
                {complaint.description}
              </p>
            </div>
          )}

          {/* Secondary Issues array pills */}
          {(() => {
            if (!complaint.secondary_issues) return null
            try {
              const parsed = typeof complaint.secondary_issues === 'string'
                ? JSON.parse(complaint.secondary_issues)
                : complaint.secondary_issues
              if (!Array.isArray(parsed) || parsed.length === 0) return null
              return (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Secondary Observations</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.map(issue => (
                      <span key={issue} style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid #e5e7eb' }}>
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )
            } catch (e) {
              return null
            }
          })()}

          {/* Photo evidence */}
          {complaint.photo_url && (
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Uploaded Photo Evidence</h3>
              <img
                src={complaint.photo_url}
                alt="Civic Issue Evidence"
                style={{
                  width: '100%', borderRadius: 16, maxHeight: 400, objectFit: 'cover', border: '1px solid #e5e7eb'
                }}
              />
            </div>
          )}

          {/* Technical metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              <strong>GPS Coordinates:</strong> {complaint.latitude?.toFixed(6)}, {complaint.longitude?.toFixed(6)}
            </div>
            
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Is this affecting your area too?</span>
              <button
                onClick={handleUpvote}
                disabled={upvoting}
                style={{
                  background: '#f0fdf4', color: '#15803d',
                  padding: '0.6rem 1.2rem', borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  border: '1px solid #bbf7d0', cursor: 'pointer',
                  minHeight: '48px', display: 'flex', alignItems: 'center', gap: 6
                }}>
                👍 {complaint.upvotes || 0} Same issue
              </button>
            </div>

            <div className="print-only" style={{ display: 'none', fontSize: 12, color: '#6b7280' }}>
              <strong>Community Support:</strong> {complaint.upvotes || 0} upvotes
            </div>
          </div>

        </div>

        {/* Footer of Printable Page */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
          <span>Generated by QuickSewa Portal</span>
          <span>GHMC Civic Redressal Desk</span>
        </div>

      </div>
    </main>
  )
}
