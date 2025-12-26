'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';

export default function AdminSafetyPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Initial Data
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('safety_alerts')
        .select(`
          *,
          tutor:tutors!user_id (
            basic_info,
            emergency_contacts
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) console.error("DB Error:", error);
      if (data) setAlerts(data);
      setLoading(false);
    };

    fetchData();

    // 2. Realtime Listener (Updates instantly)
    const channel = supabase.channel('safety_text_view')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'safety_alerts' }, () => {
        fetchData(); // Simply re-fetch on any change
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div>Loading Data...</div>;

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', backgroundColor: 'black', color: 'lime', minHeight: '100vh' }}>
      <h1>RAW SAFETY FEED</h1>
      
      {alerts.length === 0 ? (
        <p>NO ACTIVE THREATS</p>
      ) : (
        <ul>
          {alerts.map((alert) => {
            // Safe parsing of contacts
            let contacts = alert.tutor?.emergency_contacts;
            if (typeof contacts === 'string') {
              try { contacts = JSON.parse(contacts); } catch { contacts = {}; }
            }

            return (
              <li key={alert.id} style={{ border: '1px solid lime', padding: '20px', marginBottom: '20px' }}>
                <h3>ALERT ID: {alert.id}</h3>
                <p><strong>Status:</strong> {alert.status}</p>
                <p><strong>Details:</strong> {alert.details}</p>
                
                <hr style={{ borderColor: 'lime', margin: '15px 0' }}/>
                
                {/* --- THE DATA YOU ASKED FOR --- */}
                <p style={{ fontSize: '1.2em' }}>
                  <strong>LATITUDE:</strong> {alert.latitude} <br/>
                  <strong>LONGITUDE:</strong> {alert.longitude}
                </p>

                <div style={{ marginTop: '15px' }}>
                  <strong>EMERGENCY PHONES:</strong>
                  <ul style={{ marginLeft: '20px' }}>
                    <li>Father: {contacts?.father?.phone || "N/A"}</li>
                    <li>Mother: {contacts?.mother?.phone || "N/A"}</li>
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}