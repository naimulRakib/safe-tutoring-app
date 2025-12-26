'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet'; // We can import normally here!

export default function MapController({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 16, { duration: 1.5 });
    }
  }, [lat, lng, map]);

  return null;
}