import React from 'react';
import { ShieldCheck, GraduationCap, MapPin, Banknote, Ruler, Flame, Eye, Trash2, Clock, BookOpen } from 'lucide-react';
import { getDistanceKm } from './MapUtils';

// --- 1. SAFE PARSER (Handles the Nested JSON Strings) ---
// This function converts your DB strings like '{"age": 24}' into usable Objects.
const safeParse = (data: any) => {
  if (!data) return {};
  if (typeof data === 'object') return data; // Already an object
  try {
    return JSON.parse(data); // Parse string to object
  } catch (e) {
    return {}; // Return empty object on error
  }
};

// --- HELPER: University Badge ---
const VarsityBadge = ({ info }: { info: any }) => {
  if (!info || !info.university) return null;
  return (
    <div className="flex items-center gap-1.5 mt-2 text-[10px] bg-blue-50 text-blue-900 px-2 py-1 rounded border border-blue-100 w-fit">
      <GraduationCap size={12} className="text-blue-700" />
      <span className="font-bold">
        {info.university}
        {info.department && <span className="font-normal text-blue-700"> • {info.department}</span>}
      </span>
    </div>
  );
};

interface UserCardProps {
  user: any;
  myRole: string;
  onContact?: (user: any) => void;
  onViewProfile?: (userId: string, score: number) => void;
  onEliminate?: (userId: string) => void;
  isOptional?: boolean;
  userLoc?: [number, number] | null;
}

export default function UserCard({ user, myRole, onContact, onViewProfile, onEliminate, isOptional, userLoc }: UserCardProps) {
  
  // --- 2. EXTRACT NESTED DATA ---
  // We use safeParse to 'open' the nested JSON columns
  const basic = safeParse(user.basic_info);
  const teaching = safeParse(user.teaching_details);
  const varsity = safeParse(user.varsity_infos);

  // --- 3. TEACHER STYLE DATA MAPPING ---
  
  // Name: Try nested full_name first, fallback to user.name
  const displayName = basic.full_name || user.name || "Tutor";
  
  // Verification: Database sends "true" string, so we check for that
  const isVerified = String(user.varsity_verified) === 'true';

  // Institution: If verified, use Varsity info. If not, use basic institution.
  const institution = isVerified ? varsity.university : (basic.institution || "Institution Not Listed");

  // Location: Priority to user.primary_area, fallback to teaching details
  const location = user.primary_area || teaching.preferred_area || "No Location";

  // Salary: Handle "0" as "Negotiable"
  const min = Number(teaching.salary_min) || 0;
  const max = Number(teaching.salary_max) || 0;
  const salaryDisplay = (min === 0 && max === 0) ? "Negotiable" : `৳${min} - ৳${max}`;

  // Subjects: Handle Array ["Math"] OR String "Math, Physics"
  let subjects = teaching.subject_pref || user.subjects || [];
  if (typeof subjects === 'string') {
    subjects = subjects.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  // Fallback: Use Department if no subjects found
  if ((!subjects || subjects.length === 0) && varsity.department) {
    subjects = [varsity.department];
  }

  // Distance Logic
  const distKm = (userLoc && user.lat && user.lng) ? getDistanceKm(userLoc[0], userLoc[1], user.lat, user.lng) : null;
  const distDisplay = distKm ? (distKm < 1 ? `${Math.round(distKm*1000)}m` : `${distKm.toFixed(1)}km`) : null;
  const resolveId = user.id || user.tutor_id || user.student_id;

  // --- 4. RENDER UI ---
  return (
    <div className={`group bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden
      ${isOptional ? 'border-dashed border-gray-300 opacity-90' : 'border-gray-200 hover:border-emerald-300'}`}>
        
        {/* MATCH SCORE (Top Right) */}
        {user.match_score > 0 && (
           <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1
             ${user.match_score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-50 text-yellow-700'}`}>
               <Flame size={10} className={user.match_score >= 80 ? 'fill-emerald-700' : 'fill-yellow-700'} />
               {user.match_score}%
           </div>
        )}

        {/* --- HEADER --- */}
        <div className="mb-2 pr-8"> 
            {/* Name & Badge */}
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-gray-900 truncate">{displayName}</h3>
              {isVerified && <ShieldCheck size={14} className="text-blue-500 fill-blue-50" />}
            </div>

            {/* University / School */}
            {isVerified ? (
               <VarsityBadge info={varsity} />
            ) : (
               <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                  <GraduationCap size={12} /> {institution}
               </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 font-medium">
                <span className="flex items-center gap-0.5"><MapPin size={10} /> {location}</span>
                {distDisplay && (
                   <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 rounded">
                     <Ruler size={10} /> {distDisplay}
                   </span>
                )}
            </div>
        </div>

        {/* --- TEACHER DETAILS GRID --- */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
            {/* Salary */}
            <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1">
                 <Banknote size={10}/> Salary
               </span>
               <span className="text-[11px] font-bold text-gray-800">{salaryDisplay}</span>
            </div>
            
            {/* Weekly Availability */}
            <div className="flex flex-col border-l border-gray-200 pl-2">
               <span className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1">
                 <Clock size={10}/> Availability
               </span>
               <span className="text-[11px] font-bold text-gray-800">
                 {teaching.days_per_week ? `${teaching.days_per_week} Days/Week` : "Undecided"}
               </span>
            </div>
        </div>

        {/* --- SUBJECTS --- */}
        <div className="mb-3">
           {subjects.length > 0 ? (
             <div className="flex flex-wrap gap-1">
               {subjects.slice(0, 3).map((sub: string, i: number) => (
                 <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-medium shadow-sm">
                   {sub}
                 </span>
               ))}
               {subjects.length > 3 && <span className="text-[9px] text-gray-400 flex items-center">+{subjects.length - 3} more</span>}
             </div>
           ) : (
             <div className="flex items-center gap-1 text-[10px] text-gray-400 italic">
               <BookOpen size={10} /> No specific subjects
             </div>
           )}
        </div>

        {/* --- ACTIONS --- */}
        <div className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100">
            {onEliminate && (
               <button 
                 onClick={() => onEliminate(resolveId)}
                 className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors border border-transparent hover:border-red-200"
                 title="Eliminate"
               >
                 <Trash2 size={14} />
               </button>
            )}

            {onViewProfile && (
                <button 
                  onClick={() => onViewProfile(resolveId, user.match_score || 0)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                   <Eye size={12} /> PROFILE
                </button>
            )}
            
            <button 
              onClick={() => onContact?.(user)} 
              className="flex-1 bg-black text-white text-[10px] font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              CONTACT
            </button>
        </div>
    </div>
  );
}