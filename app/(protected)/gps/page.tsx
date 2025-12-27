// 👇 This line fixes the "Prerender Error" during build
// export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; 
import dynamicImport from 'next/dynamic'; 
import { createClient } from '@/app/utils/supabase/client';
import { 
  FileText, Search, LogOut, Mail, RefreshCw, 
  User as UserIcon, ShieldAlert, CheckCircle, 
  GraduationCap, BellRing, X, CalendarClock, List 
} from 'lucide-react'; 

// --- COMPONENTS ---
import Inbox from '@/app/component/Inbox';
import ProfileEditor from '@/app/component/ProfileEditor';
import ProfileAdvanced from '@/app/component/ProfileAdvanced';
import AiSearch from '@/app/component/AiSearch'; 
import ChatWindow from '@/app/component/ChatWindow'; 
import RecommendationList from '@/app/component/RecommendationList';
import AiChatWindow from '@/app/component/AiChatWindow';
import VarsityVerification from '@/app/component/VarsityVerifications';
import UserCard from '@/app/component/map/UserCard';
import ContactModal from '@/app/component/ContactModel'; 
import ProposalList from '@/app/component/dashboard/ProposalList'; 
import UpcomingAppointments from '@/app/component/dashboard/UpcomingAppointments';

// 👇 NEW IMPORT
import LocalTutorList from '@/app/component/dashboard/LocalTutorList'; 
 
// Dynamic Map
const MapDisplay = dynamicImport(() => import('@/app/component/MapDisplay'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#050505] flex flex-col items-center justify-center text-emerald-500 font-mono">
      <RefreshCw className="animate-spin mb-2" size={24} />
      <span className="text-[10px] tracking-[0.3em] uppercase">Initializing Satellites...</span>
    </div>
  )
});

// Helper
const safeParse = (data: any) => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try { return JSON.parse(data); } catch (e) { return {}; }
};

// ... (Categorize Logic for Map - Kept Intact) ...
const categorizeUsers = (currentUser: any, candidates: any[], myRole: string) => {
  const primary: any[] = [];
  const optional: any[] = [];
  if (!currentUser || !candidates) return { primary, optional };
  const myPhysicalArea = currentUser.primary_area; 
  const myPrefArea = currentUser.teaching_details?.preferred_area || ""; 
  const myOptAreas = currentUser.teaching_details?.optional_areas || []; 

  candidates.forEach((candidate) => {
    let rank = 0;
    const candidateArea = candidate.primary_area; 
    if (myRole === 'student') {
        const tutorPref = candidate.teaching_details?.preferred_area;
        const tutorOpts = candidate.teaching_details?.optional_areas || [];
        if (candidateArea === myPhysicalArea) rank = 1;
        else if (tutorPref === myPhysicalArea) rank = 2;
        else if (tutorOpts.includes(myPhysicalArea)) rank = 3;
    } else {
        if (candidateArea === myPhysicalArea) { rank = 1; }
        else if (candidateArea === myPrefArea) { rank = 2; }
        else if (myOptAreas.includes(candidateArea)) { rank = 3; }
    }
    if (rank === 1 || rank === 2) { primary.push({ ...candidate, match_rank: rank }); } 
    else if (rank === 3) { optional.push({ ...candidate, match_rank: rank }); }
  });
  primary.sort((a, b) => a.match_rank - b.match_rank);
  return { primary, optional };
};


