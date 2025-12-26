"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { CalendarClock, CheckCircle2, XCircle, Clock, MapPin, ArrowLeft, Loader2, Send, Navigation } from 'lucide-react';

interface SchedulerProps {
  applicationId: string;
  userId: string;
  myRole: string;
  onBack: () => void;
}

export default function AppointmentScheduler({ applicationId, userId, myRole, onBack }: SchedulerProps) {
  const supabase = createClient();
  const [appt, setAppt] = useState<any>(null);
  const [dateInput, setDateInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // 1. REAL-TIME SYNC
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('appointments').select('*').eq('application_id', applicationId).single();
      
      if (data) {
        setAppt(data);
      } else {
        // Create initial record if missing
        const { data: n } = await supabase
          .from('appointments')
          .insert({ application_id: applicationId, status: 'negotiating' })
          .select()
          .single();
        setAppt(n);
      }
    };
    fetch();

    const channel = supabase.channel(`appt-${applicationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `application_id=eq.${applicationId}` }, 
      (payload) => {
          console.log("Realtime Update:", payload.new);
          setAppt(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [applicationId, supabase]);

  // 2. PROPOSE / RESCHEDULE
  const handlePropose = async () => {
    if (!dateInput) return;
    setLoading(true);

    // Convert local input to UTC ISO string for DB
    const isoDate = new Date(dateInput).toISOString();

    const { data, error } = await supabase.from('appointments').update({
      proposed_date: isoDate,
      proposed_by: userId,
      student_agreed: myRole === 'student', // If I propose it, I agree to it
      tutor_agreed: myRole === 'tutor',     
      status: 'negotiating',
      // Reset locations on reschedule
      student_lat: null, student_lng: null, tutor_lat: null, tutor_lng: null
    })
    .eq('id', appt.id)
    .select() // Important: Return the updated row
    .single();

    if (error) console.error("Update failed:", error);
    if (data) setAppt(data); // Force update local state
    
    setLoading(false);
  };

  // 3. INITIAL CONFIRM (Agreement Step)
  const handleAcceptTime = async () => {
    setLoading(true);
    
    // Determine who is agreeing
    const updateField = myRole === 'student' ? { student_agreed: true } : { tutor_agreed: true };
    
    // Check if the OTHER person has already agreed
    const otherAgreed = myRole === 'student' ? appt.tutor_agreed : appt.student_agreed;
    
    let finalStatus = 'negotiating';
    if (otherAgreed) {
      finalStatus = 'confirmed'; // Both have now agreed
    }

    const { data, error } = await supabase.from('appointments').update({ 
      ...updateField, 
      status: finalStatus 
    })
    .eq('id', appt.id)
    .select()
    .single();

    if (error) console.error("Accept failed:", error);
    if (data) setAppt(data);

    setLoading(false);
  };

  // 4. SHARE EXACT GPS LOCATION
  const handleShareLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("GPS not supported");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const updateData = myRole === 'student' 
        ? { student_lat: lat, student_lng: lng } 
        : { tutor_lat: lat, tutor_lng: lng };

      await supabase.from('appointments')
        .update(updateData)
        .eq('id', appt.id)
        .select(); // Ensure we trigger a refresh

      setGpsLoading(false);
    }, (err) => {
      console.error(err);
      alert("Unable to retrieve location. Please allow GPS access.");
      setGpsLoading(false);
    });
  };

  // 5. CANCEL
  const handleCancel = async () => {
    if(!confirm("Cancel appointment? This will clear current progress.")) return;
    
    const { data } = await supabase.from('appointments').update({ 
      status: 'cancelled', 
      student_agreed: false, 
      tutor_agreed: false 
    })
    .eq('id', appt.id)
    .select()
    .single();

    if (data) setAppt(data);
  };

  if (!appt) return <div className="p-4 text-center text-xs text-gray-500 animate-pulse">Loading Schedule...</div>;

  // --- VIEW VARIABLES ---
  const myLat = myRole === 'student' ? appt.student_lat : appt.tutor_lat;
  const theirLat = myRole === 'student' ? appt.tutor_lat : appt.student_lat;
  const theirLng = myRole === 'student' ? appt.tutor_lng : appt.student_lng;
  const isMyProposal = appt.proposed_by === userId;

  return (
    <div className="h-full flex flex-col bg-[#111] text-white font-sans">
      
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-emerald-900/10">
        <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full text-gray-300">
          <ArrowLeft size={16} />
        </button>
        <span className="font-bold text-xs tracking-wider uppercase text-emerald-100">
          {appt.status === 'confirmed' ? 'Location Exchange' : 'Set Appointment'}
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        
        {/* === STATE: CANCELLED === */}
        {appt.status === 'cancelled' && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-red-400 font-bold text-sm">CANCELLED</h3>
            <p className="text-[10px] text-red-300 mt-2 mb-4">You can reschedule to restart the process.</p>
            
            {/* Reschedule Input */}
            <div className="flex flex-col gap-2">
               <input 
                type="datetime-local" 
                className="w-full bg-black/50 border border-red-500/30 rounded p-2 text-xs text-white"
                onChange={(e) => setDateInput(e.target.value)}
              />
              <button onClick={handlePropose} disabled={!dateInput} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs py-2 rounded font-bold">
                RESCHEDULE
              </button>
            </div>
          </div>
        )}

        {/* === STATE: CONFIRMED (Location Phase) === */}
        {appt.status === 'confirmed' && (
          <div className="space-y-4 animate-in zoom-in">
            
            <div className="bg-emerald-900/20 border border-emerald-500/40 p-3 rounded-xl text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <h3 className="text-emerald-400 font-bold text-sm">TIME CONFIRMED</h3>
              <p className="text-white text-xs font-mono mt-1">
                {appt.proposed_date ? new Date(appt.proposed_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Date Error"}
              </p>
            </div>

            {/* MY LOCATION STATUS */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Step 1: Share Your Location</p>
              {myLat ? (
                 <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-900/20 p-2 rounded">
                    <CheckCircle2 size={14}/> Location Sent Successfully
                 </div>
              ) : (
                 <button 
                   onClick={handleShareLocation}
                   disabled={gpsLoading}
                   className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                 >
                   {gpsLoading ? <Loader2 className="animate-spin" size={14}/> : <Navigation size={14}/>} 
                   SHARE EXACT GPS
                 </button>
              )}
            </div>

            {/* THEIR LOCATION STATUS */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Step 2: Their Location</p>
              {theirLat ? (
                <div>
                   <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300 mb-3">
                      <div className="bg-black/30 p-1.5 rounded text-center">LAT: {theirLat.toFixed(4)}</div>
                      <div className="bg-black/30 p-1.5 rounded text-center">LNG: {theirLng.toFixed(4)}</div>
                   </div>
                   <a 
                     href={`https://www.google.com/maps/search/?api=1&query=${theirLat},${theirLng}`} 
                     target="_blank" 
                     rel="noreferrer"
                     className="block text-center bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2 rounded text-xs transition-colors"
                   >
                     OPEN IN GOOGLE MAPS 
                   </a>
                </div>
              ) : (
                <div className="text-xs text-yellow-500/80 flex items-center gap-2 bg-yellow-500/10 p-2 rounded">
                   <Loader2 size={12} className="animate-spin"/> Waiting for partner...
                </div>
              )}
            </div>

            <button onClick={handleCancel} className="w-full text-center text-[10px] text-red-400 hover:text-red-300 mt-4 underline decoration-red-900">
              Cancel Appointment
            </button>
          </div>
        )}

        {/* === STATE: NEGOTIATING === */}
        {appt.status === 'negotiating' && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
            {/* CURRENT PROPOSAL CARD */}
            {appt.proposed_date ? (
              <div className="mb-6 bg-black/40 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-gray-400 mb-2 uppercase font-bold tracking-wider">
                  {isMyProposal ? "You Proposed:" : "Current Proposal:"}
                </p>
                <div className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-emerald-400"/> 
                  {new Date(appt.proposed_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                
                {!isMyProposal ? (
                  <button 
                    onClick={handleAcceptTime} 
                    disabled={loading} 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/20 transition-all"
                  >
                    {loading ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={14} />} 
                    ACCEPT THIS TIME
                  </button>
                ) : (
                  <div className="text-[10px] text-yellow-500 flex items-center justify-center gap-1.5 bg-yellow-900/10 p-1.5 rounded">
                     <Loader2 size={10} className="animate-spin"/> Waiting for response...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-white/10 rounded-xl mb-6">
                <CalendarClock className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                <p className="text-xs text-gray-400">No time proposed yet.</p>
              </div>
            )}

            {/* NEW PROPOSAL FORM */}
            <div className="pt-4 border-t border-white/10">
              <label className="text-[9px] text-gray-400 font-bold mb-2 block uppercase tracking-wider">
                {appt.proposed_date ? "Propose Different Time" : "Propose a Time"}
              </label>
              <input 
                type="datetime-local" 
                className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-xs text-white mb-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                onChange={(e) => setDateInput(e.target.value)}
              />
              <button 
                onClick={handlePropose} 
                disabled={!dateInput || loading} 
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-lg text-xs border border-white/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={12}/> : <Send size={12}/>} 
                {appt.proposed_date ? 'SEND COUNTER-OFFER' : 'SEND PROPOSAL'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}