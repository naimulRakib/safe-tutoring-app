"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Check, X, Flame, Loader2 } from 'lucide-react';

interface ProposalListProps {
  userId: string;
  onAcceptSuccess: (chatUser: any) => void;
}

export default function ProposalList({ userId, onAcceptSuccess }: ProposalListProps) {
  const supabase = createClient();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      console.log("🔍 Fetching proposals for:", userId);
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          sender:sender_id ( username, role ) 
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error("❌ Fetch Error:", error);
      } else {
        setProposals(data || []);
      }
      setLoading(false);
    };
    fetchProposals();
  }, [userId, supabase]);

  const handleAccept = async (app: any) => {
    // 1. Update Application Status
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id);
    
    // 2. SAFE INSERT: Check if Appointment already exists
    const { data: existingAppt } = await supabase
      .from('appointments')
      .select('id')
      .eq('application_id', app.id)
      .maybeSingle();

    if (!existingAppt) {
      console.log("Creating new appointment row...");
      await supabase.from('appointments').insert({ 
        application_id: app.id, 
        status: 'negotiating' 
      });
    } else {
      console.log("Appointment row already exists.");
    }
    
    // 3. Redirect to Chat
    onAcceptSuccess({
      id: app.sender_id,
      name: app.sender?.username || "User",
      applicationId: app.id,
      myRole: 'tutor' // Assuming receiver is tutor, logic might need adjustment based on who receives
    });
  };

  const handleReject = async (id: string) => {
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', id);
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-black"/></div>;

  return (
    <div className="space-y-4 font-sans">
      <h3 className="font-bold text-lg text-gray-800 border-b pb-2">Incoming Requests</h3>
      
      {proposals.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No pending requests found.
        </div>
      )}
      
      {proposals.map((prop) => (
        <div key={prop.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative animate-in slide-in-from-left-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-bold text-sm text-gray-900">{prop.sender?.username || "User"}</h4>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{prop.sender?.role}</span>
            </div>
            {prop.match_score > 0 && (
              <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-yellow-100">
                <Flame size={10} className="fill-yellow-500" /> {prop.match_score}% Match
              </span>
            )}
          </div>
          <div className="bg-gray-50 p-2.5 rounded-lg mb-4">
             <p className="text-xs text-gray-600 italic">"{prop.message}"</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleAccept(prop)} 
              className="flex-1 bg-black text-white py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={14} strokeWidth={3}/> ACCEPT & CHAT
            </button>
            <button 
              onClick={() => handleReject(prop.id)} 
              className="px-3 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              title="Reject Request"
            >
              <X size={16}/>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}