"use client";

import { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Loader2, CheckCircle, DollarSign, Calendar, BookOpen, X } from 'lucide-react';

interface HireModalProps {
  tutorId: string;
  tutorName: string;
  studentId: string;
  applicationId: string; // To link back to history
  onClose: () => void;
}

export default function HireTutorModal({ tutorId, tutorName, studentId, applicationId, onClose }: HireModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form State
  const [salary, setSalary] = useState('');
  const [days, setDays] = useState('3');
  const [subjects, setSubjects] = useState('');

  const handleSendOffer = async () => {
    if (!salary || !days) return alert("Please fill in salary and days.");
    setLoading(true);

    const { error } = await supabase.from('contracts').insert({
      student_id: studentId,
      tutor_id: tutorId,
      origin_application_id: applicationId,
      monthly_fee: Number(salary),
      days_per_week: Number(days),
      subjects: subjects.split(',').map(s => s.trim()),
      status: 'pending' // Tutor must accept
    });

    if (error) {
      alert("Error sending offer: " + error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 animate-in zoom-in">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Offer Sent!</h2>
          <p className="text-gray-500 text-sm mt-2">
            We sent the contract to {tutorName}. Once they accept, Phase 2 (Attendance & Tracking) will begin.
          </p>
          <button onClick={onClose} className="mt-6 w-full bg-black text-white py-3 rounded-xl font-bold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Hire {tutorName}</h2>
            <p className="text-emerald-100 text-xs mt-1">Set terms for monthly tuition.</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-1 rounded-full hover:bg-white/30"><X size={20}/></button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
              <DollarSign size={14}/> Monthly Salary (BDT)
            </label>
            <input 
              type="number" 
              placeholder="e.g. 5000"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                <Calendar size={14}/> Days / Week
              </label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-900 outline-none"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              >
                {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} Days</option>)}
              </select>
            </div>
            <div>
               <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                <BookOpen size={14}/> Subjects
              </label>
              <input 
                placeholder="Math, English"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-900 outline-none"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSendOffer}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : "SEND OFFER & START PHASE 2"}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-3">
              By clicking, you agree to our Terms of Service.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}