'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/app/utils/supabase/client';


import AiSearch from '@/app/component/AiSearch'; 

const MapDisplay = dynamic(() => import('@/app/component/MapDisplay'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#050505] flex items-center justify-center text-emerald-500 font-mono animate-pulse">Initializing System...</div>
});

export default function DashboardPage() {
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('IDLE');

 
  const [aiResults, setAiResults] = useState<any[] | null>(null);

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (data) setRole(data.role);
      }
      setLoading(false);
    }
    getUserRole();
  }, [supabase]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setLocationStatus('SCANNING...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('LOCKED');
      },
      (error) => {
        console.error(error);
        setLocationStatus('ERROR');
      }
    );
  };

  if (loading || !role) return <div className="min-h-screen bg-[#050505]" />;

  const isStudent = role === 'student';
  const themeColor = isStudent ? 'emerald' : 'violet';

  return (
    <div className="h-screen bg-[#050505] flex flex-col text-white font-sans">
      
      <header className="p-4 border-b border-white/10 bg-black/40 backdrop-blur-md z-10 flex justify-between items-center">
        <h1 className={`text-xl font-bold text-${themeColor}-400`}>
          {isStudent ? 'STUDENT RADAR' : 'TUTOR COMMAND'}
        </h1>
        <div className={`px-3 py-1 rounded-full border border-${themeColor}-500/30 bg-${themeColor}-500/10 text-xs font-bold text-${themeColor}-400 uppercase`}>
          {role}
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        
       
        {isStudent && (
          <AiSearch 
            userLocation={userLocation} 
            onResults={(results) => setAiResults(results)} 
          />
        )}

        <div className={`absolute top-4 right-4 z-[400] bg-black/90 border border-${themeColor}-500/30 p-4 rounded-xl shadow-2xl backdrop-blur-md max-w-xs`}>
          <h2 className={`text-${themeColor}-400 font-bold text-sm mb-2`}>
            SIGNAL CONTROLS
          </h2>
          
          <button 
            onClick={handleGetLocation}
            className={`w-full py-3 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-black font-bold text-xs rounded uppercase transition-all shadow-lg flex items-center justify-center gap-2`}
          >
            {locationStatus === 'SCANNING...' && <span className="animate-spin">⟳</span>}
            {locationStatus === 'LOCKED' ? 'SIGNAL LOCKED' : 'LOCATE ME'}
          </button>

          {userLocation && (
            <div className="mt-3 p-2 bg-white/5 rounded border border-white/10 text-center animate-in fade-in">
              <p className="text-[10px] text-gray-500 font-mono">COORDINATES ACQUIRED</p>
              <p className={`text-xs font-mono text-${themeColor}-400`}>
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        <MapDisplay 
          myRole={role} 
          currentUserLocation={userLocation} 
          highlightedUsers={aiResults} // <--- Pass the AI results here
        />
        
      </div>
    </div>
  );
}