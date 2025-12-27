'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { ShieldCheck, MessageSquare, Loader2, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

interface InboxProps {
  currentUserId: string;
  onSelectUser: (user: { id: string, name: string }) => void;
  onClose: () => void;
}

export default function Inbox({ currentUserId, onSelectUser, onClose }: InboxProps) {
  const supabase = createClient();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInbox() {
      try {
        // 1. Get Messages
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id(username),
            receiver:receiver_id(username)
          `)
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. Group by User
        const uniqueUsersMap = new Map();
        const userIdsToCheck: string[] = [];

        messages?.forEach((msg: any) => {
          const isSenderMe = msg.sender_id === currentUserId;
          const otherId = isSenderMe ? msg.receiver_id : msg.sender_id;
          const otherName = isSenderMe ? msg.receiver?.username : msg.sender?.username;

          if (!uniqueUsersMap.has(otherId)) {
            uniqueUsersMap.set(otherId, {
              id: otherId,
              name: otherName || 'Unknown',
              lastMessage: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMeLast: isSenderMe,
              // Will be populated below
              hasAcceptedApp: false, 
              role: 'user' // Default
            });
            userIdsToCheck.push(otherId);
          }
        });

        // 3. CHECK APPLICATION STATUS & ROLE for all these users
        if (userIdsToCheck.length > 0) {
          // A. Check Applications (Is it accepted?)
          const { data: apps } = await supabase
            .from('applications')
            .select('sender_id, receiver_id, status')
            .or(`sender_id.in.(${userIdsToCheck.join(',')}),receiver_id.in.(${userIdsToCheck.join(',')})`)
            .eq('status', 'accepted'); // Only care about accepted ones

          // B. Check Roles (Is it a student?)
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, role')
            .in('id', userIdsToCheck);

          // C. Merge Data back into map
          userIdsToCheck.forEach(uid => {
            const conversation = uniqueUsersMap.get(uid);
            
            // Check if ANY app exists where this user is involved with ME and is ACCEPTED
            const isAccepted = apps?.some(a => 
              (a.sender_id === uid && a.receiver_id === currentUserId) || 
              (a.sender_id === currentUserId && a.receiver_id === uid)
            );

            // Get Role
            const profile = profiles?.find(p => p.id === uid);

            if (conversation) {
              conversation.hasAcceptedApp = !!isAccepted;
              conversation.role = profile?.role || 'user';
              uniqueUsersMap.set(uid, conversation);
            }
          });
        }

        setConversations(Array.from(uniqueUsersMap.values()));

      } catch (error) {
        console.error("Inbox Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInbox();
  }, [currentUserId, supabase]);

  return (
    <div className="absolute top-20 right-4 z-[450] w-96 max-h-[70vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-10 fade-in font-sans">
      
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center">
        <div>
          <h3 className="font-black text-white tracking-widest text-xs uppercase flex items-center gap-2">
            <MessageSquare size={14} className="text-emerald-500" /> Secure Inbox
          </h3>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-emerald-500" size={20} />
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Decrypting...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-10 text-center border-dashed border border-zinc-800 m-4 rounded-xl">
            <p className="text-zinc-600 text-xs font-bold">No active frequencies.</p>
          </div>
        ) : (
          conversations.map((chat) => (
            <div 
              key={chat.id}
              className="p-4 border-b border-zinc-800/50 hover:bg-zinc-900 transition-colors group relative"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700">
                      <UserCircle2 size={20} />
                   </div>
                   <div 
                     onClick={() => onSelectUser({ id: chat.id, name: chat.name })}
                     className="cursor-pointer"
                   >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm hover:underline">{chat.name}</span>
                        {chat.role && <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase">{chat.role}</span>}
                      </div>
                      <p className="text-xs text-zinc-400 truncate w-40 mt-0.5">
                        <span className="text-zinc-600">{chat.isMeLast ? 'You: ' : ''}</span>
                        {chat.lastMessage}
                      </p>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono">{chat.time}</span>
                  
                  {/* --- PROFILE LINK LOGIC --- */}
                  {/* Only show if App is Accepted AND target is a Student */}
                  {chat.hasAcceptedApp && chat.role === 'student' && (
                    <Link 
                      href={`/studentprofile/${chat.id}`}
                      className="text-emerald-500 hover:text-emerald-400 hover:scale-110 transition-transform p-1"
                      title="View Verified Profile"
                    >
                      <ShieldCheck size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #09090b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
      `}</style>
    </div>
  );
}