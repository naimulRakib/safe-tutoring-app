'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, MapPin, ShieldCheck, 
  Lock, Zap, Globe, Brain, 
  Smartphone, Database, LayoutGrid, EyeOff, 
  Activity, Server, Mic, HelpCircle, 
  AlertTriangle, CheckCircle, Siren, Star, Gavel 
} from 'lucide-react';

// --- SLIDE DATA & COMPONENTS ---

const slides = [
  { id: 'title', component: <TitleSlide /> },
  { id: 'problem', component: <ProblemSlide /> },
  { id: 'solution', component: <SolutionOverviewSlide /> },
  { id: 'workflow', component: <ThePerfectWorkflow /> }, // UPDATED
  { id: 'safety', component: <SafetyDeepDive /> },       // NEW
  { id: 'reviews', component: <ReviewSystemSlide /> },   // NEW
  { id: 'admin', component: <AdminCommandSlide /> },     // NEW
  { id: 'stack', component: <TechStackSlide /> },
  { id: 'pitch', component: <PitchScriptSlide /> },
  { id: 'wow', component: <WowFactorSlide /> }
];

// --- SLIDE COMPONENTS ---

function TitleSlide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in duration-700">
      <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-4 ring-1 ring-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        <LayoutGrid size={80} className="text-emerald-400" />
      </div>
      <div>
        <h1 className="text-7xl font-black tracking-tighter text-white mb-2">
          SCHOLAR<span className="text-emerald-400">GRID</span>
        </h1>
        <div className="flex justify-center gap-2">
          <span className="h-1 w-12 bg-emerald-500 rounded-full"></span>
          <span className="h-1 w-3 bg-emerald-500/50 rounded-full"></span>
        </div>
      </div>
      <p className="text-2xl text-zinc-400 font-light tracking-widest uppercase max-w-2xl mx-auto">
        The First <span className="text-white font-bold">Safe-OS</span> for Home Education.
      </p>
      <div className="mt-12 flex gap-4">
        <Badge text="PostGIS Radar" />
        <Badge text="Double-Lock Escrow" />
        <Badge text="Panic Protocol" />
      </div>
    </div>
  );
}

function ProblemSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-12">
      <h2 className="text-4xl font-bold text-red-400 mb-12 flex items-center gap-4">
        <AlertTriangle size={40} /> THE BLIND SPOTS
      </h2>
      <div className="grid grid-cols-3 gap-8">
        <ProblemCard 
          icon={<EyeOff size={40} />} 
          title="Physical Blindness" 
          desc="Parents invite strangers home with ZERO verification. Female tutors enter unknown houses with NO safety trace."
        />
        <ProblemCard 
          icon={<Activity size={40} />} 
          title="Logistical Chaos" 
          desc="Tutors travel 2+ hours for low pay because current platforms can't filter by 'Hyper-Local' clusters."
        />
        <ProblemCard 
          icon={<Lock size={40} />} 
          title="Trust Deficit" 
          desc="No contracts. Late payments. Fake reviews. It's an unorganized, informal economy ripe for fraud."
        />
      </div>
    </div>
  );
}

function SolutionOverviewSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-12">
      <h2 className="text-4xl font-bold text-emerald-400 mb-6">THE SCHOLARGRID ECOSYSTEM</h2>
      <p className="text-xl text-zinc-400 mb-12 max-w-3xl">We replaced "Classified Ads" with an <strong>Operating System</strong>.</p>
      
      <div className="grid grid-cols-2 gap-12">
        <SolutionPoint icon={<MapPin/>} title="1. Hyper-Local Radar" desc="PostGIS clustering filters tutors who are physically available in your 1km radius." />
        <SolutionPoint icon={<ShieldCheck/>} title="2. Privacy Shield" desc="Profiles are visible, but Contact Info is locked until a 'Digital Handshake' contract is signed." />
        <SolutionPoint icon={<Lock/>} title="3. Double-Lock Payment" desc="Funds held in Escrow. OTP 1 starts class. OTP 2 releases funds. Impossible to scam." />
        <SolutionPoint icon={<Siren/>} title="4. Active Defense" desc="Panic Button, Live GPS Trace, and a dedicated Admin Command Center for interventions." />
      </div>
    </div>
  );
}

