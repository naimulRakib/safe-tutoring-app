'use client';

import React, { useMemo, useState } from 'react';
import { 
  Sparkles, MapPin, CheckCircle2, X, Banknote, GraduationCap, 
  User, BrainCircuit, Eye, MessageCircle 
} from 'lucide-react';
import UserCard from './map/UserCard'; // Import your UserCard component
import { createClient } from '@/app/utils/supabase/client';

interface RecommendationListProps {
  results: any[];
  onClose: () => void;
  onContact: (user: any) => void;
  onViewProfile: (userId: string) => void;
}

// Helper to safely parse JSON strings from DB
const safeParse = (data: any) => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try { return JSON.parse(data); } catch (e) { return {}; }
};

export default function RecommendationList({ 
  results, 
  onClose, 
  onContact
}: RecommendationListProps) {
  const supabase = createClient();
  
  // 1. State to manage the active profile popup
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

  // --- DEDUPLICATION ---
  const uniqueResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    const seen = new Set();
    return results.filter(item => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [results]);

  // 2. Function to fetch full details and open the UserCard
  const handleViewProfile = async (tutorSummary: any) => {
    // Show loading state immediately using the summary data we have
    setSelectedProfile({ ...tutorSummary, loading: true });

    // Fetch full details from DB to ensure UserCard has all info
    const { data } = await supabase
      .from('tutors')
      .select('*, profiles(username)')
      .eq('id', tutorSummary.id)
      .single();

    if (data) {
      // Merge DB data with AI Match data
      setSelectedProfile({
        ...data,
        name: tutorSummary.name, // Keep name from summary if needed
        match_score: tutorSummary.match_score,
        match_reason: tutorSummary.match_reason,
        basic_info: safeParse(data.basic_info),
        teaching_details: safeParse(data.teaching_details),
        varsity_infos: safeParse(data.varsity_infos),
        loading: false
      });
    } else {
      setSelectedProfile({ ...tutorSummary, loading: false });
    }
  };

  const closeProfile = () => setSelectedProfile(null);

  if (uniqueResults.length === 0) return null;

  return (
    <>
      {/* --- AI RESULTS LIST (Sidebar) --- */}
      <div className="absolute top-24 right-4 md:right-10 w-[90%] md:w-[400px] z-40 animate-in slide-in-from-top-5 fade-in duration-300 font-sans">
        
        {/* Container */}
        <div className="flex flex-col bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <h3 className="font-bold text-white text-sm">AI Suggestions</h3>
                <p className="text-[10px] text-zinc-400">Top {uniqueResults.length} Matches Found</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {uniqueResults.map((tutor, idx) => {
              const isTop = idx === 0;
              const score = tutor.match_score || tutor.techScore || 0;
              const isVerified = String(tutor.verified) === 'true' || tutor.verified === true;

              return (
                <div 
                  key={tutor.id} 
                  className={`relative p-4 rounded-2xl border transition-all duration-300
                    ${isTop ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800'}
                  `}
                >
                  {isTop && (
                    <div className="absolute -top-2 -left-2 bg-emerald-500 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-lg z-10">
                      BEST MATCH
                    </div>
                  )}

                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 relative">
                      {tutor.avatar_url ? (
                         <img src={tutor.avatar_url} alt={tutor.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                         <User size={18} className="text-zinc-500" />
                      )}
                      {isVerified && (
                         <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-black shadow-sm z-10">
                           <CheckCircle2 size={8} className="text-white" />
                         </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-sm truncate">{tutor.name}</h4>
                        <span className={`text-[10px] font-bold ${isTop ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {score}% Match
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                        <GraduationCap size={10} />
                        <span className="truncate max-w-[150px]">
                          {tutor.university || 'University Not Listed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Reason */}
                  <div className="mt-3 bg-black/30 p-2.5 rounded-lg border border-white/5">
                     <div className="flex gap-2">
                       <Sparkles size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-zinc-300 leading-snug">
                         "{tutor.match_reason || "Great match based on search."}"
                       </p>
                     </div>
                  </div>

                  {/* Footer & Buttons */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                     <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium shrink-0">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {tutor.distance_km > 0 ? `${tutor.distance_km}km` : 'Nearby'}
                        </span>
                     </div>
                     
                     <div className="flex items-center gap-2 shrink-0">
                       {/* 👇 FIXED: This calls the handler, which updates state, which renders the Modal below */}
                       <button 
                         onClick={() => handleViewProfile(tutor)}
                         className="bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5"
                       >
                         <Eye size={12} /> Profile
                       </button>

                       <button 
                         onClick={() => onContact(tutor)}
                         className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-1.5 shadow-lg shadow-white/5"
                       >
                         <MessageCircle size={12} /> Contact
                       </button>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- 3. MODAL OVERLAY (Renders UserCard when state is set) --- */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border border-gray-200">
            
            {/* Close Button for Modal */}
            <button 
              onClick={closeProfile} 
              className="absolute top-3 right-3 p-2 bg-white/50 hover:bg-gray-200 rounded-full z-20 backdrop-blur-md transition-colors text-black"
            >
              <X size={20} />
            </button>

            {/* Render the UserCard Component */}
            <div className="h-full">
                {selectedProfile.loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-500">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
                        <span className="text-xs font-mono uppercase tracking-widest">Loading Profile...</span>
                    </div>
                ) : (
                    <UserCard 
                        user={selectedProfile} 
                        myRole="student" // Or pass current role
                        onContact={() => {
                            onContact(selectedProfile);
                            closeProfile();
                        }}
                    />
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}