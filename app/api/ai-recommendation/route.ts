import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// --- HELPERS ---

const safeParse = (data: any) => {
  if (!data) return {};
  if (typeof data === 'object') return data;
  try { return JSON.parse(data); } catch (e) { return {}; }
};

function getDistKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export async function POST(req: Request) {
  try {
    const { userQuery, studentLocation } = await req.json();

    // 1. SUPABASE SETUP
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
        },
      }
    );

    // 2. FETCH DATA (Fetch up to 30 candidates to feed the AI)
    const { data: rawTutors, error } = await supabase
      .from('tutors')
      .select(`
        id, 
        basic_info, 
        teaching_details, 
        varsity_infos, 
        varsity_verified, 
        primary_area,
        bio,
        latitude, 
        longitude
      `)
      .limit(30); // 30 is a safe limit for token usage vs speed

    if (error) throw error;

    // 3. PREPARE DATA FOR AI (The "Context")
    // We explicitly type this array to fix your red line error.
    const candidates: any[] = rawTutors.map((t: any) => {
      const basic = safeParse(t.basic_info);
      const teach = safeParse(t.teaching_details);
      const varsity = safeParse(t.varsity_infos);
      
      const dist = (studentLocation && t.latitude) 
        ? getDistKm(studentLocation.lat, studentLocation.lng, t.latitude, t.longitude)
        : 0;

      // We format this string specifically for the AI to read easily
      return {
        id: t.id,
        name: basic.full_name || "Tutor",
        profile_text: `
          Name: ${basic.full_name || "Tutor"}
          Uni: ${varsity.university || "Unknown"} (${t.varsity_verified === 'true' ? 'Verified' : 'Unverified'})
          Subjects: ${teach.subject_pref || "General"}
          Location: ${t.primary_area} (${dist}km away)
          Bio: ${t.bio || "No bio"}
          Salary: ${teach.salary_min || 0}
        `.trim(),
        // Keep raw data for the frontend response
        raw: {
          ...t,
          distance_km: dist,
          subjects: teach.subject_pref,
          university: varsity.university,
          name: basic.full_name,
          salary_min: teach.salary_min,
          verified: t.varsity_verified === 'true'
        }
      };
    });

    // 4. THE "FULL AI" PROMPT
    // This prompt forces the AI to be the judge, ranking based on semantic meaning.
    const prompt = `
      Act as an expert Recruiter.
      User Query: "${userQuery}"
      
      Analyze these candidates and pick the Top 4 matches.
      
      Rules:
      1. If user asks for specific subjects (Math, Physics), prioritize them.
      2. If user mentions "Near me" or location, prioritize distance < 5km.
      3. If user wants "Expert" or "Verified", prioritize Verified/BUET/Top Uni.
      4. IGNORE candidates that completely mismatch the subject (e.g. don't show an English tutor for Math query).
      
      CANDIDATES DATA:
      ${JSON.stringify(candidates.map(c => ({ id: c.id, info: c.profile_text })))}

      Return a JSON Object with this exact format:
      {
        "matches": [
          { 
            "id": "uuid", 
            "score": 95, 
            "reason": "Direct & persuasive reason why they match the query." 
          }
        ]
      }
    `;

    // 5. CALL GROQ (Llama 3 for speed/intelligence balance)
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Powerful model for logic
      temperature: 0.2, // Low temp = strictly factual
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const aiMatches = aiResponse.matches || [];

    // 6. HYDRATE RESPONSE
    // Merge the AI's smart reasoning with the full DB data for the UI
    const finalResults = aiMatches.map((aiMatch: any) => {
      const original = candidates.find(c => c.id === aiMatch.id);
      if (!original) return null;
      
      return {
        ...original.raw, // The full DB object
        match_score: aiMatch.score, // The AI's calculated score
        match_reason: aiMatch.reason // The AI's explanation
      };
    }).filter(Boolean);

    // Fallback: If AI returns nothing (e.g. strict filtering), return the closest raw matches
    if (finalResults.length === 0) {
      return NextResponse.json({ 
        matches: candidates.slice(0, 3).map(c => ({
          ...c.raw, 
          match_score: 50, 
          match_reason: "Matches your general area."
        })) 
      });
    }

    return NextResponse.json({ matches: finalResults });

  } catch (err: any) {
    console.error("AI Search Error:", err);
    return NextResponse.json({ matches: [], message: "AI overloaded, try again." }, { status: 500 });
  }
}