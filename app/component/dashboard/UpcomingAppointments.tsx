"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, PlayCircle, User, Loader2 } from 'lucide-react';

interface UpcomingProps {
  userId: string;
  onOpenChat: (partnerId: string) => void; // Added this line
}

export default function UpcomingAppointments({ userId, onOpenChat }: UpcomingProps) {
  const supabase = createClient();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      // Fetch appointments where status is confirmed
      // We also join 'applications' to get the partner's info
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          application:application_id (
            sender_id,
            receiver_id,
            sender:sender_id(username, role),
            receiver:receiver_id(username, role)
          )
        `)
        .eq('status', 'confirmed')
        // Filter out completed ones if you want, or keep them for history
        .neq('session_status', 'completed') 
        .order('proposed_date', { ascending: true });

      if (data) {
        setAppointments(data);
      }
      setLoading(false);
    };

    fetchAppointments();
    
    // Realtime subscription to auto-update when a new appt is confirmed
    const channel = supabase.channel('my-appointments')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, 
      () => fetchAppointments())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
        <Calendar className="text-black"/> Your Schedule
      </h3>

      {appointments.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">No upcoming classes.</p>
        </div>
      )}

      {appointments.map((appt) => {
        // Determine Partner Name
        const isSender = appt.application.sender_id === userId;
        const partner = isSender ? appt.application.receiver : appt.application.sender;
        
        // Time Logic
        const meetingTime = new Date(appt.proposed_date);
        const now = new Date();
        // Allow joining 10 minutes before
        const canJoin = now.getTime() >= (meetingTime.getTime() - 10 * 60000); 
        const isOngoing = appt.session_status === 'ongoing';

        return (
          <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            
            {/* Status Strip */}
            <div className={`absolute top-0 left-0 w-1 h-full ${isOngoing ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>

            <div className="flex justify-between items-start mb-3 pl-3">
              <div>
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <User size={14}/> {partner?.username || "Partner"}
                </h4>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock size={12}/> {meetingTime.toLocaleDateString()} at {meetingTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              
              {/* Status Badge */}
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                isOngoing ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
              }`}>
                {isOngoing ? 'Live Now' : 'Confirmed'}
              </span>
            </div>

            {/* Location Info */}
            <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-4 pl-3 flex items-center gap-2">
               <MapPin size={12}/> 
               {appt.final_location_lat ? "Location Shared via GPS" : "Location shared in chat"}
            </div>

            {/* ACTION BUTTON */}
            <div className="pl-3">
              {canJoin ? (
                <button 
                  onClick={() => router.push(`/session/${appt.id}`)}
                  className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all
                    ${isOngoing 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                      : 'bg-black hover:bg-zinc-800 text-white'}`}
                >
                  <PlayCircle size={16} /> 
                  {isOngoing ? 'RETURN TO SESSION' : 'START SESSION & VERIFY'}
                </button>
              ) : (
                <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-lg text-xs cursor-not-allowed">
                  Starts in {Math.ceil((meetingTime.getTime() - now.getTime()) / (1000 * 60 * 60))} hours
                </button>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}