import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();

    if (!lat || !lng) return NextResponse.json({ zone: "Unknown Location" });

    // =========================================================
    // STEP 1: FREE MAP SEARCH (OpenStreetMap / Nominatim)
    // =========================================================
    // This gets real address data anywhere in Bangladesh (Dhaka, Cumilla, etc.)
    // No API Key needed for Hackathon scale usage.
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    // 'User-Agent' header is required by OpenStreetMap policy
    const geoRes = await fetch(osmUrl, { 
        headers: { 'User-Agent': 'StudentRadar-Hackathon/1.0' } 
    });
    
    if (!geoRes.ok) {
       console.error("OSM Error:", await geoRes.text());
       return NextResponse.json({ zone: "Map Error" });
    }
    
    const geoData = await geoRes.json();
    const address = geoData.address || {};

    // =========================================================
    // STEP 2: AI PROMPTING SYSTEM (Groq / Llama 3)
    // =========================================================
    // Nominatim gives too much detail (House numbers, roads). 
    // We use AI to extract JUST the "Main Area" (e.g., "Kandirpar").

    const systemPrompt = `
      You are a Bangladeshi Location Expert AI.
      
      YOUR TASK:
      Analyze the JSON address data provided and output ONLY the "Main Local Area" name.

      RULES:
      1. Prioritize names like 'suburb', 'neighbourhood', 'city_district', 'quarter', or 'village'.
      2. Examples of target output: "Kandirpar", "Jhawtola", "Azimpur", "Mirpur 10", "GEC Circle".
      3. Do NOT output specific house numbers, roads, or the full district (like "Cumilla District").
      4. If the location is 'Jhawtola', output "Jhawtola".
      5. Output ONLY the name in only english. No extra text.
    `;

    // We send the structured address object to the AI
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `JSON Address: ${JSON.stringify(address)}` }
      ],
      model: "llama-3.3-70b-versatile", // Smart & Fast
      temperature: 0.1, // Very precise
      max_tokens: 15, // Keep it short
    });

    const detectedZone = completion.choices[0]?.message?.content?.trim() || "Unknown Area";

    console.log(`📍 AI Detected: ${detectedZone} (from ${lat}, ${lng})`);

    return NextResponse.json({ zone: detectedZone });

  } catch (error: any) {
    console.error("Zone Detect Error:", error);
    return NextResponse.json({ zone: "Unknown Area" });
  }
}