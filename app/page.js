'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useLang } from './lib/language'
import LangToggle from './components/LangToggle'

export default function Home() {
  const { t } = useLang()
  const [count, setCount] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [wardsCount, setWardsCount] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function getStats() {
      setError(false)
      try {
        const { count: total, error: err1 } = await supabase
          .from('complaints')
          .select('*', { count: 'exact', head: true })
        if (err1) throw err1

        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const { count: resolved, error: err2 } = await supabase
          .from('complaints')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'resolved')
          .gte('created_at', oneWeekAgo.toISOString())
        if (err2) throw err2

        const { data: wardsData, error: err3 } = await supabase
          .from('complaints')
          .select('ward')
        if (err3) throw err3

        const uniqueWards = new Set(
          (wardsData || []).map(r => r.ward).filter(Boolean)
        )

        setCount(total || 0)
        setResolvedCount(resolved || 0)
        setWardsCount(uniqueWards.size || 0)
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err)
        setError(true)
      }
    }
    getStats()
  }, [])

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#f0fdf4',
      position: 'relative'
    }}>
      
      {/* Top-right interactive language selector pill */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100
      }}>
        <LangToggle />
      </div>

      <div style={{ textAlign: 'center', width: '100%', maxWidth: 440 }}>

        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#16a34a',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: 38
        }}>📍</div>

        <h1 style={{
          fontSize: 44, fontWeight: 800,
          color: '#14532d', marginBottom: 6,
          letterSpacing: '-1px'
        }}>{t.appName}</h1>

        <p style={{
          fontSize: 17, color: '#166534',
          fontWeight: 600, marginBottom: 6
        }}>{t.tagline}</p>

        <p style={{
          fontSize: 14, color: '#4b5563',
          marginBottom: '2rem', lineHeight: 1.6
        }}>
          {t.taglineSub}
        </p>

        {/* Animated stat cards */}
        {error ? (
          <div style={{
            background: 'white', borderRadius: 16,
            padding: '1rem 1.5rem', marginBottom: '2rem',
            border: '1px solid #fca5a5',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 12
          }}>
            <span style={{ fontSize: 14, color: '#dc2626', fontWeight: 600 }}>
              ⚠️ {t.unableToLoad}
            </span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: '2rem'
          }}>

            <div style={{
              background: 'white',
              borderRadius: 14,
              padding: '0.875rem 0.5rem',
              border: '1px solid #bbf7d0',
              textAlign: 'center',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#15803d',
                lineHeight: 1,
                marginBottom: 5
              }}>
                {count.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                {t.issuesReported}
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: 14,
              padding: '0.875rem 0.5rem',
              border: '1px solid #bbf7d0',
              textAlign: 'center',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#15803d',
                lineHeight: 1,
                marginBottom: 5
              }}>
                {resolvedCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                {t.resolvedWeek}
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: 14,
              padding: '0.875rem 0.5rem',
              border: '1px solid #bbf7d0',
              textAlign: 'center',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#15803d',
                lineHeight: 1,
                marginBottom: 5
              }}>
                {wardsCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                {t.wardsCovered}
              </div>
            </div>

          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <Link href="/report" style={{
            display: 'block',
            background: '#16a34a',
            color: 'white',
            padding: '1.1rem 2rem',
            borderRadius: 14,
            fontSize: 18,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: '-0.3px',
            textDecoration: 'none',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {t.reportBtn}
          </Link>

          <Link href="/map" style={{
            display: 'block',
            background: 'white',
            color: '#16a34a',
            padding: '1rem 2rem',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
            border: '2px solid #16a34a',
            textDecoration: 'none',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {t.mapBtn}
          </Link>

          <Link href="/dashboard" style={{
            display: 'block',
            background: 'white',
            color: '#6b7280',
            padding: '0.8rem 2rem',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            textDecoration: 'none',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {t.dashboardBtn}
          </Link>

        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: '2rem' }}>
          {t.footer}
        </p>

      </div>
    </main>
  )
}

