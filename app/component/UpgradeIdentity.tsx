'use client';

import React, { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';

export default function UpgradeIdentity() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');
  
  const supabase = createClient();

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update the Anonymous User with Email/Password
      const { data, error } = await supabase.auth.updateUser({
        email: email,
        password: password,
        // Optional: Update metadata to remove "is_anonymous" flag/display name
        data: { 
            is_anonymous: false,
            display_name: email.split('@')[0]
        }
      });

      if (error) throw error;

      // 2. Success State
      setStep('success');

    } catch (error: any) {
      console.error("Upgrade Failed:", error.message);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="bg-emerald-900/20 border border-emerald-500/50 p-6 rounded-2xl text-center animate-in zoom-in duration-300 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Verification Link Sent</h3>
        <p className="text-gray-400 text-sm mb-4">
          We have sent a secure uplink to <strong>{email}</strong>. Click the link to permanently bind this account.
        </p>
        <button onClick={() => setStep('input')} className="text-xs text-emerald-500 hover:text-emerald-400 underline">
          Close Interface
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-1 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
        
        <div className="bg-[#0a0a0a] rounded-[20px] p-6 relative">
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Secure Your Identity</h3>
                    <p className="text-xs text-gray-500">Convert Guest Account to Permanent Agent</p>
                </div>
            </div>

            <form onSubmit={handleUpgrade} className="space-y-4">
                
                {/* Email */}
                <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Link Email</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agent@twisted.ai"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all placeholder-gray-700"
                    />
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Set Passphrase</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all placeholder-gray-700"
                    />
                </div>

                {/* Submit */}
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl text-black font-bold text-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <>Processing...</>
                    ) : (
                        <>
                            Confirm Upgrade
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </>
                    )}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
}