import { createClient } from '@/app/utils/supabase/server';
import { 
  MapPin, ShieldCheck, GraduationCap, BookOpen, Clock, 
  User, Zap, ArrowRight, CheckCircle2, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// --- HELPER: Safe JSON Parser ---
const safeJson = (json: any) => {
  if (!json) return {};
  if (typeof json === 'object') return json;
  try { return JSON.parse(json); } catch { return {}; }
};

// 👇 FIX: Update type to Promise and await it
export default async function TutorProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. Await params to get the ID (Next.js 15 requirement)
  const { id } = await params;
  
  // 2. Initialize Supabase
  const supabase = await createClient();

  // 3. Fetch Tutor Data using the awaited 'id'
  const { data: tutor, error } = await supabase
    .from('tutors')
    .select('*')
    .eq('id', id) // <--- Use 'id', not 'params.id'
    .single();

  if (error || !tutor) {
    console.error("Tutor Fetch Error:", error);
    return notFound();
  }

  // --- Rest of your code remains the same ---
  const basic = safeJson(tutor.basic_info);
  const teaching = safeJson(tutor.teaching_details);
  const varsity = safeJson(tutor.varsity_infos);
  const course = safeJson(tutor.custom_course);
  
  const isVerified = String(tutor.varsity_verified) === 'true' || tutor.varsity_verified === true;
  
  let subjects: string[] = [];
  if (teaching.subject_pref) {
    subjects = Array.isArray(teaching.subject_pref) 
      ? teaching.subject_pref 
      : teaching.subject_pref.split(',').map((s: string) => s.trim());
  }

  const locations = teaching.optional_areas || [];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30 pb-20">
      
      {/* Background FX */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}>
      </div>
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />

      <main className="relative z-10 max-w-5xl mx-auto pt-20 px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
          
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2rem] bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center shadow-2xl relative overflow-hidden">
               <User className="text-zinc-600 w-16 h-16" />
            </div>
            {isVerified && (
              <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white p-2 rounded-xl border-4 border-[#050505] shadow-lg animate-in zoom-in">
                <ShieldCheck size={20} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-white tracking-tight">{basic.full_name || "Tutor"}</h1>
              {isVerified && (
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Varsity Verified
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 font-medium">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-500" />
                {tutor.primary_area || "Dhaka"}
              </div>
              {basic.institution && (
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-purple-500" />
                  {basic.institution}
                </div>
              )}
            </div>

            {isVerified && varsity.university && (
              <div className="inline-flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-2 pr-4 rounded-xl mt-2 backdrop-blur-md">
                <div className="bg-white/5 p-2 rounded-lg text-zinc-300">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{varsity.university}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{varsity.department} • {varsity.batch}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
             <Link 
               href={`/hire/${tutor.id}`}
               className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
             >
                HIRE NOW <ArrowRight size={18} />
             </Link>
             <button className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-8 py-3 rounded-2xl border border-zinc-800 text-xs uppercase tracking-widest transition-all">
                Save Profile
             </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2rem]">
               <h2 className="text-lg font-black uppercase text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
                 <User size={18} /> About Tutor
               </h2>
               <p className="text-zinc-300 leading-relaxed text-sm">
                 {tutor.bio || "No specific bio added. However, this tutor has passed the verification checks."}
               </p>
            </section>

            <section className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2rem]">
               <h2 className="text-lg font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center gap-2">
                 <BookOpen size={18} /> Expertise
               </h2>
               <div className="mb-6">
                 <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Subjects</p>
                 <div className="flex flex-wrap gap-2">
                   {subjects.length > 0 ? subjects.map((sub: string, i: number) => (
                     <span key={i} className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300">
                       {sub}
                     </span>
                   )) : (
                     <span className="text-zinc-500 text-sm italic">Subjects not listed</span>
                   )}
                 </div>
               </div>
               {teaching.class_pref && (
                 <div>
                   <p className="text-xs text-zinc-500 font-bold uppercase mb-3">Preferred Class Levels</p>
                   <span className="px-4 py-2 bg-emerald-900/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-400">
                     {teaching.class_pref}
                   </span>
                 </div>
               )}
            </section>

            <section className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-[2rem]">
               <h2 className="text-lg font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center gap-2">
                 <MapPin size={18} /> Service Zones
               </h2>
               <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-xs font-black uppercase">
                    {teaching.preferred_area || tutor.primary_area}
                  </span>
                  {locations.map((loc: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-bold">
                      {loc}
                    </span>
                  ))}
               </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] text-center">
               <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Expected Salary</p>
               <h3 className="text-3xl font-black text-white flex items-center justify-center gap-1">
                 <span className="text-emerald-500">৳</span>
                 {teaching.salary_min ? `${teaching.salary_min.toLocaleString()} - ${teaching.salary_max?.toLocaleString()}` : "Negotiable"}
               </h3>
               <p className="text-[10px] text-zinc-600 font-mono mt-1 uppercase">Per Month</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between">
               <div>
                 <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Availability</p>
                 <p className="text-white font-bold">{teaching.days_per_week || "3"} Days / Week</p>
               </div>
               <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center text-zinc-500">
                 <Clock size={20} />
               </div>
            </div>

            {course && course.active && (
              <div className="bg-gradient-to-br from-emerald-900/20 to-black border border-emerald-500/30 p-6 rounded-[2rem] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={80} />
                 </div>
                 <div className="relative z-10">
                    <div className="bg-emerald-500 text-black text-[10px] font-black px-3 py-1 rounded-full w-fit mb-4">
                      SPECIAL OFFER
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 leading-tight">{course.title}</h3>
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{course.details}</p>
                    <div className="flex items-end justify-between border-t border-emerald-500/20 pt-4">
                       <div>
                         <p className="text-[10px] text-zinc-500 uppercase font-bold">Total Price</p>
                         <p className="text-lg font-black text-emerald-400">৳{course.price}</p>
                       </div>
                       <span className="text-[10px] bg-zinc-900 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
                         {course.duration}
                       </span>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}