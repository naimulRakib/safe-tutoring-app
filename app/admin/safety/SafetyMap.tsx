'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Next.js
// (We reuse your custom SOS icon logic here)
const sosIcon = new L.DivIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-red-500 rounded-full animate-ping opacity-75"></div>
          <div class="relative w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
         </div>`,
  className: 'sos-marker',
  iconSize: [32, 32],
});

// --- HELPER TO MOVE MAP ---
// This hook works now because it's imported normally at the top
function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap(); // <--- This now works correctly
  
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);

  return null;
}

// --- MAIN MAP COMPONENT ---
export default function SafetyMap({ alerts }: { alerts: any[] }) {
  // Default center (Dhaka)
  const defaultCenter: [number, number] = [23.8103, 90.4125];

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={13} 
      style={{ height: '100%', width: '100%', background: '#050505' }}
    >
      <TileLayer 
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      
      {alerts.map((alert) => (
        <React.Fragment key={alert.id}>
          <Marker position={[alert.latitude, alert.longitude]} icon={sosIcon}>
            <Popup className="custom-popup">
               <div className="p-2 font-sans text-black">
                  <p className="font-black text-red-600 uppercase text-xs mb-1">SOS Triggered</p>
                  <p className="font-bold text-sm">{alert.details}</p>
               </div>
            </Popup>
          </Marker>
          {/* This triggers the flyTo animation */}
          <RecenterMap lat={alert.latitude} lng={alert.longitude} />
        </React.Fragment>
      ))}
    </MapContainer>
  );
}