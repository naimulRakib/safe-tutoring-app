'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Star, Calendar, CheckCircle, User, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import ReviewModal from './ReviewModal';

export default function ReviewManager() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        console.log("👤 Logged in User:", user.id);

        // 1. Fetch Paid Appointments
        // We select the application details to find out who the partner is
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            application:application_id (
              id,
              sender_id,
              receiver_id
            ),
            reviews ( id ) 
          `)
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false });

        if (error) console.error("❌ Fetch Error:", error);

        if (data) {
          // 2. Filter & Map Logic
          const validAppointments = data.map((appt: any) => {
            const app = appt.application;
            if (!app) return null;

            // Determine Roles based on Sender/Receiver
            let isMyAppointment = false;
            let studentIdToReview = "";

            // SCENARIO A: I am the Sender (Tutor applied to Student)
            if (app.sender_id === user.id) {
              isMyAppointment = true;
              studentIdToReview = app.receiver_id;
            } 
            // SCENARIO B: I am the Receiver (Student applied to Me)
            else if (app.receiver_id === user.id) {
              isMyAppointment = true;
              studentIdToReview = app.sender_id;
            }

            if (!isMyAppointment) return null;

            return { ...appt, studentIdToReview };
          }).filter(Boolean); // Remove nulls

          // 3. Fetch Student Names manually (since we can't easily join on dynamic IDs)
          // We get all student IDs and fetch their profiles
          const studentIds = validAppointments.map((a: any) => a.studentIdToReview);
          
          if (studentIds.length > 0) {
            // Try fetching from 'students' table first, fallback to 'profiles' if needed
            const { data: students } = await supabase
              .from('students') // OR 'profiles' depending on where names are
              .select('id, full_name, username') // Check your column names! usually 'full_name' or 'username'
              .in('id', studentIds);

            // Merge names back into appointments
            const finalData = validAppointments.map((appt: any) => {
              const studentInfo = students?.find(s => s.id === appt.studentIdToReview);
              return { 
                ...appt, 
                studentName: studentInfo?.full_name || studentInfo?.username || "Student" 
              };
            });
            
            setAppointments(finalData);
          } else {
            setAppointments([]);
          }
        }
      }
      setLoading(false);
    };

    init();
  }, []);

  if (loading) return (
    <div className="p-10 text-center flex flex-col items-center justify-center text-zinc-500 gap-2">
      <Loader2 className="animate-spin text-emerald-500" />
      <span className="text-xs font-mono">Syncing Records...</span>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Star className="text-yellow-500" /> Review Center
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Evaluate students after payment.</p>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {appointments.length === 0 ? (
          <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center flex flex-col items-center">
            <AlertCircle size={32} className="text-zinc-600 mb-3" />
            <p className="text-zinc-400 font-bold">No Paid Sessions Found</p>
          </div>
        ) : (
          appointments.map((appt) => {
            const hasReviewed = appt.reviews && appt.reviews.length > 0;

            return (
              <div key={appt.id} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-zinc-600">
                
                {/* Left: Info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-700">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{appt.studentName}</h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1.5">
                      <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
                        <Calendar size={12}/> {new Date(appt.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">
                        <DollarSign size={12}/> PAID
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Action */}
                <div className="w-full md:w-auto">
                  {hasReviewed ? (
                    <button disabled className="w-full md:w-auto px-6 py-3 rounded-xl bg-zinc-900 text-zinc-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-zinc-800">
                      <CheckCircle size={16} /> ALREADY REVIEWED
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowModal({
                        appointmentId: appt.id,
                        reviewerId: user.id,
                        revieweeId: appt.studentIdToReview,
                        role: 'tutor'
                      })}
                      className="w-full md:w-auto px-8 py-3 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-400 hover:scale-105 transition-all shadow-lg shadow-black/50"
                    >
                      <Star size={16} className="fill-black" /> RATE STUDENT
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ReviewModal 
          {...showModal} 
          onClose={() => setShowModal(null)}
          onSuccess={() => {
            alert("Review Submitted Successfully!");
            window.location.reload(); 
          }}
        />
      )}

    </div>
  );
}