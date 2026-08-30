export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
// pdf-parse is used server-side only
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

// Heuristic extraction helpers
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

function extractSkillsList(text: string): string[] {
  // Master skill keyword pool for detection
  const SKILL_KEYWORDS = [
    // Languages
    "python","java","javascript","typescript","c\\+\\+","c#","golang","go","ruby","php","swift","kotlin","scala","r","matlab","perl","bash","shell","powershell",
    // Web/Frontend
    "react","reactjs","react.js","angular","vue","vuejs","nextjs","next.js","html","css","tailwind","bootstrap","sass","jquery",
    // Backend
    "node.js","nodejs","express","django","flask","fastapi","spring","springboot","spring boot","laravel","rails","asp.net",
    // Data
    "sql","mysql","postgresql","mongodb","redis","elasticsearch","cassandra","dynamodb","oracle","sqlite","nosql","neo4j","hadoop","spark","kafka","airflow","databricks",
    // Cloud & DevOps
    "aws","azure","gcp","google cloud","docker","kubernetes","k8s","terraform","ansible","jenkins","ci/cd","github actions","gitlab ci","linux","nginx","apache","microservices",
    // AI/ML
    "machine learning","deep learning","tensorflow","pytorch","keras","scikit-learn","pandas","numpy","opencv","nlp","natural language processing","computer vision","data science","big data",
    // Other
    "git","agile","scrum","jira","rest api","graphql","grpc","oauth","jwt","selenium","cypress","jest","junit","figma","powerbi","tableau","excel","sap","salesforce","networking","cybersecurity","blockchain"
  ];
  
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const kw of SKILL_KEYWORDS) {
    const escaped = kw.replace(/[.+]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(lower)) {
      // Clean up display
      const display = kw.replace(/\\\+/g, "+").replace(/\\./g, ".");
      const displayKey = display.charAt(0).toUpperCase() + display.slice(1);
      if (!found.includes(displayKey)) found.push(displayKey);
    }
  }
  return found.slice(0, 25); // cap at 25
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
      // Check if we hit another section header (stop condition)
      const isNewSection = /^(responsibilities|requirements|qualifications|benefits|about|company|skills|experience|education|salary|compensation|apply)/i.test(line);
      if (isNewSection && !sectionHeaders.some(h => line.toLowerCase().includes(h.toLowerCase()))) {
        break;
      }
      
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
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";
    try {
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } catch (err) {
      return NextResponse.json({ error: "Failed to parse PDF", reason: String(err) }, { status: 422 });
    }
    
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "PDF appears to be empty or image-based, unable to extract text" }, { status: 422 });
    }
    
    // Extract structured fields
    const company = extractField(text, ["company", "organization", "employer", "hiring company"]);
    const jobTitle = extractField(text, ["job title", "position", "role", "designation", "post"]);
    const location = extractField(text, ["location", "job location", "work location", "city", "place of work"]);
    const experience = extractField(text, ["experience", "experience required", "years of experience", "work experience"]);
    const education = extractField(text, ["education", "qualification", "educational qualification", "degree"]);
    const salary = extractField(text, ["salary", "ctc", "compensation", "package", "stipend", "lpa", "pay"]);
    const openings = extractField(text, ["openings", "vacancies", "no of positions", "number of positions"]);
    const industry = extractField(text, ["industry", "domain", "sector"]);
    const jobType = extractField(text, ["job type", "employment type", "work type", "work mode"]);
    
    // Skills
    const skills = extractSkillsList(text);
    
    // Responsibilities
    const responsibilities = extractList(text, ["responsibilities", "key responsibilities", "job responsibilities", "duties", "you will be responsible"]);
    
    // Keywords - top tech terms found
    const keywords = skills.slice(0, 10);
    
    // Recruitment process
    const recruitmentProcess = extractList(text, ["recruitment process", "hiring process", "selection process", "interview process"]);
    
    // Eligibility criteria
    const eligibility = extractList(text, ["eligibility", "eligibility criteria", "who can apply", "requirements"]);
    
    return NextResponse.json({
      company,
      jobTitle,
      location,
      experience,
      education,
      salary,
      openings,
      industry,
      jobType,
      skills,
      responsibilities,
      keywords,
      recruitmentProcess,
      eligibility,
      rawText: text.slice(0, 3000), // first 3k chars for preview
    });
  } catch (err) {
    console.error("PDF parse API error:", err);
    return NextResponse.json({ error: "Internal server error", reason: String(err) }, { status: 500 });
  }
}
