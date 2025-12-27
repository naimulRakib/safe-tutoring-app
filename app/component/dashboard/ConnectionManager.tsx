"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { 
  Check, X, Flame, Loader2, UserCircle2, 
  MessageSquare, ShieldCheck, Signal 
} from 'lucide-react';
import Link from 'next/link';

interface ConnectionManagerProps {
  userId: string;
  onChatStart?: (chatUser: any) => void; // Optional callback if you want direct chat
}

export default function ConnectionManager({ userId, onChatStart }: ConnectionManagerProps) {
  const supabase = createClient();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending');

  // 1. Fetch All Applications (Pending & Accepted)
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          sender:sender_id ( id, username, full_name, role, basic_info ) 
        `)
        .eq('receiver_id', userId)
        .in('status', ['pending', 'accepted']) // Fetch both states
        .order('created_at', { ascending: false });

      if (error) console.error("Fetch Error:", error);
      else setApplications(data || []);
      
      setLoading(false);
    };
    fetchData();
  }, [userId, supabase]);

  // 2. Handle Accept
  const handleAccept = async (app: any) => {
    // Optimistic Update (Instant UI change)
    setApplications(prev => prev.map(p => p.id === app.id ? { ...p, status: 'accepted' } : p));

    // DB Update
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id);
    
    // Create Appointment Row if missing
    const { data: existing } = await supabase.from('appointments').select('id').eq('application_id', app.id).maybeSingle();
    if (!existing) {
      await supabase.from('appointments').insert({ application_id: app.id, status: 'negotiating' });
    }
  };

  // 3. Handle Reject
  const handleReject = async (id: string) => {
    setApplications(prev => prev.filter(p => p.id !== id));
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', id);
  };

  // Filter lists based on state
  const pendingList = applications.filter(a => a.status === 'pending');
  const acceptedList = applications.filter(a => a.status === 'accepted');

  if (loading) return (
    <div className="p-12 text-center flex flex-col items-center gap-3">
      <Loader2 className="animate-spin text-emerald-500" />
      <span className="text-zinc-600 text-xs font-mono uppercase tracking-widest">Scanning Network...</span>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* --- TABS --- */}
      <div className="flex gap-4 border-b border-zinc-800 pb-1">
        <button 
          onClick={() => setTab('pending')}
          className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${tab === 'pending' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Incoming Signals ({pendingList.length})
        </button>
        <button 
          onClick={() => setTab('accepted')}
          className={`pb-3 text-xs font-black uppercase tracking-widest transition-all ${tab === 'accepted' ? 'text-cyan-500 border-b-2 border-cyan-500' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Active Links ({acceptedList.length})
        </button>
      </div>

      {/* --- PENDING LIST (PROPOSALS) --- */}
      {tab === 'pending' && (
        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
          {pendingList.length === 0 && (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
              <p className="text-zinc-600 text-sm font-bold">No incoming signals.</p>
            </div>
          )}
          {pendingList.map((prop) => (
            <div key={prop.id} className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 p-6 rounded-[1.5rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800 group-hover:bg-emerald-500 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-4 pl-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                     <UserCircle2 className="text-zinc-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg leading-none">{prop.sender?.full_name || prop.sender?.username || "Unknown"}</h4>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">New Proposal</span>
                  </div>
                </div>
                {prop.match_score > 0 && (
                  <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-orange-500/20 flex items-center gap-1">
                    <Flame size={10} className="fill-orange-500" /> {prop.match_score}% Sync
                  </span>
                )}
              </div>

              <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl mb-6 ml-4">
                 <p className="text-xs text-zinc-400 font-mono leading-relaxed">"{prop.message}"</p>
              </div>
              
              <div className="flex gap-3 pl-4">
                <button 
                  onClick={() => handleAccept(prop)} 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
                >
                  <Check size={14} strokeWidth={4}/> Establish Link
                </button>
                <button onClick={() => handleReject(prop.id)} className="px-4 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all">
                  <X size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ACCEPTED LIST (STUDENT PROFILES) --- */}
      {tab === 'accepted' && (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
          {acceptedList.length === 0 && (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
              <p className="text-zinc-600 text-sm font-bold">No active students yet.</p>
            </div>
          )}
          {acceptedList.map((app) => (
            <div key={app.id} className="bg-zinc-900/40 border border-cyan-500/20 p-5 rounded-[1.5rem] flex items-center justify-between group hover:bg-zinc-900/60 transition-all">
               
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 relative">
                    <UserCircle2 size={24} />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black"></div>
                 </div>
                 <div>
                   <h4 className="font-bold text-white">{app.sender?.full_name || app.sender?.username}</h4>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <Signal size={10} /> Online
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">ID: {app.sender?.id.slice(0,4)}...</span>
                   </div>
                 </div>
               </div>

               <div className="flex gap-2">
                 <Link 
                   href={`/studentprofile/${app.sender_id}`} // Link to the Profile Page we made earlier
                   className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-colors"
                   title="View Profile"
                 >
                   <ShieldCheck size={18} />
                 </Link>
                 <button 
                   onClick={() => onChatStart?.({ id: app.sender_id, name: app.sender?.username, applicationId: app.id })}
                   className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                 >
                   <MessageSquare size={14} /> Open Comms
                 </button>
               </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}