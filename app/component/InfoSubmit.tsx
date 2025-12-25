'use client'

import { useState, useEffect } from 'react' // Added useEffect
import { createClient } from '../utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()

  // --- STATE ---
  const [step, setStep] = useState(1) 
  const [role, setRole] = useState<string | null>(null)
  
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('') 
  const [youtubeLink, setYoutubeLink] = useState('') 
  
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true) // Start true to prevent flash of content
  const [locationError, setLocationError] = useState('')

  // --- 1. SAFETY CHECK: Redirect if already onboarded ---
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push('/login')

        // Check if profile exists
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (data) {
          // Profile exists! Redirect to dashboard immediately.
          router.replace('/dashboard')
        } else {
          // No profile, allow them to see the form
          setLoading(false)
        }
      } catch (error) {
        setLoading(false)
      }
    }
    checkProfile()
  }, [supabase, router])

  // --- HANDLERS ---

  const handleGetLocation = () => {
    setLoading(true)
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLoading(false)
      },
      (error) => {
        setLocationError('Permission denied. Please allow location access.')
        setLoading(false)
      }
    )
  }

  const handleSubmit = async () => {
    if (!username || !role || !location) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const profileData: any = {
        id: user.id,
        username: username,
        role: role,
        location: `POINT(${location.lng} ${location.lat})`, 
        is_online: true
      }

      if (role === 'tutor') {
        profileData.bio = bio
        profileData.youtube_link = youtubeLink
      }

      // --- 2. LOGIC CHANGE: Use INSERT (Not Upsert) ---
      // We use INSERT because we want to fail if it already exists.
      // If it exists, we just catch the error and redirect.
      const { error } = await supabase
        .from('profiles')
        .insert(profileData)

      if (error) {
        // Error Code 23505 = Unique Violation (Profile already exists)
        if (error.code === '23505') {
           console.log("Profile already exists, redirecting...")
           router.push('/dashboard')
           return
        }
        throw error
      }

      // Success -> Dashboard
      router.push('/dashboard') 

    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- RENDER ---

  // Show a simple loader while we check if they are already a user
  if (loading && !location && step === 1) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Checking Profile...</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
        
        {/* PROGRESS BAR */}
        <div className="w-full bg-gray-100 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>
        </div>

        {/* STEP 1: SELECT ROLE */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-center text-gray-900 mb-2">I am a...</h2>
            
            <div className="grid grid-cols-1 gap-3">
              {['Student', 'Tutor', 'Guardian'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r.toLowerCase())}
                  className={`p-4 rounded-xl border-2 font-bold text-lg transition-all
                    ${role === r.toLowerCase() 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                      : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              disabled={!role}
              onClick={() => setStep(2)}
              className="w-full bg-black text-white py-4 rounded-xl font-bold mt-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              Continue &rarr;
            </button>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-center text-gray-900">Complete Profile</h2>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-medium"
                placeholder="e.g. Alex"
              />
            </div>

            {role === 'tutor' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Your Bio <span className="text-blue-600">(For AI Search)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm h-24 resize-none"
                    placeholder="I teach Calculus..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    YouTube Demo <span className="text-blue-600">(Proof of Work)</span>
                  </label>
                  <input
                    type="text"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm"
                    placeholder="https://youtu.be/..."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Location</label>
              {!location ? (
                <button
                  onClick={handleGetLocation}
                  disabled={loading}
                  className="w-full py-3 border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-pulse">Locating...</span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Get My Location
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-green-100 text-green-800 rounded-lg border border-green-200 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    ✅ Location Locked
                  </span>
                  <button onClick={() => setLocation(null)} className="text-xs text-green-700 underline hover:text-green-900">Change</button>
                </div>
              )}
              {locationError && <p className="text-red-500 text-xs mt-1 font-medium">{locationError}</p>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!username || !location || (role === 'tutor' && !bio) || loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? 'Creating Profile...' : 'Finish Setup'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}