'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';

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
        // 1. Get ALL messages sent or received by me
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

        // 2. Group by Conversation Partner (The "Other Person")
        const uniqueUsersMap = new Map();

        messages?.forEach((msg: any) => {
          // Determine who is the "Other" person
          const isSenderMe = msg.sender_id === currentUserId;
          const otherId = isSenderMe ? msg.receiver_id : msg.sender_id;
          const otherName = isSenderMe ? msg.receiver?.username : msg.sender?.username;

          // Only keep the FIRST (latest) message we find for this person
          if (!uniqueUsersMap.has(otherId)) {
            uniqueUsersMap.set(otherId, {
              id: otherId,
              name: otherName || 'Unknown',
              lastMessage: msg.content,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMeLast: isSenderMe
            });
          }
        });

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
    <div className="absolute top-20 right-4 z-[450] w-80 max-h-[60vh] bg-black/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-10 fade-in">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <h3 className="font-bold text-white tracking-wider text-sm">SECURE INBOX</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-gray-500 animate-pulse">Decryption in progress...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-xs">No active comms channels.</div>
        ) : (
          conversations.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => onSelectUser({ id: chat.id, name: chat.name })}
              className="p-4 border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-emerald-400 text-sm">@{chat.name}</span>
                <span className="text-[10px] text-gray-500 font-mono">{chat.time}</span>
              </div>
              <p className="text-xs text-gray-300 truncate group-hover:text-white transition-colors">
                <span className="text-gray-500">{chat.isMeLast ? 'You: ' : ''}</span>
                {chat.lastMessage}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}