"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Check, X, DollarSign, Calendar, BookOpen, Loader2, Briefcase, Star, UserCheck, Inbox } from 'lucide-react';
import ReviewModal from '../reviews/ReviewModal';

export default function ContractManager({ tutorId }: { tutorId: string }) {
  const supabase = createClient();
  
  // --- STATE ---
  const [pendingContracts, setPendingContracts] = useState<any[]>([]);
  const [activeContracts, setActiveContracts] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<any | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchContracts = async () => {
      console.log("🔍 ContractManager: Fetching for Tutor ID:", tutorId);

      // 1. Fetch Pending Requests
      const { data: pending, error: err1 } = await supabase
        .from('contracts')
        .select('*, student:student_id(username)')
        .eq('tutor_id', tutorId)
        .eq('status', 'pending');
      
      if (err1) console.error("Error fetching pending:", err1);
      if (pending) setPendingContracts(pending);

      // 2. Fetch Active & Completed Tuitions
      const { data: active, error: err2 } = await supabase
        .from('contracts')
        .select('*, student:student_id(username)')
        .eq('tutor_id', tutorId)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (err2) console.error("Error fetching active:", err2);
      if (active) setActiveContracts(active);

      setLoading(false);
    };

    if(tutorId) fetchContracts();
  }, [tutorId, supabase]);

  // --- ACTIONS ---
  const handleUpdateStatus = async (contractId: string, newStatus: 'active' | 'rejected') => {
    setActionLoading(contractId);
    const { error } = await supabase.from('contracts').update({ status: newStatus }).eq('id', contractId);

    if (!error) {
      if (newStatus === 'active') {
        const contract = pendingContracts.find(c => c.id === contractId);
        setPendingContracts(prev => prev.filter(c => c.id !== contractId));
        if (contract) setActiveContracts(prev => [{ ...contract, status: 'active' }, ...prev]);
        alert("Tuition Started! Phase 2 is now active.");
      } else {
        setPendingContracts(prev => prev.filter(c => c.id !== contractId));
      }
    }
    setActionLoading(null);
  };

  const handleMarkComplete = async (contractId: string) => {
    if (!confirm("Are you sure this tuition is finished?")) return;
    setActionLoading(contractId);
    const { error } = await supabase
      .from('contracts')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', contractId);

    if (!error) {
      setActiveContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'completed' } : c));
    }
    setActionLoading(null);
  };

  // --- RENDER ---

  if (loading) return (
    <div className="p-8 border border-dashed border-zinc-800 rounded-xl flex justify-center text-zinc-500">
        <Loader2 className="animate-spin" />
    </div>
  );

  // EMPTY STATE (This fixes the "invisible" issue)
  if (pendingContracts.length === 0 && activeContracts.length === 0) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 text-center mb-8">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="text-zinc-500" size={32} />
            </div>
            <h3 className="text-white font-bold text-lg">No Active Contracts</h3>
            <p className="text-zinc-500 text-sm mt-1">
                New tuition requests from students will appear here.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-8 mb-6 animate-in fade-in slide-in-from-top-4">
      
      {/* 1. PENDING CONTRACTS */}
      {pendingContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
            <Briefcase size={16} /> New Job Offers
          </h3>
          {pendingContracts.map(contract => (
            <div key={contract.id} className="bg-zinc-900 border border-emerald-500/20 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">Request From</p>
                  <h4 className="text-white font-bold text-lg">{contract.student?.username || "Student"}</h4>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                  <DollarSign size={14} /> {contract.monthly_fee}/mo
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateStatus(contract.id, 'active')}
                  disabled={!!actionLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {actionLoading === contract.id ? <Loader2 className="animate-spin" size={14}/> : <Check size={16} />}
                  ACCEPT
                </button>
                <button 
                  onClick={() => handleUpdateStatus(contract.id, 'rejected')}
                  disabled={!!actionLoading}
                  className="px-4 border border-white/10 text-gray-400 hover:text-red-500 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. ACTIVE / COMPLETED */}
      {activeContracts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 border-t border-zinc-800 pt-6">
            <UserCheck size={16} /> My Students
          </h3>
          {activeContracts.map(contract => (
            <div key={contract.id} className="bg-black border border-zinc-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-bold">{contract.student?.username || "Student"}</h4>
                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${contract.status === 'active' ? 'bg-blue-900/30 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  {contract.status}
                </span>
              </div>
              {contract.status === 'active' ? (
                <button 
                  onClick={() => handleMarkComplete(contract.id)}
                  disabled={!!actionLoading}
                  className="w-full border border-blue-500/30 text-blue-400 font-bold py-3 rounded-xl text-xs hover:bg-blue-900/10 transition-all"
                >
                  MARK COMPLETED
                </button>
              ) : (
                <button 
                  onClick={() => setShowReviewModal({
                    contractId: contract.id,
                    reviewerId: tutorId,
                    revieweeId: contract.student_id,
                    role: 'tutor'
                  })}
                  className="w-full bg-white text-black font-bold py-3 rounded-xl text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                >
                  <Star size={14} className="fill-black" /> REVIEW STUDENT
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* REVIEW MODAL POPUP */}
      {showReviewModal && (
        <ReviewModal 
          {...showReviewModal} 
          onClose={() => setShowReviewModal(null)}
          onSuccess={() => alert("Review Submitted!")}
        />
      )}
    </div>
  );
}