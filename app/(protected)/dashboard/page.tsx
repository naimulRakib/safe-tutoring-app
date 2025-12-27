"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { 
  Map, ShieldAlert, LayoutDashboard, Siren, MonitorPlay, LogOut, 
  User, Bell, Activity, GraduationCap, ChevronRight, BookOpen, 
  Loader2, Wallet
} from 'lucide-react';

// --- DASHBOARD PAGE ---
export default function DashboardHome() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ activeContracts: 0, pendingRequests: 0 });

  // 1. AUTH & DATA FETCH
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUser(user);

      // Fetch Profile Role
      let { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // If missing, check specific tables
      if (!profileData) {
        const { data: tData } = await supabase.from('tutors').select('*').eq('id', user.id).single();
        if (tData) profileData = { ...tData, role: 'tutor' };
        else {
           const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
           if (sData) profileData = { ...sData, role: 'student' };
        }
      }
      setProfile(profileData);

      // Fetch Stats
      const roleField = profileData?.role === 'tutor' ? 'tutor_id' : 'student_id';
      
      // Active (Confirmed Classes)
      const { count: activeCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq(roleField, user.id)
        .eq('status', 'active');

       // Pending (Requests)
      const { count: pendingCount } = await supabase
        .from('applications') // Changed from 'contracts' to 'applications' for pending requests
        .select('*', { count: 'exact', head: true })
        .eq(profileData?.role === 'tutor' ? 'receiver_id' : 'sender_id', user.id)
        .eq('status', 'pending');

      setStats({ 
        activeContracts: activeCount || 0, 
        pendingRequests: pendingCount || 0 
      });

      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center gap-3 text-emerald-500 font-mono tracking-widest text-xs uppercase animate-pulse">
      <Loader2 className="animate-spin" /> Initializing System...
    </div>
  );

  const isTutor = profile?.role === 'tutor';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 p-4 md:p-8">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isTutor ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-cyan-900/20 border-cyan-500/20'}`}>
             <User className={isTutor ? "text-emerald-500" : "text-cyan-500"} size={24} />
          </div>
          <div>
             <h1 className="text-xl font-bold">
               Welcome back, {profile?.username || profile?.basic_info?.full_name || "User"}
             </h1>
             <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide flex items-center gap-2">
               {isTutor ? 'Tutor Operative' : 'Student Account'} 
               <span className={`w-2 h-2 rounded-full ${isTutor ? 'bg-emerald-500' : 'bg-cyan-500'} animate-pulse`}></span> 
               Online
             </p>
          </div>
        </div>

        <button onClick={handleLogout} className="p-3 rounded-full hover:bg-red-500/10 hover:text-red-500 text-zinc-600 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* 1. KEY METRICS (Top Row) */}
        
        {/* Active Tuitions Card */}
        <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={120} />
          </div>
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Active Tuitions</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">{stats.activeContracts}</span>
            <span className="text-sm text-emerald-500 mb-2 font-bold">Sessions Live</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/tuition" className="text-xs bg-white text-black px-5 py-2.5 rounded-xl font-black uppercase tracking-wider hover:bg-emerald-400 transition-colors shadow-lg">
              Open Classroom
            </Link>
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden group hover:border-zinc-700 transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Bell size={120} />
          </div>
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
             {isTutor ? 'Job Offers' : 'Pending Requests'}
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">{stats.pendingRequests}</span>
            <span className="text-sm text-yellow-500 mb-2 font-bold">Needs Action</span>
          </div>
          <div className="mt-4">
             {/* If Tutor -> Go to Tutor Dashboard (which has the Proposal Manager) */}
             {/* If Student -> Go to Student Dashboard or generic Contract page */}
             <Link 
               href={isTutor ? "/auth/dashboard" : "/contract"} 
               className="text-xs border border-zinc-700 text-zinc-300 px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-colors"
             >
              View Inbox
            </Link>
          </div>
        </div>


        {/* 2. THE MAP FEATURE (Big Card - Changes based on role) */}
        {isTutor ? (
           // TUTOR VIEW: View Heatmap / Find Students
           <Link href="/gps" className="md:col-span-3 bg-gradient-to-br from-emerald-950/20 to-black border border-emerald-500/30 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-emerald-500/60 transition-all cursor-pointer">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit text-emerald-400 border border-emerald-500/20">
                      <Map size={32} />
                   </div>
                   <span className="bg-emerald-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      Scanning Area
                   </span>
                </div>
                <div className="mt-12">
                  <h2 className="text-3xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">TUTOR COMMAND MAP</h2>
                  <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
                    View local student demand, heatmaps, and optimize your service radius using PostGIS intelligence.
                  </p>
                </div>
             </div>
           </Link>
        ) : (
           // STUDENT VIEW: Find Tutors
           <Link href="/gps" className="md:col-span-3 bg-gradient-to-br from-cyan-950/20 to-black border border-cyan-500/30 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-cyan-500/60 transition-all cursor-pointer">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-cyan-500/10 rounded-2xl w-fit text-cyan-400 border border-cyan-500/20">
                      <Map size={32} />
                   </div>
                   <span className="bg-cyan-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                      Radar Active
                   </span>
                </div>
                <div className="mt-12">
                  <h2 className="text-3xl font-black text-white mb-2 group-hover:text-cyan-400 transition-colors">LAUNCH STUDENT RADAR</h2>
                  <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
                    Scan your neighborhood for verified tutors. Filter by subject, budget, and university verification status.
                  </p>
                </div>
             </div>
           </Link>
        )}


        {/* 3. SAFETY MODULE (Small Card) */}
        <Link href="/safety" className="md:col-span-1 bg-red-950/10 border border-red-500/20 rounded-[2.5rem] p-6 flex flex-col justify-between hover:bg-red-950/20 hover:border-red-500/50 transition-all cursor-pointer group">
           <ShieldAlert size={32} className="text-red-500 mb-4 group-hover:scale-110 transition-transform" />
           <div>
             <h3 className="font-bold text-white text-lg group-hover:text-red-400 transition-colors">Safety HQ</h3>
             <p className="text-xs text-zinc-500 mt-1">Panic Button & Protocols</p>
           </div>
        </Link>


        {/* 4. UTILITIES ROW */}
        
        {/* ClassRoom (QR Attendance) */}
        <Link href="/tuition" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-600 transition-all group flex flex-col justify-between h-40">
            <GraduationCap size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-bold text-white">ClassRoom</h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">QR Attendance Logs</p>
            </div>
        </Link>

        {/* Admin / Security HQ (Visible to all for hackathon demo) */}
        <Link href="/admin/safety" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-orange-500/50 transition-all group flex flex-col justify-between h-40">
            <Siren size={24} className="text-orange-400 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-bold">Admin Feed</h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Live Security Trace</p>
            </div>
        </Link>

        {/* Tutor Specific Dashboard (Earnings, etc) */}
        {isTutor && (
          <Link href="/auth/dashboard" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all group flex flex-col justify-between h-40">
              <LayoutDashboard size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-bold">My Earnings</h3>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Manage Revenue</p>
              </div>
          </Link>
        )}

        {/* Student Specific (Wallet / History) */}
        {!isTutor && (
          <Link href="/tuition-status" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-cyan-500/50 transition-all group flex flex-col justify-between h-40">
              <Wallet size={24} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-bold">Payments</h3>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">History & Invoices</p>
              </div>
          </Link>
        )}

        {/* Presentation Deck */}
        <Link href="/presentation" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-pink-500/50 transition-all group flex flex-col justify-between h-40">
            <MonitorPlay size={24} className="text-pink-400 group-hover:scale-110 transition-transform" />
            <div>
              <h3 className="font-bold">Project Deck</h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Hackathon Slides</p>
            </div>
        </Link>

      </div>
    </div>
  );
}