'use client';

// 1. Import 'use' from React
import React, { useEffect, useState, use } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { User, ArrowLeft, ShieldCheck, GraduationCap, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReviewSection from '@/app/component/reviews/ReviewsList';

interface UserProfileData {
  id: string;
  basic_info: any;
  primary_area?: string;
  varsity_verified?: boolean;
}

// 2. Update Props Type to Promise
export default function RatingPage({ params }: { params: Promise<{ id: string }> }) {
  // 3. Unwrap the params using 'use()'
  const { id } = use(params);

  const supabase = createClient();
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'tutor' | 'student' | null>(null);

  const parseName = (info: any) => {
    if (!info) return "Unknown User";
    if (typeof info === 'string') {
      try { 
        const parsed = JSON.parse(info); 
        return parsed.full_name || parsed.username || "User";
      } catch { 
        return "User"; 
      }
    }
    return info.full_name || info.username || "User";
  };

  useEffect(() => {
    const fetchIdentity = async () => {
      // 4. Use the unwrapped 'id' here
      const { data: rawTutor } = await supabase
        .from('tutors')
        .select('id, basic_info, varsity_verified, primary_area')
        .eq('id', id) 
        .single();

      const tutorData = rawTutor as UserProfileData | null;

      if (tutorData) {
        setProfile({
          ...tutorData,
          name: parseName(tutorData.basic_info),
          isVerified: tutorData.varsity_verified
        });
        setRole('tutor');
      } else {
        const { data: rawStudent } = await supabase
          .from('students')
          .select('id, basic_info, primary_area')
          .eq('id', id)
          .single();
        
        const studentData = rawStudent as UserProfileData | null;

        if (studentData) {
          setProfile({
            ...studentData,
            name: parseName(studentData.basic_info),
            isVerified: false 
          });
          setRole('student');
        }
      }
      setLoading(false);
    };

    fetchIdentity();
  }, [id]); // 5. Dependency is now just 'id'

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
      SCANNING DATABASE...
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-500">
      <h1 className="text-xl font-bold text-white mb-2">User Not Found</h1>
      <button onClick={() => router.back()} className="text-xs hover:text-emerald-500 underline">Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <button 
          onClick={() => router.back()} 
          className="mb-8 p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-col md:flex-row items-center gap-6 mb-10 p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-black rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-xl">
              <User size={40} className="text-zinc-500" />
            </div>
            <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-[#050505] shadow-lg
              ${role === 'tutor' ? 'bg-emerald-500 text-black' : 'bg-blue-500 text-white'}`}>
              {role}
            </div>
          </div>

          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">
              {profile.name}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {role === 'tutor' && profile.isVerified && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-900/20 border border-blue-800/50 text-blue-400 text-xs font-bold">
                  <ShieldCheck size={14} /> Verified Tutor
                </span>
              )}

              {profile.primary_area && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-400 text-xs">
                  <MapPin size={12} /> {profile.primary_area}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
              {role === 'tutor' ? (
                <>
                  <GraduationCap className="text-emerald-500" />
                  Teaching Performance
                </>
              ) : (
                <>
                  <ShieldCheck className="text-blue-500" />
                  Student Reputation
                </>
              )}
            </h2>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          {/* 6. Use the unwrapped 'id' here */}
          <ReviewSection targetUserId={id} />
          
        </div>

      </div>
    </div>
  );
}