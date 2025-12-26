"use client";

import { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { ShieldCheck, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';

interface MeetingVerificationProps {
  appointment: any;
  myRole: string; // 'student' or 'tutor'
  onVerified: () => void;
}

export default function MeetingVerification({ appointment, myRole, onVerified }: MeetingVerificationProps) {
  const supabase = createClient();
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. STUDENT: Verify the Tutor
  const handleVerify = async () => {
    setLoading(true);
    setError('');

    // Check against DB
    if (otpInput === appointment.meeting_otp) {
      // SUCCESS!
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          is_verified_onsite: true,
          verified_at: new Date().toISOString(),
        payment_status: 'completed' // ✅ FIXED: Use // for JS comments, not --
        })
        .eq('id', appointment.id);

      if (!updateError) {
        onVerified();
      } else {
        setError("System error. Try again.");
      }
    } else {
      setError("Incorrect Code! Ask the tutor again.");
    }
    setLoading(false);
  };

  // --- RENDER: ALREADY VERIFIED ---
  if (appointment.is_verified_onsite) {
    return (
      <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-xl flex items-center justify-center gap-3">
        <ShieldCheck className="text-green-500" size={32} />
        <div>
          <h3 className="text-green-400 font-bold text-sm">SECURELY VERIFIED</h3>
          <p className="text-green-300 text-[10px]">Session is active & tracked.</p>
        </div>
      </div>
    );
  }

  // --- RENDER: TUTOR VIEW (Show the Code) ---
  if (myRole === 'tutor') {
    return (
      <div className="bg-zinc-900 border border-emerald-500/30 p-6 rounded-xl text-center shadow-2xl">
        <div className="mb-4">
          <KeyRound className="mx-auto text-emerald-400 mb-2" size={32} />
          <h3 className="text-white font-bold text-lg">Your Secure Code</h3>
          <p className="text-gray-400 text-xs">Share this with the student ONLY when you arrive physically.</p>
        </div>
        
        {/* The Code Display */}
        <div className="bg-black border border-white/10 rounded-lg py-4 px-8 inline-block">
          <span className="text-4xl font-mono font-black text-white tracking-[0.5em]">
            {appointment.meeting_otp || "----"}
          </span>
        </div>
        
        {appointment.payment_status !== 'escrowed' && (
          <p className="text-red-400 text-xs mt-3 font-bold">
            ⚠ Student hasn't paid yet. Code hidden.
          </p>
        )}
      </div>
    );
  }

  // --- RENDER: STUDENT VIEW (Enter the Code) ---
  return (
    <div className="bg-zinc-900 border border-blue-500/30 p-6 rounded-xl shadow-2xl animate-in zoom-in">
      <div className="text-center mb-6">
        <ShieldCheck className="mx-auto text-blue-400 mb-2" size={32} />
        <h3 className="text-white font-bold text-lg">Has the Tutor Arrived?</h3>
        <p className="text-gray-400 text-xs">Ask the tutor for their 4-digit code to start.</p>
      </div>

      <div className="flex justify-center mb-4">
        <input 
          type="text" 
          maxLength={4}
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
          className="bg-black text-white text-3xl font-mono text-center tracking-[0.5em] w-40 py-3 rounded-lg border border-white/20 focus:border-blue-500 outline-none"
          placeholder="0000"
        />
      </div>

      {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

      <button 
        onClick={handleVerify} 
        disabled={loading || otpInput.length < 4}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} 
        VERIFY & START CLASS
      </button>
    </div>
  );
}