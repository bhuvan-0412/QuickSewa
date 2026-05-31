'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Home() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function getCount() {
      const { count } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
      setCount(count || 0)
    }
    getCount()
  }, [])

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#f0fdf4'
    }}>
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
        }}>QuickSewa</h1>

        <p style={{
          fontSize: 17, color: '#166534',
          fontWeight: 600, marginBottom: 6
        }}>देखो · खींचो · ठीक करो</p>

        <p style={{
          fontSize: 14, color: '#4b5563',
          marginBottom: '2rem', lineHeight: 1.6
        }}>
          Report civic issues in Hyderabad instantly.<br />
          One photo. Zero forms. Direct to GHMC.
        </p>

        <div style={{
          background: 'white', borderRadius: 16,
          padding: '1rem 1.5rem', marginBottom: '2rem',
          border: '1px solid #bbf7d0',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 12
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#15803d' }}>
            {count.toLocaleString()}
          </span>
          <span style={{ fontSize: 14, color: '#166534', textAlign: 'left', lineHeight: 1.4 }}>
            civic issues<br />reported so far
          </span>
        </div>

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
            letterSpacing: '-0.3px'
          }}>
            📸 Report an Issue
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
            border: '2px solid #16a34a'
          }}>
            🗺️ View Live Map
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
            border: '1px solid #e5e7eb'
          }}>
            Officer Dashboard →
          </Link>

        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: '2rem' }}>
          Serving Hyderabad · Built for GHMC
        </p>

      </div>
    </main>
  )
}
