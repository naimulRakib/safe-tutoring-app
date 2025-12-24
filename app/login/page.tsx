'use client';

import { createClient } from '@/app/utils/supabase/client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 1. Check if ALREADY logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace('/dashboard');
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, [supabase, router]);

  // 2. Handle Login Only (Signup moved to dedicated page)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) throw error;

      if (data.session) {
        router.refresh();
        router.replace('/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. FIXED Demo Mode (Creates Profile too!)
  const handleDemoMode = async () => {
    setLoading(true);
    const randomId = Math.floor(Math.random() * 9999);
    const demoEmail = `judge${randomId}@hackathon.test`;
    const demoPass = 'password123';
    const demoUsername = `judge_${randomId}`;

    try {
      // A. Create Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Auth failed");

      // B. Create Profile (CRITICAL FIX)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: demoUsername,
        role: 'stranger', // Default role
        is_online: true,
        location: null,
        location_area: 'Demo Zone'
      });

      if (profileError) throw profileError;
      
      // Success
      router.refresh();
      router.replace('/dashboard');

    } catch (error: any) {
      console.error(error);
      alert("Demo creation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-blue-500 selection:text-white relative overflow-hidden flex items-center justify-center">
      
      {/* Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <main className="w-full max-w-md relative z-10 px-6">
        
        {/* Logo */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer hover:scale-105 transition-transform">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Uber<span className="text-blue-500">Tutor</span>
              </span>
            </div>
          <p className="text-gray-500 text-sm mt-2">Find knowledge, anywhere, instantly.</p>
        </div>

        {/* Login Form */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div className="space-y-1 group">
              <label className="text-xs font-mono text-gray-400 ml-1">EMAIL</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all"
                  required
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
            </div>

            <div className="space-y-1 group">
              <label className="text-xs font-mono text-gray-400 ml-1">PASSWORD</label>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all"
                  required
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Access Radar <span className="text-lg">➔</span></>
              )}
            </button>
          </form>

          {/* Redirect to Signup Page */}
          <div className="relative my-6 text-center">
            <Link 
              href="/signup"
              className="text-xs text-gray-400 hover:text-white transition-colors underline decoration-gray-700 underline-offset-4"
            >
              New here? Create Identity
            </Link>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f0f0f] px-2 text-gray-500 rounded-full">Hackathon Tools</span></div>
          </div>

          {/* DEMO BUTTON */}
          <button 
            onClick={handleDemoMode}
            disabled={loading}
            className="w-full bg-white/5 border border-white/10 text-green-400 font-semibold py-3 rounded-xl hover:bg-white/10 hover:text-green-300 transition-all flex items-center justify-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 font-normal">Judge / Demo Mode</div>
              <div>⚡ Instant Access</div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}