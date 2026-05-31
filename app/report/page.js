'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Pothole', 'Garbage', 'Streetlight', 'Waterlogging', 'Encroachment', 'Other']
const CATEGORY_EMOJI = {
  Pothole: '🕳️', Garbage: '🗑️', Streetlight: '💡',
  Waterlogging: '💧', Encroachment: '🚧', Other: '📌'
}
const SEVERITY_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }

export default function Report() {
  const router = useRouter()
  const fileRef = useRef()

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

  // Upgraded AI Issue Detection States
  const [confidence, setConfidence] = useState(0)
  const [department, setDepartment] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [estimatedRepair, setEstimatedRepair] = useState('')
  const [secondaryIssues, setSecondaryIssues] = useState([])
  const [showCategoryOverride, setShowCategoryOverride] = useState(false)

  // Dual-mode Location Selector States
  const [locationMode, setLocationMode] = useState('gps') // 'gps' | 'map'
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'

  // Inject Pulsing Scanning Animation and slide keyframes in head
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!document.getElementById('pulse-animation-style')) {
      const style = document.createElement('style')
      style.id = 'pulse-animation-style'
      style.innerHTML = `
        @keyframes scan-pulse {
          0% {
            border-color: #86efac;
            box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4);
          }
          70% {
            border-color: #16a34a;
            box-shadow: 0 0 0 10px rgba(22, 163, 74, 0);
          }
          100% {
            border-color: #86efac;
            box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
          }
        }
        .ai-pulse-card {
          animation: scan-pulse 2s infinite ease-in-out;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // Geolocation trigger
  function getLocation() {
    setLocationStatus('loading')
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('error')
      // Auto switch to Pick on Map after a short timeout so user sees failure
      setTimeout(() => {
        setLocationMode('map')
      }, 1500)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('done')
      },
      (err) => {
        console.warn("GPS Geolocation failed:", err)
        setLocationStatus('error')
        // Automatically switch to Option B (Map) on GPS failure
        setTimeout(() => {
          setLocationMode('map')
        }, 1500)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  // Handle GPS selector click
  const handleGPSSelect = () => {
    setLocationMode('gps')
    getLocation()
  }

  // Handle Map selector click
  const handleMapSelect = () => {
    setLocationMode('map')
  }

  // Lazy Load and Initialize Leaflet for Pick on Map
  useEffect(() => {
    if (locationMode !== 'map') return
    let isMounted = true

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-picker-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-picker-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Inject Leaflet JS
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

      // Clean up previous report map if any
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

      // Draggable custom red pin L.divIcon to avoid Next.js asset resolution errors
      const redPinIcon = L.divIcon({
        className: '',
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: #dc2626; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: grab;
        ">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      // Placed initially at default position
      const marker = L.marker([defaultLat, defaultLng], {
        icon: redPinIcon,
        draggable: true
      }).addTo(map)

      // Initialize location state if null
      if (!location) {
        setLocation({ lat: defaultLat, lng: defaultLng })
        setLocationStatus('done')
      }

      // Map click handler to relocate marker and update state
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        setLocation({ lat, lng })
        setLocationStatus('done')
      })

      // Marker dragend handler to update state
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

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhoto(URL.createObjectURL(file))
    getLocation() // Initial auto-detection via GPS (Option A)
    await classifyWithAI(file)
  }

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
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

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
        const errData = await response.json()
        throw new Error(errData.error?.message || `API error ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      if (!text) throw new Error('Empty response from Gemini')
      
      const cleaned = text.replace(/```json|```/g, '').trim()
      const result = JSON.parse(cleaned)

      if (!result.primary_category) throw new Error('Invalid response format')

      setAiResult(result)
      setCategory(result.primary_category)
      setSeverity(result.severity || 'Medium')
      setDescription(result.auto_description || '')
      
      // Save advanced fields
      setTitle(result.auto_title || '')
      setConfidence(result.confidence || 75)
      setSecondaryIssues(result.secondary_issues || [])
      setUrgent(result.urgent === true || result.urgent === 'true')
      setEstimatedRepair(result.estimated_repair || '₹2,000-₹10,000')
      setDepartment(result.department || 'GHMC General')

    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Gemini AI error:', err.message)
      setAiResult({ error: true, reason: err.message })
      setAiUnavailable(true)
      setCategory('Other')
      setSeverity('Medium')
    }

    setAiLoading(false)
  }

  async function handleSubmit() {
    if (!photo || !category || !location) return
    setSubmitting(true)

    try {
      const fileName = `complaint_${Date.now()}.${photoFile.name.split('.').pop()}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaint-photos')
        .upload(fileName, photoFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('complaint-photos')
        .getPublicUrl(fileName)

      const ward = getWard(location.lat, location.lng)

      let insertResult = null

      // Attempt to save complete advanced details
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
        console.warn("Advanced columns fail. Executing graceful fallback insert:", advancedErr)
        // Graceful Schema Baseline fallback
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

      // Trigger Resend API call (officer notification email)
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
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                  <div style="background: #16a34a; padding: 24px; text-align: center; color: white;">
                    <h1 style="margin: 0; fontSize: 24px; fontWeight: bold;">QuickSewa Hyderabad</h1>
                    <p style="margin: 4px 0 0 0; fontSize: 14px; opacity: 0.9;">New Civic Grievance Filed</p>
                  </div>
                  <div style="padding: 24px; background: #ffffff;">
                    <h2 style="color: #14532d; font-size: 18px; margin-top: 0;">Grievance Details</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #4b5563;">Complaint ID:</td>
                        <td style="padding: 8px 0; color: #111827;">#${shortId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Title:</td>
                        <td style="padding: 8px 0; color: #111827;">${title || 'Untitled'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Category:</td>
                        <td style="padding: 8px 0; color: #111827;">${category}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Ward:</td>
                        <td style="padding: 8px 0; color: #111827;">${ward}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Severity:</td>
                        <td style="padding: 8px 0; color: #111827; font-weight: bold; color: ${severity === 'High' ? '#dc2626' : severity === 'Medium' ? '#d97706' : '#16a34a'};">${severity}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold; color: #4b5563;">Coordinates:</td>
                        <td style="padding: 8px 0; color: #111827;">${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}</td>
                      </tr>
                    </table>
                    <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; margin-bottom: 24px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">Description:</h3>
                      <p style="margin: 0; line-height: 1.5; color: #1f2937; background: #f9fafb; padding: 12px; border-radius: 8px; font-style: italic;">
                        "${description || 'No description provided.'}"
                      </p>
                    </div>
                    <div style="text-align: center;">
                      <a href="${reportUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        View Complaint Report
                      </a>
                    </div>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                    QuickSewa • GHMC Hyderabad Grievance Management
                  </div>
                </div>
              `
            })
          })
        }
      } catch (emailErr) {
        console.error("Failed to send Resend email:", emailErr)
      }

      setSubmitted(true)

    } catch (err) {
      alert('Something went wrong. Please try again.')
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
            fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 10,
            background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a',
            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6
          }}>
            ⏳ Getting your location via GPS...
          </div>
        )
      }
      if (locationStatus === 'done' && location) {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 10,
            background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
            marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <span style={{ fontWeight: 700 }}>📍 GPS Location Found:</span>
            <span>Ward: <strong>{getWard(location.lat, location.lng)}</strong></span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Coords: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        )
      }
      if (locationStatus === 'error') {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 10,
            background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca',
            marginBottom: '1rem'
          }}>
            ❌ GPS unavailable — please pick on map instead.
          </div>
        )
      }
    } else { // 'map'
      if (location) {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 10,
            background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
            marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <span style={{ fontWeight: 700 }}>📍 Map Selection Coords:</span>
            <span>Ward: <strong>{getWard(location.lat, location.lng)}</strong></span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Coords: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          </div>
        )
      } else {
        return (
          <div style={{
            fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 10,
            background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a',
            marginBottom: '1rem'
          }}>
            👆 Tap the map below to drop a pin.
          </div>
        )
      }
    }
    return null
  }

  if (submitted) {
    return (
      <main style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: '#f0fdf4'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#14532d', marginBottom: 8 }}>
            Complaint Filed!
          </h2>
          <div style={{
            background: 'white', borderRadius: 16, padding: '1rem',
            border: '1px solid #bbf7d0', marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Your complaint ID</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#15803d', letterSpacing: 2 }}>
              #{complaintId}
            </p>
          </div>
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: '2rem', lineHeight: 1.6 }}>
            Your complaint has been sent to the GHMC ward officer.
            You will receive an update within <strong>72 hours</strong>.
            If unresolved, it will auto-escalate to the supervisor.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => router.push(`/report/${fullComplaintId}`)}
              style={{
                background: '#16a34a', color: 'white',
                padding: '0.9rem', borderRadius: 12,
                fontSize: 15, fontWeight: 700,
                minHeight: '48px', cursor: 'pointer',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              📄 View Complaint Report
            </button>
            <button
              onClick={() => router.push('/map')}
              style={{
                background: 'white', color: '#16a34a',
                padding: '0.9rem', borderRadius: 12,
                fontSize: 15, fontWeight: 600,
                border: '2px solid #16a34a',
                minHeight: '48px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              🗺️ View on Live Map
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'white', color: '#6b7280',
                padding: '0.9rem', borderRadius: 12,
                fontSize: 15, border: '1px solid #e5e7eb',
                minHeight: '48px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
              Back to Home
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '1.5rem',
      paddingBottom: '4rem'
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'white', borderRadius: 10,
              padding: '0.5rem 0.75rem', fontSize: 20,
              border: '1px solid #e5e7eb',
              minHeight: '48px', cursor: 'pointer'
            }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#14532d' }}>
            Report an Issue
          </h1>
        </div>

        {/* Photo Selection Area */}
        <div
          onClick={() => !photo && fileRef.current.click()}
          style={{
            background: photo ? 'transparent' : 'white',
            border: photo ? 'none' : '2px dashed #86efac',
            borderRadius: 20,
            height: photo ? 'auto' : 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: photo ? 'default' : 'pointer',
            marginBottom: '1.25rem',
            overflow: 'hidden',
            position: 'relative'
          }}>
          {photo ? (
            <>
              <img src={photo} alt="complaint" style={{
                width: '100%', borderRadius: 20,
                maxHeight: 300, objectFit: 'cover'
              }} />
              <button
                onClick={() => fileRef.current.click()}
                style={{
                  position: 'absolute', bottom: 12, right: 12,
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  padding: '0.4rem 0.9rem', borderRadius: 8,
                  fontSize: 13, minHeight: '40px', cursor: 'pointer', border: 'none'
                }}>
                Change photo
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
              <p style={{ fontWeight: 600, color: '#15803d', fontSize: 16 }}>
                Tap to take a photo
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                or choose from gallery
              </p>
            </>
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

        {/* PROPER TWO-OPTION LOCATION SELECTOR */}
        {photo && (
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Select Location Mode
            </p>
            
            {/* Cards side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
              {/* Option A Card */}
              <div
                onClick={handleGPSSelect}
                style={{
                  background: locationMode === 'gps' ? '#f0fdf4' : 'white',
                  border: locationMode === 'gps' ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                  borderRadius: 14,
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>📍</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#14532d', display: 'block' }}>
                  Use My Location
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginTop: 2 }}>
                  Auto-detected via GPS
                </span>
              </div>

              {/* Option B Card */}
              <div
                onClick={handleMapSelect}
                style={{
                  background: locationMode === 'map' ? '#f0fdf4' : 'white',
                  border: locationMode === 'map' ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                  borderRadius: 14,
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🗺️</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#14532d', display: 'block' }}>
                  Pick on Map
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginTop: 2 }}>
                  Tap anywhere on Hyderabad map
                </span>
              </div>
            </div>

            {/* Location Status Display panel */}
            {renderLocationStatus()}

            {/* Option B Embedded Leaflet Map */}
            {locationMode === 'map' && (
              <div style={{ marginBottom: '1rem' }}>
                <div 
                  id="location-picker-map" 
                  style={{ 
                    width: '100%', 
                    height: '280px', 
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    zIndex: 10
                  }} 
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Pulsing Green "AI Scanning" Card */}
        {aiLoading && (
          <div className="ai-pulse-card" style={{
            background: '#f0fdf4', borderRadius: 16,
            padding: '1.25rem 1.5rem', marginBottom: '1rem',
            border: '2px solid #86efac',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', gap: 12
          }}>
            <span style={{ fontSize: 36, display: 'block', transform: 'scale(1.2)' }}>🤖</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#14532d', margin: 0 }}>
              QuickSewa AI is analysing your photo...
            </p>
            <div style={{
              width: '100%', height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', position: 'relative'
            }}>
              <div style={{
                position: 'absolute', width: '50%', height: '100%', background: '#16a34a', borderRadius: 2,
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

        {/* AI ERROR FALLBACK OR MANUALLY SELECTED SCENARIO */}
        {aiResult && aiResult.error && !aiLoading && photo && (
          <div style={{
            background: '#fffbeb', borderRadius: 16,
            padding: '1.25rem', marginBottom: '1.25rem',
            border: '1px solid #fde68a',
            display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#d97706', margin: 0 }}>
                ⚠️ AI analysis unavailable — please fill in details manually
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, margin: 0 }}>
                Reason: {aiResult.reason || 'Unknown error'}
              </p>
            </div>
            
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Issue type
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: 99, fontSize: 13, fontWeight: 600,
                      border: category === cat ? '2px solid #16a34a' : '1px solid #e5e7eb',
                      background: category === cat ? '#f0fdf4' : 'white',
                      color: category === cat ? '#15803d' : '#6b7280',
                      cursor: 'pointer', minHeight: '40px'
                    }}>
                    {CATEGORY_EMOJI[cat] || ''} {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Grievance Title
              </p>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={60}
                placeholder="Give it a title (optional)"
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid #e5e7eb', borderRadius: 12,
                  fontSize: 14, color: '#374151', background: 'white', minHeight: '48px', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Description
              </p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={140}
                rows={3}
                placeholder="Describe what is visible..."
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid #e5e7eb', borderRadius: 12,
                  fontSize: 14, color: '#374151', background: 'white', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4, margin: 0 }}>
                {description.length}/140
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !category || !location}
              style={{
                background: submitting || !category || !location ? '#86efac' : '#16a34a',
                color: 'white', padding: '1rem', borderRadius: 14, fontSize: 17, fontWeight: 700,
                width: '100%', minHeight: '48px', cursor: submitting || !category || !location ? 'not-allowed' : 'pointer', border: 'none'
              }}>
              {submitting ? 'Submitting...' : 'Submit Complaint →'}
            </button>
            {!location && (
              <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, textAlign: 'center', marginTop: 6, margin: '6px 0 0 0' }}>
                ⚠️ Please select a location to continue
              </p>
            )}
          </div>
        )}

        {/* STEP 3: Upgraded Rich "AI Analysis Complete" Card */}
        {photo && !aiLoading && !aiUnavailable && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16,
            padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            
            {/* Analysis Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532d', margin: 0 }}>
                AI Analysis Complete ✨
              </h2>
            </div>

            {/* Primary Category Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', padding: '10px 14px', borderRadius: 12, border: '1px solid #d1fae5' }}>
              <span style={{ fontSize: 24 }}>{CATEGORY_EMOJI[category] || '📌'}</span>
              <div>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Detected Issue</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>{category || 'Other'}</p>
              </div>
            </div>

            {/* Confidence progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                <span>Detection Confidence</span>
                <span style={{ color: confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626' }}>
                  {confidence}% confident
                </span>
              </div>
              <div style={{ width: '100%', height: 10, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${confidence}%`,
                  background: confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626',
                  borderRadius: 99,
                  transition: 'width 0.8s ease'
                }} />
              </div>
            </div>

            {/* Low confidence warning if confidence < 50 */}
            {confidence > 0 && confidence < 50 && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309',
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700
              }}>
                ⚠️ Low confidence detection — please verify the issue type
              </div>
            )}

            {/* RED Urgent Banner */}
            {urgent && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span>🚨 Urgent — This issue poses immediate risk to citizens</span>
              </div>
            )}

            {/* Title override */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Title</p>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={60}
                placeholder="Title"
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid #bbf7d0', borderRadius: 12,
                  fontSize: 14, color: '#374151', background: 'white', minHeight: '48px', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Description override */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Description</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Description"
                style={{
                  width: '100%', padding: '0.75rem 1rem', border: '1px solid #bbf7d0', borderRadius: 12,
                  fontSize: 14, color: '#374151', background: 'white', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Secondary Issues */}
            {secondaryIssues && secondaryIssues.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Also visible:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {secondaryIssues.map(issue => (
                    <span key={issue} style={{ background: '#e5e7eb', color: '#4b5563', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Department and estimated repair tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600, color: '#166534', background: 'white', padding: '10px 14px', borderRadius: 12, border: '1px solid #d1fae5' }}>
              {estimatedRepair && (
                <div>🛠️ Estimated repair: <strong style={{ color: '#15803d' }}>{estimatedRepair}</strong></div>
              )}
              {department && (
                <div>🏢 Responsible: <strong style={{ color: '#15803d' }}>→ {department}</strong></div>
              )}
            </div>

            {/* Confirm & Override buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <button
                onClick={handleSubmit}
                disabled={submitting || !location}
                style={{
                  background: submitting || !location ? '#86efac' : '#16a34a',
                  color: 'white', padding: '0.9rem', borderRadius: 12,
                  fontSize: 16, fontWeight: 700, border: 'none',
                  minHeight: '48px', cursor: submitting || !location ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                {submitting ? 'Submitting...' : 'Confirm & Submit ✓'}
              </button>
              {!location && (
                <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, textAlign: 'center', margin: '0 0 6px 0' }}>
                  ⚠️ Please select a location to continue
                </p>
              )}

              <button
                onClick={() => setShowCategoryOverride(!showCategoryOverride)}
                style={{
                  background: 'white', color: '#6b7280', padding: '0.9rem', borderRadius: 12,
                  fontSize: 14, fontWeight: 600, border: '1px solid #d1d5db',
                  minHeight: '48px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                ✏️ {showCategoryOverride ? 'Hide Edit Options' : 'Edit Details / Override'}
              </button>
            </div>

            {/* STEP 4: Category Selector Override Pills */}
            {showCategoryOverride && (
              <div style={{
                marginTop: 8, paddingTop: 14, borderTop: '1px dashed #bbf7d0'
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#14532d', marginBottom: 8, margin: '0 0 8px 0' }}>
                  Manually change category:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat)
                      }}
                      style={{
                        padding: '0.4rem 0.9rem', borderRadius: 99, fontSize: 13, fontWeight: 600,
                        border: category === cat ? '2px solid #16a34a' : '1px solid #d1d5db',
                        background: category === cat ? '#e8f5e9' : 'white',
                        color: category === cat ? '#1b5e20' : '#4b5563',
                        cursor: 'pointer', minHeight: '40px'
                      }}>
                      {CATEGORY_EMOJI[cat]} {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  )
}