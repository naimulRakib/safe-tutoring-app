import { useState } from 'react';
// 1. CHANGE THIS IMPORT (Crucial)
import { createClient } from '@/app/utils/supabase/client';

export default function VarsityVerification({ tutorId }: { tutorId: string }) {
  // 2. INITIALIZE CLIENT CORRECTLY
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

    if (!email.endsWith('buet.ac.bd')) {
      setMsg('❌ Error: Only @buet.ac.bd emails allowed.');
      setLoading(false);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Debug Log
    console.log("Saving code for User:", tutorId);

    const { error } = await supabase.from('verification_codes').insert({
      user_id: tutorId,
      email: email,
      code: code
    });

    if (error) {
      console.error("Insert Error:", error);
      setMsg('❌ Database Error. Check Console.');
    } else {
      console.log(`📨 SENT CODE TO ${email}: ${code}`);
      setMsg(`✅ Code sent! (Check Console for ID: ${code})`);
      setStep('VERIFY');
    }
    setLoading(false);
  };

  // --- 2. VERIFY CODE ---
  const verifyCode = async () => {
    setLoading(true);
    console.log("Verifying code:", otp, "for User:", tutorId);

    // FIXED QUERY: Use .maybeSingle() to prevent 406 errors
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', tutorId)
      .eq('code', otp)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // <--- This prevents the crash if no row is found

    if (error) {
      console.error("Select Error:", error);
      setMsg('❌ System Error.');
      setLoading(false);
      return;
    }

    if (!data) {
      setMsg('❌ Invalid Code or Permission Denied.');
      setLoading(false);
      return;
    }

    // Code is Valid -> Parse Info
    const varsityInfo = parseVarsityInfo(email);

    if (!varsityInfo) {
      setMsg('❌ Could not parse ID.');
      setLoading(false);
      return;
    }

    // UPDATE TUTOR PROFILE
    const { error: updateError } = await supabase
      .from('tutors')
      .update({
        varsity_verified: true,
        varsity_infos: varsityInfo
      })
      .eq('id', tutorId);

    if (updateError) {
      console.error("Update Error:", updateError);
      setMsg('❌ Failed to update profile.');
    } else {
      setMsg('🎉 SUCCESS! You are verified.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded bg-white shadow-sm max-w-sm text-black">
      <h3 className="font-bold text-lg mb-2">Varsity Verification 🎓</h3>
      
      {msg && <div className="text-sm mb-3 p-2 bg-gray-100 rounded">{msg}</div>}

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
            className="w-full bg-red-700 text-white p-2 rounded"
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Enter code sent to {email}</p>
          <input 
            className="w-full border p-2 rounded text-center tracking-widest" 
            placeholder="123456"
            value={otp}
            onChange={e => setOtp(e.target.value)}
          />
          <button 
            onClick={verifyCode} 
            disabled={loading}
            className="w-full bg-green-600 text-white p-2 rounded"
          >
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>
        </div>
      )}
    </div>
  );
}