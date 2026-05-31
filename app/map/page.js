'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const STATUS_COLOR = { open: '#dc2626', 'in-progress': '#d97706', resolved: '#16a34a' }
const STATUS_LABEL = { open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved' }
const CATEGORY_EMOJI = {
  Pothole: '🕳️', Garbage: '🗑️', Streetlight: '💡',
  Waterlogging: '💧', Encroachment: '🚧', Other: '📌'
}

export default function MapPage() {
  const [complaints, setComplaints] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComplaints()
  }, [])

  async function fetchComplaints() {
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
    setComplaints(data || [])
    setLoading(false)
  }

  async function upvote(id) {
    const complaint = complaints.find(c => c.id === id)
    await supabase
      .from('complaints')
      .update({ upvotes: (complaint.upvotes || 0) + 1 })
      .eq('id', id)
    setComplaints(prev =>
      prev.map(c => c.id === id ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c)
    )
  }

  const categories = ['All', 'Pothole', 'Garbage', 'Streetlight', 'Waterlogging', 'Encroachment']
  const filtered = filter === 'All' ? complaints : complaints.filter(c => c.category === filter)

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 1) return 'Just now'
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  function getSlaHours(dateStr, status) {
    if (status === 'resolved') return null
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000)
    return 72 - hrs
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!complaints.length) return

    const L = window.L
    if (!L) return

    if (window._map) {
      window._map.remove()
      window._map = null
    }

    const map = L.map('leaflet-map').setView([17.3850, 78.4867], 12)
    window._map = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    filtered.forEach(complaint => {
      const color = STATUS_COLOR[complaint.status] || '#6b7280'
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${color};border:3px solid white;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer
        ">${CATEGORY_EMOJI[complaint.category] || '📌'}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
      const marker = L.marker([complaint.latitude, complaint.longitude], { icon })
      marker.on('click', () => setSelected(complaint))
      marker.addTo(map)
    })
  }, [complaints, filter])

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />

      <div style={{
        padding: '1rem 1.25rem',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" style={{ fontSize: 20, color: '#374151' }}>←</Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#14532d' }}>
            QuickSewa · Live Map
          </h1>
        </div>
        <div style={{
          background: '#f0fdf4', padding: '4px 12px',
          borderRadius: 99, fontSize: 13, color: '#15803d', fontWeight: 600
        }}>
          {filtered.length} issues
        </div>
      </div>

      <div style={{
        padding: '0.75rem 1rem',
        background: 'white',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex', gap: 8, overflowX: 'auto'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '0.4rem 1rem', borderRadius: 99, fontSize: 13,
              fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
              border: filter === cat ? '2px solid #16a34a' : '1px solid #e5e7eb',
              background: filter === cat ? '#f0fdf4' : 'white',
              color: filter === cat ? '#15803d' : '#6b7280'
            }}>
            {CATEGORY_EMOJI[cat] || ''} {cat}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div id="leaflet-map" style={{ width: '100%', height: '100%' }} />

        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'white', borderRadius: 12,
          padding: '0.6rem 1rem', border: '1px solid #e5e7eb',
          display: 'flex', gap: 12, zIndex: 1000, flexWrap: 'wrap'
        }}>
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: color
              }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                {STATUS_LABEL[status]}
              </span>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: '1.25rem', zIndex: 1000,
            borderTop: '1px solid #e5e7eb',
            maxHeight: '55%', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{CATEGORY_EMOJI[selected.category]}</span>
                  <span style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>
                    {selected.category}
                  </span>
                  <span style={{
                    fontSize: 12, padding: '2px 10px', borderRadius: 99, fontWeight: 600,
                    background: `${STATUS_COLOR[selected.status]}15`,
                    color: STATUS_COLOR[selected.status],
                    border: `1px solid ${STATUS_COLOR[selected.status]}40`
                  }}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                  📍 {selected.ward} · {timeAgo(selected.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: '#f3f4f6', borderRadius: '50%',
                  width: 32, height: 32, fontSize: 16, color: '#6b7280'
                }}>✕</button>
            </div>

            {selected.photo_url && (
              <img
                src={selected.photo_url}
                alt="complaint"
                style={{
                  width: '100%', borderRadius: 12,
                  maxHeight: 180, objectFit: 'cover', marginBottom: 12
                }}
              />
            )}

            {selected.description && (
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 1.5 }}>
                {selected.description}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {(() => {
                  const sla = getSlaHours(selected.created_at, selected.status)
                  if (sla === null) return (
                    <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ Resolved</span>
                  )
                  if (sla < 0) return (
                    <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>🚨 Escalated — {Math.abs(sla)}h overdue</span>
                  )
                  return (
                    <span style={{ fontSize: 13, color: sla < 24 ? '#dc2626' : '#d97706', fontWeight: 600 }}>
                      ⏱ {sla}h remaining
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => upvote(selected.id)}
                style={{
                  background: '#f0fdf4', color: '#15803d',
                  padding: '0.5rem 1rem', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  border: '1px solid #bbf7d0'
                }}>
                👍 {selected.upvotes || 0} Same issue
              </button>
            </div>
          </div>
        )}
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          if (!window.L) {
            var s = document.createElement('script');
            s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            document.head.appendChild(s);
          }
        `
      }} />

    </main>
  )
}