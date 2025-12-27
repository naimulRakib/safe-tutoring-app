'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';

// 👇 CHECK THIS IMPORT PATH CAREFULLY
// Ensure it points to the exact file location. 
// If you used 'components' (plural) in your folder structure, add the 's'.
import TuitionManager from '@/app/component/dashboard/TuitionManager'; 

export default function TuitionPage() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  if (!user) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black mb-8">My Classroom</h1>
        {/* 👇 This triggers the error if the import above is wrong */}
        <TuitionManager userId={user.id} />
      </div>
    </div>
  );
}