'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { CalendarClock, MessageSquare, X, Lock, CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react'; 
import AppointmentScheduler from './chat/AppointmentScheduler';

interface ChatWindowProps {
  currentUserId: string;
  recipientId: string;
  recipientName: string;
  applicationId?: string; 
  myRole?: string;        
  onClose: () => void;
}

export default function ChatWindow({ currentUserId, recipientId, recipientName, applicationId: propAppId, myRole: propRole, onClose }: ChatWindowProps) {
  const supabase = createClient();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewMode, setViewMode] = useState<'CHAT' | 'SCHEDULE'>('CHAT');
  
  // State
  const [activeAppId, setActiveAppId] = useState<string | null>(propAppId || null);
  const [activeRole, setActiveRole] = useState<string | null>(propRole || null);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [apptStatus, setApptStatus] = useState<'none' | 'negotiating' | 'confirmed' | 'cancelled'>('none');
  const [loadingContext, setLoadingContext] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. INITIALIZATION & RESTORING STATE
  useEffect(() => {
    const initChat = async () => {
      setLoadingContext(true);
      
      let finalAppId = propAppId;
      let finalRole = propRole;
      let finalAppStatus = null;

      // A. Auto-Discover Application ID if missing
      if (!finalAppId) {
        const { data: appData } = await supabase
          .from('applications')
          .select('id, status')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUserId})`)
          .eq('status', 'accepted')
          .maybeSingle();

        if (appData) {
          finalAppId = appData.id;
          finalAppStatus = appData.status;
        }
      } else {
        const { data } = await supabase.from('applications').select('status').eq('id', finalAppId).single();
        if (data) finalAppStatus = data.status;
      }

      // B. Auto-Discover Role
      if (!finalRole) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUserId).single();
        if (profile) finalRole = profile.role;
      }

      // C. CHECK FOR EXISTING APPOINTMENT (CRITICAL FOR PERSISTENCE)
      if (finalAppId) {
        const { data: existingAppt } = await supabase
          .from('appointments')
          .select('status')
          .eq('application_id', finalAppId)
          .neq('status', 'cancelled') // Ignore cancelled ones so we can make new ones
          .maybeSingle();
        
        if (existingAppt) {
          console.log("✅ Restored Appointment Status:", existingAppt.status);
          setApptStatus(existingAppt.status); // <--- Restores the button state
        }
      }

      if (finalAppId) setActiveAppId(finalAppId);
      if (finalRole) setActiveRole(finalRole);
      if (finalAppStatus) setAppStatus(finalAppStatus);
      
      setLoadingContext(false);
    };

    initChat();
  }, [currentUserId, recipientId, propAppId, propRole, supabase]);

  // 2. REAL-TIME LISTENERS
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data || []);
    };
    fetchMessages();

    const msgChannel = supabase.channel(`chat:${currentUserId}-${recipientId}`) 
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new as any;
          if ((msg.sender_id === currentUserId && msg.receiver_id === recipientId) || (msg.sender_id === recipientId && msg.receiver_id === currentUserId)) {
            setMessages((prev) => {
               if (prev.some(m => m.id === msg.id)) return prev;
               return [...prev, msg];
            });
          }
        }
      )
      .subscribe();
      
    let apptChannel: any;
    if (activeAppId) {
      apptChannel = supabase.channel(`appt-status-${activeAppId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `application_id=eq.${activeAppId}` }, 
        (payload) => {
           const newStatus = (payload.new as any).status;
           setApptStatus(newStatus);
        })
        .subscribe();
    }

    return () => { 
      supabase.removeChannel(msgChannel);
      if (apptChannel) supabase.removeChannel(apptChannel);
    };
  }, [currentUserId, recipientId, supabase, activeAppId]);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages, viewMode]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage; setNewMessage('');
    await supabase.from('messages').insert({ sender_id: currentUserId, receiver_id: recipientId, content: text });
  };

  // Helper: Should we show the schedule button?
  // Logic: Show if we have an active appt OR if the application is accepted
  const showScheduleButton = (activeAppId && activeRole) && (appStatus === 'accepted' || apptStatus !== 'none');

  const getScheduleButtonStyle = () => {
    if (viewMode === 'SCHEDULE') return 'text-emerald-400 bg-white/10 ring-1 ring-emerald-500';
    switch (apptStatus) {
      case 'confirmed': return 'text-black bg-emerald-500 hover:bg-emerald-400 animate-pulse';
      case 'negotiating': return 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/50 animate-pulse'; // Added animation for visibility
      default: return 'text-gray-400 hover:text-white hover:bg-white/10';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 h-[450px] bg-[#0a0a0a] border border-emerald-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in slide-in-from-bottom-10 font-sans ring-1 ring-white/10">
      
      {/* HEADER */}
      <div className="p-3 bg-zinc-900/80 border-b border-white/10 flex justify-between items-center backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm tracking-wide truncate w-32">{recipientName}</span>
          {loadingContext ? (
             <span className="text-[9px] text-gray-500 animate-pulse">Syncing...</span>
          ) : (
             <>
               {apptStatus === 'confirmed' && <span className="text-[9px] text-emerald-400 font-bold font-mono uppercase flex items-center gap-1"><CheckCircle2 size={10}/> APPOINTMENT SET</span>}
               {apptStatus === 'negotiating' && <span className="text-[9px] text-yellow-400 font-bold font-mono uppercase flex items-center gap-1"><Zap size={10}/> NEGOTIATING...</span>}
             </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showScheduleButton ? (
             <button 
               onClick={() => setViewMode(viewMode === 'CHAT' ? 'SCHEDULE' : 'CHAT')}
               className={`p-1.5 rounded-lg transition-all duration-300 ${getScheduleButtonStyle()}`}
               title={apptStatus === 'confirmed' ? "View Appointment" : "Schedule"}
             >
               {viewMode === 'CHAT' ? <CalendarClock size={16} /> : <MessageSquare size={16} />}
             </button>
          ) : (
            (!loadingContext && activeAppId) && (
               <div className="p-1.5 text-zinc-600 cursor-not-allowed" title="Connection not fully accepted">
                  <Lock size={14} />
               </div>
            )
          )}
          
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"><X size={16} /></button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {viewMode === 'SCHEDULE' && activeAppId && activeRole ? (
        <div className="flex-1 overflow-hidden p-0 bg-zinc-900">
           <AppointmentScheduler 
              applicationId={activeAppId} 
              userId={currentUserId}
              myRole={activeRole} 
              onBack={() => setViewMode('CHAT')} 
           />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-black relative">
            
            {/* STICKY BANNERS - Always visible if status exists */}
            {apptStatus === 'negotiating' && (
              <div 
                onClick={() => setViewMode('SCHEDULE')}
                className="bg-yellow-900/20 border border-yellow-500/30 p-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-yellow-900/30 transition-colors mb-4 animate-in fade-in slide-in-from-top-2 group"
              >
                <AlertCircle size={14} className="text-yellow-500 group-hover:animate-bounce" />
                <span className="text-[10px] text-yellow-200 font-bold">Negotiation in progress. Tap to view.</span>
              </div>
            )}
            
            {apptStatus === 'confirmed' && (
              <div 
                onClick={() => setViewMode('SCHEDULE')}
                className="bg-emerald-900/20 border border-emerald-500/30 p-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-emerald-900/30 transition-colors mb-4 animate-in fade-in slide-in-from-top-2"
              >
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[10px] text-emerald-200 font-bold">Appointment Scheduled. Tap for details.</span>
              </div>
            )}

            {messages.length === 0 && <div className="text-center text-zinc-600 text-xs mt-10">Start chatting with {recipientName}...</div>}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs shadow-sm ${
                  msg.sender_id === currentUserId 
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-200 border border-white/5 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-white/10 bg-zinc-900 flex gap-2">
            <input 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="Type a message..." 
              className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors" 
            />
            <button 
              onClick={handleSend} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 text-[10px] rounded-lg transition-colors"
            >
              SEND
            </button>
          </div>
        </>
      )}
    </div>
  );
}