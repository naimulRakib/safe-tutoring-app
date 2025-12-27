'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { 
  ShieldCheck, Clock, CheckCircle, MapPin, Flag, Loader2, KeyRound, AlertTriangle, Send, RefreshCw, Wifi, UserPlus 
} from 'lucide-react';

import HireTutorModal from '@/app/component/dashboard/HireTutorModal';

export default function LiveSessionPage() {
  const { id } = useParams();
  const supabase = createClient();
  const router = useRouter();

  // --- STATE ---
  const [showHireModal, setShowHireModal] = useState(false); 
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'student' | 'tutor' | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('00h 00m 00s');
  const [errorMsg, setErrorMsg] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('CONNECTING');

  // 1. INITIALIZE & REAL-TIME SYNC
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: appt, error } = await supabase
        .from('appointments')
        .select(`*, application:application_id(sender_id, receiver_id)`)
        .eq('id', id)
        .single();

      if (error || !appt) {
        alert("Session not found");
        return router.push('/dashboard');
      }

      setSession(appt);

      if (appt.application.sender_id === user.id) setRole('student'); 
      else setRole('tutor'); 
    };
    
    init();

    const channel = supabase.channel(`session-${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'appointments', 
        filter: `id=eq.${id}` 
      }, 
      (payload) => {
        setSession(payload.new);
      })
      .subscribe((status) => {
        setRealtimeStatus(status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [id, supabase, router]);

  // 2. LIVE TIMER
  useEffect(() => {
    if (session?.session_status === 'ongoing' && session.started_at) {
      const interval = setInterval(() => {
        const start = new Date(session.started_at).getTime();
        const now = new Date().getTime();
        const duration = 5 * 1000; // Testing: 5 Seconds
        const end = start + duration;
        const diff = end - now;

        if (diff <= 0) {
          setTimeLeft("TIME UP");
        } else {
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${h}h ${m}m ${s}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // --- ACTIONS ---

  const handleSendStartOTP = async () => {
    setLoading(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSession((prev: any) => ({ ...prev, start_otp: code }));
    await supabase.from('appointments').update({ start_otp: code }).eq('id', id);
    setLoading(false);
  };

  const handleSendEndOTP = async () => {
    setLoading(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSession((prev: any) => ({ ...prev, end_otp: code }));
    await supabase.from('appointments').update({ end_otp: code }).eq('id', id);
    setLoading(false);
  };

  const handleVerifyStart = async () => {
    setErrorMsg('');
    if (otpInput !== session.start_otp) {
      setErrorMsg("❌ Incorrect Code!");
      return;
    }
    setLoading(true);
    const now = new Date().toISOString();
    setSession((prev: any) => ({ ...prev, session_status: 'ongoing', started_at: now, payment_status: 'escrow_locked' }));
    await supabase.from('appointments').update({ session_status: 'ongoing', started_at: now, payment_status: 'escrow_locked' }).eq('id', id);
    setLoading(false);
  };

  const handleVerifyEnd = async () => {
    setErrorMsg('');
    if (otpInput !== session.end_otp) {
      setErrorMsg("❌ Incorrect End Code!");
      return;
    }
    setLoading(true);
    setSession((prev: any) => ({ ...prev, session_status: 'completed', ended_at: new Date().toISOString(), payment_status: 'paid' }));
    await supabase.from('appointments').update({ session_status: 'completed', ended_at: new Date().toISOString(), payment_status: 'paid' }).eq('id', id);
    setLoading(false);
  };

  const handleReport = async () => {
    const reason = prompt("Report Reason:");
    if (!reason) return;
    setSession((prev: any) => ({ ...prev, session_status: 'disputed' }));
    await supabase.from('reports').insert({ appointment_id: id, reported_user_id: session.application.receiver_id, reason: reason });
    await supabase.from('appointments').update({ session_status: 'disputed' }).eq('id', id);
    router.push('/dashboard');
  };

  const handleRetry = async () => {
    if (!confirm("Resume verification?")) return;
    setLoading(true);
    const fallbackStatus = session.started_at ? 'ongoing' : 'confirmed';
    setSession((prev: any) => ({ ...prev, session_status: fallbackStatus }));
    await supabase.from('appointments').update({ session_status: fallbackStatus }).eq('id', id);
    setLoading(false);
  };

  // --- VIEW: COMPLETED ---
  if (session?.session_status === 'completed') {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6 text-center animate-in zoom-in">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
          <CheckCircle size={40} className="text-black" />
        </div>
        <h1 className="text-3xl font-black mb-2">Session Complete</h1>
        <p className="text-gray-400 text-sm mb-8 italic">Demo session finished. What's next?</p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {role === 'student' && (
            <button 
              onClick={() => setShowHireModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20"
            >
              <UserPlus size={18} /> Hire for Monthly Tuition
            </button>
          )}
          
          <button 
            onClick={() => router.push('/dashboard')} 
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
          >
            Return to Dashboard
          </button>
        </div>

        {/* HIRETUTOR MODAL INTEGRATION */}
        {showHireModal && role === 'student' && (
          <HireTutorModal 
            tutorId={session.application.receiver_id} 
            tutorName="the Tutor"
            studentId={session.application.sender_id}
            applicationId={session.application_id}
            onClose={() => setShowHireModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* HEADER */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${session?.session_status === 'ongoing' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
          <span className="font-black text-sm uppercase tracking-wide">{session?.session_status === 'confirmed' ? 'Waiting Room' : session?.session_status}</span>
        </div>
        <div className="flex items-center gap-2">
           {realtimeStatus === 'SUBSCRIBED' ? <Wifi size={14} className="text-green-500"/> : <Wifi size={14} className="text-red-500 animate-pulse"/>}
           <div className="bg-white/5 px-4 py-1.5 rounded-full text-xs font-mono">ID: {id?.toString().slice(0,6)}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 max-w-lg mx-auto w-full z-10">
        
        {/* STAGE 1: START VERIFICATION */}
        {(session?.session_status === 'scheduled' || session?.session_status === 'confirmed') && (
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-10">
            <div className="text-center">
              <MapPin size={40} className="text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-black">Start Verification</h2>
            </div>

            {role === 'tutor' ? (
              <div className="bg-zinc-900 p-8 rounded-3xl text-center border border-zinc-800 shadow-2xl">
                <p className="text-blue-400 text-xs uppercase font-bold mb-4 tracking-widest">Start Code</p>
                {session?.start_otp ? (
                  <div className="text-6xl font-mono font-black tracking-[0.25em] text-white animate-pulse">{session.start_otp}</div>
                ) : (
                  <div className="text-gray-500 text-sm italic">Waiting for student to trigger code...</div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {!session?.start_otp ? (
                  <button onClick={handleSendStartOTP} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg">
                    <Send size={24} /> <span>SEND OTP TO TUTOR</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <input type="text" maxLength={4} placeholder="0 0 0 0" className="w-full bg-black border border-blue-500/50 rounded-2xl p-6 text-center text-4xl font-mono tracking-[0.5em] text-white" onChange={(e) => setOtpInput(e.target.value)} />
                    <button onClick={handleVerifyStart} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                      <ShieldCheck size={20} /> CONFIRM & START
                    </button>
                  </div>
                )}
                {errorMsg && <p className="text-red-500 text-center font-bold">{errorMsg}</p>}
              </div>
            )}
          </div>
        )}

        {/* STAGE 2: LIVE SESSION */}
        {session?.session_status === 'ongoing' && (
          <div className="w-full space-y-10 animate-in zoom-in">
            <div className="text-center">
              <Clock size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-5xl font-black font-mono tracking-tighter">{timeLeft}</h2>
              <p className="text-emerald-500 text-xs font-bold uppercase tracking-[0.3em] mt-2 animate-pulse">Session Live</p>
            </div>

            {role === 'tutor' ? (
              <div className="bg-zinc-900 p-8 rounded-3xl text-center border border-red-900/30">
                <p className="text-red-400 text-xs uppercase font-bold mb-4 tracking-widest">End Code</p>
                {session?.end_otp ? <div className="text-6xl font-mono font-black tracking-[0.25em] text-white animate-pulse">{session.end_otp}</div> : <div className="text-gray-500 text-sm italic">Waiting for student...</div>}
              </div>
            ) : (
              <div className="space-y-6 pt-6">
                {!session?.end_otp ? (
                  <button onClick={handleSendEndOTP} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg">
                    <Send size={24} /> <span>FINISH CLASS (SEND OTP)</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <input type="text" maxLength={4} placeholder="0 0 0 0" className="w-full bg-black border border-emerald-500/50 rounded-2xl p-6 text-center text-4xl font-mono tracking-[0.5em] text-white" onChange={(e) => setOtpInput(e.target.value)} />
                    <button onClick={handleVerifyEnd} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                      <CheckCircle size={20} /> CONFIRM COMPLETION
                    </button>
                  </div>
                )}
                <button onClick={handleReport} className="w-full text-red-500 text-xs font-bold py-2 hover:bg-red-500/10 rounded flex items-center justify-center gap-1"><Flag size={12}/> Report Issue</button>
              </div>
            )}
          </div>
        )}

        {/* STAGE 3: DISPUTED */}
        {session?.session_status === 'disputed' && (
           <div className="text-center space-y-6 animate-in fade-in">
              <AlertTriangle className="mx-auto text-yellow-500" size={64} />
              <h2 className="text-2xl font-bold text-yellow-500">Session Under Review</h2>
              <button onClick={handleRetry} className="bg-white text-black font-bold py-3 px-6 rounded-full text-xs flex items-center justify-center gap-2 mx-auto"><RefreshCw size={14}/> RETRY VERIFICATION</button>
              <button onClick={() => router.push('/dashboard')} className="mt-4 text-gray-500 underline text-sm">Go Back Home</button>
           </div>
        )}

      </div>
    </div>
  );
}