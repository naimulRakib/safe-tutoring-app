import { createClient } from '@/app/utils/supabase/client';// 🟢 Correct for Server Routes
import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function POST(req: Request) {
  const debugLogs: string[] = [];
  const log = (msg: string) => { console.log(msg); debugLogs.push(msg); };

  log("1. Init API Route (Groq Version + SSR)");

  try {
    // --- 1. INITIALIZE SUPABASE (SSR Pattern) ---
    // This replaces the complex createRouteHandlerClient block.
    // We await it because cookies() in Next.js 15 is async.
    const supabase = await createClient();

    // --- 2. PARSE REQUEST ---
    let body;
    try { body = await req.json(); } catch { body = {}; }
    const { userQuery } = body;
    log(`2. Parsed Query: "${userQuery}"`);

    // --- 3. AUTHENTICATION ---
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ matches: [], message: "Login required." }, { status: 401 });
    }

    // --- 4. FETCH STUDENT PREFS ---
    let primaryZone = "";
    
    // Check Profile (Master Record)
    const { data: profData } = await supabase.from('profiles').select('primary_area').eq('id', user.id).maybeSingle();
    if (profData) primaryZone = (profData as any).primary_area || "";

    if (!primaryZone) {
      return NextResponse.json({ matches: [], message: "⚠️ Set Primary Area in Profile first!", debug: debugLogs });
    }
    
    const studentZones = [primaryZone.toLowerCase()]; 
    log(`4. Target Zone: ${primaryZone}`);

    // --- 5. FETCH TUTORS ---
    // 🟢 Using 'teaching_details' JSON instead of missing columns
    const { data: allTutors, error: tutorError } = await supabase
      .from('tutors')
      .select(`
        id, 
        primary_area, 
        teaching_details, 
        subjects, 
        varsity_verified, 
        varsity_infos,
        basic_info
      `)
      .limit(100);

    if (tutorError) throw new Error(tutorError.message);

    // --- 6. FILTER IN MEMORY (Smart Area Match) ---
    const nearbyTutors = (allTutors as any[])?.filter(t => {
      if (!t.primary_area) return false;
      
      const tPrimary = t.primary_area.trim().toLowerCase();
      
      // Extract optional areas from JSONB safely
      let details = t.teaching_details;
      if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch(e) { details = {}; }
      }
      
      const optionalList = details?.optional_areas || [];
      const tSecondaryString = Array.isArray(optionalList) ? optionalList.join(" ").toLowerCase() : "";
      
      const isPrimaryMatch = studentZones.includes(tPrimary);
      const isSecondaryMatch = studentZones.some((z: string) => tSecondaryString.includes(z));
      
      return isPrimaryMatch || isSecondaryMatch;
    }) || [];

    log(`6. Tutors found in/near ${primaryZone}: ${nearbyTutors.length}`);

    if (nearbyTutors.length === 0) {
      return NextResponse.json({ 
        matches: [], 
        message: `No tutors found in ${primaryZone}.`,
        debug: debugLogs
      });
    }

    // --- 7. HYDRATE CANDIDATES ---
    const tutorIds = nearbyTutors.map((t: any) => t.id);

    // Fetch Profile Context
    const { data: profiles } = await supabase.from('profiles').select('id, username, bio').in('id', tutorIds);

    const candidates = nearbyTutors.map((t: any) => {
      const p = (profiles as any[])?.find(x => x.id === t.id) || { username: "Tutor", bio: "" };
      
      const isMainMatch = t.primary_area.toLowerCase() === primaryZone.toLowerCase();

      // University Info Parser
      let varsityText = "Unverified";
      if (String(t.varsity_verified) === 'true') {
         let vInfo = t.varsity_infos;
         if (typeof vInfo === 'string') try { vInfo = JSON.parse(vInfo); } catch(e){}
         varsityText = `${vInfo?.university || 'Uni'} - ${vInfo?.department || ''}`;
      }

      // Name Parser
      let basic = t.basic_info;
      if (typeof basic === 'string') try { basic = JSON.parse(basic); } catch(e){}
      const realName = basic?.full_name || p.username || "Tutor";

      return {
        id: t.id,
        name: realName,
        location: t.primary_area,
        match_type: isMainMatch ? "🌟 Primary Match" : "📍 Nearby Match",
        subjects: t.subjects, 
        verified: String(t.varsity_verified) === 'true', 
        bio: p.bio || `Teaches ${t.subjects}`, 
        context: `${varsityText}. Located in ${t.primary_area}.`
      };
    });

    // --- 8. AI RANKING (GROQ) ---
    const prompt = `
      You are an expert tutor matching system.
      
      USER QUERY: "${userQuery || 'General recommendation'}"
      STUDENT AREA: "${primaryZone}"
      
      CANDIDATES:
      ${JSON.stringify(candidates.map(c => ({ 
        id: c.id, 
        name: c.name, 
        sub: c.subjects, 
        info: c.context 
      })))}

      TASK:
      1. Rank candidates based on relevance to the USER QUERY.
      2. If query is empty, prioritize verified tutors.
      3. Return a valid JSON Object with a "rankings" array.
      
      FORMAT:
      {
        "rankings": [
          { "id": "uuid", "match_score": 95, "reason": "Teaches Math which user asked for" },
          { "id": "uuid", "match_score": 60, "reason": "Good backup option" }
        ]
      }

      IMPORTANT: Return ONLY JSON. No markdown.
    `;

    log("8. Asking Groq...");
    
    let rankings = [];
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a JSON-only API." },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const aiContent = completion.choices[0].message.content || '{}';
      const parsed = JSON.parse(aiContent);
      
      if (Array.isArray(parsed)) rankings = parsed;
      else if (parsed.rankings) rankings = parsed.rankings;
      else rankings = [];

    } catch (e: any) {
      log(`AI Failed: ${e.message}`);
      rankings = candidates.map((c: any) => ({ id: c.id, match_score: 50, reason: "AI Service Busy" }));
    }

    // --- 9. SAFE MERGE & SORT ---
    const finalResults = rankings.map((rank: any) => {
      const original = candidates.find((c: any) => c.id === rank.id);
      if (!original) return null;
      return { ...original, ...rank };
    }).filter(Boolean);

    finalResults.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0));

    log(`9. Success. Returning ${finalResults.length} matches.`);
    
    return NextResponse.json({ 
      matches: finalResults, 
      search_area: primaryZone,
      debug: debugLogs 
    });

  } catch (error: any) {
    console.error("API Crash:", error);
    return NextResponse.json({ 
      matches: [],
      error: error.message,
      debug: debugLogs
    }, { status: 200 });
  }
}