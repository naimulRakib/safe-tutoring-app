'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  BookCheck, 
  ShieldAlert, 
  Zap, 
  Calendar,
  BarChart3
} from 'lucide-react';

// 👇 CHECK THIS IMPORT PATH CAREFULLY
import TuitionManager from '@/app/component/dashboard/TuitionManager'; 

export default function TuitionPage() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
      <p className="text-zinc-500 font-mono text-xs animate-pulse">SYNCING_IDENTITY...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px)`, backgroundSize: '30px 30px' }}>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* --- Header Section --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">Live Session</span>
              <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em]">// Classroom_Node_v4.0</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              My <span className="text-emerald-500">Classroom</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <Zap className="text-emerald-500 fill-emerald-500" size={18} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Handshake Pulse</p>
              <p className="text-sm font-black text-emerald-400">98.2% Consistency</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* --- LEFT SIDE: Main Classroom Manager --- */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              {/* Scanline Animation */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-[scan_4s_linear_infinite]" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Activity size={16} className="text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-tight">Active Contracts</h2>
              </div>

              {/* 👇 Your core logic component remains untouched here */}
              <TuitionManager userId={user.id} />
            </div>

            {/* AI Learning Graph (Static Visual) */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-cyan-400" /> Progress_Analytics
                  </h3>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-800 text-[10px] font-bold text-zinc-500">Weekly</div>
                    <div className="px-3 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-[10px] font-bold text-cyan-400">Monthly</div>
                  </div>
               </div>
               
               {/* Visual Mock of a graph */}
               <div className="flex items-end justify-between h-32 gap-1 px-2">
                  {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div 
                        style={{ height: `${h}%` }} 
                        className={`w-full rounded-t-md transition-all duration-500 cursor-help
                          ${i === 7 ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}
                       ></div>
                    </div>
                  ))}
               </div>
               <div className="mt-4 flex justify-between text-[9px] font-mono text-zinc-600 uppercase">
                  <span>Start_Cycle</span>
                  <span>Mid_Term</span>
                  <span>Final_Phase</span>
               </div>
            </div>
          </div>

          {/* --- RIGHT SIDE: Professional Sidebar Analytics --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl">
                <Clock className="text-zinc-500 mb-2" size={20} />
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Teaching_Hours</p>
                <p className="text-xl font-black">42.5h</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl">
                <BarChart3 className="text-zinc-500 mb-2" size={20} />
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Rating_Avg</p>
                <p className="text-xl font-black text-emerald-400">4.92</p>
              </div>
            </div>

            {/* Performance Sidebar */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 space-y-6">
               <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest border-b border-zinc-800 pb-4">Performance_Metrics</h3>
               
               {/* Metric 1 */}
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-400 flex items-center gap-2"><BookCheck size={14} className="text-emerald-500" /> Syllabus Progress</span>
                    <span className="text-emerald-400">72%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[72%] shadow-[0_0_10px_#10b981]"></div>
                  </div>
               </div>

               {/* Metric 2 */}
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-400 flex items-center gap-2"><Calendar size={14} className="text-cyan-500" /> Class Regularity</span>
                    <span className="text-cyan-400">95%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 w-[95%] shadow-[0_0_10px_#22d3ee]"></div>
                  </div>
               </div>

               {/* Verification Shield (Marketing UI) */}
               <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">

                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Trust Layer Active</h4>
                    <p className="text-[9px] text-zinc-500 font-mono leading-tight mt-1">
                      All session handshakes are cryptographically verified via PostGIS.
                    </p>
                  </div>
               </div>

               {/* Caution Area (Mock) */}
               <div className="pt-4">
                 <div className="flex items-center gap-2 text-red-500/70 mb-2">
                    <ShieldAlert size={14} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">System Alert</span>
                 </div>
                 <p className="text-[10px] text-zinc-600 bg-red-500/5 p-3 rounded-xl border border-red-500/10 font-medium italic">
                   "Ensure QR scanning happens within 50 meters of the registered zone to avoid payment disputes."
                 </p>
               </div>

            </div>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-12 text-center text-zinc-700 text-[10px] font-mono uppercase tracking-widest">
          ScholarGrid Operating System // Classroom Instance // Encrypted P2P Signal
        </footer>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(600px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}