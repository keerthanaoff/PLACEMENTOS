// ─── JD Service ────────────────────────────────────────────────────────────
// Full CRUD + scoring + skill-gap analysis for PlacementOS JD Intelligence

const STORAGE_KEY = "pos_jds_v2";
const isBrowser = typeof window !== "undefined";

export interface StoredJD {
  id: string;
  filename: string;
  company: string;
  jobTitle: string;
  location: string;
  experience: string;
  education: string;
  salary: string;
  openings: string;
  industry: string;
  jobType: string;
  skills: string[];           // required skills
  preferredSkills: string[];
  responsibilities: string[];
  eligibility: string[];
  keywords: string[];
  recruitmentProcess: string[];
  rawText?: string;
  status: "ACTIVE" | "PENDING" | "DRAFT";
  analysisStatus?: "COMPLETED" | "PENDING" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  studentId: string;
  jdId: string;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  projectScore: number;
  keywordScore: number;
  roleScore: number;
  certScore: number;
  overallScore: number;
  recommendation: "STRONGLY_RECOMMENDED" | "RECOMMENDED" | "CONSIDER" | "NOT_RECOMMENDED";
  matchedSkills: string[];
  missingSkills: string[];
  isDemoResume: boolean;
}

export type ScoreCategory = "Excellent" | "Good" | "Moderate" | "Low";

import { INITIAL_JDS } from "@/lib/jdSeedData";

