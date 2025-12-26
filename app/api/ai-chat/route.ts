import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function POST(req: Request) {
  try {
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

    // --- 1. PARSE & FIX INPUT MISMATCH ---
    const body = await req.json();
    let { messages } = body;
    const { userQuery } = body;

    if (!messages && userQuery) {
      messages = [{ role: 'user', content: userQuery }];
    }
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ reply: "Error: No message content received." });
    }

    // --- 2. AUTH CHECK ---
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ reply: "Please log in to chat." });

    // --- 3. GET LOCATION ---
    const { data: profile } = await supabase.from('profiles').select('primary_area').eq('id', user.id).single();
    const currentZone = profile?.primary_area;
    if (!currentZone) return NextResponse.json({ reply: "Please update your Profile location first." });

    // --- 4. FETCH TUTORS (POWERFUL QUERY) ---
    // Now selecting ALL rich JSON columns
    const { data: tutors } = await supabase
      .from('tutors')
      .select(`
        id, 
        bio, 
        teaching_details, 
        basic_info, 
        varsity_infos, 
        varsity_verified,
        verification,
        profiles ( username )
      `)
      .eq('primary_area', currentZone)
      .limit(15);

    // --- 5. CONTEXT PREP (RICH DATA EXTRACTION) ---
    let contextText = "No active tutors found in this area.";
    
    if (tutors && tutors.length > 0) {
      const list = tutors.map((t: any) => {
        // A. Parse JSON Columns
        const basic = t.basic_info || {};
        const teaching = t.teaching_details || {};
        const varsity = t.varsity_infos || {};
        const verify = t.verification || {};

        // B. Smart Name Logic (Real Name > Username)
        const displayName = basic.full_name || t.profiles?.username || "Tutor";

        // C. Smart Education Logic (Verified Varsity > Basic Institution)
        let education = basic.institution || "University Student";
        if (t.varsity_verified && varsity.university) {
          education = `Verified ${varsity.university} (${varsity.department || ''})`;
        }

        // D. Format Subjects
        const rawSubs = teaching.subject_pref || "Various";
        const subjects = Array.isArray(rawSubs) ? rawSubs.join(", ") : rawSubs;

        // E. Format Salary
        const min = teaching.salary_min || 0;
        const max = teaching.salary_max || 0;
        const salary = min > 0 ? `${min}-${max} Tk` : "Negotiable";

        return {
          name: displayName,
          education: education,
          is_verified: t.varsity_verified ? "✅ Verified ID" : "Unverified",
          subjects: subjects,
          rate: salary,
          bio: t.bio ? t.bio.substring(0, 150) : "No bio."
        };
      });
      contextText = JSON.stringify(list);
    }

    // --- 6. SANITIZE MESSAGES ---
    const cleanMessages = messages.map((m: any) => ({
      role: m.role === 'model' ? 'assistant' : m.role, 
      content: m.content || ""
    }));

    // --- 7. POWERFUL SYSTEM PROMPT ---
    const systemPrompt = `
      You are 'TwistedAI', an elite academic counselor for students in ${currentZone}.
      
      DATA (Available Tutors): 
      ${contextText}

      INSTRUCTIONS:
      1. Recommend the best tutors based on the user's need.
      2. **Highlight Verified Tutors:** If a tutor has 'Verified BUET/DMC/DU', mention it! It's a huge plus.
      3. **Be Specific:** Say "I recommend [Name] because they study at [University] and teach [Subjects]."
      4. **Keep it concise.** Do not list everyone. Pick the top 2-3 matches.
      5. If the list is empty, apologize and ask them to broaden their search.
    `;

    // --- 8. CALL GROQ ---
    let completion;
    try {
        completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, ...cleanMessages],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 500,
        });
    } catch (e: any) {
        // Fallback model
        completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, ...cleanMessages],
            model: "llama-3.1-8b-instant", 
            temperature: 0.5,
            max_tokens: 500,
        });
    }

    return NextResponse.json({ reply: completion.choices[0].message.content });

  } catch (error: any) {
    console.error("AI Critical Error:", error);
    return NextResponse.json({ reply: `System overload. Error: ${error.message}` });
  }
}