"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, ArrowRightCircle, MapPin, GraduationCap, 
  DollarSign, Clock, BookOpen, User as UserIcon, ChevronDown, 
  ChevronRight, Undo2, AlertCircle 
} from 'lucide-react';
import UserCard from './UserCard';
import { createClient } from '@/app/utils/supabase/client';

// --- INTERFACES ---
interface RadarSidebarProps {
  show: boolean;
  onClose: () => void;
  smartFilter: boolean;
  primaryList: any[];
  optionalList: any[];
  myRole: string;
  onContactUser: (u: any) => void;
  userLoc: [number, number] | null;
  totalCount: number;
}

// --- HELPER: SKELETON LOADER ---
const ProfileSkeleton = () => (
  <div className="animate-pulse w-full">
    <div className="h-24 bg-gray-200 w-full relative">
       <div className="absolute -bottom-8 left-6 w-16 h-16 bg-gray-300 rounded-full border-4 border-white"></div>
    </div>
    <div className="pt-10 px-6 pb-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-20 bg-gray-100 rounded-xl w-full"></div>
      <div className="grid grid-cols-2 gap-3">
         <div className="h-16 bg-gray-100 rounded-xl"></div>
         <div className="h-16 bg-gray-100 rounded-xl"></div>
      </div>
    </div>
  </div>
);

