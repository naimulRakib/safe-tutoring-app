'use client';

import React from 'react';
import Link from 'next/link'; // Import Link
import { 
  ShieldCheck, GraduationCap, MapPin, Banknote, 
  Ruler, Flame, Eye, Trash2, Clock, BookOpen, 
  User as UserIcon, Heart, School, UserCheck, FileText, Star // Import Star icon
} from 'lucide-react';
import { getDistanceKm } from './MapUtils';

// --- 1. SAFE PARSER ---
const safeParse = (data: any) => {
  if (!data) return {};
  if (typeof data === 'object') return data; 
  try { return JSON.parse(data); } catch (e) { return {}; }
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

export default function UserCard({ 
  user, 
  myRole, 
  onContact, 
  onViewProfile, 
  onEliminate, 
  isOptional, 
  userLoc 
}: UserCardProps) {

  // --- 2. EXTRACT DATA ---
  const basic = safeParse(user.basic_info);
  const tuition = safeParse(user.tuition_details);
  const teaching = safeParse(user.teaching_details);
  const priority = safeParse(user.tutor_priority);
  const varsity = safeParse(user.varsity_infos);
  const verifyData = safeParse(user.verification);

  // --- 3. DETERMINE VIEW MODE ---
  const isViewingStudent = myRole === 'tutor';

  // --- 4. MAP DATA FIELDS ---

  let displayName = "User";
  let institutionDisplay = "";
  let isPreference = false; 
  let budgetOrSalary = "Negotiable";
  let salaryLabel = "Salary";
  let subjects: string[] = [];
  let availabilityDisplay = "Flexible";
  let isVerified = false;
  
  let genderPref = "";
  let otherReq = "";

  // 🆔 ID Resolution
  const resolveId = user.id || user.student_id || user.tutor_id;

  if (isViewingStudent) {
      // ==========================
      //      STUDENT MODE
      // ==========================
      
      // 1. Name
      const cls = basic.class_level || user.class_level;
      displayName = cls ? `Student (${cls})` : "Student";

      // 2. Institution / Preference
      const prefInst = priority.preferred_institution || user.preferred_institution;
      const curInst = basic.institution || user.institution;
      
      if (prefInst) {
          institutionDisplay = `Wants: ${prefInst}`;
          isPreference = true;
      } else if (curInst) {
          institutionDisplay = `From: ${curInst}`;
          isPreference = false;
      } else {
          institutionDisplay = "Institution Hidden";
      }

      // 3. Budget
      salaryLabel = "Budget";
      const sMin = Number(tuition.salary_min ?? user.salary_min ?? 0);
      const sMax = Number(tuition.salary_max ?? user.salary_max ?? user.budget ?? 0);
      
      if (sMax > 0 && sMin > 0) budgetOrSalary = `৳${sMin} - ৳${sMax}`;
      else if (sMax > 0) budgetOrSalary = `Up to ৳${sMax}`;
      else if (sMin > 0) budgetOrSalary = `Min ৳${sMin}`;

      // 4. Subjects
      const rawSubs = tuition.subjects || user.subjects;
      if (Array.isArray(rawSubs)) subjects = rawSubs;
      else if (typeof rawSubs === 'string') subjects = rawSubs.split(',').map((s: string) => s.trim());

      // 5. Availability
      const days = tuition.days_per_week ?? user.days_per_week ?? tuition.days;
      if (days && Number(days) > 0) {
          availabilityDisplay = `${days} Days / Week`;
      }

      // 6. Verification
      isVerified = verifyData.status === 'verified' || user.status === 'verified' || user.is_verified === true;

      // 7. Special Requirements
      genderPref = priority.tutor_gender || user.tutor_gender || "Any";
      otherReq = priority.other_requirements || user.other_requirements || "";

  } else {
      // ==========================
      //       TUTOR MODE
      // ==========================

      displayName = basic.full_name || user.username || user.name || "Tutor";

      isVerified = String(user.varsity_verified) === 'true' || user.varsity_verified === true;
      const uni = varsity.university || user.university;
      
      if (isVerified && uni) {
          institutionDisplay = uni; 
      } else {
          institutionDisplay = basic.institution || "Institution Not Listed";
      }

      salaryLabel = "Salary";
      const tMin = Number(teaching.salary_min ?? user.salary_min ?? 0);
      const tMax = Number(teaching.salary_max ?? user.salary_max ?? 0);

      if (tMin > 0 && tMax > 0) budgetOrSalary = `৳${tMin} - ৳${tMax}`;
      else if (tMin > 0) budgetOrSalary = `From ৳${tMin}`;

      const rawSubs = teaching.subject_pref || user.subject_pref || user.subjects;
      if (Array.isArray(rawSubs)) subjects = rawSubs;
      else if (typeof rawSubs === 'string') subjects = rawSubs.split(',').map((s: string) => s.trim());

      const days = teaching.days_per_week ?? user.days_per_week;
      if (days && Number(days) > 0) {
          availabilityDisplay = `${days} Days / Week`;
      }
  }

  // --- 5. LOCATION & DISTANCE (FIXED) ---
  const locationName = user.primary_area || "Dhaka";
  
  // Ensure we have numbers for calculation
  const lat = parseFloat(user.lat || user.latitude);
  const lng = parseFloat(user.lng || user.longitude);
  
  let distDisplay = null;

  // Check if both userLoc and target coords are valid numbers
  if (userLoc && !isNaN(lat) && !isNaN(lng)) {
      const dist = getDistanceKm(userLoc[0], userLoc[1], lat, lng);
      
      // Ensure result is a valid number before comparing
      if (typeof dist === 'number' && !isNaN(dist)) {
          distDisplay = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
      }
  }

  // --- 6. RENDER ---
  return (
    <div className={`group bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden
      ${isOptional ? 'border-dashed border-gray-300 opacity-90' : 'border-gray-200 hover:border-emerald-300'}`}>
        
        {/* MATCH SCORE */}
        {user.match_score > 0 && (
           <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-xl text-[10px] font-bold flex items-center gap-1
             ${user.match_score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-50 text-yellow-700'}`}>
               <Flame size={10} className={user.match_score >= 80 ? 'fill-emerald-700' : 'fill-yellow-700'} />
               {user.match_score}%
           </div>
        )}

        {/* HEADER */}
        <div className="mb-2 pr-8"> 
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-gray-900 truncate">{displayName}</h3>
              {/* Show Shield for Verified Tutors OR Verified Students */}
              {isVerified && <ShieldCheck size={14} className="text-blue-500 fill-blue-50" />}
            </div>

            {!isViewingStudent && isVerified ? (
                <VarsityBadge info={varsity.university ? varsity : { ...varsity, university: institutionDisplay, department: user.department }} />
            ) : (
                <div className={`flex items-center gap-1 mt-1 text-[10px] ${isPreference ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>
                   {isPreference ? <Heart size={12} /> : <School size={12} />} 
                   <span className="truncate max-w-[180px]">{institutionDisplay}</span>
                </div>
            )}

            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 font-medium">
                <span className="flex items-center gap-0.5"><MapPin size={10} /> {locationName}</span>
                {distDisplay && (
                   <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 rounded">
                     <Ruler size={10} /> {distDisplay}
                   </span>
                )}
            </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1">
                 <Banknote size={10}/> {salaryLabel}
               </span>
               <span className="text-[11px] font-bold text-gray-800">{budgetOrSalary}</span>
            </div>
            
            <div className="flex flex-col border-l border-gray-200 pl-2">
               <span className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1">
                 <Clock size={10}/> Availability
               </span>
               <span className="text-[11px] font-bold text-gray-800">{availabilityDisplay}</span>
            </div>
        </div>

        {/* GENDER PREF (Student Only) */}
        {isViewingStudent && (
           <div className="mb-2 flex items-center gap-2 text-[10px] text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
              <UserCheck size={12} className="text-blue-500"/> 
              <span className="font-bold text-blue-900">Prefers: {genderPref} Tutor</span>
           </div>
        )}

        {/* SUBJECTS */}
        <div className="mb-3">
           <span className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-1 mb-1">
             <BookOpen size={10}/> {isViewingStudent ? "Needs Help In" : "Teaches"}
           </span>
           {subjects.length > 0 ? (
             <div className="flex flex-wrap gap-1">
               {subjects.slice(0, 3).map((sub: string, i: number) => (
                 <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-medium shadow-sm">
                   {sub}
                 </span>
               ))}
               {subjects.length > 3 && <span className="text-[9px] text-gray-400 flex items-center">+{subjects.length - 3}</span>}
             </div>
           ) : (
             <div className="flex items-center gap-1 text-[10px] text-gray-400 italic">
               No specific subjects listed
             </div>
           )}
        </div>

        {/* OTHER REQ (Student Only) */}
        {isViewingStudent && otherReq && (
           <div className="mb-3 flex items-start gap-1.5 text-[10px] text-zinc-500 italic bg-zinc-50 p-2 rounded border border-zinc-100">
              <FileText size={10} className="mt-0.5 text-zinc-400 shrink-0"/>
              <span className="line-clamp-2">"{otherReq}"</span>
           </div>
        )}

        {/* ACTION BAR */}
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

            {/* REVIEW BUTTON */}
            <Link 
              href={`/profile/rating/${resolveId}`}
              className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors border border-transparent hover:border-yellow-200 flex items-center justify-center"
              title="Reviews"
            >
              <Star size={14} />
            </Link>

            {/* PROFILE BUTTON */}
            {onViewProfile && (
                <button 
                  onClick={() => onViewProfile(resolveId, user.match_score || 0)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                   <Eye size={12} /> PROFILE
                </button>
            )}
            
            <button 
              onClick={() => onContact && onContact(user)} 
              className="flex-1 bg-black text-white text-[10px] font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              CONTACT
            </button>
        </div>
    </div>
  );
}