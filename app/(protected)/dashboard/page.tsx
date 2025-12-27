'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { 
  Map, ShieldAlert, FileText, LayoutDashboard, 
  Siren, MonitorPlay, LogOut, User, 
  Wallet, BookOpen, ChevronRight, Activity, Bell, GraduationCap // <--- Added Icon
} from 'lucide-react';

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
      // Check Session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setUser(user);

      // Fetch Profile Role
      let { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // If profile missing, fetch specific table
      if (!profileData) {
        const { data: tData } = await supabase.from('tutors').select('*').eq('id', user.id).single();
        if (tData) profileData = { ...tData, role: 'tutor' };
        else {
           const { data: sData } = await supabase.from('students').select('*').eq('id', user.id).single();
           if (sData) profileData = { ...sData, role: 'student' };
        }
      }
      setProfile(profileData);

      // Fetch Quick Stats (Active Contracts)
      const { count: activeCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq(profileData?.role === 'tutor' ? 'tutor_id' : 'student_id', user.id)
        .eq('status', 'active');

       // Fetch Pending
      const { count: pendingCount } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq(profileData?.role === 'tutor' ? 'tutor_id' : 'student_id', user.id)
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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-emerald-500 font-mono tracking-widest text-xs">
      INITIALIZING DASHBOARD...
    </div>
  );

  const isTutor = profile?.role === 'tutor';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 p-4 md:p-8">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center">
             <User className="text-zinc-400" size={24} />
          </div>
          <div>
             <h1 className="text-xl font-bold">
               Welcome back, {profile?.username || profile?.basic_info?.full_name || "User"}
             </h1>
             <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
               {isTutor ? 'Tutor Operative' : 'Student Account'} • <span className="text-emerald-500">Online</span>
             </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="p-3 rounded-full hover:bg-red-500/10 hover:text-red-500 text-zinc-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* 1. KEY METRICS (Top Row) */}
        <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={100} />
          </div>
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Active Tuitions</h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">{stats.activeContracts}</span>
            <span className="text-sm text-emerald-500 mb-2 font-bold">Sessions Live</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Link href="/contract" className="text-xs bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-emerald-400 transition-colors">
              Manage Contracts
            </Link>
          </div>
        </div>

        <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Bell size={100} />
          </div>
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
             {isTutor ? 'Job Offers' : 'Pending Requests'}
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">{stats.pendingRequests}</span>
            <span className="text-sm text-yellow-500 mb-2 font-bold">Needs Action</span>
          </div>
          <div className="mt-4">
             <Link href={isTutor ? "/tutor/dashboard" : "/contract"} className="text-xs border border-zinc-700 text-zinc-300 px-4 py-2 rounded-full font-bold hover:bg-zinc-800 transition-colors">
              View Inbox
            </Link>
          </div>
        </div>


        {/* 2. THE MAP FEATURE (Big Card) */}
        <Link href="/gps" className="md:col-span-3 bg-gradient-to-br from-emerald-950/30 to-black border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/60 transition-all cursor-pointer">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                 <div className="p-3 bg-emerald-500/10 rounded-xl w-fit text-emerald-400">
                    <Map size={32} />
                 </div>
                 <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded uppercase animate-pulse">
                    Live System
                 </span>
              </div>
              
              <div className="mt-8">
                <h2 className="text-3xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {isTutor ? 'Tutor Command Map' : 'Launch Student Radar'}
                </h2>
                <p className="text-zinc-400 max-w-md text-sm">
                  Access the geospatial interface to find tutors, track sessions, and view AI recommendations in real-time.
                </p>
              </div>
           </div>
        </Link>


        {/* 3. SAFETY MODULE (Small Card) */}
        <Link href="/safety" className="md:col-span-1 bg-red-950/10 border border-red-900/30 rounded-3xl p-6 flex flex-col justify-between hover:bg-red-950/20 hover:border-red-500/50 transition-all cursor-pointer group">
           <ShieldAlert size={32} className="text-red-500 mb-4 group-hover:scale-110 transition-transform" />
           <div>
             <h3 className="font-bold text-white text-lg">Safety Center</h3>
             <p className="text-xs text-red-400 mt-1">Panic Button & Protocols</p>
           </div>
        </Link>


        {/* 4. UTILITIES ROW */}
        
        {/* NEW: ClassRoom (QR Attendance) */}
        <Link href="/tuition" className="md:col-span-1 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-blue-500/30 rounded-3xl p-6 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all group">
            <GraduationCap size={24} className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-white">ClassRoom</h3>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">QR Attendance & Logs</p>
            <div className="flex items-center gap-2 text-xs text-blue-400 mt-4 group-hover:translate-x-1 transition-transform font-bold">
               Enter Room <ChevronRight size={12}/>
            </div>
        </Link>

        {/* Tuition Manager / Status */}
        <Link href="/tuition-status" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-600 transition-all group">
            <BookOpen size={24} className="text-purple-400 mb-4" />
            <h3 className="font-bold">Tuition Status</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 group-hover:text-white transition-colors">
               View Logs <ChevronRight size={12}/>
            </div>
        </Link>

        {/* Admin / Security HQ */}
        <Link href="/admin/safety" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-orange-500/50 transition-all group">
            <Siren size={24} className="text-orange-400 mb-4" />
            <h3 className="font-bold">Admin HQ</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 group-hover:text-white transition-colors">
               Security Feed <ChevronRight size={12}/>
            </div>
        </Link>

        {/* Tutor Specific Dashboard (Earnings, etc) */}
        {isTutor && (
          <Link href="/auth/dashboard" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-cyan-500/50 transition-all group">
              <LayoutDashboard size={24} className="text-cyan-400 mb-4" />
              <h3 className="font-bold">My Tuition</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 group-hover:text-white transition-colors">
                 Manage Profile <ChevronRight size={12}/>
              </div>
          </Link>
        )}

        {/* Presentation Deck */}
        <Link href="/presentation" className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-pink-500/50 transition-all group">
            <MonitorPlay size={24} className="text-pink-400 mb-4" />
            <h3 className="font-bold">Hackathon Deck</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 group-hover:text-white transition-colors">
               Open Slides <ChevronRight size={12}/>
            </div>
        </Link>

      </div>
    </div>
  );
}