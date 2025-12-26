"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
// 👇 Import your Managers
import ContractManager from '@/app/component/dashboard/ContractManager'; 
import ReviewManager from '@/app/component/reviews/ReviewManager';

export default function TutorDashboardPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-black text-white p-10">Please Log In</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      
      {/* Header */}
      <header className="mb-10 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-black tracking-tight mb-2">Dashboard</h1>
        <p className="text-zinc-500">Welcome back, Tutor.</p>
      </header>

      <div className="max-w-5xl mx-auto space-y-12">

        {/* 1. CONTRACTS (Jobs) */}
        <section>
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Job Requests</h3>
           <ContractManager tutorId={user.id} />
        </section>

        {/* 2. STATS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <h3 className="font-bold text-lg mb-2 text-zinc-300">Total Earnings</h3>
              <p className="text-4xl font-mono text-emerald-500 font-bold">৳0.00</p>
           </div>
           {/* You could add a "Total Classes" box here */}
        </section>

        {/* 3. REVIEWS (New Section) */}
        {/* Only appears if there are paid appointments */}
        <section>
           <div className="p-1 mb-4">
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Pending Reviews</h3>
             <p className="text-zinc-600 text-[10px]">You can only review students after payment is confirmed.</p>
           </div>
           <ReviewManager />
        </section>

      </div>
    </div>
  );
}