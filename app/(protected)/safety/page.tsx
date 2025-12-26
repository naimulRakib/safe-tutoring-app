'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { 
  ShieldAlert, Phone, MapPin, Loader2, 
  Siren, CheckCircle, AlertTriangle, UserPlus, 
  Activity, Radio, X
} from 'lucide-react';

// --- CONSTANTS ---
const DEFAULT_CONTACTS = {
  father: { name: '', phone: '' },
  mother: { name: '', phone: '' }
};

// --- COMPONENTS ---

// 1. EMERGENCY CONTACT FORM
const EmergencyContactForm = ({ contacts, onSave, loading }: { contacts: any, onSave: (c: any) => void, loading: boolean }) => {
  const [formData, setFormData] = useState(DEFAULT_CONTACTS);

  useEffect(() => { 
    if (contacts) {
      setFormData({
        father: { ...DEFAULT_CONTACTS.father, ...(contacts.father || {}) },
        mother: { ...DEFAULT_CONTACTS.mother, ...(contacts.mother || {}) }
      });
    }
  }, [contacts]);

  const handleChange = (parent: 'father' | 'mother', field: 'name' | 'phone', value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [field]: value }
    }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <UserPlus size={20} className="text-emerald-500"/> Trusted Contacts
      </h3>
      <p className="text-xs text-zinc-400 mb-6">
        These numbers will receive an immediate SMS with your live location if you trigger a Safety Alert.
      </p>

      <div className="space-y-6">
        {['father', 'mother'].map((parent) => (
          <div key={parent} className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase">{parent} / Guardian</label>
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Name"
                className="bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-emerald-500 outline-none"
                value={(formData as any)[parent].name}
                onChange={(e) => handleChange(parent as 'father'|'mother', 'name', e.target.value)}
              />
              <input 
                placeholder="Phone"
                className="bg-black border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-emerald-500 outline-none"
                value={(formData as any)[parent].phone}
                onChange={(e) => handleChange(parent as 'father'|'mother', 'phone', e.target.value)}
              />
            </div>
          </div>
        ))}

        <button 
          onClick={() => onSave(formData)}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? <Activity className="animate-spin" size={18} /> : <CheckCircle size={18} />}
          {loading ? 'Saving...' : 'Save Emergency Contacts'}
        </button>
      </div>
    </div>
  );
};

