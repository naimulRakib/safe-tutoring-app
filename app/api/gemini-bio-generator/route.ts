import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { rawText } = await req.json();

    if (!rawText) {
      return NextResponse.json({ success: false, error: "No text provided" }, { status: 400 });
    }

    // SYSTEM PROMPT: Defines the persona
    const systemPrompt = `
      You are an expert **Education Profile Copywriter**. Your goal is to take raw, messy text from a tutor and rewrite it into a **Premium, High-Converting Profile Bio** that attracts students and parents.
      
      YOUR RULES:
      1. Headline: Create a catchy 1-line headline with emojis (e.g., "🎓 BUET Engineer | 5+ Years Math Expert").
      2. Structure: Use clean bullet points for Skills, Experience, and Achievements.
      3. Tone: Professional, confident, yet approachable.
      4. Formatting: Use specific emojis to make it visually popping (📍, ⭐, 📚, 🏆).
      5. Selling Point: Identify their strongest asset (e.g., "Strict but results-oriented") and highlight it.
      6. Output: Return ONLY the polished bio text. Do not add conversational filler like "Here is the bio".
    `;

    // CALL GROQ API (Llama 3 model)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `RAW INPUT: "${rawText}"` }
      ],
      model: "llama-3.3-70b-versatile", // Free, Fast, and Smart
      temperature: 0.7,
    });

    const bio = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ success: true, bio: bio });

  } catch (error: any) {
    console.error("AI Bio Gen Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}