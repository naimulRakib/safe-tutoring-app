'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Users, MapPin, Zap, ArrowRight, ShieldCheck, Search, Info } from 'lucide-react';

export default function GroupTutoringOS({ currentUserRole, userId }: { currentUserRole: 'tutor' | 'student', userId: string }) {
  const [tutorOffers, setTutorOffers] = useState<any[]>([]);
  const [studentRequests, setStudentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'offers' | 'requests'>(currentUserRole === 'student' ? 'offers' : 'requests');
  const supabase = createClient();

  const fetchChannelData = useCallback(async () => {
    setLoading(true);
    // 1. Fetch Tutor-led Courses
    const { data: tutors } = await supabase
      .from('tutors')
      .select('*')
      .eq('custom_course->active', true);

    // 2. Fetch Student-led Group Requests
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('custom_course_plan->active', true);

    if (tutors) setTutorOffers(tutors);
    if (students) setStudentRequests(students);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 italic">
              NEIGHBORHOOD <span className="text-blue-500">CHANNELS</span>
            </h1>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
              {currentUserRole === 'student' ? 'Find a Batch in Burichang' : 'Browse Student-Led Study Groups'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('offers')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'offers' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              Tutor Batches
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              Student Requests
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 animate-pulse">
            <Search className="text-blue-500 mb-4" size={48} />
            <p className="font-mono text-zinc-500 text-xs">SCANNING LOCAL CHANNELS...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* RENDER TUTOR OFFERS (When Active) */}
            {activeTab === 'offers' && tutorOffers.map((tutor) => {
              const info = typeof tutor.basic_info === 'string' ? JSON.parse(tutor.basic_info) : tutor.basic_info;
              return (
                <div key={tutor.id} className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:border-blue-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                      Teacher Led
                    </span>
                    <p className="text-2xl font-black text-white">৳{tutor.custom_course.price}</p>
                  </div>
                  <h3 className="text-2xl font-black mb-4 leading-tight">{tutor.custom_course.title}</h3>
                  <div className="flex items-center gap-3 mb-6 p-3 bg-black/40 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-blue-500 border border-zinc-700">T</div>
                    <div>
                      <p className="text-xs font-bold">{info.full_name}</p>
                      <p className="text-[10px] text-blue-400 font-mono">{tutor.varsity_infos?.university}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase mb-8">
                    <span className="flex items-center gap-1"><MapPin size={12}/> {tutor.primary_area}</span>
                    <span className="flex items-center gap-1"><Users size={12}/> Capacity: {tutor.max_student_capacity}</span>
                  </div>
                  <button className="w-full py-4 bg-blue-600 rounded-2xl font-black text-sm group-hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                    ENROLL IN BATCH <ArrowRight size={18}/>
                  </button>
                </div>
              );
            })}

            {/* RENDER STUDENT REQUESTS (When Active) */}
            {activeTab === 'requests' && studentRequests.map((student) => {
              const info = typeof student.basic_info === 'string' ? JSON.parse(student.basic_info) : student.basic_info;
              return (
                <div key={student.id} className="bg-zinc-900/40 border border-emerald-500/20 rounded-[2.5rem] p-8 hover:border-emerald-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                      Host Requested
                    </span>
                    <p className="text-2xl font-black text-white">৳{student.custom_course_plan.offer_price}</p>
                  </div>
                  <h3 className="text-2xl font-black mb-2 leading-tight">{student.custom_course_plan.topic}</h3>
                  <p className="text-xs text-zinc-500 mb-6 line-clamp-2 italic">"{student.custom_course_plan.details}"</p>
                  
                  <div className="flex items-center gap-3 mb-6 p-3 bg-black/40 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-emerald-500 border border-zinc-700">S</div>
                    <div>
                      <p className="text-xs font-bold">{info.full_name}</p>
                      <p className="text-[10px] text-zinc-500">{info.class_level}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase mb-8">
                    <span className="flex items-center gap-1"><MapPin size={12}/> {student.primary_area}</span>
                    <span className="flex items-center gap-1"><Zap size={12}/> Need: {student.custom_course_plan.duration}</span>
                  </div>

                  <button className="w-full py-4 bg-emerald-600 rounded-2xl font-black text-sm group-hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 text-black">
                    BID AS TUTOR <ArrowRight size={18}/>
                  </button>
                </div>
              );
            })}

          </div>
        )}

        {/* Informational Footer */}
        <div className="mt-12 bg-zinc-900/50 p-6 rounded-3xl border border-white/5 flex items-start gap-4 animate-in fade-in duration-1000">
           <Info className="text-blue-500 shrink-0" size={20} />
           <p className="text-xs text-zinc-400 leading-relaxed">
             <strong>ScholarGrid OS Intelligence:</strong> Channels are geo-fenced to <strong>{currentUserRole === 'student' ? 'Burichang' : 'Your Area'}</strong>. 
             Student-led groups allow tutors to earn 3x more by teaching multiple students at once, while students pay 60% less.
           </p>
        </div>

      </div>
    </div>
  );
}