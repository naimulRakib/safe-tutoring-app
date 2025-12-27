'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Siren, Phone, MapPin, Activity } from 'lucide-react';
import dynamic from 'next/dynamic';

// 👇 DYNAMICALLY IMPORT THE MAP COMPONENT (Disable SSR)
// This fixes the "window is not defined" and hook errors
const SafetyMap = dynamic(() => import('../safety/SafetyMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-emerald-500 font-mono animate-pulse">INITIALIZING SATELLITE UPLINK...</div>
});

export default function AdminSafetyPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('safety_alerts')
      .select(`
        *,
        tutor:tutors!user_id (
          basic_info,
          emergency_contacts
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) console.error("DB Error:", error);
    if (data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('safety_hq')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safety_alerts' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center font-mono text-red-500 animate-pulse">BOOTING SAFETY HQ OS...</div>;

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* 1. LEFT SIDE: LIVE LIST FEED */}
      <div className="w-1/3 border-r border-red-500/20 flex flex-col overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-red-500/20 bg-red-500/5">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-red-500">
            <Siren className="animate-pulse" /> INCOMING THREATS
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-widest">Global Intervention Layer Active</p>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center text-zinc-600 italic">No active SOS triggers in the grid.</div>
        ) : (
          <div className="flex-1 p-4 space-y-4">
            {alerts.map((alert) => {
              const info = typeof alert.tutor?.basic_info === 'string' ? JSON.parse(alert.tutor.basic_info) : alert.tutor?.basic_info;
              const contacts = typeof alert.tutor?.emergency_contacts === 'string' ? JSON.parse(alert.tutor.emergency_contacts) : alert.tutor?.emergency_contacts;

              return (
                <div key={alert.id} className="p-6 bg-zinc-900/50 rounded-3xl border border-red-500/30 hover:bg-zinc-900 transition-all cursor-crosshair">
                   <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-red-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest">Active SOS</span>
                      <span className="text-[10px] font-mono text-zinc-500">{new Date(alert.created_at).toLocaleTimeString()}</span>
                   </div>
                   
                   <h3 className="text-xl font-bold mb-1">{info?.full_name || "Unknown Tutor"}</h3>
                   <div className="flex items-center gap-2 text-zinc-400 text-xs mb-4">
                      <MapPin size={14} /> {alert.latitude}, {alert.longitude}
                   </div>

                   <div className="space-y-2 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Phone size={12}/> Emergency Contacts
                      </p>
                      <p className="text-sm">Father: <span className="text-red-400 font-bold">{contacts?.father?.phone || "N/A"}</span></p>
                      <p className="text-sm">Mother: <span className="text-red-400 font-bold">{contacts?.mother?.phone || "N/A"}</span></p>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. RIGHT SIDE: THE MAP HQ (Loaded Dynamically) */}
      <div className="flex-1 relative">
        <SafetyMap alerts={alerts} />

        {/* HUD OVERLAY */}
        <div className="absolute top-6 right-6 z-[1000] space-y-4 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl w-64">
             <div className="flex items-center gap-3 text-red-500 mb-4">
                <Activity size={24} />
                <h2 className="font-black text-sm uppercase tracking-tighter">HQ Status</h2>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-xs">
                   <span className="text-zinc-500">Grid Latency</span>
                   <span className="text-emerald-500">12ms</span>
                </div>
                <div className="flex justify-between text-xs">
                   <span className="text-zinc-500">Active Traces</span>
                   <span className="text-red-500 font-bold">{alerts.length}</span>
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                   <div className="bg-red-500 h-full w-[40%] animate-pulse"></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .leaflet-container { font-family: inherit; }
        .custom-popup .leaflet-popup-content-wrapper { background: white; border-radius: 12px; }
        .custom-popup .leaflet-popup-tip { background: white; }
      `}</style>
    </div>
  );
}