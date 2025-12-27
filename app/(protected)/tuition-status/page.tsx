"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { 
  Users, AlertTriangle, CheckCircle, XCircle, 
  Settings, Loader2, Power, ArrowLeft, GraduationCap 
} from 'lucide-react';

export default function TuitionStatusPage() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'tutor' | null>(null);
  
  // Settings State
  const [isStatusActive, setIsStatusActive] = useState(true); // "Looking" or "Accepting"
  const [capacity, setCapacity] = useState(0); // Only for tutors
  
  // Contracts Data
  const [contracts, setContracts] = useState<any[]>([]);
  
  // Modal State
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // 1. INITIAL FETCH
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      setUserId(user.id);

      // A. Get Profile Role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profile) return;
      setRole(profile.role);

      // B. Fetch Status based on Role
      if (profile.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('is_looking_for_tutor')
          .eq('id', user.id)
          .single();
        if (studentData) setIsStatusActive(studentData.is_looking_for_tutor);
      } 
      else if (profile.role === 'tutor') {
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('is_accepting_tuitions, max_student_capacity')
          .eq('id', user.id)
          .single();
        if (tutorData) {
          setIsStatusActive(tutorData.is_accepting_tuitions);
          setCapacity(tutorData.max_student_capacity || 5);
        }
      }

      // C. Fetch Contracts (History)
      const { data: contractData } = await supabase
        .from('contracts')
        .select(`
          *,
          student:student_id(username),
          tutor:tutor_id(username)
        `)
        .or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (contractData) setContracts(contractData);
      
      setLoading(false);
    };
    
    init();
  }, [supabase, router]);

  // 2. TOGGLE STATUS (Saves to separate tables)
  const toggleStatus = async () => {
    const newValue = !isStatusActive;
    setIsStatusActive(newValue); // Optimistic UI

    if (role === 'student') {
      await supabase.from('students').update({ is_looking_for_tutor: newValue }).eq('id', userId);
    } else {
      await supabase.from('tutors').update({ is_accepting_tuitions: newValue }).eq('id', userId);
    }
  };

  // 3. UPDATE CAPACITY (Tutor Only)
  const updateCapacity = async (newCap: number) => {
    setCapacity(newCap);
    await supabase.from('tutors').update({ max_student_capacity: newCap }).eq('id', userId);
  };

  // 4. CANCEL CONTRACT
  const confirmCancel = async () => {
    if (!cancelTarget || !reason) return alert("Reason required");
    
    const { error } = await supabase.from('contracts').update({
      status: 'cancelled',
      cancelled_by: userId,
      cancellation_reason: reason
    }).eq('id', cancelTarget);

    if (!error) {
      setContracts(prev => prev.map(c => c.id === cancelTarget ? { ...c, status: 'cancelled', cancellation_reason: reason, cancelled_by: userId } : c));
      setCancelTarget(null);
      setReason("");
    }
  };

  // 5. MARK COMPLETE (Tutor Only)
  const markComplete = async (id: string) => {
    if(!confirm("End this contract successfully?")) return;
    await supabase.from('contracts').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'completed' } : c));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-emerald-500"><Loader2 className="animate-spin"/></div>;

  const activeCount = contracts.filter(c => c.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto flex items-center gap-4 mb-8 pt-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-white">Tuition Manager</h1>
          <p className="text-xs text-gray-500">Manage your availability and active contracts</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">

        {/* === CARD 1: STATUS CONTROL === */}
        <div className={`p-6 rounded-2xl border transition-all ${isStatusActive ? 'bg-zinc-900 border-emerald-500/30' : 'bg-red-950/10 border-red-500/30'}`}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {role === 'tutor' ? <Settings size={18} className="text-emerald-400"/> : <GraduationCap size={18} className="text-blue-400"/>}
                {role === 'tutor' ? "Tutor Availability" : "Tuition Need Status"}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {role === 'tutor' 
                  ? "Turn this off to hide your profile from search results." 
                  : "Turn this off if you found a tutor and don't want new offers."}
              </p>
            </div>
            <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${isStatusActive ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
              {isStatusActive ? "Active" : "Hidden"}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Toggle Button */}
            <button 
              onClick={toggleStatus}
              className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl transition-all shadow-lg ${isStatusActive ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
            >
              <Power size={20} />
              <span className="font-bold">
                {isStatusActive 
                  ? (role === 'tutor' ? "I AM ACCEPTING STUDENTS" : "I NEED A TUTOR") 
                  : (role === 'tutor' ? "NOT ACCEPTING NEW STUDENTS" : "I DON'T NEED A TUTOR")}
              </span>
            </button>

            {/* Tutor Capacity Control */}
            {role === 'tutor' && (
              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/10 w-full md:w-auto justify-center">
                <span className="text-xs text-gray-400 font-bold uppercase">Max Students</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateCapacity(Math.max(0, capacity - 1))} className="w-8 h-8 bg-zinc-800 rounded hover:bg-zinc-700">-</button>
                  <span className="text-xl font-mono font-bold w-8 text-center">{capacity}</span>
                  <button onClick={() => updateCapacity(capacity + 1)} className="w-8 h-8 bg-zinc-800 rounded hover:bg-zinc-700">+</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === CARD 2: ACTIVE TUITIONS === */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 ml-1">Active Contracts</h3>
          <div className="space-y-3">
            {contracts.filter(c => c.status === 'active').map(c => {
              // --- ROBUST NAME LOGIC ---
              const amITutor = userId === c.tutor_id;
              const partnerName = amITutor ? c.student?.username : c.tutor?.username;
              // -------------------------

              return (
                <div key={c.id} className="bg-zinc-900 border border-white/10 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 group hover:border-emerald-500/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">
                        {partnerName || "Unknown Partner"}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        Started: {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {amITutor && (
                      <button onClick={() => markComplete(c.id)} className="flex-1 sm:flex-none bg-white text-black text-xs font-bold px-4 py-3 rounded-lg hover:bg-emerald-400 transition-colors">
                        Mark Complete
                      </button>
                    )}
                    <button 
                      onClick={() => setCancelTarget(c.id)} 
                      className="flex-1 sm:flex-none border border-red-500/30 text-red-500 text-xs font-bold px-4 py-3 rounded-lg hover:bg-red-900/20"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
            {activeCount === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
                <p className="text-gray-500 text-sm">No active tuitions running.</p>
              </div>
            )}
          </div>
        </div>

        {/* === CARD 3: HISTORY === */}
        {contracts.some(c => c.status === 'cancelled' || c.status === 'completed') && (
          <div className="opacity-70 hover:opacity-100 transition-opacity duration-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 ml-1">Past History</h3>
            <div className="space-y-3">
              {contracts.filter(c => c.status !== 'active' && c.status !== 'pending').map(c => {
                // --- ROBUST NAME LOGIC ---
                const amITutor = userId === c.tutor_id;
                const partnerName = amITutor ? c.student?.username : c.tutor?.username;
                // -------------------------

                return (
                  <div key={c.id} className="bg-black border border-white/5 p-4 rounded-xl flex items-start gap-4">
                    {c.status === 'completed' ? <CheckCircle className="text-emerald-500 shrink-0" size={20} /> : <XCircle className="text-red-500 shrink-0" size={20} />}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h5 className="font-bold text-sm text-gray-300">
                          {partnerName || "Unknown Partner"}
                        </h5>
                        <span className={`text-[10px] uppercase font-bold ${c.status === 'completed' ? 'text-emerald-500' : 'text-red-500'}`}>{c.status}</span>
                      </div>
                      {c.status === 'cancelled' && (
                        <div className="mt-2 bg-red-900/10 border border-red-900/30 p-2 rounded text-xs text-red-300">
                          <span className="font-bold block mb-1">Reason by {c.cancelled_by === userId ? "You" : "Partner"}:</span>
                          "{c.cancellation_reason}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* CANCEL MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-500/50 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in">
            <div className="text-center mb-4">
              <AlertTriangle className="mx-auto text-red-500 mb-2" size={40} />
              <h3 className="text-xl font-bold text-white">Cancel Contract?</h3>
              <p className="text-xs text-gray-400">This action permanently ends the tuition.</p>
            </div>
            
            <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Reason Required</label>
            <textarea 
              className="w-full bg-black border border-white/20 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none h-24 mb-4 resize-none"
              placeholder="Why are you cancelling? (e.g. Moving, Schedule Conflict...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl text-xs hover:bg-white/20">ABORT</button>
              <button onClick={confirmCancel} disabled={!reason.trim()} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl text-xs hover:bg-red-500 disabled:opacity-50">CONFIRM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}