import { createClient } from '@/app/utils/supabase/server';
import { 
  MapPin, ShieldAlert, BookOpen, User, 
  Lock, EyeOff, CheckCircle, Smartphone,
  FileText, Calendar
} from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

// --- HELPER: Safe JSON ---
const safeJson = (json: any) => {
  if (!json) return {};
  if (typeof json === 'object') return json;
  try { return JSON.parse(json); } catch { return {}; }
};

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params; // The Student we want to see
  const supabase = await createClient();

  // 1. Get Current User (You, the Tutor)
  const { data: { user: viewer } } = await supabase.auth.getUser();
  if (!viewer) return redirect('/login');

  // 2. Fetch Student Data
  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error || !student) return notFound();

  // 3. ACCESS LOGIC: Check 'applications' table
  // We need to know if there is an ACCEPTED application between Viewer & Student
  // Scenario A: Viewer sent to Student
  // Scenario B: Student sent to Viewer
  
  const { data: connections } = await supabase
    .from('applications')
    .select('status')
    .or(`and(sender_id.eq.${viewer.id},receiver_id.eq.${studentId}),and(sender_id.eq.${studentId},receiver_id.eq.${viewer.id})`)
    .eq('status', 'accepted') // <--- CRITICAL: Must be accepted
    .limit(1);

  // Access Granted if: connection exists OR viewer is looking at themselves
  const isUnlocked = (connections && connections.length > 0) || viewer.id === studentId;

  // 4. Parse Data
  const basic = safeJson(student.basic_info);
  const tuition = safeJson(student.tuition_info || {}); 

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-cyan-500/30 pb-20">
      
      {/* Background Grid (Cyan for Students) */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#06b6d4 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto pt-20 px-6">
        
        {/* --- LOCKED WARNING --- */}
        {!isUnlocked && (
          <div className="mb-8 p-6 bg-red-900/10 border border-red-500/30 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 backdrop-blur-md">
             <div className="p-3 bg-red-500/20 rounded-full text-red-500 border border-red-500/20">
               <ShieldAlert size={24} />
             </div>
             <div>
               <h3 className="text-red-400 font-black uppercase tracking-widest text-sm">Access Restricted</h3>
               <p className="text-zinc-400 text-xs mt-1">
                 You must have an <strong>ACCEPTED</strong> application to view contact details.
               </p>
             </div>
          </div>
        )}

        {/* --- HEADER --- */}
        <div className="flex items-center gap-6 mb-12">
          {/* Avatar (Blurred if locked) */}
          <div className={`w-28 h-28 rounded-3xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center relative overflow-hidden transition-all duration-700 ${!isUnlocked ? 'blur-sm grayscale opacity-50' : 'shadow-[0_0_30px_rgba(6,182,212,0.3)]'}`}>
             <User className="text-zinc-600 w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            {isUnlocked ? (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <h1 className="text-3xl font-black text-white">{basic.full_name || "Student"}</h1>
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle size={14} /> Proposal Accepted
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-black text-zinc-600 uppercase tracking-tighter">Classified User</h1>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <Lock size={12} /> Identity Protected
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <MapPin size={16} className={isUnlocked ? "text-cyan-500" : "text-zinc-600"} />
              {/* Always show Area (Public Info), hide exact address */}
              {student.primary_area || "Dhaka"} 
              {isUnlocked && <span className="text-zinc-600">•</span>}
              {isUnlocked && <span className="text-zinc-300">{basic.current_address}</span>}
            </div>
          </div>
        </div>

        {/* --- INFO GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Requirements (Public - Always Visible) */}
          <section className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem]">
             <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center gap-2">
               <BookOpen size={16} /> Tuition Request
             </h2>
             <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                   <span className="text-zinc-400 text-sm">Class Level</span>
                   <span className="font-bold text-white">{tuition.class_level || "Not specified"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                   <span className="text-zinc-400 text-sm">Subjects</span>
                   <span className="font-bold text-cyan-400">{tuition.subjects || "General Science"}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-zinc-400 text-sm">Days / Week</span>
                   <span className="font-bold text-white">{tuition.days_per_week || "3"} Days</span>
                </div>
             </div>
          </section>

          {/* 2. Contact & Private Info (Restricted) */}
          <section className={`bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 ${!isUnlocked ? 'group cursor-not-allowed border-red-500/10' : 'hover:border-cyan-500/30'}`}>
             
             {/* LOCK OVERLAY */}
             {!isUnlocked && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 transition-all">
                  <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-700 shadow-xl">
                    <EyeOff size={24} className="text-zinc-500" />
                  </div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">Contact Locked</h3>
                  <p className="text-zinc-500 text-[10px] mt-2 max-w-[200px] font-mono">
                    CONNECTION_STATUS: PENDING
                  </p>
               </div>
             )}

             <h2 className="text-sm font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center gap-2">
               <Smartphone size={16} /> Contact Details
             </h2>

             <div className={`space-y-4 ${!isUnlocked ? 'opacity-10 blur-sm select-none' : ''}`}>
                <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-2xl">
                   <p className="text-[10px] text-cyan-500 font-bold uppercase mb-1">Mobile Number</p>
                   <p className="text-xl font-mono font-black text-white tracking-wider">
                     {basic.mobile || "017XXXXXXXX"}
                   </p>
                </div>
                
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                   <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Guardian Contact</p>
                   <p className="text-sm text-zinc-300">
                     {basic.guardian_phone || "Hidden"}
                   </p>
                </div>
             </div>

          </section>

        </div>

      </main>
    </div>
  );
}