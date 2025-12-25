'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { BookOpen, Banknote, UserCircle, MapPin, Save, X, UploadCloud, FileText, GraduationCap, Briefcase, Package, ShieldCheck, Check, ScanFace, Plus } from 'lucide-react';

interface ProfileAdvancedProps {
  onClose: () => void;
  role?: string;
}

// --- CONSTANTS ---
const DHAKA_AREAS = [
  "Adabor", "Azimpur", "Badda", "Banani", "Bangshal", "Baridhara", "Basabo", "Bashundhara", 
  "Banasree", "Cantonment", "Chawkbazar", "Dakshinkhan", "Dhanmondi", "Farmgate", 
  "Gulshan 1", "Gulshan 2", "Hazaribagh", "Jatrabari", "Kafrul", "Kamrangirchar", 
  "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur 1", "Mirpur 10", "Mirpur 11", 
  "Mirpur 12", "Mirpur 14", "Mohakhali", "Mohammadpur", "Motijheel", "New Market", 
  "Pallabi", "Paltan", "Ramna", "Rampura", "Sabujbagh", "Shahbagh", "Sher-e-Bangla Nagar", 
  "Shyampur", "Sutrapur", "Tejgaon", "Uttara", "Uttar Khan", "Vatara", "Wari", "Burichang"
];

