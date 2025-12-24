'use client';

import { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';

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

    // Clean username (no spaces, lowercase)
    const cleanUsername = form.username.trim().toLowerCase().replace(/\s+/g, '_');

    try {
      // 1. Create Auth User AND set display_name in metadata
      // This ensures Supabase Auth knows the user's name immediately
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            display_name: cleanUsername,
            full_name: cleanUsername,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert into profiles using upsert
        // We use upsert to prevent "duplicate key" errors if a DB trigger already created the row
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            username: cleanUsername,
            role: 'stranger',
            is_online: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (profileError) {
          console.error("DB Sync Error:", profileError);
          // If profile fails, we don't block the user, 
          // but we warn them that basic setup is needed.
        }
      }

      // Success Flow
      router.push('/dashboard');
      router.refresh();

    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during initialization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 text-white selection:bg-emerald-500">
      
      {/* Decorative background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-600/10 blur-[100px]" />
      </div>

      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-5 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            ACTIVATE_IDENTITY
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">System Access Protocol</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl text-red-400 text-xs font-mono animate-pulse">
            ERROR: {errorMsg.toUpperCase()}
          </div>
        )}

        <div className="space-y-4">
          <div className="group">
            <label className="text-[10px] font-mono text-zinc-500 ml-1">CODENAME (HANDLE)</label>
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl focus:border-emerald-500 focus:outline-none transition-all placeholder:text-zinc-700" 
              placeholder="e.g. ghost_operative" 
              onChange={e => setForm({...form, username: e.target.value})} 
              required 
            />
          </div>

          <div className="group">
            <label className="text-[10px] font-mono text-zinc-500 ml-1">SECURE_EMAIL</label>
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl focus:border-emerald-500 focus:outline-none transition-all placeholder:text-zinc-700" 
              placeholder="name@provider.com" 
              type="email" 
              onChange={e => setForm({...form, email: e.target.value})} 
              required 
            />
          </div>

          <div className="group">
            <label className="text-[10px] font-mono text-zinc-500 ml-1">ENCRYPTED_PASSPHRASE</label>
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-800 p-3.5 rounded-xl focus:border-emerald-500 focus:outline-none transition-all placeholder:text-zinc-700" 
              placeholder="••••••••" 
              type="password" 
              onChange={e => setForm({...form, password: e.target.value})} 
              required 
            />
          </div>
        </div>

        <button 
          disabled={loading} 
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              ACTIVATE PROFILE <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}