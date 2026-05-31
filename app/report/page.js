'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/language'
import LangToggle from '../components/LangToggle'

const CATEGORIES = ['Pothole', 'Garbage', 'Streetlight', 'Waterlogging', 'Encroachment', 'Other']
const CATEGORY_EMOJI = {
  Pothole: '🕳️', Garbage: '🗑️', Streetlight: '💡',
  Waterlogging: '💧', Encroachment: '🚧', Other: '📌'
}
const SEVERITY_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }

// Functional Fix: Define toBase64 utility
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

export default function Report() {
  const { t, lang } = useLang()
  const router = useRouter()
  const fileRef = useRef()

  // Form Core States
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('Medium')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [complaintId, setComplaintId] = useState('')
  const [fullComplaintId, setFullComplaintId] = useState('')

  // Advanced AI Detection States
  const [confidence, setConfidence] = useState(0)
  const [department, setDepartment] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [estimatedRepair, setEstimatedRepair] = useState('')
  const [secondaryIssues, setSecondaryIssues] = useState([])
  const [showCategoryOverride, setShowCategoryOverride] = useState(false)

  // Location Picker States
  const [locationMode, setLocationMode] = useState('gps') // 'gps' | 'map'
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'

  // UX Feedback States
  const [dragActive, setDragActive] = useState(false)
  const [toast, setToast] = useState(null)

  // Show Toast Helper
  const triggerToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Inject Custom Keyframes dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!document.getElementById('report-custom-styles')) {
      const style = document.createElement('style')
      style.id = 'report-custom-styles'
      style.innerHTML = `
        @keyframes scanner-slide {
          0%, 100% { top: 0%; opacity: 0.3; }
          50% { top: 96%; opacity: 1; }
        }
        .scanner-bar {
          position: absolute;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
          box-shadow: 0 0 10px #22c55e;
          animation: scanner-slide 2.5s infinite ease-in-out;
        }
        .pulse-outline {
          animation: border-glow 2s infinite ease-in-out;
        }
        @keyframes border-glow {
          0%, 100% { border-color: rgba(22, 163, 74, 0.2); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.05); }
          50% { border-color: rgba(22, 163, 74, 0.6); box-shadow: 0 0 15px rgba(22, 163, 74, 0.15); }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Geolocation Handler
  function getLocation() {
    setLocationStatus('loading')
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('error')
      triggerToast('GPS access is not supported by your browser', 'error')
      setTimeout(() => setLocationMode('map'), 1500)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('done')
        triggerToast(t.locationFound || 'GPS location found successfully!', 'success')
      },
      (err) => {
        console.warn("GPS Geolocation failed:", err)
        setLocationStatus('error')
        triggerToast('Could not access GPS. Switched to Hyderabad map picker.', 'error')
        setTimeout(() => setLocationMode('map'), 1500)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  // Dual mode click handlers
  const handleGPSSelect = () => {
    setLocationMode('gps')
    getLocation()
  }

  const handleMapSelect = () => {
    setLocationMode('map')
  }

  // Drag and Drop File Handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (!file.type.startsWith('image/')) {
        triggerToast('Please upload an image file format.', 'error')
        return
      }
      setPhotoFile(file)
      setPhoto(URL.createObjectURL(file))
      getLocation()
      await classifyWithAI(file)
    }
  }

  // Standard File Select Handler
  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhoto(URL.createObjectURL(file))
    getLocation()
    await classifyWithAI(file)
  }

  // AI Classification with timeout & raw response safety
  async function classifyWithAI(file) {
    setAiLoading(true)
    setAiResult(null)
    setAiUnavailable(false)
    setShowCategoryOverride(false)

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      console.error('Gemini API key missing from .env.local')
      setAiResult({ error: true, reason: 'missing_key' })
      setAiUnavailable(true)
      setAiLoading(false)
      triggerToast('AI assistance offline. Please fill manually.', 'error')
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    try {
      const base64 = await toBase64(file)
      const base64Data = base64.split(',')[1]

      if (!base64Data) throw new Error('Could not read image file')

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `You are an expert civic infrastructure analyst for Hyderabad, India. Analyse this image and identify civic issues. Respond ONLY with a valid JSON object, no markdown, no code blocks, no extra text:
{"primary_category":"Pothole|Garbage|Streetlight|Waterlogging|Encroachment|Other","confidence":85,"severity":"Low|Medium|High","auto_title":"Short 5-8 word title","auto_description":"2-3 sentence description of the issue","secondary_issues":[],"urgent":false,"estimated_repair":"₹5,000–₹15,000","department":"GHMC Roads|GHMC Sanitation|GHMC Lighting|HMWS&SB|GHMC Encroachment|GHMC General"}`
                },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500
            }
          }),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API error ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (!text) throw new Error('Empty response')

      const cleaned = text.replace(/```json|```/g, '').trim()
      const result = JSON.parse(cleaned)

      if (!result.primary_category) throw new Error('Format match error')

      setAiResult(result)
      setCategory(result.primary_category)
      setSeverity(result.severity || 'Medium')
      setDescription(result.auto_description || '')
      setTitle(result.auto_title || '')
      setConfidence(result.confidence || 75)
      setSecondaryIssues(result.secondary_issues || [])
      setUrgent(result.urgent === true || result.urgent === 'true')
      setEstimatedRepair(result.estimated_repair || '₹2,000-₹10,000')
      setDepartment(result.department || 'GHMC General')

      triggerToast(t.aiComplete || 'AI Scanner analyzed photo successfully!', 'success')

    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Gemini AI error:', err.message)
      setAiResult({ error: true, reason: err.message })
      setAiUnavailable(true)
      setCategory('Other')
      setSeverity('Medium')
      triggerToast('AI analysis unavailable. Manual form enabled.', 'error')
    }

    setAiLoading(false)
  }

  // Leaflet lazy loading for Hyderabad coordinates picker
  useEffect(() => {
    if (locationMode !== 'map') return
    let isMounted = true

    // Inject CSS
    if (!document.getElementById('leaflet-picker-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-picker-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Inject JS
    if (!window.L) {
      const script = document.createElement('script')
      script.id = 'leaflet-picker-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => {
        if (isMounted) initReportMap()
      }
      document.head.appendChild(script)
    } else {
      initReportMap()
    }

    function initReportMap() {
      const L = window.L
      if (!L) return

      if (window._reportMap) {
        window._reportMap.remove()
        window._reportMap = null
      }

      const defaultLat = location?.lat || 17.3850
      const defaultLng = location?.lng || 78.4867

      const map = L.map('location-picker-map').setView([defaultLat, defaultLng], 12)
      window._reportMap = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      const redPinIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: #dc2626; border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; cursor: grab;
        ">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })

      const marker = L.marker([defaultLat, defaultLng], {
        icon: redPinIcon,
        draggable: true
      }).addTo(map)

      if (!location) {
        setLocation({ lat: defaultLat, lng: defaultLng })
        setLocationStatus('done')
      }

      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        setLocation({ lat, lng })
        setLocationStatus('done')
      })

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng()
        setLocation({ lat, lng })
        setLocationStatus('done')
      })
    }

    return () => {
      isMounted = false
      if (window._reportMap) {
        window._reportMap.remove()
        window._reportMap = null
      }
    }
  }, [locationMode])

  // Submit report to Supabase Storage and complaints database table
  async function handleSubmit() {
    if (!photo || !category || !location) return
    setSubmitting(true)

    try {
      const extension = photoFile.name.split('.').pop() || 'jpg'
      const fileName = `complaint_${Date.now()}.${extension}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaint-photos')
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('complaint-photos')
        .getPublicUrl(fileName)

      const ward = getWard(location.lat, location.lng)
      let insertResult = null

      try {
        const { data, error } = await supabase
          .from('complaints')
          .insert([{
            title: title || 'Untitled Issue',
            photo_url: urlData.publicUrl,
            category,
            severity,
            description,
            latitude: location.lat,
            longitude: location.lng,
            ward,
            status: 'open',
            upvotes: 0,
            confidence: confidence || null,
            department: department || null,
            urgent: urgent || false,
            estimated_repair: estimatedRepair || null,
            secondary_issues: secondaryIssues && secondaryIssues.length > 0 ? JSON.stringify(secondaryIssues) : null
          }])
          .select()
        if (error) throw error
        insertResult = data
      } catch (advancedErr) {
        console.warn("Advanced column insert blocked. Performing graceful fallback insert:", advancedErr)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('complaints')
          .insert([{
            title: title || 'Untitled Issue',
            photo_url: urlData.publicUrl,
            category,
            severity,
            description,
            latitude: location.lat,
            longitude: location.lng,
            ward,
            status: 'open',
            upvotes: 0
          }])
          .select()
        if (fallbackError) throw fallbackError
        insertResult = fallbackData
      }

      const shortId = insertResult[0].id.slice(0, 8).toUpperCase()
      setComplaintId(shortId)
      setFullComplaintId(insertResult[0].id)

      // Optional Resend email notify
      try {
        const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY
        if (resendApiKey) {
          const reportUrl = `${window.location.origin}/report/${insertResult[0].id}`
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'complaints@quicksewa.in',
              to: 'officer@quicksewa.in',
              subject: `New ${category} complaint in ${ward} — Severity: ${severity}`,
              html: `<p>New complaint details can be loaded at <a href="${reportUrl}">View Report</a>.</p>`
            })
          })
        }
      } catch (e) {
        console.warn("Resend email failed:", e)
      }

      setSubmitted(true)
      triggerToast('Grievance logged successfully!', 'success')

    } catch (err) {
      console.error(err)
      triggerToast('Form submission failed. Please check connection.', 'error')
    }
    setSubmitting(false)
  }

  function getWard(lat, lng) {
    if (!lat) return 'Hyderabad'
    if (lat > 17.47) return 'Kukatpally'
    if (lat > 17.44) return 'Kondapur'
    if (lat > 17.42) return 'Banjara Hills'
    if (lat > 17.40) return 'Jubilee Hills'
    if (lat > 17.38) return 'Himayatnagar'
    if (lng > 78.51) return 'Uppal'
    if (lng > 78.49) return 'Secunderabad'
    if (lng < 78.38) return 'Gachibowli'
    return 'LB Nagar'
  }

  const renderLocationStatus = () => {
    if (locationMode === 'gps') {
      if (locationStatus === 'loading') {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '12px 16px', borderRadius: 12,
            background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span className="pulse-outline" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#b45309' }} />
            {t.locationLoading}
          </div>
        )
      }
      if (locationStatus === 'done' && location) {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '12px 16px', borderRadius: 12,
            background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
            marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 4
          }}>
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>📍 {t.locationFound}</span>
            <span style={{ fontSize: 12 }}>Ward Area: <strong>{getWard(location.lat, location.lng)}</strong></span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        )
      }
      if (locationStatus === 'error') {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '12px 16px', borderRadius: 12,
            background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
            marginBottom: '1rem'
          }}>
            ❌ Could not get GPS. Please pick on Hyderabad map instead.
          </div>
        )
      }
    } else {
      if (location) {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '12px 16px', borderRadius: 12,
            background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
            marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 4
          }}>
            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>📍 {t.selectedLocation}</span>
            <span style={{ fontSize: 12 }}>Ward Area: <strong>{getWard(location.lat, location.lng)}</strong></span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        )
      } else {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '12px 16px', borderRadius: 12,
            background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
            marginBottom: '1rem'
          }}>
            {t.tapMapPin}
          </div>
        )
      }
    }
    return null
  }

  // REDESIGNED Success page view
  if (submitted) {
    return (
      <main style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
      }}>
        {/* Animated toast inside screen */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24,
            background: toast.type === 'success' ? 'var(--primary)' : '#dc2626',
            color: 'white', padding: '12px 24px', borderRadius: 12,
            boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999
          }}>
            <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{toast.message}</span>
          </div>
        )}

        <div className="animated-card" style={{
          textAlign: 'center', maxWidth: 440, width: '100%',
          background: 'white', borderRadius: 24, padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--primary-border)'
        }}>
          {/* Circular drawing checkmark icon */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '2px solid #bbf7d0',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.15)',
            animation: 'scaleIn 0.5s ease-out'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" style={{
                strokeDasharray: 50,
                strokeDashoffset: 50,
                animation: 'drawCheck 0.6s ease-in-out forwards 0.2s'
              }} />
            </svg>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#14532d', marginBottom: 8, letterSpacing: '-0.5px' }}>
            {t.successTitle}
          </h2>
          
          <div style={{
            background: '#f8fafc', borderRadius: 16, padding: '1.25rem',
            border: '1px solid #e2e8f0', marginBottom: '2rem',
            textAlign: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{t.successId}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#15803d', letterSpacing: '2px', fontFamily: 'monospace', margin: 0 }}>
              #{complaintId}
            </p>
          </div>

          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: '2rem', lineHeight: 1.6 }}>
            {t.successMsg}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => router.push(`/report/${fullComplaintId}`)}
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white',
                padding: '0.9rem', borderRadius: 14,
                fontSize: 15, fontWeight: 700,
                minHeight: '52px', cursor: 'pointer',
                border: 'none', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              {t.viewReport}
            </button>
            
            <button
              onClick={() => router.push('/map')}
              style={{
                background: 'white', color: '#16a34a',
                padding: '0.9rem', borderRadius: 14,
                fontSize: 15, fontWeight: 700,
                border: '2px solid #16a34a',
                minHeight: '52px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              {t.viewMap}
            </button>

            <button
              onClick={() => router.push('/')}
              style={{
                background: 'transparent', color: '#6b7280',
                padding: '0.9rem', borderRadius: 14,
                fontSize: 14, border: '1px solid #d1d5db',
                minHeight: '48px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              {t.backHome}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)',
      padding: '2rem 1rem',
      paddingBottom: '5rem',
      position: 'relative'
    }}>
      
      {/* Toast Alert Feedback Banner */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: toast.type === 'success' ? 'var(--primary)' : '#dc2626',
          color: 'white', padding: '12px 24px', borderRadius: 12,
          boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 9999, animation: 'slideInRight 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{toast.message}</span>
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header Bar and Language Selector Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'white', borderRadius: 12,
                width: 44, height: 44, fontSize: 18,
                border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>←</button>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#14532d', margin: 0, letterSpacing: '-0.5px' }}>
              {t.reportTitle}
            </h1>
          </div>
          <LangToggle />
        </div>

        {/* CARD CONTENT */}
        <div className="animated-card" style={{
          background: 'white', borderRadius: 24, padding: '2rem 1.5rem',
          boxShadow: 'var(--shadow-md)', border: '1px solid rgba(22, 163, 74, 0.1)'
        }}>

          {/* Photo Selection Area: DRAG AND DROP CARD */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !photo && fileRef.current.click()}
            style={{
              background: photo ? 'transparent' : (dragActive ? '#f0fdf4' : '#fafafa'),
              border: photo ? 'none' : (dragActive ? '2px dashed #16a34a' : '2px dashed #cbd5e1'),
              borderRadius: 20,
              minHeight: photo ? 'auto' : 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: photo ? 'default' : 'pointer',
              marginBottom: '2rem',
              overflow: 'hidden',
              position: 'relative',
              transition: 'var(--transition)',
              boxShadow: dragActive ? '0 0 15px rgba(22, 163, 74, 0.1)' : 'none'
            }}>
            {photo ? (
              <div style={{ position: 'relative', width: '100%', borderRadius: 20, overflow: 'hidden' }}>
                <img src={photo} alt="complaint proof" style={{
                  width: '100%', borderRadius: 20,
                  maxHeight: 280, objectFit: 'cover', display: 'block'
                }} />
                
                {/* Image Overlay scan bar during loading */}
                {aiLoading && <div className="scanner-bar" />}

                <button
                  onClick={() => fileRef.current.click()}
                  style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(0,0,0,0.7)', color: 'white',
                    padding: '8px 16px', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, minHeight: '40px', cursor: 'pointer', border: 'none',
                    backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}>
                  {t.changePhoto}
                </button>
              </div>
            ) : (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 12, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>📤</div>
                <p style={{ fontWeight: 700, color: '#15803d', fontSize: 16, marginBottom: 4 }}>
                  {t.tapPhoto}
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>
                  {t.orGallery}
                </p>
                <span style={{ fontSize: 11, background: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>
                  PNG, JPG, JPEG up to 10MB
                </span>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            style={{ display: 'none' }}
          />

          {/* TWO-OPTION LOCATION SELECTOR */}
          {photo && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t.selectLocationMode || 'Location Selector'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
                {/* Option A Card */}
                <div
                  onClick={handleGPSSelect}
                  style={{
                    background: locationMode === 'gps' ? '#f0fdf4' : 'white',
                    border: locationMode === 'gps' ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '1.25rem 1rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: locationMode === 'gps' ? '0 4px 15px rgba(22,163,74,0.1)' : 'var(--shadow-sm)',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ fontSize: 32, display: 'block', marginBottom: 6 }}>📍</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#14532d', display: 'block' }}>
                    {t.useMyLocation}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 4 }}>
                    {t.useMyLocationSub}
                  </span>
                </div>

                {/* Option B Card */}
                <div
                  onClick={handleMapSelect}
                  style={{
                    background: locationMode === 'map' ? '#f0fdf4' : 'white',
                    border: locationMode === 'map' ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '1.25rem 1rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: locationMode === 'map' ? '0 4px 15px rgba(22,163,74,0.1)' : 'var(--shadow-sm)',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ fontSize: 32, display: 'block', marginBottom: 6 }}>🗺️</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#14532d', display: 'block' }}>
                    {t.pickOnMap}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 4 }}>
                    {t.pickOnMapSub}
                  </span>
                </div>
              </div>

              {/* Location Status logs panel */}
              {renderLocationStatus()}

              {/* Option B Leaflet Hyderabad map container */}
              {locationMode === 'map' && (
                <div style={{ marginBottom: '1.25rem', animation: 'scaleIn 0.3s ease-out' }}>
                  <div 
                    id="location-picker-map" 
                    style={{ 
                      width: '100%', 
                      height: '240px', 
                      borderRadius: '16px', 
                      overflow: 'hidden',
                      border: '1px solid #d1d5db',
                      boxShadow: 'var(--shadow-sm)',
                      zIndex: 10
                    }} 
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Pulsing Green Scanning Loading Card */}
          {aiLoading && (
            <div className="ai-pulse-card" style={{
              background: '#f0fdf4', borderRadius: 16,
              padding: '1.5rem', marginBottom: '2rem',
              border: '2px solid #86efac',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 12, boxShadow: '0 4px 15px rgba(22, 163, 74, 0.1)'
            }}>
              <span style={{ fontSize: 38, animation: 'scaleIn 1s infinite alternate' }}>🤖</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#14532d', margin: 0 }}>
                {t.aiScanning}
              </p>
              <div style={{
                width: '100%', height: 6, background: '#cbd5e1', borderRadius: 99, overflow: 'hidden', position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', width: '50%', height: '100%', background: '#16a34a', borderRadius: 99,
                  animation: 'loading-slide 1.5s infinite ease-in-out'
                }} />
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes loading-slide {
                    0% { left: -50%; }
                    100% { left: 100%; }
                  }
                `}} />
              </div>
            </div>
          )}

          {/* AI FAILURE CARD */}
          {aiResult && aiResult.error && !aiLoading && photo && (
            <div style={{
              background: '#fffbeb', borderRadius: 20,
              padding: '1.5rem', marginBottom: '2rem',
              border: '1px solid #fde68a',
              display: 'flex', flexDirection: 'column', gap: 16
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#d97706', margin: 0 }}>
                  {t.aiUnavailable}
                </p>
                <p style={{ fontSize: 12, color: '#78350f', marginTop: 4, margin: 0, opacity: 0.85 }}>
                  {lang === 'te' ? 'కారణం: ' : 'Reason: '} {aiResult.reason || 'Unknown error'}
                </p>
              </div>
              
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
                  {t.manualChange}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '8px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                        border: category === cat ? '2px solid #16a34a' : '1px solid #d1d5db',
                        background: category === cat ? '#f0fdf4' : 'white',
                        color: category === cat ? '#15803d' : '#4b5563',
                        cursor: 'pointer', minHeight: '44px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: category === cat ? '0 4px 10px rgba(22,163,74,0.1)' : 'none'
                      }}>
                      {CATEGORY_EMOJI[cat] || ''} {t.categories[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  {t.titleLabel} {t.descriptionOptional}
                </p>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={60}
                  placeholder={t.titlePlaceholder}
                  style={{
                    width: '100%', padding: '0.85rem 1rem', border: '1px solid #cbd5e1', borderRadius: 12,
                    fontSize: 14, color: '#374151', background: 'white', minHeight: '48px', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  {t.descriptionLabel} {t.descriptionOptional}
                </p>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={140}
                  rows={3}
                  placeholder={t.descriptionPlaceholder}
                  style={{
                    width: '100%', padding: '0.85rem 1rem', border: '1px solid #cbd5e1', borderRadius: 12,
                    fontSize: 14, color: '#374151', background: 'white', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 4, margin: 0 }}>
                  {description.length}/140
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !category || !location}
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white', padding: '1rem', borderRadius: 14, fontSize: 16, fontWeight: 700,
                  width: '100%', minHeight: '52px', cursor: 'pointer', border: 'none',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)'
                }}>
                {submitting ? t.submitting : t.submitBtn}
              </button>
              {!location && (
                <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, textAlign: 'center', marginTop: 6, margin: 0 }}>
                  {t.pleaseSelectLocation}
                </p>
              )}
            </div>
          )}

          {/* STEP 3: Upgraded Premium "AI Analysis Complete" Card */}
          {photo && !aiLoading && !aiUnavailable && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 20,
              animation: 'scaleIn 0.3s ease-out'
            }}>
              
              {/* Header bar */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532d', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.aiComplete}
                </h2>
              </div>

              {/* Category chip visual box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--primary-light)', padding: '12px 16px', borderRadius: 16, border: '1px solid var(--primary-border)' }}>
                <span style={{ fontSize: 32 }}>{CATEGORY_EMOJI[category] || '📌'}</span>
                <div>
                  <p style={{ fontSize: 11, color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{t.detectedIssue}</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: 0 }}>{t.categories[category] || category}</p>
                </div>
              </div>

              {/* Confidence progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  <span>{t.confidenceLabel}</span>
                  <span style={{ color: confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626' }}>
                    {confidence}% {t.aiConfident}
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${confidence}%`,
                    background: confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626',
                    borderRadius: 99,
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>

              {/* Low confidence warning banner */}
              {confidence > 0 && confidence < 50 && (
                <div style={{
                  background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309',
                  padding: '10px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700
                }}>
                  {t.lowConfidence}
                </div>
              )}

              {/* URGENT Banner */}
              {urgent && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                  borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span>{t.aiUrgent}</span>
                </div>
              )}

              {/* Title parameter */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{t.titleLabel}</p>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={60}
                  placeholder={t.titleLabel}
                  style={{
                    width: '100%', padding: '0.8rem 1rem', border: '1px solid #cbd5e1', borderRadius: 12,
                    fontSize: 14, color: '#374151', background: 'white', minHeight: '48px', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Description parameter */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{t.descLabel}</p>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                  placeholder={t.descLabel}
                  style={{
                    width: '100%', padding: '0.8rem 1rem', border: '1px solid #cbd5e1', borderRadius: 12,
                    fontSize: 14, color: '#374151', background: 'white', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Secondary Issues array */}
              {secondaryIssues && secondaryIssues.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>{t.alsoDetected || 'Also visible'}:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {secondaryIssues.map(issue => (
                      <span key={issue} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, border: '1px solid #e2e8f0' }}>
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Department tags details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, fontWeight: 600, color: '#166534', background: '#f8fafc', padding: '12px 16px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                {estimatedRepair && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>🛠️ {t.aiEstimate}</span>
                    <strong style={{ color: '#111827' }}>{estimatedRepair}</strong>
                  </div>
                )}
                {department && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>🏢 {t.aiDepartment}</span>
                    <strong style={{ color: '#16a34a' }}>{department}</strong>
                  </div>
                )}
              </div>

              {/* Confirm & overrides row buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !location}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white', padding: '1rem', borderRadius: 14,
                    fontSize: 16, fontWeight: 700, border: 'none',
                    minHeight: '52px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.25)'
                  }}>
                  {submitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pulse-outline" style={{ width: 12, height: 12, borderRadius: '50%', background: 'white' }} />
                      {t.submitting}
                    </div>
                  ) : t.aiConfirmSubmit}
                </button>
                {!location && (
                  <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, textAlign: 'center', margin: 0 }}>
                    {t.pleaseSelectLocation}
                  </p>
                )}

                <button
                  onClick={() => setShowCategoryOverride(!showCategoryOverride)}
                  style={{
                    background: 'white', color: '#4b5563', padding: '0.9rem', borderRadius: 14,
                    fontSize: 14, fontWeight: 700, border: '1px solid #d1d5db',
                    minHeight: '48px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                  ✏️ {showCategoryOverride ? t.hideOverrideButton || 'Hide Edit Options' : t.aiEditDetails}
                </button>
              </div>

              {/* Override selector list */}
              {showCategoryOverride && (
                <div style={{
                  marginTop: 8, paddingTop: 16, borderTop: '1px dashed var(--primary-border)',
                  animation: 'scaleIn 0.3s ease-out'
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#14532d', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.manualChange}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        style={{
                          padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                          border: category === cat ? '2px solid #16a34a' : '1px solid #cbd5e1',
                          background: category === cat ? '#f0fdf4' : 'white',
                          color: category === cat ? '#15803d' : '#4b5563',
                          cursor: 'pointer', minHeight: '44px',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          boxShadow: category === cat ? '0 4px 10px rgba(22,163,74,0.1)' : 'none',
                          transform: category === cat ? 'scale(1.02)' : 'none'
                        }}>
                        <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[cat]}</span>
                        <span>{t.categories[cat] || cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}