export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- CORE STATE ---
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // --- UI MODALS ---
  const [showBasicEdit, setShowBasicEdit] = useState(false);
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showVarsityVerify, setShowVarsityVerify] = useState(false);
  const [showProposals, setShowProposals] = useState(false); 
  const [showSchedule, setShowSchedule] = useState(false); 
  const [contactTarget, setContactTarget] = useState<any | null>(null); 
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);

  // 👇 NEW: Toggle for Local List
  const [showLocalList, setShowLocalList] = useState(false);

  // --- DATA INTERACTION ---
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [sortedMatches, setSortedMatches] = useState<{ primary: any[], optional: any[] }>({ primary: [], optional: [] });
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string, applicationId?: string} | null>(null);

  // 1. Fetch Profile
  // 1. Fetch Profile
  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Define tutorData with explicit any type to avoid TS errors during merge
      let tutorData: any = null;

      if (profileData?.role === 'tutor') {
        const { data: tData } = await supabase
          .from('tutors')
          .select('varsity_verified, teaching_details')
          .eq('id', user.id)
          .maybeSingle();
        tutorData = tData;
      } else {
         const { data: sData } = await supabase
          .from('students')
          .select('tuition_details')
          .eq('id', user.id)
          .maybeSingle();
         tutorData = sData;
      }

      const completeProfile = { ...profileData, ...tutorData };
      setProfile(completeProfile);

      if (!profileData || !profileData.role || profileData.role === 'stranger') {
        setShowBasicEdit(true);
      } 
      // 👇 Fixed Line: Added Optional Chaining (?.)
      else if (profileData.role === 'tutor' && !tutorData?.varsity_verified) {
        setShowVarsityVerify(true);
      }

    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [supabase, router]);
  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // 2. Map Categorization Logic
  useEffect(() => {
    if (profile && aiResults && aiResults.length > 0) {
        const { primary, optional } = categorizeUsers(profile, aiResults, profile.role);
        setSortedMatches({ primary, optional });
    }
  }, [aiResults, profile]);

  const handleProfileUpdate = (newRole: string) => {
      setProfile((prev: any) => ({ ...prev, role: newRole }));
      setShowBasicEdit(false);
      if (newRole === 'tutor') setShowVarsityVerify(true);
      else setTimeout(() => setShowAdvancedEdit(true), 500);
  };
  const handleLogout = async () => { setLoading(true); await supabase.auth.signOut(); router.replace('/login'); };
  const handleViewProfile = async (userId: string) => {
    setViewingProfile({ loading: true });
    const tableName = profile?.role === 'student' ? 'tutors' : 'students';
    const { data } = await supabase.from(tableName).select('*, profiles(username)').eq('id', userId).single();
    if (data) setViewingProfile({ ...data, basic_info: safeParse(data.basic_info), teaching_details: safeParse(data.teaching_details), varsity_infos: safeParse(data.varsity_infos), name: data.basic_info?.full_name || data.profiles?.username || "User", loading: false });
    else setViewingProfile(null);
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-emerald-500 font-mono">LOADING SYSTEM...</div>;

  const isStudent = profile?.role === 'student';

  return (
    <div className="h-screen bg-[#050505] flex flex-col text-white font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* ... (Existing Modals) ... */}
      {showBasicEdit && <div className="absolute inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"><ProfileEditor onProfileUpdate={handleProfileUpdate} onClose={() => setShowBasicEdit(false)} isForced={!profile?.role || profile?.role === 'stranger'} /></div>}
      {showAdvancedEdit && <div className="absolute inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"><ProfileAdvanced role={profile?.role} onClose={() => setShowAdvancedEdit(false)} /></div>}
      {showVarsityVerify && profile?.role === 'tutor' && <div className="absolute inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"><div className="relative"><button onClick={() => setShowVarsityVerify(false)} className="absolute -top-10 right-0 text-white/50 hover:text-white text-sm"><LogOut size={12}/></button><VarsityVerification tutorId={profile.id} /></div></div>}
      {contactTarget && profile && <ContactModal senderId={profile.id} targetUser={contactTarget} onClose={() => setContactTarget(null)} />}
      {showProposals && profile && <div className="absolute inset-0 z-[9000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white text-black w-full max-w-md rounded-xl p-6 shadow-2xl relative"><button onClick={() => setShowProposals(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><LogOut size={18}/></button><ProposalList userId={profile.id} onAcceptSuccess={(chatUser) => { setActiveChatUser(chatUser); setShowProposals(false); }} /></div></div>}
      {showSchedule && profile && <div className="absolute inset-0 z-[9000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white text-black w-full max-w-md rounded-xl p-6 shadow-2xl relative"><button onClick={() => setShowSchedule(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={18}/></button><UpcomingAppointments userId={profile.id} onOpenChat={(partnerId) => { setActiveChatUser({ id: partnerId, name: "Partner" }); setShowSchedule(false); }} /></div></div>}
      {viewingProfile && <div className="absolute inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95"><div className="bg-white w-full max-w-md rounded-2xl relative overflow-hidden shadow-2xl border border-gray-200"><button onClick={() => setViewingProfile(null)} className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full z-10 text-black transition-colors"><X size={20}/></button>{viewingProfile.loading ? <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-500"><RefreshCw className="animate-spin" size={24}/><span>Loading...</span></div> : <UserCard user={viewingProfile} myRole={profile.role} onContact={() => { setContactTarget({ id: viewingProfile.id, name: viewingProfile.name }); setViewingProfile(null); }} />}</div></div>}

      {/* 👇 NEW: LOCAL TUTOR LIST MODAL */}
{showLocalList && isStudent && profile?.primary_area && (
  <div className="absolute inset-0 z-[8000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
      <div className="bg-[#0a0a0a] w-full max-w-lg rounded-2xl border border-zinc-800 shadow-2xl relative flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50 rounded-t-2xl">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2">
              <List size={18}/> LOCAL TUTORS: {profile.primary_area}
            </h3>
            <button onClick={() => setShowLocalList(false)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <LocalTutorList 
              studentArea={profile.primary_area} 
              
              // 👇 ADD THESE TWO LINES TO FIX THE RED LINE
              userLocation={userLocation} 
              onViewProfile={handleViewProfile} 

              onContact={(user) => {
                  setContactTarget({ id: user.id, name: user.basic_info?.full_name || "Tutor" });
                  setShowLocalList(false);
              }} 
            />
        </div>
      </div>
  </div>
)}

      {/* --- HEADER --- */}
      <header className="p-4 border-b border-white/10 bg-black/60 backdrop-blur-md z-10 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-5">
          <div><h1 className={`text-xl font-black tracking-tighter ${isStudent ? 'text-emerald-400' : 'text-cyan-400'}`}>{isStudent ? 'STUDENT RADAR' : 'TUTOR COMMAND'}</h1><div className="flex items-center gap-2 mt-0.5"><span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStudent ? 'bg-emerald-500' : 'bg-cyan-500'}`}></span><p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">{profile?.username || 'GHOST_OPERATIVE'}</p></div></div>
          <button onClick={() => setShowBasicEdit(true)} className="group flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"><RefreshCw size={12} className="text-emerald-500 group-hover:rotate-180 transition-transform duration-700" /><span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">System Change</span></button>
        </div>
        <div className="flex gap-2">
          
          {/* 👇 NEW BUTTON FOR STUDENTS: LOCAL LIST */}
          {isStudent && (
             <button 
               onClick={() => setShowLocalList(true)} 
               className="px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 bg-emerald-900/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/40 transition-all"
             >
               <List size={12}/> LOCAL LIST
             </button>
          )}

          {!isStudent && <button onClick={() => setShowVarsityVerify(true)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 transition-all ${profile?.varsity_verified ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400 animate-pulse'}`}>{profile?.varsity_verified ? <CheckCircle size={12} /> : <GraduationCap size={12} />}{profile?.varsity_verified ? 'VERIFIED' : 'VERIFY VARSITY'}</button>}
          <button onClick={() => setShowSchedule(!showSchedule)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 transition-all ${showSchedule ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}><CalendarClock size={12} /> SCHEDULE</button>
          <button onClick={() => setShowProposals(!showProposals)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 transition-all ${showProposals ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}><BellRing size={12} className={showProposals ? 'text-black' : 'text-red-400 animate-pulse'} /> REQUESTS</button>
          <button onClick={() => setShowAdvancedEdit(true)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 hover:scale-105 transition-all ${isStudent ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-cyan-900/30 border-cyan-500/30 text-cyan-400'}`}>{isStudent ? <Search size={12} /> : <FileText size={12} />}{isStudent ? 'REQUIREMENTS' : 'DOSSIER / CV'}</button>
          <button onClick={() => setShowInbox(!showInbox)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2 ${showInbox ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}><Mail size={12} /> INBOX</button>
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-all"><LogOut size={12} /></button>
        </div>
      </header>

      {/* --- MAIN INTERFACE --- */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        
        {isStudent && <AiSearch userLocation={userLocation} onResults={setAiResults} />}
        {isStudent && aiResults && <RecommendationList results={sortedMatches.primary.length > 0 ? [...sortedMatches.primary, ...sortedMatches.optional] : aiResults} onClose={() => setAiResults(null)} onContact={(user) => setContactTarget(user)} onViewProfile={(userId) => handleViewProfile(userId)} />}
        {showInbox && profile && <Inbox currentUserId={profile.id} onClose={() => setShowInbox(false)} onSelectUser={(user) => { setActiveChatUser(user); setShowInbox(false); }} />}
        {isStudent && <AiChatWindow />}
        {activeChatUser && profile && <ChatWindow currentUserId={profile.id} recipientId={activeChatUser.id} recipientName={activeChatUser.name} applicationId={activeChatUser.applicationId} myRole={profile.role} onClose={() => setActiveChatUser(null)} />}
        
        <div className="absolute inset-0 z-0">
          <MapDisplay 
            myRole={profile?.role} 
            highlightedUsers={aiResults}
            onLocationFound={(loc) => setUserLocation(loc)}
            onContactUser={(targetUser) => {
              const id = targetUser.tutor_id || targetUser.student_id || targetUser.id;
              const name = targetUser.tutor_name || targetUser.student_name || targetUser.username || targetUser.name || "User";
              if (id) setContactTarget({ id, name }); 
            }}
          />
        </div>
      </div>

      <style jsx>{` @keyframes progress { 0% { left: -100%; } 100% { left: 100%; } } .animate-progress { width: 0%; position: absolute; animation: progress 1.5s infinite linear; } `}</style>
    </div>
  );
}