"use client";

import React, { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Loader2, Navigation, List, X, Sparkles, Flame, ShieldCheck, BookOpen, Banknote } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { createClient } from '@/app/utils/supabase/client';

// --- IMPORTS FROM COMPONENTS ---
import { tutorIcon, studentIcon, verifiedTutorIcon, calculateDistributedPoints } from './map/MapUtils';
import RadarSidebar from './map/RadarSide';// Ensure this path is correct

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

// --- MAP CONTROLLER ---
const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
};

// --- INTERFACE DEFINITION ---
interface MapDisplayProps {
  myRole: string; 
  highlightedUsers?: any[] | null; 
  currentUserLocation?: any | null;
  onLocationFound?: (loc: { lat: number; lng: number }) => void;
  // Make sure this matches what you pass from the parent
  onContactUser?: (user: any) => void; 
}

const MapDisplay: FC<MapDisplayProps> = ({ myRole, highlightedUsers, onLocationFound, onContactUser, currentUserLocation }) => {
  const supabase = createClient();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]);
  const [gpsStatus, setGpsStatus] = useState<'IDLE' | 'SCANNING' | 'ANALYZING'>('IDLE');
  
  // --- CORE DATA STATE ---
  const [allFetchedData, setAllFetchedData] = useState<any[]>([]);
  const [showListPanel, setShowListPanel] = useState(false);
  const [smartFilter, setSmartFilter] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if(data.user) setSessionUserId(data.user.id); });
  }, [supabase]);

  // 👇👇👇 SYNC WITH PARENT (DASHBOARD) 👇👇👇
  // If Dashboard sends strictly filtered users, use them immediately
  // This OVERRIDES any internal fetching logic.
  useEffect(() => {
    if (highlightedUsers && highlightedUsers.length > 0) {
        setAllFetchedData(highlightedUsers);
        
        // Auto Center on first match if valid
        const valid = highlightedUsers.find(u => (u.lat || u.latitude) && (u.lng || u.longitude));
        if (valid && !userLoc) {
            setMapCenter([valid.lat || valid.latitude, valid.lng || valid.longitude]);
        }
    }
  }, [highlightedUsers, userLoc]);


  // --- 1. CORE RADAR LOGIC (HANDLES BOTH) ---
  const syncRadar = useCallback(async (lat: number, lng: number) => {
    if (!sessionUserId) return;
    
    // 🛑 Optimization: If highlightedUsers is provided by parent, DO NOT fetch internally.
    if (highlightedUsers && highlightedUsers.length > 0) return;

    try {
      let data: any[] = [];
      let areaToSearch = "Dhaka"; 

      // 1. Determine Area (For Text Match)
      const { data: st } = await supabase.from(myRole === 'student' ? 'students' : 'tutors').select('primary_area').eq('id', sessionUserId).single();
      if (st?.primary_area) areaToSearch = st.primary_area; // Use saved area if available

      console.log(`📡 RADAR: Role=${myRole}, Area="${areaToSearch}", GPS=${lat},${lng}`);

      if (myRole === 'student') {
        // --- STUDENT SEARCHING FOR TUTORS ---
        const { data: tutors } = await supabase.rpc('get_smart_matches_for_student', {
          input_student_id: sessionUserId,
          input_area: areaToSearch,
          input_lat: lat,
          input_lng: lng
        });
        if (tutors) data = tutors;

      } else {
        // --- TUTOR SEARCHING FOR STUDENTS ---
        let scanLat = lat;
        let scanLng = lng;
        
        // Auto-start Fallback logic for Tutors
        if (lat === 0 && lng === 0) {
           const { data: t } = await supabase.from('tutors').select('latitude, longitude').eq('id', sessionUserId).single();
           if (t?.latitude) { scanLat = t.latitude; scanLng = t.longitude; }
           else { scanLat = 23.8103; scanLng = 90.4125; } 
        }

        const { data: students } = await supabase.rpc('get_smart_matches_for_tutor', {
          input_tutor_id: sessionUserId,
          input_lat: scanLat,
          input_lng: scanLng
        });
        if (students) data = students;
      }

      if (data) {
        setAllFetchedData(data);
        if (data.length > 0) setShowListPanel(true);
        
        const validGPS = data.find(u => u.lat && u.lng);
        if (!userLoc && validGPS) setMapCenter([validGPS.lat, validGPS.lng]);
      }
    } catch (err) { console.error("Radar Error:", err); }
  }, [myRole, sessionUserId, supabase, userLoc, highlightedUsers]); // Added highlightedUsers to dependency

  // --- 2. AUTO START ---
  // (Optional: You can add an useEffect here to call syncRadar on mount if userLoc is known)

  // --- 3. FILTERING & COLLISION LOGIC ---
  const { displayMarkers, primaryList, optionalList } = useMemo(() => {
    let filtered = [...allFetchedData];

    // A. Smart Filter Toggle
    if (smartFilter) {
      if (myRole === 'student') {
         filtered = filtered.filter(u => u.match_score > 30 || u.varsity_verified);
      } else {
         filtered = filtered.filter(u => u.match_score > 40);
      }
      filtered.sort((a, b) => b.match_score - a.match_score);
    } 

    // B. Split Lists (Respect Dashboard Ranks if available)
    const primary = filtered.filter(u => u.match_type === 'PRIMARY' || u.match_rank === 1 || u.match_rank === 2);
    const optional = filtered.filter(u => u.match_type === 'OPTIONAL' || u.match_rank === 3);

    // If no ranks (fallback to old logic), use generic splitting
    if (primary.length === 0 && optional.length === 0) {
        // Fallback for old data or simple GPS search
        return { displayMarkers: [], primaryList: filtered, optionalList: [] };
    }

    // C. Map Logic (Only Valid GPS)
    const mappable = filtered.filter(u => (u.lat || u.latitude) && (u.lng || u.longitude));
    const groups: Record<string, any[]> = {};
    const finalMarkers: any[] = [];

    mappable.forEach(u => {
      const lat = u.lat || u.latitude;
      const lng = u.lng || u.longitude;
      const key = `${lat}-${lng}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...u, lat, lng });
    });

    Object.values(groups).forEach(group => {
      if (group.length === 1) {
        finalMarkers.push({ ...group[0], displayLat: group[0].lat, displayLng: group[0].lng });
      } else {
        group.forEach((u, i) => {
          const { lat, lng } = calculateDistributedPoints(u.lat, u.lng, group.length, i);
          finalMarkers.push({ ...u, displayLat: lat, displayLng: lng });
        });
      }
    });

    return { displayMarkers: finalMarkers, primaryList: primary, optionalList: optional };
  }, [allFetchedData, smartFilter, myRole]);

  // --- 4. LOCATE ME ---
  const handleLocateMe = () => {
    setGpsStatus('SCANNING');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLoc([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        if (onLocationFound) onLocationFound({ lat: latitude, lng: longitude });
        setGpsStatus('ANALYZING');
        try {
          // Identify zone name for better text matching
          const res = await fetch('/api/identify-zone', {
             method: 'POST', 
             body: JSON.stringify({ lat: latitude, lng: longitude }) 
          });
          // Note: response handling is minimal as DB logic handles area matching
          await res.json(); 
          await syncRadar(latitude, longitude); 
        } catch { 
          await syncRadar(latitude, longitude); 
        }
        setGpsStatus('IDLE');
      },
      () => { alert("GPS Failed"); setGpsStatus('IDLE'); },
      { enableHighAccuracy: true }
    );
  };

  // --- HANDLER WRAPPER ---
  // This ensures a valid function is always passed to the child, even if the prop is undefined
  const handleContactWrapper = (user: any) => {
    if (onContactUser) {
      onContactUser(user);
    } else {
      console.warn("onContactUser prop not provided to MapDisplay");
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex overflow-hidden bg-[#080808]">
      
      {/* === MAP === */}
      <div className="flex-1 relative z-0">
        <MapContainer center={mapCenter} zoom={13} className="w-full h-full" zoomControl={false}>
          <TileLayer url={TILE_URL} />
          <MapController center={mapCenter} zoom={14} />

          {userLoc && (
            <Marker position={userLoc} icon={myRole === 'student' ? studentIcon : tutorIcon}>
              <Popup>You</Popup>
            </Marker>
          )}

          {displayMarkers.map((u) => {
            // Icon Selection
            let markerIcon;
            if (myRole === 'student') markerIcon = u.varsity_verified ? verifiedTutorIcon : tutorIcon;
            else markerIcon = studentIcon; 

            return (
              <Marker key={u.id} position={[u.displayLat, u.displayLng]} icon={markerIcon}>
                <Popup>
                  {/* --- MAP POPUP (Simplified view) --- */}
                  {myRole === 'student' ? (
                    <div className="w-[150px] font-sans">
                       <span className="font-bold text-xs flex items-center gap-1">
                          {u.name}
                          {u.match_score > 0 && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded flex items-center"><Flame size={8}/> {u.match_score}%</span>}
                       </span>
                       <div className="text-[10px] text-gray-500 mt-1 truncate">{u.primary_area}</div>
                    </div>
                  ) : (
                    <div className="w-[150px] font-sans">
                       <div className="font-bold text-xs flex items-center gap-1 text-emerald-800">
                          <BookOpen size={12}/> {u.name}
                       </div>
                       <div className="mt-1 text-[10px] font-bold text-gray-800 flex items-center gap-1">
                          <Banknote size={10} /> Budget: ৳{u.budget}
                       </div>
                    </div>
                  )}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* --- SMART TOGGLE --- */}
        {allFetchedData.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400]">
             <button 
                onClick={() => setSmartFilter(!smartFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black shadow-2xl transition-all border
                  ${smartFilter 
                    ? 'bg-black text-white border-yellow-400 ring-2 ring-yellow-400/50' 
                    : 'bg-white text-gray-700 border-gray-300 hover:scale-105'}`}
             >
                <Sparkles size={14} className={smartFilter ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'} />
                {smartFilter ? 'SMART MATCH: ON' : 'ENABLE SMART MATCH'}
             </button>
          </div>
        )}

        <button onClick={() => setShowListPanel(!showListPanel)} className="absolute top-4 right-4 z-[500] bg-white p-2 rounded shadow-md md:hidden text-black">
          {showListPanel ? <X size={20} /> : <List size={20} />}
        </button>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[400] w-full max-w-xs px-6">
            <button onClick={handleLocateMe} disabled={gpsStatus !== 'IDLE'} className="w-full bg-white text-black font-black py-4 rounded-full text-xs tracking-widest flex justify-center items-center gap-2 shadow-2xl hover:scale-105 transition-transform border border-gray-100">
            {gpsStatus !== 'IDLE' ? <Loader2 className="animate-spin" /> : <Navigation size={16} />}
            {gpsStatus === 'SCANNING' ? 'ACQUIRING GPS...' : gpsStatus === 'ANALYZING' ? 'SEARCHING...' : 'SCAN LOCAL AREA'}
            </button>
        </div>
      </div>

      {/* === SIDEBAR COMPONENT === */}
      {/* IMPORTANT: 
          We pass the wrapper function to satisfy TypeScript and ensure safety.
      */}
      <RadarSidebar 
        show={showListPanel}
        onClose={() => setShowListPanel(false)}
        smartFilter={smartFilter}
        primaryList={primaryList}
        optionalList={optionalList}
        myRole={myRole}
        onContactUser={handleContactWrapper}
        userLoc={userLoc}
        totalCount={allFetchedData.length}
      />
    </div>
  );
};

export default MapDisplay;