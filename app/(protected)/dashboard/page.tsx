// 👇 This line fixes the "Prerender Error" during build
// export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; 
import dynamicImport from 'next/dynamic'; 
import { createClient } from '@/app/utils/supabase/client';
import { 
  FileText, 
  LogOut, 
  RefreshCw, 
  User as UserIcon, 
  CheckCircle, // Added Icon
  GraduationCap // Added Icon
} from 'lucide-react'; 

// --- COMPONENTS KEPT ---
import ProfileEditor from '@/app/component/ProfileEditor';
import ProfileAdvanced from '@/app/component/ProfileAdvanced';
import VarsityVerification from '@/app/component/VarsityVerifications'; // Added Component

// Dynamic Map
const MapDisplay = dynamicImport(() => import('@/app/component/MapDisplay'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#050505] flex flex-col items-center justify-center text-emerald-500 font-mono">
      <RefreshCw className="animate-spin mb-2" size={24} />
      <span className="text-[10px] tracking-[0.3em] uppercase">Initializing Global Map...</span>
    </div>
  )
});

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- CORE STATE ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // --- UI MODALS ---
  const [showBasicEdit, setShowBasicEdit] = useState(false);
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);
  const [showVarsityVerify, setShowVarsityVerify] = useState(false); // Added State

  // --- MAP STATE ---
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

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

      // Fetch tutor specific data for verification status
      let tutorData = null;
      if (profileData?.role === 'tutor') {
        const { data: tData } = await supabase
          .from('tutors')
          .select('varsity_verified')
          .eq('id', user.id)
          .maybeSingle();
        tutorData = tData;
      }

      const completeProfile = { ...profileData, ...tutorData };
      setProfile(completeProfile);
      
      // Trigger First-Time Setup if role is missing
      if (!profileData || !profileData.role || profileData.role === 'stranger') {
        setShowBasicEdit(true);
      } else if (profileData.role === 'tutor' && !tutorData?.varsity_verified) {
        // Optional: Auto-open verification for unverified tutors
        // setShowVarsityVerify(true); 
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
      if (newRole === 'tutor') {
        setShowVarsityVerify(true);
      } else {
        // Open advanced editor after basic is done for students
        setTimeout(() => setShowAdvancedEdit(true), 500);
      }
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
        <span className="text-[10px] tracking-widest animate-pulse uppercase">Loading_Geospatial_Data...</span>
      </div>
    );
  }

  const isStudent = profile?.role === 'student';

  return (
    <div className="h-screen bg-[#050505] flex flex-col text-white font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* --- MODAL LAYER --- */}
      
      {/* 1. BASIC IDENTITY */}
      {showBasicEdit && (
        <div className="absolute inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
           <ProfileEditor 
              onProfileUpdate={handleProfileUpdate}
              onClose={() => setShowBasicEdit(false)} 
              isForced={!profile?.role || profile?.role === 'stranger'} 
           />
        </div>
      )}

      {/* 2. ADVANCED DATA */}
      {showAdvancedEdit && (
        <div className="absolute inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
           <ProfileAdvanced 
             role={profile?.role}
             onClose={() => setShowAdvancedEdit(false)} 
           />
        </div>
      )}

      {/* 3. VARSITY VERIFICATION (New Modal) */}
      {showVarsityVerify && profile?.role === 'tutor' && (
        <div className="absolute inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative">
             <button 
                onClick={() => setShowVarsityVerify(false)}
                className="absolute -top-10 right-0 text-white/50 hover:text-white text-sm flex items-center gap-1"
             >
               Skip for now <LogOut size={12}/>
             </button>
             <VarsityVerification tutorId={profile.id} />
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="p-4 border-b border-white/10 bg-black/60 backdrop-blur-md z-10 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-5">
          <div>
            <h1 className={`text-xl font-black tracking-tighter transition-all duration-500 ${isStudent ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {isStudent ? 'STUDENT RADAR' : 'TUTOR COMMAND'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStudent ? 'bg-emerald-500' : 'bg-cyan-500'}`}></span>
              <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                {profile?.username || 'OPERATIVE'}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowBasicEdit(true)}
            className="group flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
          >
            <UserIcon size={12} className="text-emerald-500 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Edit Identity</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          
          {/* VARSITY VERIFICATION BUTTON (Only for Tutors) */}
          {!isStudent && (
             <button
               onClick={() => setShowVarsityVerify(true)}
               className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 transition-all
                 ${profile?.varsity_verified 
                    ? 'bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30' 
                    : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400 animate-pulse hover:bg-yellow-900/30'}`}
             >
               {profile?.varsity_verified ? <CheckCircle size={12} /> : <GraduationCap size={12} />}
               {profile?.varsity_verified ? 'VERIFIED' : 'VERIFY VARSITY'}
             </button>
          )}

          {/* ADVANCED INFO */}
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

      {/* --- MAIN INTERFACE (MAP ONLY) --- */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        
        {/* BACKGROUND MAP */}
        <div className="absolute inset-0 z-0">
          <MapDisplay 
            myRole={profile?.role} 
            highlightedUsers={null} // No search results to highlight
            onLocationFound={(loc) => setUserLocation(loc)}
            onContactUser={(user) => console.log("Map User Clicked:", user)}
          />
        </div>

        {/* Optional Overlay to show map is active */}
        <div className="absolute bottom-4 left-4 pointer-events-none">
           <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-2 rounded text-[10px] text-gray-400 font-mono">
              LAT: {userLocation?.lat.toFixed(4) || "---"} <br/>
              LNG: {userLocation?.lng.toFixed(4) || "---"}
           </div>
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