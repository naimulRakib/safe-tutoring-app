'use client';

import React, { useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Star, AlertTriangle, X, Loader2, CheckCircle, User, GraduationCap } from 'lucide-react';

interface ReviewModalProps {
  appointmentId: string;
  reviewerId: string;
  revieweeId: string;
  role: 'student' | 'tutor'; // This is the role of the REVIEWER (Me)
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ appointmentId, reviewerId, revieweeId, role, onClose, onSuccess }: ReviewModalProps) {
  const supabase = createClient();
  const [rating, setRating] = useState(5); // Default 5 Stars
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isStrike, setIsStrike] = useState(false);
  const [loading, setLoading] = useState(false);

  const isTutorReviewing = role === 'tutor'; // Am I a Tutor?

  const handleSubmit = async () => {
    if (!comment.trim()) return alert("Please write a short review.");
    setLoading(true);

    const { error } = await supabase.from('reviews').insert({
      appointment_id: appointmentId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating: rating,
      comment: comment,
      is_strike: isTutorReviewing ? isStrike : false // Only tutors can strike
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className={`absolute top-0 left-0 w-full h-1 ${isTutorReviewing ? 'bg-emerald-500' : 'bg-cyan-500'} shadow-[0_0_20px_currentColor]`} />

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-1 ${isTutorReviewing ? 'text-emerald-500' : 'text-cyan-500'}`}>
              {isTutorReviewing ? <GraduationCap size={14}/> : <User size={14}/>}
              {isTutorReviewing ? 'Tutor Protocol' : 'Student Feedback'}
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {isTutorReviewing ? 'Evaluate Student' : 'Rate Your Tutor'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Interactive Star Rating */}
        <div className="mb-8 text-center">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  size={32} 
                  className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'} transition-colors`} 
                />
              </button>
            ))}
          </div>
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
            {rating === 5 ? "Excellent Performance" : rating === 1 ? "Poor Performance" : `${rating} Star Rating`}
          </p>
        </div>

        {/* Comment Box */}
        <div className="mb-6">
          <textarea 
            className="w-full h-32 bg-black/50 border border-zinc-700 rounded-2xl p-4 text-sm text-white focus:border-zinc-500 outline-none resize-none transition-all placeholder:text-zinc-600"
            placeholder={isTutorReviewing ? "Was the student punctual? Did they pay on time?" : "How was the teaching style? Was the concept clear?"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Strike Toggle (Tutor Only) */}
        {isTutorReviewing && (
          <div 
            onClick={() => setIsStrike(!isStrike)} 
            className={`mb-6 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 group ${isStrike ? 'bg-red-900/10 border-red-500/50' : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700'}`}
          >
            <div className={`p-2 rounded-full ${isStrike ? 'bg-red-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${isStrike ? 'text-red-400' : 'text-zinc-300'}`}>Issue Formal Strike</p>
              <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">Flag this student for non-payment or abusive behavior.</p>
            </div>
            {isStrike && <CheckCircle className="text-red-500 animate-in zoom-in" size={20} />}
          </div>
        )}

        {/* Submit Button */}
        <button 
          onClick={handleSubmit} 
          disabled={loading} 
          className={`w-full font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
            ${isTutorReviewing ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-cyan-500 hover:bg-cyan-400 text-black'}`}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>SUBMIT EVALUATION <CheckCircle size={18} /></>
          )}
        </button>

      </div>
    </div>
  );
}