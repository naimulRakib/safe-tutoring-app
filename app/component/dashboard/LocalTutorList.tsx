'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { MapPin, Clock, CheckCircle, User, AlertCircle, Eye, Ruler } from 'lucide-react';

// Distance Calculator (Haversine Formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
};

interface LocalTutorListProps {
  studentArea: string; 
  userLocation: { lat: number, lng: number } | null;
  onContact: (tutor: any) => void;
  onViewProfile: (tutorId: string) => void;
}

export default function LocalTutorList({ studentArea, userLocation, onContact, onViewProfile }: LocalTutorListProps) {
  const supabase = createClient();
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocalTutors = async () => {
      if (!studentArea) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        // 1. Fetch ALL Tutors (Broad fetch, filter in JS to avoid DB errors)
        // We removed .eq('is_accepting_tuitions', true) here to prevent errors if column is missing
        let { data: allTutors, error } = await supabase
          .from('tutors')
          .select('*, profiles(username, full_name, avatar_url)');

        // Fallback if relation fails
        if (error) {
          console.warn("Complex fetch error (likely RLS or relation), trying simple fetch:", error);
          const simpleRes = await supabase.from('tutors').select('*');
          allTutors = simpleRes.data;
        }

        if (!allTutors) {
           setTutors([]);
           setLoading(false);
           return;
        }

        // 2. STRICT FILTERING LOGIC
        const target = studentArea.trim().toLowerCase();

        const matchedTutors = allTutors.filter((tutor: any) => {
          // Normalize Data
          const physArea = (tutor.primary_area || '').trim().toLowerCase();
          const mainPref = (tutor.teaching_details?.preferred_area || '').trim().toLowerCase();
          
          let opts: string[] = [];
          // Handle loose JSON data types safely
          if (Array.isArray(tutor.teaching_details?.optional_areas)) {
              opts = tutor.teaching_details.optional_areas.map((a: any) => String(a).trim().toLowerCase());
          } else if (typeof tutor.teaching_details?.optional_areas === 'string') {
              opts = tutor.teaching_details.optional_areas.split(',').map((a: string) => a.trim().toLowerCase());
          }

          // Strict Match Check: Location || Main Pref || Optional Pref
          return (
            physArea === target || 
            mainPref === target || 
            opts.includes(target)
          );
        });

        setTutors(matchedTutors);

      } catch (err: any) {
        console.error('CRITICAL ERROR:', err);
        setErrorMsg("Could not load local list.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocalTutors();
  }, [studentArea, supabase]);

  if (loading) return (
    <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-emerald-500 font-mono text-xs animate-pulse">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      SCANNING SECTOR: {studentArea}...
    </div>
  );

  if (errorMsg) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-400 text-xs">{errorMsg}</p>
      </div>
    );
  }

  if (tutors.length === 0) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8 text-center backdrop-blur-sm">
        <MapPin className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
        <h3 className="text-zinc-400 font-bold text-sm">No Matches in {studentArea}</h3>
        <p className="text-zinc-600 text-xs mt-1">We checked locations and preferences.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-2 mb-2 bg-black/40 p-2 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
           <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
             SECTOR: {studentArea}
           </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{tutors.length} ACTIVE</span>
      </div>

      <div className="grid gap-3 custom-scrollbar pr-1">
        {tutors.map((tutor) => {
          const isVerified = tutor.varsity_verified === true || String(tutor.varsity_verified) === 'true';
          
          // Safe subject parsing
          let subjects: string[] = [];
          const rawSub = tutor.teaching_details?.subject_pref;
          if (Array.isArray(rawSub)) subjects = rawSub;
          else if (typeof rawSub === 'string') subjects = rawSub.split(',');

          // Distance
          const lat = tutor.latitude || tutor.lat;
          const lng = tutor.longitude || tutor.lng;
          const distance = (userLocation && lat && lng) 
            ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng) 
            : null;

          return (
            <div key={tutor.id} className="bg-[#111] border border-zinc-800 p-4 rounded-xl flex flex-col gap-3 hover:border-emerald-500/30 hover:bg-[#161616] transition-all group shadow-lg">
              
              {/* Top Row: Avatar + Info */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-lg border border-zinc-700 overflow-hidden shrink-0">
                    {tutor.profiles?.avatar_url ? (
                      <img src={tutor.profiles.avatar_url} alt="Av" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-zinc-500" size={18} />
                    )}
                  </div>

                  {/* Name & Inst */}
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                      {tutor.basic_info?.full_name || tutor.profiles?.username || "Tutor"}
                      {isVerified && <CheckCircle size={12} className="text-blue-500 fill-blue-900/20" />}
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                      {tutor.basic_info?.institution || "N/A"} • {tutor.basic_info?.edu_level || "Student"}
                    </p>
                  </div>
                </div>

                {/* Salary & Distance */}
                <div className="text-right">
                   <span className="block font-black text-emerald-500 text-xs">
                     ৳{tutor.teaching_details?.salary_min || 'Neg.'}
                   </span>
                   {distance && (
                     <span className="flex items-center justify-end gap-1 text-[9px] text-yellow-500 font-mono mt-1">
                       <Ruler size={8}/> {distance}
                     </span>
                   )}
                </div>
              </div>

              {/* Middle: Tags */}
              <div className="flex flex-wrap gap-1.5">
                {subjects.slice(0, 3).map((sub: string, i: number) => (
                  <span key={i} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] font-medium rounded border border-zinc-700">
                    {sub.trim()}
                  </span>
                ))}
              </div>

              {/* Bottom: Footer & Button */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                <div className="flex flex-col gap-0.5">
                   {tutor.primary_area === studentArea ? (
                      <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                        <MapPin size={8} /> NEIGHBOR
                      </span>
                   ) : (
                      <span className="text-[9px] text-blue-400 font-bold flex items-center gap-1">
                        <MapPin size={8} /> COMMUTER
                      </span>
                   )}
                   <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                      <Clock size={8} /> {tutor.teaching_details?.days_per_week || 3} days/week
                   </span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onViewProfile(tutor.id)}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                  >
                    <Eye size={10} /> PROFILE
                  </button>

                  <button 
                    onClick={() => onContact(tutor)}
                    className="px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-emerald-400 transition-colors"
                  >
                    Contact
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}