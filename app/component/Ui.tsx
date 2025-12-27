'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Shield, Star, CheckCircle, Smartphone, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30">
      
      {/* Subtle Background Grid - Visual branding */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#10b981 0.5px, transparent 0.5px)`, backgroundSize: '30px 30px' }}>
      </div>

      {/* Navbar - Clean Glassmorphism */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <div className="bg-emerald-500 text-black p-1.5 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          Scholar<span className="text-emerald-500">Grid</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Log In
          </Link>
          <Link href="/signup" className="px-5 py-2 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition-all font-bold">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section - Bold but clear */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center mt-12 mb-20">
        
        {/* Simple Trust Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border border-emerald-500/20 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          100% Verified & Safe Tutors
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mb-6">
          Find the perfect tutor <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            right in your neighborhood.
          </span>
        </h1>

        <p className="text-zinc-400 max-w-2xl mb-10 text-lg leading-relaxed">
          The easiest way to connect with top students and expert teachers. 
          Verified backgrounds, real-time tracking, and guaranteed safety for every student.
        </p>

        {/* Action Buttons - User Friendly Labels */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-100 text-black rounded-xl font-bold hover:bg-white transition-all transform hover:-translate-y-0.5 shadow-lg">
            Find a Tutor <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-8 py-4 bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl font-bold hover:bg-zinc-800 transition-all">
            Become a Tutor
          </button>
        </div>

        {/* Example Profile - High Tech Visual, Easy Content */}
        <div className="mt-20 w-full max-w-3xl relative">
            {/* Ambient Background Glows */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>

            <div className="relative border border-zinc-800 rounded-2xl bg-zinc-900/50 backdrop-blur-xl p-6 text-left flex flex-col sm:flex-row gap-6 items-center sm:items-start group hover:border-emerald-500/40 transition-all">
                
                {/* Visual Scanning Animation */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-[scan_4s_linear_infinite]"></div>

                {/* Avatar */}
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex-shrink-0 border border-zinc-700 flex items-center justify-center text-4xl shadow-lg">
                    👩‍🏫
                </div>
                
                {/* Tutor Info - Simple Language */}
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-xl text-white">Sarah Jenkins</h3>
                            <p className="text-sm text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                                <MapPin size={14} /> Available in Mirpur 1, Dhaka
                            </p>
                        </div>
                        <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg text-yellow-400 text-sm font-bold border border-zinc-800">
                            <Star className="w-3.5 h-3.5 fill-current" /> 5.0
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['Mathematics', 'Physics', 'English'].map((subject) => (
                            <span key={subject} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-md border border-zinc-700">
                                {subject}
                            </span>
                        ))}
                    </div>

                    <div className="pt-3 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 border-t border-zinc-800 mt-2 uppercase font-bold tracking-wider">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> ID Verified
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" /> Safety Checked
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5" /> Live Tracking
                        </span>
                    </div>
                </div>

                {/* Simple Button */}
                <div className="w-full sm:w-auto">
                    <button className="w-full px-6 py-3 bg-emerald-500 text-black text-sm font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-md">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 text-center text-zinc-500 text-xs border-t border-zinc-900 bg-black/40 backdrop-blur-md">
        <div className="flex justify-center gap-6 mb-4 font-bold uppercase tracking-widest">
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Parents</span>
            <span className="hover:text-emerald-400 cursor-pointer transition-colors">Contact</span>
        </div>
        <p className="font-mono">© 2025 ScholarGrid - Safe Home Education</p>
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}