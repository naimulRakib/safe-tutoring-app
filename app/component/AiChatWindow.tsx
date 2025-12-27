'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2 } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client'; 

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AiChatWindow() {
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am your Academic Counselor. Tell me what kind of tutor you need (Subject, Area, Budget)?' }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 1. Update UI immediately
    const userText = input;
    const newHistory = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // 2. Send CHAT HISTORY (messages) to the API
      // This matches the "Bulletproof" backend I just gave you.
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }) 
      });
      
      const data = await res.json();

      // 3. Display the AI's Reply
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: "I'm having trouble connecting to the tutor database right now." }]);
      }

    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: "Connection failed. Please check your internet." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="mb-4 w-80 h-[450px] bg-black/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="p-3 bg-emerald-900/20 border-b border-emerald-500/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-emerald-400" />
              <span className="text-xs font-bold text-white tracking-widest">AI_COUNSELOR</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X size={16}/>
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-zinc-700">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-xs p-3 rounded-xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-emerald-600 text-black font-bold rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-200 border border-white/5 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 text-[10px] px-3 py-2 rounded-xl rounded-tl-none border border-white/5 flex items-center gap-2">
                  <Loader2 size={10} className="animate-spin text-emerald-500"/>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-black/50 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ex: I need a Physics tutor..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none placeholder:text-zinc-600"
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim()} 
              className="bg-emerald-600 p-2 rounded-lg text-black hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-110 transition-transform active:scale-95 group z-50"
      >
        {isOpen ? (
          <X className="text-black" /> 
        ) : (
          <Bot className="text-black group-hover:rotate-12 transition-transform" size={28} />
        )}
      </button>
    </div>
  );
}