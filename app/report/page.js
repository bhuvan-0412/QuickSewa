'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Pothole', 'Garbage', 'Streetlight', 'Waterlogging', 'Encroachment', 'Other']
const SEVERITY = ['Low', 'Medium', 'High']

const SEVERITY_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }

export default function Report() {
  const router = useRouter()
  const fileRef = useRef()

  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [location, setLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [complaintId, setComplaintId] = useState('')

  function getLocation() {
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('done')
      },
      () => {
        setLocation({ lat: 17.3850, lng: 78.4867 })
        setLocationStatus('fallback')
      }
    )
  }

  async function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhoto(URL.createObjectURL(file))
    getLocation()
    await classifyWithAI(file)
  }

  async function classifyWithAI(file) {
    setAiLoading(true)
    try {
      const base64 = await toBase64(file)
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `You are a civic issue classifier for Hyderabad, India. Look at this image and respond with ONLY a JSON object in this exact format, nothing else:
{"category": "Pothole|Garbage|Streetlight|Waterlogging|Encroachment|Other", "severity": "Low|Medium|High", "description": "one sentence description of what you see"}`
                },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64.split(',')[1]
                  }
                }
              ]
            }]
          })
        }
      )

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleaned = text.replace(/```json|```/g, '').trim()
      const result = JSON.parse(cleaned)
      setAiResult(result)
      setCategory(result.category)
      setSeverity(result.severity)
      setDescription(result.description)
    } catch (err) {
      setAiResult({ error: true })
      setCategory('Other')
      setSeverity('Medium')
    }
    setAiLoading(false)
  }

  async function handleSubmit() {
    if (!photo || !category || !severity) return
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

      const ward = getWard(location?.lat, location?.lng)

      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          photo_url: urlData.publicUrl,
          category,
          severity,
          description,
          latitude: location?.lat || 17.3850,
          longitude: location?.lng || 78.4867,
          ward,
          status: 'open',
          upvotes: 0
        }])
        .select()

      if (error) throw error

      const id = data[0].id.slice(0, 8).toUpperCase()
      setComplaintId(id)
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

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => router.push('/map')}
              style={{
                background: '#16a34a', color: 'white',
                padding: '0.9rem', borderRadius: 12,
                fontSize: 15, fontWeight: 600
              }}>
              View on Live Map
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'white', color: '#6b7280',
                padding: '0.9rem', borderRadius: 12,
                fontSize: 15, border: '1px solid #e5e7eb'
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
              border: '1px solid #e5e7eb'
            }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#14532d' }}>
            Report an Issue
          </h1>
        </div>

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
                  fontSize: 13
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

        {locationStatus !== 'idle' && (
          <div style={{
            background: 'white', borderRadius: 12,
            padding: '0.75rem 1rem', marginBottom: '1rem',
            border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 18 }}>
              {locationStatus === 'loading' ? '⏳' : locationStatus === 'done' ? '📍' : '📍'}
            </span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#14532d' }}>
                {locationStatus === 'loading' ? 'Getting your location...' :
                 locationStatus === 'done' ? 'Location captured' : 'Using approximate location'}
              </p>
              {location && (
                <p style={{ fontSize: 12, color: '#9ca3af' }}>
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)} · {getWard(location.lat, location.lng)}
                </p>
              )}
            </div>
          </div>
        )}

        {aiLoading && (
          <div style={{
            background: '#eff6ff', borderRadius: 12,
            padding: '0.75rem 1rem', marginBottom: '1rem',
            border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
              AI is analysing your photo...
            </p>
          </div>
        )}

        {aiResult && !aiResult.error && !aiLoading && (
          <div style={{
            background: '#f0fdf4', borderRadius: 12,
            padding: '0.75rem 1rem', marginBottom: '1rem',
            border: '1px solid #bbf7d0',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#14532d' }}>
                AI detected: {aiResult.category} ·{' '}
                <span style={{ color: SEVERITY_COLOR[aiResult.severity] }}>
                  {aiResult.severity} severity
                </span>
              </p>
              <p style={{ fontSize: 12, color: '#4b5563' }}>You can edit below if needed</p>
            </div>
          </div>
        )}

        {photo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

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
                      padding: '0.5rem 1rem',
                      borderRadius: 99,
                      fontSize: 14,
                      fontWeight: 500,
                      border: category === cat ? '2px solid #16a34a' : '1px solid #e5e7eb',
                      background: category === cat ? '#f0fdf4' : 'white',
                      color: category === cat ? '#15803d' : '#6b7280'
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Severity
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {SEVERITY.map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    style={{
                      flex: 1, padding: '0.6rem',
                      borderRadius: 10, fontSize: 14, fontWeight: 600,
                      border: severity === sev
                        ? `2px solid ${SEVERITY_COLOR[sev]}`
                        : '1px solid #e5e7eb',
                      background: severity === sev
                        ? `${SEVERITY_COLOR[sev]}15`
                        : 'white',
                      color: severity === sev ? SEVERITY_COLOR[sev] : '#9ca3af'
                    }}>
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={140}
                rows={3}
                placeholder="Any additional details..."
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  border: '1px solid #e5e7eb', borderRadius: 12,
                  fontSize: 14, color: '#374151',
                  background: 'white', resize: 'none',
                  lineHeight: 1.5
                }}
              />
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>
                {description.length}/140
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !category || !severity}
              style={{
                background: submitting || !category || !severity ? '#86efac' : '#16a34a',
                color: 'white', padding: '1rem',
                borderRadius: 14, fontSize: 17, fontWeight: 700,
                width: '100%', marginTop: 4,
                transition: 'background 0.2s'
              }}>
              {submitting ? 'Submitting...' : 'Submit Complaint →'}
            </button>

          </div>
        )}

      </div>
    </main>
  )
}