// 2. SAFETY PROTOCOL VISUALIZER
const SafetyProtocol = () => {
  const steps = [
    { icon: <AlertTriangle size={20} />, title: "Threat Detected", desc: "You press the Panic Button." },
    { icon: <Radio size={20} />, title: "Live Trace On", desc: "Your GPS is tracked in real-time." },
    { icon: <Phone size={20} />, title: "SMS Sent", desc: "Parents get an SOS link." },
    { icon: <ShieldAlert size={20} />, title: "Security Team", desc: "Immediate intervention initiated." },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">How It Works</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-emerald-500 mb-3">
              {step.icon}
            </div>
            <h4 className="font-bold text-white text-sm mb-1">{step.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function SafetyPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);
  
  // Panic & Tracking State
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [panicCount, setPanicCount] = useState(5);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null); // ID of the live alert
  const [locationError, setLocationError] = useState("");
  
  // Refs for Intervals/Watchers
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('tutors').select('emergency_contacts').eq('id', user.id).single();
        if (data?.emergency_contacts) {
          setContacts({
            father: { ...DEFAULT_CONTACTS.father, ...(data.emergency_contacts.father || {}) },
            mother: { ...DEFAULT_CONTACTS.mother, ...(data.emergency_contacts.mother || {}) }
          });
        }
      }
    };
    fetchUser();

    // Cleanup on unmount
    return () => stopTracking();
  }, []);

  // 2. Save Contacts Logic
  const handleSaveContacts = async (newContacts: any) => {
    setLoading(true);
    if (userId) {
      const { error } = await supabase.from('tutors').update({ emergency_contacts: newContacts }).eq('id', userId);
      if (!error) {
        alert("Contacts Saved Successfully!");
        setContacts(newContacts);
      }
    }
    setLoading(false);
  };

  // 3. EXECUTE SAFETY PROTOCOL (GPS + DB)
  const executeSafetyProtocol = () => {
    // A. Check User ID exists
    if (!userId) {
      alert("System Error: User ID not found. Please reload.");
      return;
    }

    // B. Check GPS support
    if (!navigator.geolocation) {
      setLocationError("GPS not supported.");
      return;
    }

    // C. Get Initial Position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // D. INSERT Alert into Database
        console.log("🚀 Creating Alert for:", userId);
        const { data, error } = await supabase.from('safety_alerts').insert({
          user_id: userId,
          latitude: latitude,
          longitude: longitude,
          details: "Panic Button Pressed by Tutor",
          status: 'active'
        }).select().single();

        if (error) {
          console.error("❌ DB Insert Error:", error.message);
          alert(`Connection Error: ${error.message}`);
        } else if (data) {
          console.log("✅ Alert Active. ID:", data.id);
          setActiveAlertId(data.id); 
          setIsPanicMode(false);
          
          // E. Start Live Tracking Loop
          watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
              console.log("📍 Updating GPS:", pos.coords.latitude, pos.coords.longitude);
              await supabase.from('safety_alerts').update({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              }).eq('id', data.id);
            }, 
            (err) => console.error("Watch Error:", err),
            { enableHighAccuracy: true, maximumAge: 0 }
          );
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        setLocationError("GPS Denied. Enable Location Services.");
      },
      { enableHighAccuracy: true }
    );
  };

  // 4. STOP TRACKING
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setActiveAlertId(null);
    setPanicCount(5);
    setIsPanicMode(false);
  };

  // 5. TRIGGER LOGIC (Countdown)
  const startPanic = () => {
    if (isPanicMode || activeAlertId) return;
    
    setIsPanicMode(true);
    let count = 5;
    
    // Clear any existing interval
    if (countdownRef.current) clearInterval(countdownRef.current);

    countdownRef.current = setInterval(() => {
      count--;
      setPanicCount(count);
      
      if (count === 0) {
        clearInterval(countdownRef.current!);
        executeSafetyProtocol(); // 🔥 FIRE
      }
    }, 1000);
  };

  const cancelPanic = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsPanicMode(false);
    setPanicCount(5);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-emerald-900/20 rounded-xl">
            <ShieldAlert size={32} className="text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Safety Center</h1>
            <p className="text-sm text-zinc-400">Emergency protocols & Live Trace.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Contacts */}
          <div className="lg:col-span-2 space-y-8">
            <EmergencyContactForm contacts={contacts} onSave={handleSaveContacts} loading={loading} />
            <SafetyProtocol />
          </div>

          {/* RIGHT: Panic Button */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              
              {/* STATE: ALERT ACTIVE (TRACKING) */}
              {activeAlertId ? (
                <div className="rounded-2xl p-8 bg-red-600 text-white text-center animate-in zoom-in border border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                  <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Radio size={32} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black uppercase mb-2">LIVE TRACE ON</h2>
                  <p className="text-sm opacity-90 mb-6 font-bold">
                    GPS Broadcast Active. <br/>
                    Security Team Notified.
                  </p>
                  <p className="text-xs bg-black/20 p-3 rounded-lg leading-relaxed">
                    Keep this page open. Your location is being updated in real-time for our security team.
                  </p>
                  <button 
                    onClick={stopTracking}
                    className="mt-6 bg-white text-red-600 px-6 py-2 rounded-full font-bold text-xs hover:bg-gray-100 transition-colors"
                  >
                    I AM SAFE NOW (STOP)
                  </button>
                </div>
              ) : (
                /* STATE: READY / ACTIVATING */
                <div className={`rounded-2xl p-6 border transition-all duration-500 flex flex-col items-center text-center ${isPanicMode ? 'bg-red-900/20 border-red-500 animate-pulse' : 'bg-zinc-900 border-zinc-800'}`}>
                  
                  <h3 className={`font-bold uppercase tracking-widest mb-6 ${isPanicMode ? 'text-red-500' : 'text-zinc-400'}`}>
                    {isPanicMode ? 'HOLD TO CONFIRM...' : 'EMERGENCY TRIGGER'}
                  </h3>

                  <button 
                    onMouseDown={startPanic}
                    onTouchStart={startPanic}
                    onMouseUp={cancelPanic}
                    onTouchEnd={cancelPanic}
                    onMouseLeave={cancelPanic}
                    className={`w-40 h-40 rounded-full border-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center transition-all duration-300 select-none cursor-pointer
                      ${isPanicMode 
                        ? 'bg-red-600 border-red-800 scale-110 shadow-[0_0_100px_rgba(220,38,38,0.6)]' 
                        : 'bg-gradient-to-b from-zinc-800 to-black border-zinc-700 hover:border-red-500/50 hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]'
                      }`}
                  >
                    {isPanicMode ? (
                      <span className="text-6xl font-black text-white">{panicCount}</span>
                    ) : (
                      <>
                        <Siren size={40} className="text-red-500 mb-1" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Hold 5s<br/>To Alert</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-zinc-500 mt-8 leading-relaxed">
                    Hold button for 5 seconds to activate <strong>Live Trace</strong> and alert security immediately.
                  </p>
                  
                  {locationError && <p className="text-red-500 text-xs mt-3 font-bold bg-red-900/20 p-2 rounded">{locationError}</p>}
                </div>
              )}

              {/* Status Indicator */}
              <div className={`mt-4 border p-4 rounded-xl flex items-center justify-between transition-colors ${activeAlertId ? 'bg-red-900/20 border-red-500/50' : 'bg-zinc-900/50 border-zinc-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${activeAlertId ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                  <span className={`text-xs font-bold ${activeAlertId ? 'text-red-400' : 'text-zinc-300'}`}>System Status</span>
                </div>
                <span className={`text-xs font-mono ${activeAlertId ? 'text-red-500 font-bold' : 'text-emerald-500'}`}>
                  {activeAlertId ? 'ALERT ACTIVE' : 'ONLINE'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}