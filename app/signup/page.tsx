'use client';

import { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Cpu, Fingerprint, LockKeyhole, Mail, User as UserIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanUsername = form.username.trim().toLowerCase().replace(/\s+/g, '_');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { display_name: cleanUsername, full_name: cleanUsername },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          username: cleanUsername,
          role: 'stranger',
          is_online: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 md:p-8 text-white selection:bg-emerald-500/30 font-sans">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-600/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px)`, backgroundSize: '30px 30px' }} />
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden md:flex flex-col space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <Cpu className="text-emerald-400" size={32} />
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-tight">
              JOIN THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">SCHOLAR_GRID</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-xs leading-relaxed">
              Initialize your operative profile and access the neighborhood tutoring radar.
            </p>
          </div>

          <div className="space-y-4 pt-8">
             <div className="flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                 <ShieldCheck size={18} className="text-emerald-500" />
               </div>
               <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">End-to-End Encryption</span>
             </div>
             <div className="flex items-center gap-4 group">
               <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                 <Fingerprint size={18} className="text-cyan-500" />
               </div>
               <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Biometric Verification</span>
             </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent animate-[scan_4s_linear_infinite]" />

          <div className="mb-8 relative">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LockKeyhole size={20} className="text-emerald-500" /> 
              CREATE_ACCOUNT
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-tighter">Enter credentials to proceed</p>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] font-mono flex items-start gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 animate-pulse" />
               <span>SYSTEM_ERROR: {errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon size={16} className="text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  className="w-full bg-black/40 border border-zinc-800 pl-11 p-4 rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-700 text-sm" 
                  placeholder="USERNAME_HANDLE" 
                  onChange={e => setForm({...form, username: e.target.value})} 
                  required 
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  className="w-full bg-black/40 border border-zinc-800 pl-11 p-4 rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-700 text-sm" 
                  placeholder="EMAIL_ADDRESS" 
                  type="email" 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  required 
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockKeyhole size={16} className="text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input 
                  className="w-full bg-black/40 border border-zinc-800 pl-11 p-4 rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-zinc-700 text-sm" 
                  placeholder="PASSWORD_KEY" 
                  type="password" 
                  onChange={e => setForm({...form, password: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  INITIALIZE PROFILE <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-zinc-800 pt-6">
            <p className="text-zinc-500 text-xs font-medium">
              Already verified? {' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-tighter">
                Access Node
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}