export default function RadarSidebar({ 
  show, 
  onClose, 
  smartFilter, 
  primaryList, 
  optionalList, 
  myRole, 
  onContactUser, 
  userLoc 
}: RadarSidebarProps) {
  
  const supabase = createClient();

  // --- STATE ---
  const [visiblePrimary, setVisiblePrimary] = useState<any[]>(primaryList);
  const [visibleOptional, setVisibleOptional] = useState<any[]>(optionalList);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  
  // UI State
  const [expandPrimary, setExpandPrimary] = useState(true);
  const [expandOptional, setExpandOptional] = useState(true);
  
  // Undo Logic State
  const [recentlyEliminated, setRecentlyEliminated] = useState<{ user: any, list: 'primary' | 'optional' } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync props to state
  useEffect(() => {
    setVisiblePrimary(primaryList);
    setVisibleOptional(optionalList);
  }, [primaryList, optionalList]);

  // --- ACTIONS ---

  // 1. ELIMINATE WITH UNDO
  const handleEliminate = (userId: string) => {
    // Find the user to store for undo
    const inPrimary = visiblePrimary.find(u => (u.id === userId || u.tutor_id === userId || u.student_id === userId));
    const inOptional = visibleOptional.find(u => (u.id === userId || u.tutor_id === userId || u.student_id === userId));

    const userToRemove = inPrimary || inOptional;
    const listType = inPrimary ? 'primary' : 'optional';

    if (userToRemove) {
      // Set for potential undo
      setRecentlyEliminated({ user: userToRemove, list: listType });

      // Clear previous timer if exists
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      
      // Auto-hide undo button after 4 seconds
      undoTimeoutRef.current = setTimeout(() => {
        setRecentlyEliminated(null);
      }, 4000);

      // Perform Removal
      if (listType === 'primary') {
        setVisiblePrimary(prev => prev.filter(u => u !== userToRemove));
      } else {
        setVisibleOptional(prev => prev.filter(u => u !== userToRemove));
      }
    }
  };

  // 2. RESTORE (UNDO)
  const handleUndo = () => {
    if (!recentlyEliminated) return;
    const { user, list } = recentlyEliminated;

    if (list === 'primary') {
      setVisiblePrimary(prev => [user, ...prev]);
    } else {
      setVisibleOptional(prev => [user, ...prev]);
    }
    setRecentlyEliminated(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  // 3. VIEW PROFILE
  const handleViewProfile = async (userId: string, score: number) => {
    setSelectedProfile({ loading: true });

    const tableName = myRole === 'student' ? 'tutors' : 'students';
    
    // Attempt DB Fetch
    const { data } = await supabase
      .from(tableName)
      .select(`*, profiles ( username )`)
      .eq('id', userId)
      .single();

    if (data) {
      setSelectedProfile({ ...data, match_score: score });
    } else {
      // Fallback to local data
      const fallback = [...visiblePrimary, ...visibleOptional].find(r => 
        r.id === userId || r.tutor_id === userId || r.student_id === userId
      );
      setSelectedProfile({ ...fallback, match_score: score, loading: false });
    }
  };

  const closeProfile = () => setSelectedProfile(null);

  if (!show) return null;

  return (
    <>
      {/* --- SIDEBAR CONTAINER --- */}
      <div className="w-full md:w-[320px] h-full bg-white/95 backdrop-blur-md border-l border-gray-200 shadow-2xl overflow-hidden z-10 transition-transform absolute right-0 md:relative flex flex-col font-sans">
          
          {/* HEADER */}
          <div className={`px-4 py-3 border-b flex justify-between items-center sticky top-0 z-20 ${smartFilter ? 'bg-black text-white' : 'bg-white text-black'}`}>
            <div>
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  {smartFilter && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>}
                  {smartFilter ? 'Smart Radar' : 'Local Results'}
                </h3>
                <p className={`text-[10px] mt-0.5 ${smartFilter ? 'text-gray-400' : 'text-gray-500'}`}>
                  {visiblePrimary.length + visibleOptional.length} matches found
                </p>
            </div>
            <button onClick={onClose} className="md:hidden p-1 bg-gray-100/10 rounded-full hover:bg-gray-100/20 transition"><X size={18}/></button>
          </div>

          {/* SCROLLABLE LIST AREA */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
            
            {/* 1. PRIMARY SECTION */}
            {visiblePrimary.length > 0 && (
              <div className="bg-white rounded-xl border border-green-100 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandPrimary(!expandPrimary)}
                    className="w-full flex items-center justify-between p-3 bg-green-50/50 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 size={14} className="fill-green-100 text-green-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wide">Top Matches</h4>
                      <span className="text-[10px] bg-green-200 text-green-800 px-1.5 rounded-full">{visiblePrimary.length}</span>
                    </div>
                    {expandPrimary ? <ChevronDown size={14} className="text-green-700"/> : <ChevronRight size={14} className="text-green-700"/>}
                  </button>
                  
                  {expandPrimary && (
                    <div className="p-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      {visiblePrimary.map(user => (
                          <UserCard 
                            key={user.id} 
                            user={user} 
                            myRole={myRole} 
                            onContact={onContactUser} 
                            userLoc={userLoc}
                            onViewProfile={handleViewProfile}
                            onEliminate={handleEliminate}
                          />
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* 2. OPTIONAL SECTION */}
            {visibleOptional.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setExpandOptional(!expandOptional)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-gray-600">
                      <ArrowRightCircle size={14} />
                      <h4 className="text-xs font-bold uppercase tracking-wide">Flexible Matches</h4>
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded-full">{visibleOptional.length}</span>
                    </div>
                    {expandOptional ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                  </button>
                  
                  {expandOptional && (
                    <div className="p-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      {visibleOptional.map(user => (
                          <UserCard 
                            key={user.id} 
                            user={user} 
                            myRole={myRole} 
                            onContact={onContactUser} 
                            isOptional 
                            userLoc={userLoc}
                            onViewProfile={handleViewProfile}
                            onEliminate={handleEliminate}
                          />
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* EMPTY STATE */}
            {visiblePrimary.length === 0 && visibleOptional.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 space-y-2">
                   <div className="p-4 bg-gray-50 rounded-full">
                     <AlertCircle size={32} className="text-gray-300"/>
                   </div>
                   <p className="text-xs font-medium">No matches available.</p>
                </div>
            )}
          </div>

          {/* UNDO TOAST (Floating at bottom of sidebar) */}
          {recentlyEliminated && (
             <div className="absolute bottom-4 left-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-xl flex justify-between items-center animate-in slide-in-from-bottom-5 fade-in duration-300 z-30">
                <span className="text-xs">User removed</span>
                <button onClick={handleUndo} className="flex items-center gap-1 text-xs font-bold text-yellow-400 hover:text-yellow-300">
                   <Undo2 size={12} /> UNDO
                </button>
             </div>
          )}
      </div>

      {/* --- DETAILED PROFILE MODAL (OVERLAY) --- */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative border border-gray-200 max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={closeProfile} 
              className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-black/10 rounded-full z-10 backdrop-blur-md transition-colors text-white hover:text-black"
            >
              <X size={20} />
            </button>

            {selectedProfile.loading ? (
               <ProfileSkeleton />
            ) : (
              <>
                {/* Profile Banner */}
                <div className={`h-28 ${selectedProfile.varsity_verified ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-zinc-800 to-black'} relative`}>
                  <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 bg-white rounded-full border-[5px] border-white flex items-center justify-center shadow-lg">
                       <UserIcon size={40} className="text-gray-300"/>
                    </div>
                  </div>
                </div>

                {/* Profile Body */}
                <div className="pt-12 px-6 pb-6">
                  
                  {/* Header Info */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {selectedProfile.basic_info?.full_name || selectedProfile.name || "User"}
                        {selectedProfile.varsity_verified && <CheckCircle2 size={20} className="text-blue-500 fill-white" />}
                      </h2>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1 font-medium">
                        <MapPin size={14} className="text-gray-400"/> {selectedProfile.primary_area} 
                      </p>
                    </div>
                    {selectedProfile.match_score && (
                      <div className="flex flex-col items-center justify-center bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                         <span className="text-2xl font-black text-green-600">{selectedProfile.match_score}%</span>
                         <span className="text-[9px] text-green-800 uppercase tracking-widest font-bold">Match</span>
                      </div>
                    )}
                  </div>

                  {/* University / Verification Card */}
                  {selectedProfile.varsity_verified && selectedProfile.varsity_infos ? (
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl mb-5 flex items-start gap-3">
                      <div className="bg-blue-100 p-2.5 rounded-full text-blue-600 mt-0.5">
                        <GraduationCap size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">{selectedProfile.varsity_infos.university || "Verified University"}</p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          {selectedProfile.varsity_infos.department} • Batch {selectedProfile.varsity_infos.batch}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-5 flex items-center gap-3">
                       <GraduationCap size={18} className="text-gray-400"/>
                       <p className="text-sm text-gray-600">{selectedProfile.basic_info?.institution || "Institution Unverified"}</p>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <DollarSign size={12}/> {myRole === 'student' ? 'Expected Salary' : 'Budget'}
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedProfile.teaching_details?.salary_min || selectedProfile.rate || selectedProfile.budget || "Negotiable"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <Clock size={12}/> Availability
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedProfile.teaching_details?.days_per_week || "3"} Days / Week
                      </p>
                    </div>
                  </div>

                  {/* Subjects / Bio */}
                  <div className="mb-6">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2 flex items-center gap-1">
                      <BookOpen size={12}/> {myRole === 'student' ? 'Teaching Expertise' : 'Looking for help in'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const raw = selectedProfile.teaching_details?.subject_pref || selectedProfile.subjects;
                        const list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',') : []);
                        return list.length ? list.map((s: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-sm">
                            {s.trim()}
                          </span>
                        )) : <span className="text-sm text-gray-400 italic">No specific subjects listed</span>;
                      })()}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-gray-100 flex gap-3">
                    <button 
                       onClick={() => {
                         handleEliminate(selectedProfile.id || selectedProfile.tutor_id || selectedProfile.student_id);
                         closeProfile();
                       }}
                       className="flex-1 bg-red-50 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 transition-all flex justify-center items-center gap-2 border border-transparent hover:border-red-200"
                    >
                      <X size={18}/> Eliminate
                    </button>
                    <button 
                      onClick={() => {
                        onContactUser(selectedProfile);
                        closeProfile();
                      }} 
                      className="flex-[2] bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-all flex justify-center items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                    >
                      Contact Now
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}