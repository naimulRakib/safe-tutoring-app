import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Get your key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "No URL provided" });
    }

    if (!genAI) {
      return NextResponse.json({ success: false, error: "Gemini API Key missing" });
    }

    console.log("🔍 Analyzing ID Card...");

    // 1. Fetch the image and convert to Base64
    // Gemini requires the actual image data, not just a URL (for security/access reasons)
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) throw new Error("Failed to fetch image from URL");
    
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResp.headers.get('content-type') || 'image/jpeg';

    // 2. Configure Model (Gemini 2.5 Flash)
    // We use responseMimeType: "application/json" to force strict JSON output (Saves tokens!)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-09-2025",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Low temp for precision
      }
    });

    // 3. Ultra-Concise Prompt (Saves Input Tokens)
    const prompt = `Extract JSON: { "student_name": string, "student_id_number": string, "institution_name": string } from this ID card. Return null for missing fields.`;

    // 4. Generate Content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("🤖 Gemini Raw JSON:", text);

    // 5. Parse
    // Since we forced JSON mode, we can usually parse directly
    let extractedData;
    try {
      extractedData = JSON.parse(text);
    } catch (e) {
      // Fallback cleanup just in case
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(cleanText);
    }

    return NextResponse.json({ success: true, data: extractedData });

  } catch (error: any) {
    console.error("❌ Extraction Failed:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}