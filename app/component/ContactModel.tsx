"use client";
import { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';

interface ContactModalProps {
  senderId: string;
  targetUser: any;
  onClose: () => void;
}

export default function ContactModal({ senderId, targetUser, onClose }: ContactModalProps) {
  const supabase = createClient();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      // 1. BETTER CHECK: Check for Pending OR Accepted links
      // We don't want to send a request if we are already connected.
      const { data: existing } = await supabase
        .from('applications')
        .select('id, status')
        .eq('sender_id', senderId)
        .eq('receiver_id', targetUser.id)
        .or('status.eq.pending,status.eq.accepted') // Check both!
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
            alert("You are already connected with this user! Go to Chat.");
        } else {
            alert("Request already pending! Please wait for them to reply.");
        }
        setLoading(false);
        return;
      }

      // 2. Send Proposal
      const { error } = await supabase.from('applications').insert({
        sender_id: senderId,
        receiver_id: targetUser.id,
        message: message.trim(),
        match_score: targetUser.match_score || 0,
        status: 'pending'
      });

      if (error) throw error;
      
      setSent(true);
      setTimeout(onClose, 2000);

    } catch (err) {
      console.error(err);
      alert("Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl animate-in zoom-in">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Proposal Sent!</h3>
          <p className="text-sm text-gray-500 mt-2">Good luck!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
          <div>
              <h3 className="font-bold text-gray-800 text-lg">Contact {targetUser.name}</h3>
              <p className="text-xs text-gray-500">Send a personalized message</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <textarea
            className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none h-32 text-gray-800 resize-none bg-gray-50 focus:bg-white transition-colors"
            placeholder={`Hi ${targetUser.name}, I noticed your profile and...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoFocus
          />
          
          <div className="mt-6 flex gap-3">
            <button 
                onClick={handleSend} 
                disabled={loading || !message.trim()} 
                className="w-full py-3 rounded-xl bg-black hover:bg-gray-800 text-white font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} 
              Send Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}