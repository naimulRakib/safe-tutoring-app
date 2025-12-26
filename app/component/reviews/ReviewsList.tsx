'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Star, AlertTriangle, User, MessageSquare, Loader2 } from 'lucide-react';

// --- 1. TYPE DEFINITIONS (Prevents Red Lines) ---
interface Review {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  is_strike: boolean;
  created_at: string;
  reviewerName?: string; // Optional field we add manually
}

export default function ReviewSection({ targetUserId }: { targetUserId: string }) {
  const supabase = createClient();
  
  // --- STATE ---
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ average: 0, count: 0, strikes: 0 });
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchReviews = async () => {
      // A. Get Reviews
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', targetUserId)
        .order('created_at', { ascending: false });

      if (data) {
        // Cast data to our Type
        const rawReviews = data as Review[];

        // B. Fetch Reviewer Names (Manual Join)
        // We do this to avoid complex SQL joins if you have separate 'students'/'tutors' tables
        const reviewerIds = rawReviews.map(r => r.reviewer_id);
        const nameMap: Record<string, string> = {};

        if (reviewerIds.length > 0) {
          // Check 'students' table
          const { data: students } = await supabase
            .from('students')
            .select('id, username, full_name')
            .in('id', reviewerIds);
          
          // Check 'tutors' table
          const { data: tutors } = await supabase
            .from('tutors')
            .select('id, username, full_name') // Ensure your table has these columns, or adjust to 'basic_info'
            .in('id', reviewerIds);

          // Combine results
          [...(students || []), ...(tutors || [])].forEach((u: any) => {
             // Handle JSONB 'basic_info' if necessary, or direct columns
             const name = u.username || u.full_name || (u.basic_info?.full_name) || "User";
             nameMap[u.id] = name;
          });
        }

        // C. Combine Data
        const finalReviews = rawReviews.map(r => ({
          ...r,
          reviewerName: nameMap[r.reviewer_id] || "Anonymous User"
        }));

        setReviews(finalReviews);

        // D. Calculate Stats
        const totalRating = finalReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = finalReviews.length > 0 ? (totalRating / finalReviews.length) : 0;
        const strikeCount = finalReviews.filter(r => r.is_strike).length;

        setStats({
          average: Number(avg.toFixed(1)),
          count: finalReviews.length,
          strikes: strikeCount
        });
      }
      setLoading(false);
    };

    if (targetUserId) fetchReviews();
  }, [targetUserId]);

  // --- RENDER ---

  if (loading) return (
    <div className="flex justify-center p-10">
      <Loader2 className="animate-spin text-zinc-600" />
    </div>
  );

  return (
    <div className="w-full space-y-6">
      
      {/* 1. STATS DASHBOARD */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        
        {/* Rating Block */}
        <div className="flex items-center gap-5">
          <div className="text-center">
            <span className="text-5xl font-black text-white">{stats.average}</span>
            <span className="text-[10px] text-zinc-500 block uppercase tracking-wide font-bold mt-1">Rating</span>
          </div>
          
          <div className="h-10 w-px bg-zinc-800 hidden sm:block"></div>
          
          <div>
            <div className="flex text-emerald-500 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={16} 
                  className={star <= Math.round(stats.average / 2) ? "fill-emerald-500" : "text-zinc-700 fill-zinc-800"} 
                />
              ))}
            </div>
            <p className="text-xs text-zinc-400 font-mono font-bold">Based on {stats.count} reviews</p>
          </div>
        </div>

        {/* Strike Block (Only if exists) */}
        {stats.strikes > 0 && (
          <div className="flex flex-col items-center sm:items-end text-red-500 bg-red-950/20 px-4 py-2 rounded-xl border border-red-900/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} />
              <span className="font-black text-lg">{stats.strikes}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Negative Strikes</span>
          </div>
        )}
      </div>

      {/* 2. REVIEWS LIST */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
            <MessageSquare className="mx-auto text-zinc-700 mb-3" size={32} />
            <p className="text-zinc-500 text-sm font-medium">No reviews yet.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-black border border-zinc-800 p-5 rounded-2xl transition-all hover:border-zinc-700">
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                    <User size={16} className="text-zinc-500"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{review.reviewerName}</p>
                    <p className="text-[10px] text-zinc-600 font-mono">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <Star size={12} className="text-emerald-500 fill-emerald-500" />
                  <span className="text-xs font-black text-emerald-500">{review.rating}/10</span>
                </div>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed pl-1 italic">
                "{review.comment}"
              </p>

              {review.is_strike && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-red-950/20 border border-red-900/30 rounded-lg">
                  <AlertTriangle size={12} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">
                    Negative Strike Issued
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}