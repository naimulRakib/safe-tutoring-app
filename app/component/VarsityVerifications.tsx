'use client'; // 👈 Essential for Next.js App Router

import { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';

export default function VarsityVerification({ tutorId }: { tutorId: string }) {
  const supabase = createClient(); 

  const [step, setStep] = useState<'INPUT' | 'VERIFY'>('INPUT');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // --- PARSE HELPER ---
  const parseVarsityInfo = (email: string) => {
    const match = email.match(/(\d{7})/);
    if (!match) return null;
    const fullId = match[0];
    const batchCode = fullId.substring(0, 2);
    const deptCode = fullId.substring(2, 4);
    const roll = fullId.substring(4, 7);

    const deptMap: Record<string, string> = {
      '04': 'Civil Engineering (CE)',
      '05': 'Computer Science (CSE)',
      '06': 'Electrical Engineering (EEE)',
      '08': 'IPE',
      '10': 'Mechanical Engineering (ME)'
    };

    return {
      university: 'BUET',
      student_id: fullId,
      batch: `Batch ${batchCode}`,
      department: deptMap[deptCode] || 'Unknown Dept',
      roll: roll,
      email: email
    };
  };

  // --- 1. SEND CODE ---
  const sendCode = async () => {
    setLoading(true);
    setMsg('');

    // Check 1: Is user logged in?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== tutorId) {
      console.error("Auth Error: You are not logged in as this tutor.");
      setMsg("❌ Error: Auth Mismatch. Are you logged in?");
      setLoading(false);
      return;
    }

    if (!email.endsWith('buet.ac.bd')) {
      setMsg('❌ Error: Only @buet.ac.bd emails allowed.');
      setLoading(false);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`🚀 Attempting to insert for User: ${tutorId}, Email: ${email}`);

    const { data, error } = await supabase.from('verification_codes').insert({
      user_id: tutorId,
      email: email,
      code: code
    }).select(); // .select() returns the data so we can confirm insertion

    if (error) {
      // DEBUG: Detailed Error Logging
      console.error("❌ INSERT FAILED");
      console.error("Message:", error.message);
      console.error("Details:", error.details);
      console.error("Hint:", error.hint);
      console.error("Code:", error.code);
      setMsg(`❌ DB Error: ${error.message || 'Check Console'}`);
    } else {
      console.log("✅ Insert Success:", data);
      console.log(`📨 MOCK EMAIL: Code is ${code}`); // Since we don't have a real mailer yet
      setMsg(`✅ Code sent! (Check Console for ID: ${code})`);
      setStep('VERIFY');
    }
    setLoading(false);
  };

  // --- 2. VERIFY CODE ---
  const verifyCode = async () => {
    setLoading(true);
    console.log(`🔍 Verifying OTP: ${otp} for User: ${tutorId}`);

    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', tutorId)
      .eq('code', otp)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Select Error:", error.message);
      setMsg('❌ System Error during verification.');
      setLoading(false);
      return;
    }

    if (!data) {
      console.warn("No matching code found in DB.");
      setMsg('❌ Invalid Code. Please try again.');
      setLoading(false);
      return;
    }

    // Code is Valid -> Parse Info
    const varsityInfo = parseVarsityInfo(email);

    if (!varsityInfo) {
      setMsg('❌ Could not parse Student ID from email.');
      setLoading(false);
      return;
    }

    console.log("📝 Updating Tutor Profile with:", varsityInfo);

    // UPDATE TUTOR PROFILE
    const { error: updateError } = await supabase
      .from('tutors')
      .update({
        varsity_verified: true,
        varsity_infos: varsityInfo
      })
      .eq('id', tutorId);

    if (updateError) {
      console.error("Update Error:", updateError.message);
      setMsg('❌ Failed to update tutor profile. Check RLS policies on "tutors" table.');
    } else {
      setMsg('🎉 SUCCESS! You are verified.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded bg-white shadow-sm max-w-sm text-black">
      <h3 className="font-bold text-lg mb-2">Varsity Verification 🎓</h3>
      
      {msg && <div className="text-sm mb-3 p-2 bg-gray-100 rounded border border-gray-200">{msg}</div>}

      {step === 'INPUT' ? (
        <div className="space-y-2">
          <input 
            className="w-full border p-2 rounded" 
            placeholder="u1805001@student.buet.ac.bd"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button 
            onClick={sendCode} 
            disabled={loading}
            className="w-full bg-red-700 text-white p-2 rounded hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Enter code sent to {email}</p>
          <input 
            className="w-full border p-2 rounded text-center tracking-widest font-bold" 
            placeholder="123456"
            value={otp}
            onChange={e => setOtp(e.target.value)}
          />
          <button 
            onClick={verifyCode} 
            disabled={loading}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>
          <button 
            onClick={() => setStep('INPUT')}
            className="w-full text-xs text-gray-500 underline mt-2"
          >
            Wrong email? Go back.
          </button>
        </div>
      )}
    </div>
  );
}