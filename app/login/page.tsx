'use client';

import { createClient } from '@/app/utils/supabase/client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LockKeyhole, 
  Mail, 
  Cpu, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  Terminal,
  BookOpen
} from 'lucide-react';

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

  // 2. Handle Login
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

  // 3. Demo Mode Logic
  const handleDemoMode = async () => {
    setLoading(true);
    const randomId = Math.floor(Math.random() * 9999);
    const demoEmail = `judge${randomId}@hackathon.test`;
    const demoPass = 'password123';
    const demoUsername = `judge_${randomId}`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Auth failed");

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: demoUsername,
        role: 'stranger',
        is_online: true,
        location: null,
        location_area: 'Demo Zone'
      });

      if (profileError) throw profileError;
      
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 relative overflow-hidden flex items-center justify-center p-6">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px)`, backgroundSize: '30px 30px' }}>
      </div>

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <main className="w-full max-w-md relative z-10">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 font-black text-3xl tracking-tighter group cursor-pointer">
              <div className="w-10 h-10 bg-emerald-500 text-black rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <span className="uppercase">
                Scholar<span className="text-emerald-500">Grid</span>
              </span>
            </div>
          <p className="text-zinc-500 text-xs font-mono mt-3 uppercase tracking-[0.3em]">Authorized Access Only</p>
        </div>

        {/* Login Form Container */}
        <div className="backdrop-blur-xl bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent animate-[scan_4s_linear_infinite]" />

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black font-mono text-zinc-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={10} className="text-emerald-500" /> Identifier_Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@provider.com"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black font-mono text-zinc-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={10} className="text-emerald-500" /> Encrypted_Passphrase
                </label>
                <div className="relative">
                  <LockKeyhole className="w-4 h-4 text-zinc-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-3 uppercase text-xs tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>Initialize Session <ChevronRight size={18} /></>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center space-y-4">
            <Link 
              href="/signup"
              className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              Request New Identity Profile
            </Link>
          </div>

          {/* Separator */}
          <div className="relative my-8 flex items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="mx-4 text-[10px] font-mono text-zinc-700 uppercase tracking-[0.2em]">Dev_Access</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* DEMO BUTTON */}
          <button 
            onClick={handleDemoMode}
            disabled={loading}
            className="w-full bg-zinc-950 border border-emerald-500/20 text-emerald-400 font-bold py-4 rounded-2xl hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all flex items-center justify-between px-6 group"
          >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                 <Zap size={20} className="fill-emerald-500" />
               </div>
               <div className="text-left">
                 <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-tighter">Bypass Protocol</div>
                 <div className="text-sm">Judge Instant Login</div>
               </div>
            </div>
            <ShieldCheck size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Footer info */}
        <p className="text-center mt-10 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
          ScholarGrid Secure Core // v1.0.4
        </p>
      </main>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(460px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}