function ThePerfectWorkflow() {
  const steps = [
    { title: "Discovery", desc: "Student uses AI Search. Map filters Tutors by GPS & Subject." },
    { title: "The Contract", desc: "Digital negotiation. Monthly Fee & Days locked in DB." },
    { title: "The Demo Class", desc: "Tutor arrives. Money locked in Escrow. OTP Check-in." },
    { title: "Execution", desc: "Class happens. Live Trace active for safety." },
    { title: "Completion", desc: "Student gives OTP. Funds released to Tutor." },
    { title: "Reputation", desc: "Verified Review System unlocks. Ratings update Public Profile." },
  ];

  return (
    <div className="h-full flex flex-col justify-center px-8 relative overflow-hidden">
      <div className="absolute right-0 top-0 opacity-10"><Server size={400}/></div>
      <h2 className="text-3xl font-bold text-cyan-400 mb-8 flex items-center gap-3 relative z-10">
        <Activity /> THE LIFECYCLE
      </h2>
      <div className="grid grid-cols-1 gap-3 relative z-10">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-4 bg-zinc-900/80 p-4 rounded-xl border border-white/5 hover:border-cyan-500/50 transition-all group">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-900/30 text-cyan-400 flex items-center justify-center font-bold text-sm group-hover:bg-cyan-500 group-hover:text-black transition-colors">
              {idx + 1}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm group-hover:text-cyan-400">{step.title}</h4>
              <p className="text-xs text-zinc-500 group-hover:text-zinc-300">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SafetyDeepDive() {
  return (
    <div className="h-full flex flex-col justify-center px-12 bg-red-950/10">
      <h2 className="text-4xl font-black text-red-500 mb-8 flex items-center gap-4">
        <Siren size={48} className="animate-pulse" /> PANIC PROTOCOL
      </h2>
      <div className="grid grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-red-900/50">
            <h3 className="text-xl font-bold text-white mb-2">1. The Threat Trigger</h3>
            <p className="text-zinc-400">If a tutor feels unsafe, they hold the <span className="text-red-400 font-bold">Panic Button</span> for 3 seconds. It works silently.</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-red-900/50">
            <h3 className="text-xl font-bold text-white mb-2">2. Live Trace Injection</h3>
            <p className="text-zinc-400">The system bypasses privacy filters. It injects the Tutor's <span className="text-red-400 font-bold">Real-Time GPS Lat/Lng</span> directly into the Admin Dashboard.</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-red-900/50">
            <h3 className="text-xl font-bold text-white mb-2">3. Auto-Notification</h3>
            <p className="text-zinc-400">Parents/Guardians receive an instant SMS with the location link. Security HQ gets a flashing red alert.</p>
          </div>
        </div>
        
        {/* Visual Mockup */}
        <div className="border-4 border-zinc-800 rounded-3xl p-4 bg-black relative">
          <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-80">
             <div className="w-32 h-32 rounded-full border-8 border-red-900 bg-red-600 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <Siren size={48} className="text-white"/>
             </div>
             <p className="text-red-500 font-black tracking-widest text-xl">SOS ACTIVE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminCommandSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-12">
      <h2 className="text-4xl font-bold text-orange-500 mb-8 flex items-center gap-4">
        <ShieldCheck size={40} /> ADMIN COMMAND CENTER
      </h2>
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-zinc-900 p-8 rounded-2xl border border-orange-900/30">
          <h3 className="text-2xl font-bold text-white mb-4">God-Mode Visibility</h3>
          <p className="text-zinc-400 leading-relaxed mb-6">
            Admins have a dedicated dashboard that connects via <strong>Supabase Realtime</strong>.
            They don't need to refresh. If a contract is signed, a review is flagged, or a panic button is pressed—it pops up instantly.
          </p>
          <ul className="space-y-3 text-orange-400/80 text-sm">
            <li className="flex items-center gap-2"><CheckCircle size={14}/> Resolve SOS Alerts</li>
            <li className="flex items-center gap-2"><CheckCircle size={14}/> Monitor Live GPS of Active Classes</li>
            <li className="flex items-center gap-2"><CheckCircle size={14}/> Override Disputes</li>
          </ul>
        </div>
        <div className="relative bg-black border border-zinc-800 rounded-xl overflow-hidden">
           {/* Mock UI */}
           <div className="absolute inset-0 flex flex-col">
              <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-4 space-y-3">
                 <div className="bg-red-950/20 border border-red-500/50 p-3 rounded text-red-400 text-xs font-mono">
                    [ALERT] USER_ID_992 TRIGGERED PANIC @ 23.8103, 90.4125
                 </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-3 rounded text-zinc-500 text-xs font-mono">
                    [LOG] Contract #442 Signed by Student_A
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ReviewSystemSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-12">
      <h2 className="text-4xl font-bold text-yellow-400 mb-8 flex items-center gap-4">
        <Star size={40} /> THE TRUST ENGINE
      </h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center">
          <Lock className="mx-auto mb-4 text-zinc-500" size={48} />
          <h3 className="font-bold text-xl text-white">Payment-Locked</h3>
          <p className="text-zinc-500 text-sm mt-2">
            You physically <strong>cannot</strong> leave a review until the system confirms the money has moved. Zero fake reviews.
          </p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center">
          <Gavel className="mx-auto mb-4 text-red-400" size={48} />
          <h3 className="font-bold text-xl text-white">The "Strike" System</h3>
          <p className="text-zinc-500 text-sm mt-2">
            Tutors can issue "Strikes" against abusive students. 3 Strikes = Ban. We protect the workers, not just the customers.
          </p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center">
          <LayoutGrid className="mx-auto mb-4 text-blue-400" size={48} />
          <h3 className="font-bold text-xl text-white">Public Ledger</h3>
          <p className="text-zinc-500 text-sm mt-2">
            Reviews appear instantly on public profiles. Good behavior is gamified and rewarded with higher visibility.
          </p>
        </div>
      </div>
    </div>
  );
}

function TechStackSlide() {
  return (
    <div className="h-full flex flex-col justify-center px-12">
      <h2 className="text-4xl font-bold text-white mb-12">THE POWER STACK</h2>
      <div className="grid grid-cols-4 gap-6">
        <TechCard icon={<Globe className="text-blue-400"/>} title="Next.js 14" desc="Server Actions & App Router"/>
        <TechCard icon={<Database className="text-emerald-400"/>} title="Supabase" desc="Postgres, Auth & Realtime"/>
        <TechCard icon={<MapPin className="text-purple-400"/>} title="PostGIS + Leaflet" desc="Geospatial Query Engine"/>
        <TechCard icon={<Smartphone className="text-pink-400"/>} title="HTML5 Geolocation" desc="High-Accuracy Device GPS"/>
      </div>
    </div>
  );
}

function PitchScriptSlide() {
  return (
    <div className="h-full grid grid-cols-2 gap-8 px-8">
      <div className="bg-black border border-zinc-800 rounded-xl p-6 h-full overflow-y-auto custom-scrollbar">
        <h3 className="text-emerald-500 font-mono mb-4 flex items-center gap-2 sticky top-0 bg-black py-2"><Mic size={18}/> THE 3-MINUTE PITCH</h3>
        <div className="space-y-6 text-zinc-300 text-sm leading-relaxed">
          <p><strong>1. The Hook:</strong> "Home tutoring is unsafe and disorganized. We fixed it."</p>
          <p><strong>2. The Tech:</strong> "We use PostGIS to map the city into zones. A student in Uttara only sees tutors in Uttara."</p>
          <p><strong>3. The Safety:</strong> "Show them the Panic Button. Explain how it injects live coordinates into the Admin Dashboard."</p>
          <p><strong>4. The Trust:</strong> "Explain the 'Double-Lock'. Money is held in escrow. Code 1 starts class. Code 2 pays the tutor. No scams."</p>
          <p><strong>5. The Close:</strong> "We aren't just an app. We are the regulatory infrastructure for the gig economy."</p>
        </div>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full overflow-y-auto">
        <h3 className="text-yellow-500 font-mono mb-4 flex items-center gap-2"><HelpCircle size={18}/> Q&A PREP</h3>
        <div className="space-y-4">
          <QACard q="Why not just use Facebook?" a="Facebook has no verification, no location sorting, and no payment protection. We have all three."/>
          <QACard q="How do you verify users?" a="University Email matching + NID verification logic on the backend."/>
          <QACard q="Is the map live?" a="Yes. We use Leaflet with real-time GPS observers. If a tutor moves, their marker moves."/>
        </div>
      </div>
    </div>
  );
}

function WowFactorSlide() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-12">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-20"></div>
        <ShieldCheck size={120} className="text-emerald-400 relative z-10" />
      </div>
      <h2 className="text-5xl font-black text-white mb-6">THE FINAL VERDICT</h2>
      <p className="text-2xl text-zinc-300 max-w-3xl">
        We didn't just build a "Tutor Finder". <br/>
        <span className="text-emerald-400 font-bold">We built a Digital Security Firm that happens to teach.</span>
      </p>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const Badge = ({ text }: { text: string }) => (
  <span className="px-4 py-2 rounded-full border border-zinc-800 text-zinc-500 text-sm bg-zinc-900/50">
    {text}
  </span>
);

const ProblemCard = ({ icon, title, desc }: any) => (
  <div className="bg-zinc-900/50 p-8 rounded-2xl border border-red-900/30 hover:bg-zinc-900 transition-colors">
    <div className="text-zinc-500 mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-zinc-400 text-sm">{desc}</p>
  </div>
);

const SolutionPoint = ({ icon, title, desc }: any) => (
  <div className="flex gap-4">
    <div className="p-3 bg-emerald-900/20 rounded-lg h-fit text-emerald-400">{icon}</div>
    <div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-zinc-400 text-sm mt-1">{desc}</p>
    </div>
  </div>
);

const TechCard = ({ icon, title, desc }: any) => (
  <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center hover:border-emerald-500/30 transition-colors">
    <div className="mx-auto mb-4 w-fit">{icon}</div>
    <h3 className="font-bold text-xl">{title}</h3>
    <p className="text-zinc-500 text-sm mt-2">{desc}</p>
  </div>
);

const QACard = ({ q, a }: { q: string, a: string }) => (
  <div className="bg-black/50 p-4 rounded-lg">
    <p className="text-xs text-zinc-500 font-bold mb-1">Q: {q}</p>
    <p className="text-sm text-zinc-300">"{a}"</p>
  </div>
);

// --- MAIN PAGE ---

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') setCurrentSlide(prev => Math.max(prev - 1, 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-full bg-[#050505] text-white font-sans overflow-hidden relative selection:bg-emerald-500 selection:text-black">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-300 z-50" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />

      {/* Slide Container */}
      <div className="h-full w-full flex items-center justify-center p-8">
        <div className="w-full max-w-7xl h-[85vh] relative animate-in fade-in zoom-in-95 duration-500 key={currentSlide}">
          {slides[currentSlide].component}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex items-center gap-4 z-50">
        <span className="text-zinc-500 font-mono text-sm">{currentSlide + 1} / {slides.length}</span>
        <button onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))} disabled={currentSlide === 0} className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 transition disabled:opacity-50 border border-zinc-800"><ChevronLeft size={20} /></button>
        <button onClick={() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))} disabled={currentSlide === slides.length - 1} className="p-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition disabled:opacity-50 font-bold"><ChevronRight size={20} /></button>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/10 blur-[120px] rounded-full" />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
    </div>
  );
}