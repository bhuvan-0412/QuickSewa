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
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
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

      <div className="animated-card" style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid rgba(22, 163, 74, 0.15)',
        textAlign: 'center'
      }}>
        {/* Soft green GHMC badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(22, 163, 74, 0.1)',
          color: '#16a34a',
          fontSize: '12px',
          fontWeight: 700,
          padding: '6px 14px',
          borderRadius: '99px',
          marginBottom: '1.25rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span>🛡️</span> GHMC HYDERABAD
        </div>

        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          fontSize: 32,
          boxShadow: '0 8px 20px rgba(22, 163, 74, 0.3)',
          color: 'white'
        }}>📍</div>

        <h1 style={{
          fontSize: '36px', fontWeight: 800,
          color: '#14532d', marginBottom: 8,
          letterSpacing: '-1px',
          lineHeight: 1.2
        }}>{t.appName}</h1>

        <p className="telugu-text" style={{
          fontSize: '16px', color: '#166534',
          fontWeight: 600, marginBottom: 8
        }}>{t.tagline}</p>

        <p style={{
          fontSize: '14px', color: '#4b5563',
          marginBottom: '2rem', lineHeight: 1.6
        }}>
          {t.taglineSub}
        </p>

        {/* Animated stat cards */}
        {error ? (
          <div style={{
            background: '#fef2f2', borderRadius: 16,
            padding: '1rem', marginBottom: '2rem',
            border: '1px solid #fca5a5',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8
          }}>
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
              ⚠️ {t.unableToLoad}
            </span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: '2rem'
          }}>

            <div 
              className="hover-lift"
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1rem 0.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                cursor: 'default'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>📋</div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#16a34a',
                lineHeight: 1.1,
                marginBottom: 4
              }}>
                {count.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                {t.issuesReported}
              </div>
            </div>

            <div 
              className="hover-lift"
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1rem 0.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                cursor: 'default'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>✅</div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#16a34a',
                lineHeight: 1.1,
                marginBottom: 4
              }}>
                {resolvedCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                {t.resolvedWeek}
              </div>
            </div>

            <div 
              className="hover-lift"
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1rem 0.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                cursor: 'default'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>🗺️</div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#16a34a',
                lineHeight: 1.1,
                marginBottom: 4
              }}>
                {wardsCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                {t.wardsCovered}
              </div>
            </div>

          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          <Link href="/report" style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)',
            textDecoration: 'none',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            {t.reportBtn}
          </Link>

          <Link href="/map" style={{
            background: 'white',
            color: '#16a34a',
            padding: '1rem 2rem',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            border: '2px solid #16a34a',
            textDecoration: 'none',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--primary-light)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'none'
            }}
          >
            {t.mapBtn}
          </Link>

          <Link href="/dashboard" style={{
            background: 'transparent',
            color: '#4b5563',
            padding: '0.8rem 2rem',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid #d1d5db',
            textDecoration: 'none',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f9fafb'
              e.currentTarget.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
          >
            {t.dashboardBtn}
          </Link>

        </div>

        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2.5rem', fontWeight: 500, letterSpacing: '0.5px' }}>
          {t.footer}
        </p>

      </div>
    </main>
  )
}