export const jdService = {
  // ─────────────────────── CRUD ────────────────────────────────────────────
  getAll(): StoredJD[] {
    if (!isBrowser) return [];
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      
      // Seed data if empty
      if (!raw || JSON.parse(raw).length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_JDS));
        raw = JSON.stringify(INITIAL_JDS);
      }
      
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  getById(id: string): StoredJD | null {
    return this.getAll().find(j => j.id === id) || null;
  },

  save(jd: Partial<StoredJD> & { id?: string }): StoredJD {
    const all = this.getAll();
    const now = new Date().toISOString();
    const id = jd.id || `JD_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const idx = all.findIndex(j => j.id === id);

    const record: StoredJD = {
      id,
      filename: jd.filename || "Unknown",
      company: jd.company || "Unknown Company",
      jobTitle: jd.jobTitle || "Unknown Role",
      location: jd.location || "Not specified",
      experience: jd.experience || "Not specified",
      education: jd.education || "Not specified",
      salary: jd.salary || "Not specified",
      openings: jd.openings || "Not specified",
      industry: jd.industry || "Not specified",
      jobType: jd.jobType || "Not specified",
      skills: jd.skills || [],
      preferredSkills: jd.preferredSkills || [],
      responsibilities: jd.responsibilities || [],
      eligibility: jd.eligibility || [],
      keywords: jd.keywords || [],
      recruitmentProcess: jd.recruitmentProcess || [],
      rawText: jd.rawText,
      status: jd.status || "ACTIVE",
      analysisStatus: jd.analysisStatus || "COMPLETED",
      createdAt: idx > -1 ? all[idx].createdAt : now,
      updatedAt: now,
    };

    if (idx > -1) { all[idx] = record; }
    else { all.unshift(record); }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return record;
  },

  delete(id: string): void {
    if (!isBrowser) return;
    const all = this.getAll().filter(j => j.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  // ─────────────────────── Legacy compat (for ai-resume page) ──────────────
  async getAllJDs(): Promise<StoredJD[]> {
    // First try local storage
    const local = this.getAll();
    if (local.length > 0) return local;
    
    // Fall back to static JSON
    try {
      const res = await fetch("/data/jds.json");
      if (!res.ok) return [];
      const data: Array<{ filename: string; content: string }> = await res.json();
      return data.map((d, i) => this._parseLegacy(d, i));
    } catch { return []; }
  },

  _parseLegacy(d: { filename: string; content: string }, idx: number): StoredJD {
    // Minimal extraction for legacy static JSON
    const lines = d.content.split("\n").map(l => l.trim()).filter(Boolean);
    const title = lines.find(l => l.includes("Position:"))?.split("Position:")[1]?.trim() || "Unknown Role";
    const company = lines[1] || "Unknown Company";
    const now = new Date().toISOString();
    return {
      id: `legacy_${idx}`,
      filename: d.filename,
      company,
      jobTitle: title,
      location: "Not specified",
      experience: "Not specified",
      education: "Not specified",
      salary: "Not specified",
      openings: "Not specified",
      industry: "Not specified",
      jobType: "Not specified",
      skills: [],
      preferredSkills: [],
      responsibilities: [],
      eligibility: [],
      keywords: [],
      recruitmentProcess: [],
      rawText: d.content.slice(0, 2000),
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
  },

  // ─────────────────────── Matching Engine ────────────────────────────────
  /**
   * Weighted JD ↔ Student matching. All scores are deterministic.
   * Weights: Skills 35 | Experience 15 | Education 10 | Projects 15 |
   *          Keywords 10 | Role 10 | Certs 5
   */
  calculateMatch(student: any, jd: StoredJD): MatchResult {
    const isDemoResume = !student.resumeLink || student.resumeLink === "N/A";
    const studentSkills = this._parseSkills(
      [student.skills, student.project, student.jobRole].filter(Boolean).join(" ")
    );
    const jdSkills = jd.skills.map(s => s.toLowerCase().trim());

    // 1. Skills (35%)
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    for (const sk of jdSkills) {
      if (studentSkills.some(ss => ss.includes(sk) || sk.includes(ss))) {
        matchedSkills.push(sk);
      } else {
        missingSkills.push(sk);
      }
    }
    const skillsScore = jdSkills.length > 0
      ? Math.round((matchedSkills.length / jdSkills.length) * 100)
      : this._seededRand(student.id, jd.id, 55, 90);

    // 2. Experience (15%)
    const expScore = this._matchExperience(student.experience || "Fresher", jd.experience);

    // 3. Education (10%)
    const eduScore = this._matchEducation(student.ug || student.education || "", jd.education);

    // 4. Projects (15%) – presence + keyword overlap
    const projectScore = student.project && student.project !== "N/A"
      ? this._keywordOverlap(student.project, [...jd.skills, ...jd.keywords])
      : 0;

    // 5. Keywords (10%)
    const studentText = [student.skills, student.project, student.jobRole, student.education].join(" ");
    const kwScore = this._keywordOverlap(studentText, [...jd.keywords, ...jd.skills]);

    // 6. Role match (10%)
    const roleScore = this._matchRole(student.jobRole || "", jd.jobTitle);

    // 7. Certifications (5%) – crude: github or linkedin presence signals professionalism
    const certScore = student.github && student.linkedin ? 100
      : student.github || student.linkedin ? 70
      : 30;

    // Weighted overall
    const overall = Math.round(
      skillsScore * 0.35 +
      expScore * 0.15 +
      eduScore * 0.10 +
      projectScore * 0.15 +
      kwScore * 0.10 +
      roleScore * 0.10 +
      certScore * 0.05
    );

    const recommendation =
      overall >= 90 ? "STRONGLY_RECOMMENDED"
      : overall >= 75 ? "RECOMMENDED"
      : overall >= 60 ? "CONSIDER"
      : "NOT_RECOMMENDED";

    return {
      studentId: student.id,
      jdId: jd.id,
      skillsScore,
      experienceScore: expScore,
      educationScore: eduScore,
      projectScore,
      keywordScore: kwScore,
      roleScore,
      certScore,
      overallScore: overall,
      recommendation,
      matchedSkills,
      missingSkills,
      isDemoResume,
    };
  },

  getScoreCategory(score: number): ScoreCategory {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Moderate";
    return "Low";
  },

  getScoreColor(score: number): string {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  },

  getScoreBg(score: number): string {
    if (score >= 90) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    if (score >= 75) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (score >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  },

  // ─────────────────────── Private helpers ─────────────────────────────────
  _parseSkills(text: string): string[] {
    return text.toLowerCase()
      .split(/[,|;\n\r\/]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1);
  },

  _seededRand(s1: string, s2: string, min: number, max: number): number {
    let hash = 0;
    for (let i = 0; i < (s1 + s2).length; i++) {
      hash = ((hash << 5) - hash) + (s1 + s2).charCodeAt(i);
      hash |= 0;
    }
    return min + (Math.abs(hash) % (max - min + 1));
  },

  _matchExperience(studentExp: string, jdExp: string): number {
    const lower = (jdExp || "").toLowerCase();
    if (lower.includes("fresher") || lower.includes("0") || lower === "not specified") return 85;
    if (lower.includes("1") || lower.includes("2")) {
      return studentExp.toLowerCase().includes("fresher") ? 60 : 85;
    }
    return studentExp.toLowerCase().includes("fresher") ? 40 : 75;
  },

  _matchEducation(studentEdu: string, jdEdu: string): number {
    const jdLower = (jdEdu || "").toLowerCase();
    const stuLower = (studentEdu || "").toLowerCase();
    if (jdLower === "not specified" || !jdLower) return 80;
    const hasBE = stuLower.includes("b.e") || stuLower.includes("b.tech") || stuLower.includes("btech") || stuLower.includes("bachelor");
    if (jdLower.includes("bachelor") || jdLower.includes("b.e") || jdLower.includes("b.tech")) {
      return hasBE ? 100 : 60;
    }
    return 75;
  },

  _keywordOverlap(text: string, words: string[]): number {
    if (!words || words.length === 0) return 50;
    const lower = text.toLowerCase();
    const matched = words.filter(w => lower.includes(w.toLowerCase())).length;
    return Math.min(95, Math.round((matched / words.length) * 100));
  },

  _matchRole(studentRole: string, jdTitle: string): number {
    if (!studentRole || studentRole === "N/A") return 50;
    const s = studentRole.toLowerCase();
    const j = jdTitle.toLowerCase();
    
    const roleWords = j.split(/\s+/);
    const matched = roleWords.filter(w => s.includes(w) && w.length > 3).length;
    if (matched >= 2) return 95;
    if (matched === 1) return 75;
    
    // Broad category match
    const devRoles = ["developer", "engineer", "software", "programmer", "coder"];
    const dataRoles = ["data", "analyst", "scientist", "ml", "ai", "analytics"];
    const isDevStudent = devRoles.some(r => s.includes(r));
    const isDevJD = devRoles.some(r => j.includes(r));
    const isDataStudent = dataRoles.some(r => s.includes(r));
    const isDataJD = dataRoles.some(r => j.includes(r));
    
    if (isDevStudent && isDevJD) return 80;
    if (isDataStudent && isDataJD) return 80;
    return 40;
  }
};
