import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

// Use AI for structured analysis if API key exists
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Heuristic fallback helpers
function extractField(text: string, patterns: string[]): string {
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}[:\\s]+([^\\n]{2,100})`, "i");
    const match = text.match(regex);
    if (match && match[1].trim()) {
      return match[1].trim().replace(/[|•]/g, "").trim();
    }
  }
  return "Not specified";
}

function extractList(text: string, sectionHeaders: string[]): string[] {
  const results: string[] = [];
  let inSection = false;
  const lines = text.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const isHeader = sectionHeaders.some(h => line.toLowerCase().includes(h.toLowerCase()));
    if (isHeader) { inSection = true; continue; }
    
    if (inSection) {
      const isNewSection = /^(responsibilities|requirements|qualifications|benefits|about|company|skills|experience|education|salary|compensation|apply)/i.test(line);
      if (isNewSection && !sectionHeaders.some(h => line.toLowerCase().includes(h.toLowerCase()))) break;
      
      const cleaned = line.replace(/^[-•*→▶✓✔>]\s*/, "").trim();
      if (cleaned.length > 5 && cleaned.length < 200) {
        results.push(cleaned);
      }
    }
  }
  return results.slice(0, 15);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";
    try {
      // Dynamic require inside the request handler to avoid build-time evaluation
      // which causes DOMMatrix ReferenceError in Next.js
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      
      // Basic DOMMatrix polyfill just in case pdf-parse needs it during execution
      if (typeof global !== 'undefined' && !global.DOMMatrix) {
        (global as any).DOMMatrix = class DOMMatrix {};
      }
      
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } catch (err) {
      return NextResponse.json({ error: "PDF uploaded successfully, but text extraction failed.", reason: String(err) }, { status: 422 });
    }
    
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "PDF appears to be empty or image-based, unable to extract text" }, { status: 422 });
    }
    
    // Default fallback extraction
    const fallbackData = {
      company: extractField(text, ["company", "organization", "employer", "hiring company"]),
      jobTitle: extractField(text, ["job title", "position", "role", "designation", "post"]),
      location: extractField(text, ["location", "job location", "work location", "city", "place of work"]),
      experience: extractField(text, ["experience", "experience required", "years of experience", "work experience"]),
      education: extractField(text, ["education", "qualification", "educational qualification", "degree"]),
      salary: extractField(text, ["salary", "ctc", "compensation", "package", "stipend", "lpa", "pay"]),
      openings: extractField(text, ["openings", "vacancies", "no of positions", "number of positions"]),
      industry: extractField(text, ["industry", "domain", "sector"]),
      jobType: extractField(text, ["job type", "employment type", "work type", "work mode"]),
      skills: extractList(text, ["skills", "technologies", "tech stack"]),
      responsibilities: extractList(text, ["responsibilities", "key responsibilities", "job responsibilities", "duties"]),
      eligibility: extractList(text, ["eligibility", "eligibility criteria", "who can apply", "requirements"]),
      recruitmentProcess: extractList(text, ["recruitment process", "hiring process", "selection process"]),
      keywords: [],
    };

    // Attempt AI extraction if available
    let aiData = null;
    let analysisPending = false;
    
    if (ai) {
      try {
        const prompt = `Analyze this Job Description and extract the following structured information. If a field is not found, leave it as "Not specified" or empty array.
Return valid JSON ONLY with these exact keys:
{
  "company": "", "jobTitle": "", "location": "", "experience": "", "education": "", "salary": "", "openings": "", "industry": "", "jobType": "",
  "skills": [], "preferredSkills": [], "responsibilities": [], "eligibility": [], "recruitmentProcess": [], "keywords": []
}

Job Description Text:
${text.slice(0, 15000)}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const resText = response.text || "";
        const jsonMatch = resText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          aiData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("AI Analysis failed:", e);
        analysisPending = true;
      }
    } else {
      analysisPending = true;
    }
    
    // Merge AI data with fallback
    const finalData = aiData ? { ...fallbackData, ...aiData } : fallbackData;
    
    // Generate some keywords if empty
    if (!finalData.keywords || finalData.keywords.length === 0) {
      finalData.keywords = finalData.skills.slice(0, 10);
    }
    
    return NextResponse.json({
      success: true,
      message: analysisPending ? "JD saved successfully. AI analysis is pending." : "JD imported successfully",
      data: {
        ...finalData,
        rawText: text.slice(0, 5000), // first 5k chars for preview
        analysisStatus: analysisPending ? "PENDING" : "COMPLETED"
      }
    });
  } catch (err) {
    console.error("PDF parse API error:", err);
    return NextResponse.json({ error: "Internal server error", reason: String(err) }, { status: 500 });
  }
}