// --- LAYOUT HELPER ---
const Row = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="grid grid-cols-[110px_1fr] items-center gap-4 py-1.5">
    <label className="text-[10px] font-mono text-zinc-500 text-right uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default function ProfileAdvanced({ onClose, role: propRole }: ProfileAdvancedProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(propRole || null);

  // ==========================================
  // 🎓 STUDENT STATE
  // ==========================================
  const [studentBasic, setStudentBasic] = useState({ full_name: '', institution: '', class_level: '', age: '', gender: 'Any', mobile: '' });
  const [studentTuition, setStudentTuition] = useState({ subjects: '', salary_min: '', salary_max: '', days_per_week: '', work_hours: '' });
  const [studentPriority, setStudentPriority] = useState({ tutor_gender: 'Any', preferred_institution: '', other_requirements: '' });
  const [studentCourse, setStudentCourse] = useState({ active: false, topic: '', duration: '', offer_price: '', details: '' });
  
  const [studentFiles, setStudentFiles] = useState<{ id_card_url: string; id_card_details?: any }>({ 
    id_card_url: '', 
    id_card_details: null 
  });

  // ==========================================
  // 👨‍🏫 TUTOR STATE
  // ==========================================
  const [tutorBasic, setTutorBasic] = useState({ full_name: '', age: '', edu_level: '', institution: '', occupation: '', mobile: '', current_address: '' });
  
  // ✅ UPDATED: Added preferred_area and optional_areas to state
  const [tutorTeaching, setTutorTeaching] = useState({ 
    class_pref: '', 
    subject_pref: '', 
    days_per_week: '', 
    hours_per_day: '', 
    gender_pref: 'Any', 
    salary_min: '', 
    salary_max: '',
    preferred_area: '', // Main Area
    optional_areas: [] as string[] // Secondary Areas
  });

  const [tutorCourse, setTutorCourse] = useState({ active: false, title: '', duration: '', price: '', details: '' });
  const [tutorBio, setTutorBio] = useState('');
  const [tutorFiles, setTutorFiles] = useState<{ cv_url: string; nid_url: string; cv_details?: any; nid_details?: any }>({ 
    cv_url: '', nid_url: '', cv_details: null, nid_details: null 
  });

  // --- LOAD DATA ---
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        let activeRole = propRole;
        if (!activeRole) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          activeRole = profile?.role;
        }
        setCurrentRole(activeRole || null);

        if (activeRole === 'student') {
          const { data: s } = await supabase.from('students').select('*').eq('id', user.id).maybeSingle();
          if (s) {
            if (s.basic_info) setStudentBasic(prev => ({ ...prev, ...s.basic_info }));
            if (s.tuition_details) setStudentTuition(prev => ({ ...prev, ...s.tuition_details }));
            if (s.tutor_priority) setStudentPriority(prev => ({ ...prev, ...s.tutor_priority }));
            if (s.custom_course_plan) setStudentCourse({ active: true, ...s.custom_course_plan });
            if (s.verification) setStudentFiles({ 
                id_card_url: s.verification.id_card_url || '',
                id_card_details: s.verification.id_card_details || null
            });
          }
        } 
        else if (activeRole === 'tutor') {
          const { data: t } = await supabase.from('tutors').select('*').eq('id', user.id).maybeSingle();
          if (t) {
            if (t.basic_info) setTutorBasic(prev => ({ ...prev, ...t.basic_info }));
            if (t.teaching_details) {
                setTutorTeaching(prev => ({ 
                    ...prev, 
                    ...t.teaching_details,
                    // Ensure arrays are initialized if missing in DB
                    optional_areas: t.teaching_details.optional_areas || [] 
                }));
            }
            if (t.custom_course) setTutorCourse({ active: true, ...t.custom_course });
            if (t.bio) setTutorBio(t.bio);
            if (t.verification) setTutorFiles({
                cv_url: t.verification.cv_url || '',
                nid_url: t.verification.nid_url || '',
                cv_details: t.verification.cv_details || null,
                nid_details: t.verification.nid_details || null
            });
          }
        }
      } catch (error) {
        console.error("Load Error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase, propRole]);

  // --- HELPER: ADD OPTIONAL AREA ---
  const addOptionalArea = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const area = e.target.value;
    if (area && !tutorTeaching.optional_areas.includes(area) && area !== tutorTeaching.preferred_area) {
        setTutorTeaching(prev => ({
            ...prev,
            optional_areas: [...prev.optional_areas, area]
        }));
    }
    e.target.value = ""; // Reset select
  };

  const removeOptionalArea = (area: string) => {
    setTutorTeaching(prev => ({
        ...prev,
        optional_areas: prev.optional_areas.filter(a => a !== area)
    }));
  };

  // --- FILE UPLOAD ---
  const handleFileUpload = async (e: any, type: 'cv' | 'nid' | 'student_id') => {
    if (!userId || !e.target.files[0]) return;
    const file = e.target.files[0];
    const filePath = `${userId}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
    
    try {
      setSaving(true);
      const { error } = await supabase.storage.from('documents').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      
      if (type === 'student_id') setStudentFiles(p => ({ ...p, id_card_url: publicUrl }));
      else setTutorFiles(p => ({ ...p, [`${type}_url`]: publicUrl }));

      setExtracting(type); 
      const res = await fetch('/api/analyze-id-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl, documentType: type })
      });
      const result = await res.json();
      setExtracting(null);

      if (result.success && result.data) {
        if (type === 'student_id') {
            setStudentFiles(p => ({ ...p, id_card_details: result.data }));
            if (result.data.student_name) setStudentBasic(p => ({ ...p, full_name: result.data.student_name }));
            if (result.data.institution_name) setStudentBasic(p => ({ ...p, institution: result.data.institution_name }));
        } else if (type === 'cv') {
            setTutorFiles(p => ({ ...p, cv_details: result.data }));
            if (result.data.full_name) setTutorBasic(p => ({ ...p, full_name: result.data.full_name }));
        } else if (type === 'nid') {
            setTutorFiles(p => ({ ...p, nid_details: result.data }));
            if (result.data.full_name) setTutorBasic(p => ({ ...p, full_name: result.data.full_name }));
        }
        alert("✅ AI Scan Complete! Data Extracted.");
      } else {
        alert("Uploaded, but AI couldn't read the text clearly.");
      }
    } catch (err: any) { 
      alert("Error: " + err.message); 
      setExtracting(null);
    } finally { 
      setSaving(false); 
    }
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { data: profileData } = await supabase.from('profiles').select('location, location_area').eq('id', userId).single();

      if (currentRole === 'student') {
        const payload = {
          id: userId,
          basic_info: { ...studentBasic, age: parseInt(studentBasic.age) || 0 },
          tuition_details: {
            ...studentTuition,
subjects: (Array.isArray(studentTuition.subjects) 
              ? studentTuition.subjects 
              : (studentTuition.subjects || '').split(',')
            ).map((s: any) => String(s).trim()).filter(Boolean),
            salary_min: parseInt(studentTuition.salary_min) || 0,
            salary_max: parseInt(studentTuition.salary_max) || 0,
            days_per_week: parseInt(studentTuition.days_per_week) || 0,
            work_hours: parseFloat(studentTuition.work_hours) || 0
          },
          tutor_priority: studentPriority,
          custom_course_plan: studentCourse.active ? { ...studentCourse, offer_price: parseInt(studentCourse.offer_price) || 0 } : null,
          verification: { ...studentFiles, status: studentFiles.id_card_url ? 'pending' : 'unverified' },
          location: profileData?.location, 
          primary_area: profileData?.location_area
        };
        const { error } = await supabase.from('students').upsert(payload);
        if (error) throw error;
      } 
      else if (currentRole === 'tutor') {
        const payload = {
          id: userId,
          basic_info: { ...tutorBasic, age: parseInt(tutorBasic.age) || 0 },
          teaching_details: { 
             ...tutorTeaching, 
             days_per_week: parseInt(tutorTeaching.days_per_week) || 0,
             hours_per_day: parseFloat(tutorTeaching.hours_per_day) || 0,
             salary_min: parseInt(tutorTeaching.salary_min) || 0,
             salary_max: parseInt(tutorTeaching.salary_max) || 0
          },
          custom_course: tutorCourse.active ? { ...tutorCourse } : null,
          verification: { 
            cv_url: tutorFiles.cv_url,
            nid_url: tutorFiles.nid_url,
            cv_details: tutorFiles.cv_details,
            nid_details: tutorFiles.nid_details,
            is_verified: false 
          },
          bio: tutorBio,
          location: profileData?.location,
          primary_area: profileData?.location_area
        };
        const { error } = await supabase.from('tutors').upsert(payload);
        if (error) throw error;
      }
      alert("Profile Saved Successfully!");
      onClose();
    } catch (e: any) { alert(e.message); } 
    finally { setSaving(false); }
  };

  if (loading) return <div className="w-full h-96 flex items-center justify-center text-emerald-500 font-mono">LOADING_DATA...</div>;

  return (
    <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2">
            {currentRole === 'tutor' ? <GraduationCap size={20}/> : <BookOpen size={20}/>}
            {currentRole === 'tutor' ? 'TUTOR DATABASE' : 'STUDENT REQ'}
          </h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-widest">
            {currentRole === 'tutor' ? 'Secure Data Entry' : 'Academic Requirements'}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
      </div>

      {/* ============================================== */}
      {/* 🎓 STUDENT FORM */}
      {/* ============================================== */}
      {currentRole === 'student' && (
        <div className="space-y-8 animate-in fade-in">
          <section>
            <h3 className="text-xs font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-500/20 pb-1 w-fit"><UserCircle size={14}/> PERSONAL INFO</h3>
            <div className="space-y-1">
              <Row label="Full Name"><input value={studentBasic.full_name} onChange={e => setStudentBasic({...studentBasic, full_name: e.target.value})} className="input-dark" placeholder="Real Name" /></Row>
              <Row label="Age / Gender">
                <div className="flex gap-2">
                  <input type="number" value={studentBasic.age} onChange={e => setStudentBasic({...studentBasic, age: e.target.value})} className="input-dark w-20" placeholder="Age" />
                  <select value={studentBasic.gender} onChange={e => setStudentBasic({...studentBasic, gender: e.target.value})} className="input-dark flex-1"><option value="Any">Any</option><option value="Male">Male</option><option value="Female">Female</option></select>
                </div>
              </Row>
              <Row label="Mobile"><input value={studentBasic.mobile} onChange={e => setStudentBasic({...studentBasic, mobile: e.target.value})} className="input-dark" placeholder="+880..." /></Row>
              <Row label="Institution"><input value={studentBasic.institution} onChange={e => setStudentBasic({...studentBasic, institution: e.target.value})} className="input-dark" placeholder="School/College Name" /></Row>
              <Row label="Class Level"><input value={studentBasic.class_level} onChange={e => setStudentBasic({...studentBasic, class_level: e.target.value})} className="input-dark" placeholder="Class 10 / A-Level" /></Row>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-blue-500 mb-4 flex items-center gap-2 border-b border-blue-500/20 pb-1 w-fit"><BookOpen size={14}/> TUITION NEEDS</h3>
            <div className="space-y-1">
              <Row label="Subjects"><input value={studentTuition.subjects} onChange={e => setStudentTuition({...studentTuition, subjects: e.target.value})} className="input-dark" placeholder="Math, Physics" /></Row>
              <Row label="Budget (Tk)">
                <div className="flex gap-2 items-center"><input type="number" value={studentTuition.salary_min} onChange={e => setStudentTuition({...studentTuition, salary_min: e.target.value})} className="input-dark w-1/2" placeholder="Min" /><input type="number" value={studentTuition.salary_max} onChange={e => setStudentTuition({...studentTuition, salary_max: e.target.value})} className="input-dark w-1/2" placeholder="Max" /></div>
              </Row>
              <Row label="Schedule">
                <div className="flex gap-2"><input type="number" value={studentTuition.days_per_week} onChange={e => setStudentTuition({...studentTuition, days_per_week: e.target.value})} className="input-dark w-1/2" placeholder="Days/Wk" /><input type="number" value={studentTuition.work_hours} onChange={e => setStudentTuition({...studentTuition, work_hours: e.target.value})} className="input-dark w-1/2" placeholder="Hrs/Day" /></div>
              </Row>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-purple-500 mb-4 flex items-center gap-2 border-b border-purple-500/20 pb-1 w-fit"><MapPin size={14}/> TUTOR PREFERENCES</h3>
            <div className="space-y-1">
              <Row label="Pref. Gender"><select value={studentPriority.tutor_gender} onChange={e => setStudentPriority({...studentPriority, tutor_gender: e.target.value})} className="input-dark"><option value="Any">No Preference</option><option value="Male">Male Tutor</option><option value="Female">Female Tutor</option></select></Row>
              <Row label="Pref. Inst."><input value={studentPriority.preferred_institution} onChange={e => setStudentPriority({...studentPriority, preferred_institution: e.target.value})} className="input-dark" placeholder="e.g. BUET / DMC" /></Row>
              <Row label="Other Req"><textarea value={studentPriority.other_requirements} onChange={e => setStudentPriority({...studentPriority, other_requirements: e.target.value})} className="input-dark h-16" placeholder="Requirements..." /></Row>
            </div>
          </section>

          <section className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-yellow-500 flex items-center gap-2"><Package size={14}/> CUSTOM COURSE OFFER</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={studentCourse.active} onChange={e => setStudentCourse({...studentCourse, active: e.target.checked})} className="sr-only peer" />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {studentCourse.active && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <Row label="Topic"><input value={studentCourse.topic} onChange={e => setStudentCourse({...studentCourse, topic: e.target.value})} className="input-dark font-bold text-emerald-400" placeholder="Topic" /></Row>
                <Row label="Details"><div className="flex gap-2"><input value={studentCourse.duration} onChange={e => setStudentCourse({...studentCourse, duration: e.target.value})} className="input-dark w-1/2" placeholder="Duration" /><input type="number" value={studentCourse.offer_price} onChange={e => setStudentCourse({...studentCourse, offer_price: e.target.value})} className="input-dark w-1/2 font-bold text-yellow-500" placeholder="Price" /></div></Row>
                <Row label="Desc"><textarea value={studentCourse.details} onChange={e => setStudentCourse({...studentCourse, details: e.target.value})} className="input-dark h-16" placeholder="Describe..." /></Row>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-800 pb-1 w-fit"><ShieldCheck size={14}/> VERIFICATION & AI SCAN</h3>
            <div className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${studentFiles.id_card_url ? 'border-emerald-500 bg-emerald-900/10' : 'border-zinc-700 hover:bg-zinc-900'}`}>
                <input type="file" onChange={(e) => handleFileUpload(e, 'student_id')} className="hidden" id="sid_up" />
                <label htmlFor="sid_up" className="text-center cursor-pointer w-full">
                  {extracting === 'student_id' ? (
                    <div className="flex flex-col items-center text-emerald-400 animate-pulse"><ScanFace size={30} /><span className="text-xs mt-2 font-mono">AI IS READING ID CARD...</span></div>
                  ) : studentFiles.id_card_url ? (
                    <div className="text-emerald-500 flex flex-col items-center"><Check size={24} /><span className="text-[10px] font-bold mt-1">ID VERIFIED BY AI</span>{studentFiles.id_card_details && <span className="text-[9px] text-zinc-500 mt-1">Data Extracted Successfully</span>}</div>
                  ) : (
                    <div className="text-zinc-500 flex flex-col items-center"><UploadCloud size={24} /><span className="text-[10px] block mt-2 font-mono uppercase tracking-widest">UPLOAD STUDENT ID</span></div>
                  )}
                </label>
            </div>
          </section>
        </div>
      )}

      {/* ============================================== */}
      {/* 👨‍🏫 TUTOR FORM */}
      {/* ============================================== */}
      {currentRole === 'tutor' && (
        <div className="space-y-8 animate-in fade-in">
          
          <section>
            <h3 className="text-xs font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-500/20 pb-1 w-fit"><UserCircle size={14}/> PERSONAL IDENTIFICATION</h3>
            <div className="space-y-1">
              <Row label="Full Name"><input value={tutorBasic.full_name} onChange={e => setTutorBasic({...tutorBasic, full_name: e.target.value})} className="input-dark" /></Row>
              <Row label="Age"><input type="number" value={tutorBasic.age} onChange={e => setTutorBasic({...tutorBasic, age: e.target.value})} className="input-dark w-24" /></Row>
              <Row label="Mobile"><input value={tutorBasic.mobile} onChange={e => setTutorBasic({...tutorBasic, mobile: e.target.value})} className="input-dark" /></Row>
              <Row label="Address"><input value={tutorBasic.current_address} onChange={e => setTutorBasic({...tutorBasic, current_address: e.target.value})} className="input-dark" /></Row>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-blue-500 mb-4 flex items-center gap-2 border-b border-blue-500/20 pb-1 w-fit"><Briefcase size={14}/> ACADEMIC BACKGROUND</h3>
            <div className="space-y-1">
              <Row label="Institution"><input value={tutorBasic.institution} onChange={e => setTutorBasic({...tutorBasic, institution: e.target.value})} className="input-dark" placeholder="e.g. BUET" /></Row>
              <Row label="Level/Degree"><input value={tutorBasic.edu_level} onChange={e => setTutorBasic({...tutorBasic, edu_level: e.target.value})} className="input-dark" placeholder="e.g. B.Sc in CSE" /></Row>
              <Row label="Occupation"><input value={tutorBasic.occupation} onChange={e => setTutorBasic({...tutorBasic, occupation: e.target.value})} className="input-dark" placeholder="Student / Job Holder" /></Row>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-purple-500 mb-4 flex items-center gap-2 border-b border-purple-500/20 pb-1 w-fit"><BookOpen size={14}/> TEACHING PREFERENCES</h3>
            <div className="space-y-1">
              <Row label="Subjects"><input value={tutorTeaching.subject_pref} onChange={e => setTutorTeaching({...tutorTeaching, subject_pref: e.target.value})} className="input-dark" /></Row>
              <Row label="Class Pref"><input value={tutorTeaching.class_pref} onChange={e => setTutorTeaching({...tutorTeaching, class_pref: e.target.value})} className="input-dark" /></Row>
              <Row label="Schedule"><div className="flex gap-2"><input value={tutorTeaching.days_per_week} onChange={e => setTutorTeaching({...tutorTeaching, days_per_week: e.target.value})} className="input-dark w-1/2" placeholder="Days/Wk" type="number"/><input value={tutorTeaching.hours_per_day} onChange={e => setTutorTeaching({...tutorTeaching, hours_per_day: e.target.value})} className="input-dark w-1/2" placeholder="Hrs/Day" type="number"/></div></Row>
              <Row label="Expected Pay"><div className="flex gap-2 items-center"><input value={tutorTeaching.salary_min} onChange={e => setTutorTeaching({...tutorTeaching, salary_min: e.target.value})} className="input-dark w-1/2" placeholder="Min" type="number"/><span className="text-zinc-600">-</span><input value={tutorTeaching.salary_max} onChange={e => setTutorTeaching({...tutorTeaching, salary_max: e.target.value})} className="input-dark w-1/2" placeholder="Max" type="number"/></div></Row>
            </div>
          </section>

          {/* ⚡ NEW SECTION: TUITION ZONE (Main + Optional) */}
          <section>
            <h3 className="text-xs font-bold text-emerald-500 mb-4 flex items-center gap-2 border-b border-emerald-500/20 pb-1 w-fit"><MapPin size={14}/> TUITION ZONES</h3>
            
            {/* 1. Main Preferred Area */}
            <div className="mb-4">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Main Preferred Area</label>
              <select 
                value={tutorTeaching.preferred_area} 
                onChange={e => setTutorTeaching({...tutorTeaching, preferred_area: e.target.value})} 
                className="input-dark"
              >
                <option value="">Select Main Area</option>
                {DHAKA_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>

            {/* 2. Optional Areas */}
            <div className="mb-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Optional Areas (Add Multiple)</label>
              <select onChange={addOptionalArea} className="input-dark mb-2">
                <option value="">+ Add Area</option>
                {DHAKA_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
              
              <div className="flex flex-wrap gap-2">
                {tutorTeaching.optional_areas?.map((area, idx) => (
                  <span key={idx} className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded flex items-center gap-1 border border-zinc-700">
                    {area} <button onClick={() => removeOptionalArea(area)} className="hover:text-red-400"><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-yellow-500 flex items-center gap-2"><Package size={14}/> CUSTOM COURSE OFFER</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={tutorCourse.active} onChange={e => setTutorCourse({...tutorCourse, active: e.target.checked})} className="sr-only peer" />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:bg-yellow-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {tutorCourse.active && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <Row label="Course Title"><input value={tutorCourse.title} onChange={e => setTutorCourse({...tutorCourse, title: e.target.value})} className="input-dark" /></Row>
                <Row label="Duration"><input value={tutorCourse.duration} onChange={e => setTutorCourse({...tutorCourse, duration: e.target.value})} className="input-dark" /></Row>
                <Row label="Price"><input value={tutorCourse.price} onChange={e => setTutorCourse({...tutorCourse, price: e.target.value})} className="input-dark font-bold text-yellow-500" /></Row>
                <Row label="Details"><textarea value={tutorCourse.details} onChange={e => setTutorCourse({...tutorCourse, details: e.target.value})} className="input-dark h-20" /></Row>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 border-b border-gray-800 pb-1 w-fit"><FileText size={14}/> BIO & VERIFICATION</h3>
            <div className="space-y-4">
              <textarea value={tutorBio} onChange={e => setTutorBio(e.target.value)} className="input-dark w-full h-24" placeholder="Write a bio for students to see..." />
              <div className="flex gap-4">
                <div className={`flex-1 border border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${tutorFiles.cv_url ? 'border-emerald-500 bg-emerald-900/10' : 'border-zinc-700 hover:bg-zinc-900'}`}>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'cv')} className="hidden" id="cv_up" />
                  <label htmlFor="cv_up" className="text-center cursor-pointer w-full text-[10px] text-zinc-400">{extracting === 'cv' ? <ScanFace size={24} className="mx-auto text-emerald-400 animate-pulse"/> : tutorFiles.cv_url ? 'CV UPLOADED' : 'UPLOAD CV'}</label>
                </div>
                <div className={`flex-1 border border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${tutorFiles.nid_url ? 'border-emerald-500 bg-emerald-900/10' : 'border-zinc-700 hover:bg-zinc-900'}`}>
                  <input type="file" onChange={(e) => handleFileUpload(e, 'nid')} className="hidden" id="nid_up" />
                  <label htmlFor="nid_up" className="text-center cursor-pointer w-full text-[10px] text-zinc-400">{extracting === 'nid' ? <ScanFace size={24} className="mx-auto text-emerald-400 animate-pulse"/> : tutorFiles.nid_url ? 'NID UPLOADED' : 'UPLOAD NID'}</label>
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* FOOTER */}
      <div className="sticky bottom-0 pt-6 mt-4 bg-gradient-to-t from-[#0a0a0a] to-transparent">
        <button onClick={handleSave} disabled={saving || extracting !== null} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 text-xs tracking-widest">
          {saving ? 'SAVING...' : extracting ? 'AI PROCESSING...' : 'SAVE & UPDATE DATABASE'} <Save size={14} />
        </button>
      </div>

      <style jsx>{`
        .input-dark { width: 100%; background-color: #111; border: 1px solid #27272a; border-radius: 4px; padding: 8px 12px; color: white; font-size: 12px; outline: none; transition: border-color 0.2s; }
        .input-dark:focus { border-color: #10B981; }
      `}</style>
    </div>
  );
}