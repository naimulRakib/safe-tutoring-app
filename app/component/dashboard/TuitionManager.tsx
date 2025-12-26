'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { 
  QrCode, Scan, CheckCircle, Lock, RefreshCw, 
  CreditCard, Calendar, Loader2, User 
} from 'lucide-react';
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

export default function TuitionManager({ userId }: { userId: string }) {
  const supabase = createClient();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  
  // Handshake State
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [handshakeLoading, setHandshakeLoading] = useState(false);

  // --- 1. MANUAL FETCH & MERGE (FIXED) ---
  useEffect(() => {
    // 👇 FIXED: Removed space in name (was 'fetchContractsAnd profiles')
    const fetchContracts = async () => {
      console.log("🔍 Fetching Contracts manually...");

      // A. Get Raw Contracts
      const { data: rawContracts, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('status', 'active')
        .or(`tutor_id.eq.${userId},student_id.eq.${userId}`);

      if (error) {
        console.error("❌ Contract Error:", error);
        setLoading(false);
        return;
      }

      if (!rawContracts || rawContracts.length === 0) {
        setContracts([]);
        setLoading(false);
        return;
      }

      // B. Collect all IDs involved
      const tutorIds = rawContracts.map(c => c.tutor_id);
      const studentIds = rawContracts.map(c => c.student_id);
      const allIds = [...new Set([...tutorIds, ...studentIds])];

      // C. Fetch Profiles Manually
      const { data: tutors } = await supabase.from('tutors').select('id, basic_info').in('id', allIds);
      const { data: students } = await supabase.from('students').select('id, basic_info').in('id', allIds);

      // D. Create a Lookup Map
      const nameMap: Record<string, any> = {};

      [...(tutors || []), ...(students || [])].forEach((user: any) => {
        let name = "Unknown";
        if (user.basic_info) {
          const info = typeof user.basic_info === 'string' ? JSON.parse(user.basic_info) : user.basic_info;
          name = info.full_name || info.username || "Partner";
        }
        nameMap[user.id] = name;
      });

      // E. Attach Names
      const enrichedContracts = rawContracts.map(c => ({
        ...c,
        tutor_name: nameMap[c.tutor_id] || "Unknown Tutor",
        student_name: nameMap[c.student_id] || "Unknown Student"
      }));

      setContracts(enrichedContracts);
      setLoading(false);
    };

    // 👇 FIXED: Called the corrected function name
    if (userId) fetchContracts();
  }, [userId]);

  // --- 2. GENERATE QR ---
  const handleGenerateQR = (contractId: string) => {
    const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedQR(sessionCode); 
  };

  // --- 3. VERIFY ATTENDANCE ---
  const handleVerifyAttendance = async () => {
    if (!selectedContract || !inputCode) return;
    setHandshakeLoading(true);

    const { error: logError } = await supabase.from('attendance_logs').insert({
      contract_id: selectedContract.id,
      verified_by_student: true,
      otp_used: inputCode
    });

    if (logError) {
      alert("Error: " + logError.message);
      setHandshakeLoading(false);
      return;
    }

    const newCount = (selectedContract.classes_completed || 0) + 1;
    const isPayDue = newCount % 8 === 0; 

    await supabase.from('contracts').update({
      classes_completed: newCount,
      payment_due: isPayDue
    }).eq('id', selectedContract.id);

    alert(`Success! Class ${newCount} Recorded.`);
    window.location.reload(); 
  };

  // --- 4. MOCK PAYMENT ---
  const handlePayment = async () => {
    if (!confirm("Proceed to Payment Gateway?")) return;
    setHandshakeLoading(true);

    await supabase.from('contracts').update({
      payment_due: false,
      last_payment_date: new Date().toISOString()
    }).eq('id', selectedContract.id);

    alert("Payment Confirmed. Cycle Unlocked.");
    window.location.reload();
  };

  if (loading) return <div className="p-8 text-center text-zinc-500"><Loader2 className="animate-spin mx-auto"/></div>;

  return (
    <div className="w-full space-y-6">
      
      {/* LIST VIEW */}
      {!selectedContract ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contracts.length === 0 ? (
             <div className="col-span-2 p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500">
               <p>No active tuitions found.</p>
             </div>
          ) : (
            contracts.map(c => {
              const amIStudent = c.student_id === userId;
              const partnerName = amIStudent ? c.tutor_name : c.student_name;
              const progress = (c.classes_completed % 8) || 0;
              
              return (
                <div key={c.id} onClick={() => setSelectedContract({...c, amIStudent})} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-emerald-500/50 cursor-pointer transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <User size={18} className="text-emerald-500"/>
                        {partnerName}
                      </h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                        {c.subjects?.[0] || "Tuition"} • {c.days_per_week} Days/Wk
                      </p>
                    </div>
                    {c.payment_due && <span className="px-3 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold rounded-full animate-pulse border border-red-500/50">PAYMENT DUE</span>}
                  </div>
                  
                  <div className="mb-2 flex justify-between text-xs font-bold text-zinc-400 relative z-10">
                    <span>Cycle Progress</span>
                    <span className="text-white">{progress}/8 Classes</span>
                  </div>
                  <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-zinc-800 relative z-10">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(progress / 8) * 100}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // --- ACTION VIEW ---
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-right-4">
          <button onClick={() => setSelectedContract(null)} className="text-xs text-zinc-500 hover:text-white mb-6 flex items-center gap-1">← Back to List</button>

          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {selectedContract.payment_due ? "PAYMENT LOCKED" : "CLASSROOM MODE"}
              </h2>
              <p className="text-zinc-500 text-sm mt-1">
                {selectedContract.payment_due 
                  ? "8 Classes completed. Payment required."
                  : "Verify attendance to log today's class."}
              </p>
            </div>

            <div className="w-full max-w-sm bg-black p-8 rounded-3xl border border-zinc-800 relative overflow-hidden">
              {selectedContract.payment_due ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/50">
                    <Lock size={32} />
                  </div>
                  <div className="space-y-2">
                     <p className="text-3xl font-mono text-white">৳{selectedContract.monthly_fee}</p>
                     <p className="text-xs text-zinc-500 uppercase">Due for 8 Classes</p>
                  </div>
                  {selectedContract.amIStudent ? (
                    <button 
                      onClick={handlePayment}
                      disabled={handshakeLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      {handshakeLoading ? <Loader2 className="animate-spin"/> : <CreditCard size={18}/>}
                      PAY NOW
                    </button>
                  ) : (
                    <div className="p-3 bg-red-900/10 text-red-400 text-xs rounded border border-red-900/30">
                      Waiting for Student Payment...
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {!selectedContract.amIStudent ? (
                    <div className="space-y-4">
                      {generatedQR ? (
                        <div className="bg-white p-4 rounded-xl mx-auto w-fit animate-in zoom-in">
                          <QRCode value={generatedQR} size={150} />
                          <p className="text-black font-mono font-bold text-xl mt-2 tracking-widest">{generatedQR}</p>
                        </div>
                      ) : (
                        <button onClick={() => handleGenerateQR(selectedContract.id)} className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200">
                          <QrCode size={18}/> GENERATE QR
                        </button>
                      )}
                      <p className="text-[10px] text-zinc-500">Show this to student.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Scan className="absolute left-4 top-4 text-zinc-500" size={20} />
                        <input 
                          type="number" 
                          placeholder="Enter QR Code"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-4 pl-12 pr-4 text-white text-center font-mono text-lg tracking-widest focus:border-emerald-500 outline-none"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value)}
                        />
                      </div>
                      <button onClick={handleVerifyAttendance} disabled={!inputCode || handshakeLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                        {handshakeLoading ? <Loader2 className="animate-spin"/> : <CheckCircle size={18}/>}
                        CONFIRM
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-8 text-zinc-500 text-xs font-mono">
               <div className="flex items-center gap-2">
                 <RefreshCw size={12}/> Cycle: {Math.floor(selectedContract.classes_completed / 8) + 1}
               </div>
               <div className="flex items-center gap-2">
                 <Calendar size={12}/> Last: {selectedContract.last_payment_date ? new Date(selectedContract.last_payment_date).toLocaleDateString() : 'N/A'}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}