'use client';

import React, { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Star, AlertTriangle, X, Loader2, CheckCircle } from 'lucide-react';

interface ReviewModalProps {
  appointmentId: string; // Changed from contractId
  reviewerId: string;
  revieweeId: string;
  role: 'student' | 'tutor';
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ appointmentId, reviewerId, revieweeId, role, onClose, onSuccess }: ReviewModalProps) {
  const supabase = createClient();
  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState('');
  const [isStrike, setIsStrike] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return alert("Please write a short review.");
    setLoading(true);

    const { error } = await supabase.from('reviews').insert({
      appointment_id: appointmentId, // storing the appointment link
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating: rating,
      comment: comment,
      is_strike: role === 'tutor' ? isStrike : false
    });

    setLoading(false);

    if (error) {
      if (error.code === '42501') alert("Security Error: You can only review PAID appointments.");
      else if (error.code === '23505') alert("You already reviewed this session!");
      else alert(error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            {role === 'student' ? 'Rate Demo Class' : 'Student Report'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400">
            <X size={20} />
          </button>
        </div>

        {/* Rating Slider */}
        <div className="mb-6 text-center bg-black/30 p-4 rounded-xl border border-zinc-800">
          <div className="text-5xl font-black text-emerald-500 mb-2 flex justify-center items-center gap-2">
            {rating}<span className="text-lg text-zinc-600">/10</span>
          </div>
          <input 
            type="range" min="1" max="10" value={rating} 
            onChange={(e) => setRating(parseInt(e.target.value))}
            className="w-full accent-emerald-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-bold uppercase tracking-widest">
            <span>Poor</span><span>Excellent</span>
          </div>
        </div>

        {/* Strike Toggle (Tutor Only) */}
        {role === 'tutor' && (
          <div onClick={() => setIsStrike(!isStrike)} className={`mb-6 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isStrike ? 'bg-red-900/20 border-red-500' : 'bg-zinc-800/50 border-zinc-700'}`}>
            <AlertTriangle size={18} className={isStrike ? "text-red-500" : "text-zinc-500"} />
            <div>
              <p className={`text-sm font-bold ${isStrike ? 'text-red-400' : 'text-zinc-300'}`}>Issue a Strike?</p>
              <p className="text-[10px] text-zinc-500 leading-tight">Flag for non-payment or bad behavior.</p>
            </div>
            {isStrike && <CheckCircle className="ml-auto text-red-500" size={20} />}
          </div>
        )}

        <textarea 
          className="w-full h-28 bg-black border border-zinc-700 rounded-xl p-4 text-sm text-white focus:border-emerald-500 outline-none resize-none mb-4"
          placeholder="Write your review here..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button onClick={handleSubmit} disabled={loading} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Star size={18} className="fill-black" />}
          SUBMIT REVIEW
        </button>

      </div>
    </div>
  );
}