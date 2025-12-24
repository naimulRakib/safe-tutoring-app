'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Shield, Star, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Navbar - Trustworthy and Professional */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-800">
          <div className="bg-blue-600 text-white p-1 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          SafeTutor
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/login" className="hidden sm:block px-4 py-2 text-slate-600 hover:text-blue-600 transition">
            Log In
          </Link>
          <Link href="/signup" className="px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center mt-16 mb-20">
        
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold mb-8 border border-blue-100 uppercase tracking-wide">
          <Shield className="w-3 h-3" />
          Background Verified Tutors Only
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 max-w-4xl mb-6">
          Master any subject with <br />
          <span className="text-blue-600">trusted academic experts.</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mb-10 leading-relaxed">
          Connect with Ivy League students and certified teachers in a secure, monitored environment. 
          We prioritize safety, quality, and results.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200">
            Find a Tutor <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition">
            Become a Tutor
          </button>
        </div>

        {/* Mock UI: Tutor Profile Card */}
        <div className="mt-20 w-full max-w-3xl relative">
            {/* Decorative background blobs */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-200/50 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-200/50 rounded-full blur-3xl"></div>

            <div className="relative border border-slate-200 rounded-2xl shadow-xl bg-white p-6 text-left flex flex-col sm:flex-row gap-6">
                {/* Avatar Placeholder */}
                <div className="w-24 h-24 bg-slate-100 rounded-full flex-shrink-0 border-4 border-white shadow-sm flex items-center justify-center text-4xl">
                    👩‍🏫
                </div>
                
                {/* Tutor Info */}
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Sarah Jenkins</h3>
                            <p className="text-sm text-slate-500">PhD Candidate, Mathematics • Stanford University</p>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-xs font-bold border border-yellow-100">
                            <Star className="w-3 h-3 fill-current" /> 5.0
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">Calculus</span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">Physics</span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">SAT Prep</span>
                    </div>

                    <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 mt-2">
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="w-3 h-3" /> ID Verified
                        </span>
                        <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Background Check Clear
                        </span>
                    </div>
                </div>

                {/* "Book" Button Mock */}
                <div className="flex items-center">
                    <button className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                        Book Session
                    </button>
                </div>
            </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <div className="flex justify-center gap-6 mb-4 font-medium">
            <span className="cursor-pointer hover:text-slate-600">Safety Policy</span>
            <span className="cursor-pointer hover:text-slate-600">For Parents</span>
            <span className="cursor-pointer hover:text-slate-600">Contact</span>
        </div>
        <p>© 2024 SafeTutor Inc. Education for everyone.</p>
      </footer>
    </div>
  );
}