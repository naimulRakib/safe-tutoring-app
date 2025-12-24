"use client";
import { useEffect, useState } from "react";
import { createClient } from '@/app/utils/supabase/client'; // <--- CHANGE THIS
import { useRouter } from "next/navigation"; // <--- ADD THIS
import { User } from "@supabase/supabase-js";
import HomeUI from "./Ui"; // Assuming this is your Login/Landing page

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const supabase = createClient(); // <--- Initialize here
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If no session, stop loading and let the render logic handle the UI
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        // Optional: If they log out while on this page, force redirect
        router.push('/'); 
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // --- LOADING STATE (Your beautiful UI) ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden">
        {/* FX Layers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        {/* Loader Core */}
        <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
                <div className="absolute inset-8 bg-emerald-500/20 rounded-full animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                </div>
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-emerald-500 font-bold tracking-[0.2em] text-sm animate-pulse">
                    AUTHENTICATING AGENT
                </h2>
                <div className="flex items-center justify-center gap-1">
                    <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce delay-150"></span>
                </div>
            </div>
        </div>
      </div>
    );
  }

  // --- NOT AUTHENTICATED ---
  if (!user) {
    // Return HomeUI directly (so they can login)
    return <HomeUI />;
  }

  // --- AUTHENTICATED ---
  return <>{children}</>;
};

export default PrivateRoute;