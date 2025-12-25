'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { MapPin, ShieldCheck, Loader2, X, Globe, Navigation, ChevronDown } from 'lucide-react';

// --- CONSTANTS ---
const DHAKA_AREAS = [
  "Adabor", "Azimpur", "Badda", "Banani", "Bangshal", "Baridhara", "Basabo", "Bashundhara", 
  "Banasree", "Cantonment", "Chawkbazar", "Dakshinkhan", "Dhanmondi", "Farmgate", 
  "Gulshan 1", "Gulshan 2", "Hazaribagh", "Jatrabari", "Kafrul", "Kamrangirchar", 
  "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur 1", "Mirpur 10", "Mirpur 11", 
  "Mirpur 12", "Mirpur 14", "Mohakhali", "Mohammadpur", "Motijheel", "New Market", 
  "Pallabi", "Paltan", "Ramna", "Rampura", "Sabujbagh", "Shahbagh", "Sher-e-Bangla Nagar", 
  "Shyampur", "Sutrapur", "Tejgaon", "Uttara", "Uttar Khan", "Vatara", "Wari", "Burichang"
];

interface ProfileEditorProps {
  onClose: () => void;
  onProfileUpdate?: (role: string) => void;
  isForced?: boolean;
}

export default function ProfileEditor({ onClose, onProfileUpdate, isForced = false }: ProfileEditorProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Toggle between GPS Button and Manual Selection
  const [isManualLoc, setIsManualLoc] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    role: 'student',
    primary_area: '', 
    location: null as string | null, // Store geometry string
  });

  const [locationStatus, setLocationStatus] = useState<string>('System Idle');

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

        if (data) {
          setFormData({
            username: data.username || '',
            role: (data.role === 'stranger' || !data.role) ? 'student' : data.role,
            primary_area: data.primary_area || '',
            location: data.location || null,
          });

          // If we have text but no specific GPS point, default to manual view
          if (data.primary_area && !data.location) {
             setIsManualLoc(true);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    loadProfile();
  }, [supabase]);

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) return alert("GPS not supported");
    setLocationStatus('🛰️ SCANNING...');
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      
      // Format for PostGIS Geometry (Longitude first, then Latitude)
      const point = `POINT(${longitude} ${latitude})`; 

      try {
        const res = await fetch('/api/identify-zone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: latitude, lng: longitude })
        });
        const data = await res.json();
        const zone = data.zone || 'Unknown';

        // Save the point to state
        setFormData(p => ({ ...p, primary_area: zone, location: point }));
        setLocationStatus(`✅ ${zone}`);

        // Sync to Profiles + Role Table immediately
        if (userId) {
          // Update generic profile
          await supabase.from('profiles').update({ location: point, primary_area: zone }).eq('id', userId);
          
          // Update specific role table with Geometry
          const table = formData.role === 'tutor' ? 'tutors' : 'students';
          await supabase.from(table).upsert({ 
            id: userId, 
            location: point, 
            primary_area: zone 
          });
        }
      } catch (e) { setLocationStatus('❌ AI ERROR'); }
    });
  };

  const handleManualLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     // When typing manually, we update the text, but we must clear the precise GPS point
     setFormData({
        ...formData, 
        primary_area: e.target.value,
        location: null 
     });
  };

  const handleSave = async () => {
    if (!userId || !formData.username) return alert("Missing Data");
    setSaving(true);
    try {
      // 1. Update Profile
      const { error: pErr } = await supabase.from('profiles').upsert({
        id: userId,
        username: formData.username,
        role: formData.role,
        primary_area: formData.primary_area,
        location: formData.location, 
        is_online: true
      });
      if (pErr) throw pErr;

      // 2. Initialize Role Table (Ensure row exists)
      const table = formData.role === 'tutor' ? 'tutors' : 'students';
      
      const rolePayload: any = { id: userId, primary_area: formData.primary_area };
      if (formData.location) {
        rolePayload.location = formData.location; // PostGIS expects 'POINT(lng lat)'
      }

      await supabase.from(table).upsert(rolePayload);

      if (onProfileUpdate) onProfileUpdate(formData.role);
      onClose();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-emerald-500 animate-pulse font-mono">LOADING_ENCRYPTION...</div>;

  return (
    <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl relative">
      {!isForced && <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20}/></button>}
      
      <div className="mb-6">
        <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Identity_Protocol</h2>
        <p className="text-[10px] text-zinc-500 font-mono">ROLE SELECTION UNLOCKED</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10px] font-mono text-zinc-500 uppercase">Handle</label>
          <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500" />
        </div>

        <div>
          <label className="text-[10px] font-mono text-zinc-500 uppercase">System Mode</label>
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none cursor-pointer">
            <option value="student">STUDENT_RADAR</option>
            <option value="tutor">TUTOR_COMMAND</option>
          </select>
        </div>

        <div className="pt-4 border-t border-white/5">
          {/* Header with Switcher */}
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase">Operational Zone</label>
            <button 
              onClick={() => setIsManualLoc(!isManualLoc)} 
              className="text-[9px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider flex items-center gap-1"
            >
              {isManualLoc ? <><Navigation size={10}/> Switch to Auto GPS</> : <><Globe size={10}/> Switch to Manual</>}
            </button>
          </div>
          
          {/* Conditional Input */}
          {isManualLoc ? (
             <div className="relative group">
                <Globe className="absolute left-3 top-3.5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={14} />
                <ChevronDown className="absolute right-3 top-3.5 text-zinc-600 pointer-events-none" size={14} />
                
                {/* Manual Selection with Datalist */}
                <input 
                   list="dhaka-areas-list"
                   value={formData.primary_area} 
                   onChange={handleManualLocationChange}
                   className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white outline-none focus:border-emerald-500 placeholder:text-zinc-700 font-mono text-sm"
                   placeholder="Search Area (e.g. Uttara)"
                />
                <datalist id="dhaka-areas-list">
                    {DHAKA_AREAS.map((area) => (
                        <option key={area} value={area} />
                    ))}
                </datalist>

             </div>
          ) : (
             <>
               <button onClick={handleUpdateLocation} className="w-full py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-bold tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2 group">
                 <MapPin size={14} className="group-hover:animate-bounce" /> 
                 {formData.primary_area || 'SYNC GPS'}
               </button>
               <p className="text-[9px] text-center mt-2 text-zinc-600 font-mono">{locationStatus}</p>
             </>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-emerald-400 hover:scale-[1.02] transition-all flex justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]">
          {saving ? <Loader2 className="animate-spin" /> : 'ESTABLISH IDENTITY'}
        </button>
      </div>
    </div>
  );
}