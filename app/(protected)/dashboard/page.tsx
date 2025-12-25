'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; 
import { createClient } from '@/app/utils/supabase/client';
import { 
  FileText, 
  LogOut, 
  RefreshCw, 
  User as UserIcon
} from 'lucide-react'; 

// --- COMPONENTS KEPT ---
import ProfileEditor from '@/app/component/ProfileEditor';
import ProfileAdvanced from '@/app/component/ProfileAdvanced';

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- CORE STATE ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // --- UI MODALS ---
  const [showBasicEdit, setShowBasicEdit] = useState(false);
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);

  /**
   * 1. FETCH PROFILE
   */
  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/login'); 
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*') 
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setProfile(profileData);
      
      // Logic to trigger First-Time Setup
      if (!profileData || !profileData.role || profileData.role === 'stranger') {
        setShowBasicEdit(true);
      } else {
        setShowBasicEdit(false);
      }
      
    } catch (error) { 
      console.error("Dashboard Identity Error:", error); 
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * 2. HANDLERS
   */
  const handleProfileUpdate = (newRole: string) => {
      setProfile((prev: any) => ({ ...prev, role: newRole }));
      setShowBasicEdit(false);
      
      // Automatically open Advanced Editor after Basic setup
      setTimeout(() => setShowAdvancedEdit(true), 500);
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-emerald-500 font-mono space-y-4">
        <div className="w-12 h-1 bg-emerald-900 overflow-hidden relative">
          <div className="absolute inset-0 bg-emerald-500 animate-progress"></div>
        </div>
        <span className="text-[10px] tracking-widest animate-pulse uppercase">Loading_Profile_System...</span>
      </div>
    );
  }

  const isStudent = profile?.role === 'student';

  return (
    <div className="h-screen bg-[#050505] flex flex-col text-white font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* --- MODAL LAYER (Only Profile Editors) --- */}
      
      {/* 1. BASIC IDENTITY EDITOR */}
      {showBasicEdit && (
        <div className="absolute inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
           <ProfileEditor 
              onProfileUpdate={handleProfileUpdate}
              onClose={() => setShowBasicEdit(false)} 
              isForced={!profile?.role || profile?.role === 'stranger'} 
           />
        </div>
      )}

      {/* 2. ADVANCED DATA EDITOR */}
      {showAdvancedEdit && (
        <div className="absolute inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
           <ProfileAdvanced 
             role={profile?.role}
             onClose={() => setShowAdvancedEdit(false)} 
           />
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="p-4 border-b border-white/10 bg-black/60 backdrop-blur-md z-10 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-5">
          <div>
            <h1 className={`text-xl font-black tracking-tighter transition-all duration-500 ${isStudent ? 'text-emerald-400' : 'text-cyan-400'}`}>
              PROFILE MANAGER
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStudent ? 'bg-emerald-500' : 'bg-cyan-500'}`}></span>
              <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                {profile?.username || 'UNKNOWN_USER'}
              </p>
            </div>
          </div>

          {/* Trigger Basic Editor manually */}
          <button 
            onClick={() => setShowBasicEdit(true)}
            className="group flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
          >
            <UserIcon size={12} className="text-emerald-500 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Edit Basic Info</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          {/* Trigger Advanced Editor manually */}
          <button 
            onClick={() => setShowAdvancedEdit(true)} 
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 hover:scale-105 transition-all
              ${isStudent 
                ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' 
                : 'bg-cyan-900/30 border-cyan-500/30 text-cyan-400'}`}
          >
            <FileText size={12} />
            {isStudent ? 'EDIT REQUIREMENTS' : 'EDIT DOSSIER / CV'}
          </button>
          
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-all">
            <LogOut size={12} />
          </button>
        </div>
      </header>

      {/* --- MAIN INTERFACE PLACEHOLDER --- */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center bg-[#050505]">
        <div className="text-center opacity-30">
            <RefreshCw className="mx-auto mb-4 animate-spin-slow" size={48}/>
            <h2 className="text-2xl font-mono text-gray-500">PROFILE EDITOR MODE</h2>
            <p className="text-xs text-gray-600 mt-2">Map and interactions disabled.</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-progress {
          width: 0%;
          position: absolute;
          animation: progress 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}