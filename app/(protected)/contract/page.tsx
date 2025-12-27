"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { 
  DollarSign, Calendar, BookOpen, Loader2, 
  Check, X, RefreshCw, ArrowLeft, Send, MessageSquare 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContractPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Negotiation State
  const [editId, setEditId] = useState<string | null>(null);
  const [newFee, setNewFee] = useState('');
  const [newDays, setNewDays] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data } = await supabase
        .from('contracts')
        .select(`
          *,
          tutor:tutor_id(username),
          student:student_id(username)
        `)
        .or(`student_id.eq.${authUser?.id},tutor_id.eq.${authUser?.id}`)
        .order('created_at', { ascending: false });

      if (data) setContracts(data);
      setLoading(false);
    };
    init();
  }, [supabase]);

  const handleUpdate = async (contractId: string, updates: any) => {
    setLoading(true);
    const { error } = await supabase
      .from('contracts')
      .update({ 
        ...updates, 
        last_action_by: user.id 
      })
      .eq('id', contractId);

    if (!error) {
       window.location.reload(); // Refresh to show new state
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-emerald-500 font-mono">
      <Loader2 className="animate-spin mr-2" /> SYNCING CONTRACTS...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-sans">
      {/* Header */}
      <div className="max-w-2xl mx-auto flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest">Tuition Negotiator</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {contracts.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-gray-500 text-sm">No active negotiations found.</p>
          </div>
        )}

        {contracts.map((c) => {
          const isMyTurn = c.last_action_by !== user.id;
          const partnerName = user.id === c.tutor_id ? c.student?.username : c.tutor?.username;
          const role = user.id === c.tutor_id ? 'Tutor' : 'Guardian';

          return (
            <div key={c.id} className={`relative overflow-hidden bg-zinc-900 border ${c.status === 'active' ? 'border-emerald-500/50' : 'border-white/10'} rounded-3xl p-6 shadow-2xl transition-all`}>
              
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase tracking-tighter rounded-bl-xl ${c.status === 'active' ? 'bg-emerald-500 text-black' : 'bg-yellow-500 text-black'}`}>
                {c.status}
              </div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {partnerName} <span className="text-[10px] text-zinc-500 font-normal">({role})</span>
                  </h2>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">Contract ID: {c.id.slice(0,8)}</p>
                </div>
              </div>

              {/* Terms Display */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Monthly Fee</label>
                  {editId === c.id ? (
                    <input 
                      type="number" 
                      className="bg-black text-emerald-400 font-bold w-full outline-none" 
                      value={newFee || c.monthly_fee}
                      onChange={(e) => setNewFee(e.target.value)}
                    />
                  ) : (
                    <p className="text-xl font-black text-emerald-400 tracking-tighter">৳{c.monthly_fee}</p>
                  )}
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Days / Week</label>
                  {editId === c.id ? (
                    <select 
                      className="bg-black text-white font-bold w-full outline-none" 
                      value={newDays || c.days_per_week}
                      onChange={(e) => setNewDays(e.target.value)}
                    >
                      {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} Days</option>)}
                    </select>
                  ) : (
                    <p className="text-xl font-black tracking-tighter">{c.days_per_week} Days</p>
                  )}
                </div>
              </div>

              {/* Action Logic */}
              <div className="pt-4 border-t border-white/5">
                {c.status === 'pending' && (
                  <>
                    {isMyTurn ? (
                      <div className="flex flex-col gap-3">
                        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-400 text-center mb-2">
                          Partner sent an offer. It's your turn to decide.
                        </div>
                        {editId === c.id ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdate(c.id, { monthly_fee: newFee || c.monthly_fee, days_per_week: newDays || c.days_per_week })}
                              className="flex-1 bg-white text-black font-bold py-3 rounded-2xl text-xs"
                            >
                              SEND COUNTER-OFFER
                            </button>
                            <button onClick={() => setEditId(null)} className="px-4 bg-zinc-800 rounded-2xl">
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdate(c.id, { status: 'active' })}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
                            >
                              <Check size={16} /> ACCEPT TERMS
                            </button>
                            <button 
                              onClick={() => setEditId(c.id)}
                              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 border border-white/10"
                            >
                              <RefreshCw size={14} /> NEGOTIATE
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2 bg-zinc-800/50 rounded-xl">
                        <p className="text-xs text-zinc-500 animate-pulse">Waiting for {partnerName} to respond...</p>
                      </div>
                    )}
                  </>
                )}

                {c.status === 'active' && (
                  <div className="flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold py-2">
                    <CheckCircle size={16} /> TUITION IS IN PROGRESS
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckCircle({ size, className }: { size: number, className?: string }) {
  return <Check size={size} className={`p-0.5 bg-emerald-500 text-black rounded-full ${className}`} />;
}