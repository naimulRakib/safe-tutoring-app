"use client";

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { 
  ShieldCheck, Star, Wallet, Zap, History, UserCheck, 
  TrendingUp, MessageSquare, ArrowUpRight, Loader2, Terminal
} from 'lucide-react';

// 👇 Your Managers
import ContractManager from '@/app/component/dashboard/ContractManager'; 
import ReviewManager from '@/app/component/reviews/ReviewManager'; // Ensure path is correct

export default function TutorDashboardPage() {
  // 1. STABILIZE CLIENT: This fixes the "useEffect changed size" error
  const supabase = useMemo(() => createClient(), []);
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isMounted) {
          setUser(user);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth Error:", err);
        if (isMounted) setLoading(false);
      }
    };

    checkUser();

    return () => { isMounted = false; };
  }, [supabase]); // Depend on the stable memoized client

  // --- LOADING STATE ---
  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
      <p className="text-zinc-500 font-mono text-[10px] uppercase animate-pulse">Establishing_Secure_Link...</p>
    </div>
  );
  
  // --- UNAUTHORIZED STATE ---
  if (!user) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white">
      <div className="text-center p-12 border border-zinc-800 rounded-[2.5rem] bg-zinc-900/40 backdrop-blur-xl">
        <ShieldCheck className="mx-auto text-zinc-700 mb-4" size={48} />
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Unauthorized Access</h2>
        <p className="text-zinc-500 text-sm mb-6">Your session token is missing or expired.</p>
        <button className="px-8 py-3 bg-emerald-500 text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all">
          Return to Gateway
        </button>
      </div>
    </div>
  );

  // --- MAIN DASHBOARD UI ---
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px)`, backgroundSize: '32px 32px' }}>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-zinc-900">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-[0_0_10px_rgba(16,185,129,0.4)]">Tutor Active</span>
              <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]">// Identity_Verified</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              Tutor <span className="text-emerald-500">Dashboard</span>
            </h1>
            <p className="text-zinc-500 text-xs mt-1">Operational hub for professional educators.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Network Status</p>
               <p className="text-sm font-black text-emerald-400">Node_Online</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
              <UserCheck className="text-emerald-500" size={20} />
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[2rem] group hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <Wallet className="text-zinc-500" size={20} />
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <TrendingUp size={10} /> +12%
                </span>
              </div>
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total_Revenue</h3>
              <p className="text-3xl font-black mt-1">৳0.00</p>
           </div>

           <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-[2rem] group hover:border-yellow-500/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <Star className="text-zinc-500" size={20} />
                <span className="text-[10px] text-zinc-400 font-bold">5.00/5.00</span>
              </div>
              <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Reputation_Score</h3>
              <p className="text-3xl font-black mt-1">Perfect</p>
           </div>

           <div className="p-6 bg-emerald-500 text-black rounded-[2rem] shadow-[0_20px_40px_rgba(16,185,129,0.2)] flex flex-col justify-between">
              <div>
                <Zap size={24} fill="black" />
                <h3 className="text-[10px] font-black uppercase tracking-widest mt-4">System Verdict</h3>
                <p className="text-xl font-black leading-tight">High Demand <br/> In Area</p>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase mt-4 hover:translate-x-1 transition-transform">
                Boost Visibility <ArrowUpRight size={14} />
              </button>
           </div>
        </div>

        {/* Main Operational Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Contract Manager */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
               {/* Scanline Animation */}
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-[scan_5s_linear_infinite]" />
               
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-lg font-bold uppercase tracking-tighter flex items-center gap-3">
                   <History className="text-emerald-500" size={20} /> Active_Contracts
                 </h2>
                 <span className="text-[10px] font-mono text-zinc-600">Sync_Live</span>
               </div>
               
               <ContractManager tutorId={user.id} />
            </section>
          </div>

          {/* Review Manager */}
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
               <div className="mb-8">
                 <h2 className="text-lg font-bold uppercase tracking-tighter flex items-center gap-3">
                   <MessageSquare className="text-cyan-400" size={20} /> Feedback_Hub
                 </h2>
                 <p className="text-zinc-500 text-[10px] font-mono mt-2 uppercase tracking-widest">
                   Mutual Verification System
                 </p>
               </div>

               <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl mb-6">
                 <div className="flex items-center gap-2 mb-1">
                    <Terminal size={12} className="text-cyan-400" />
                    <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Logic Update</span>
                 </div>
                 <p className="text-[10px] text-zinc-400 leading-relaxed">
                   To protect your ranking, reviews are only enabled after the payment cycle is confirmed. Rate students based on punctuality and focus.
                 </p>
               </div>

               <ReviewManager />

               <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-600 uppercase">
                  <span>Transparency Enforced</span>
                  <ShieldCheck size={14} className="text-emerald-500" />
               </div>
            </section>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-20 text-center pb-10">
          <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.5em]">
            ScholarGrid Secure Core // v1.0.4 // Dhaka_Operating_System
          </p>
        </footer>

      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(500px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}