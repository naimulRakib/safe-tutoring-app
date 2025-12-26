'use client';

import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface AiSearchProps {
  userLocation: { lat: number; lng: number } | null;
  onResults: (results: any[]) => void;
}

export default function AiSearch({ userLocation, onResults }: AiSearchProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      // We call the API route here instead of importing the DB directly
      const res = await fetch('/api/ai-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userQuery: query, 
          studentLocation: userLocation 
        }),
      });

      const data = await res.json();
      if (data.matches) {
        onResults(data.matches); // Pass data up to Dashboard
      } else {
        alert(data.message || "No matches found");
      }
    } catch (error) {
      console.error(error);
      alert("AI Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-30 px-4">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2">
          
          <div className="pl-4 pr-2 text-emerald-500 animate-pulse">
            <Sparkles size={20} />
          </div>

          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI: 'I need a strict Math tutor near Azimpur for Class 10'..."
            className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 focus:outline-none py-3 px-2 text-sm font-medium"
          />

          <button 
            type="submit"
            disabled={searching}
            className="ml-2 bg-white text-black px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? (
              <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full"></span>
            ) : (
              <>
                <Search size={14} />
                SEARCH
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      {!searching && query === '' && (
        <div className="flex gap-2 justify-center mt-3 opacity-0 animate-in fade-in slide-in-from-top-4 fill-mode-forwards" style={{ animationDelay: '0.5s' }}>
          <button onClick={() => setQuery("Physics tutor from BUET")} className="text-[10px] bg-black/50 border border-white/10 px-3 py-1 rounded-full text-gray-400 hover:text-white hover:border-emerald-500/50 transition-colors">
            ⚛️ Physics (BUET)
          </button>
          <button onClick={() => setQuery("English teacher for kids")} className="text-[10px] bg-black/50 border border-white/10 px-3 py-1 rounded-full text-gray-400 hover:text-white hover:border-emerald-500/50 transition-colors">
            🔤 English (Kids)
          </button>
          <button onClick={() => setQuery("Strict Math tutor nearby")} className="text-[10px] bg-black/50 border border-white/10 px-3 py-1 rounded-full text-gray-400 hover:text-white hover:border-emerald-500/50 transition-colors">
            📐 Strict Math
          </button>
        </div>
      )}
    </div>
  );
}