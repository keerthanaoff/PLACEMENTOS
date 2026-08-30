export interface AnalysisResult {
  studentId: string;
  overallScore: number;
  academicScore: number;
  resumeScore: number;
  githubScore: number;
  linkedinScore: number;
  portfolioScore: number;
  profileCompleteness: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  jdMatchScore?: number;
}

export const resumeAnalysisService = {
  analyzeStudentProfile(student: any): AnalysisResult {
    let score = 0;
    
    let academicScore = 0;
    let resumeScore = 0;
    let githubScore = 0;
    let linkedinScore = 0;
    let portfolioScore = 0;
    let completenessScore = 0;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // Academics (25)
    const ug = Number(student.ugPercentageNum || student.ugPercentage || 0);
    if (ug >= 90) { academicScore += 25; strengths.push("Excellent UG academic record"); }
    else if (ug >= 80) { academicScore += 22; strengths.push("Strong UG academic record"); }
    else if (ug >= 70) { academicScore += 18; }
    else if (ug >= 60) { academicScore += 14; weaknesses.push("Average academic performance"); }
    else { academicScore += 10; weaknesses.push("Low academic performance"); suggestions.push("Focus on building strong technical projects to offset academics"); }
    
    score += academicScore;

    // Resume (15)
    if (student.resumeLink) {
      resumeScore = 15;
      score += 15;
      strengths.push("Resume is available");
    } else {
      weaknesses.push("Missing resume document");
      suggestions.push("Upload an ATS-friendly PDF resume immediately");
    }

    // GitHub (10)
    if (student.github) {
      githubScore = 10;
      score += 10;
      strengths.push("GitHub profile linked");
    } else {
      weaknesses.push("Missing GitHub profile");
      suggestions.push("Create a GitHub account and push your projects");
    }

    // LinkedIn (10)
    if (student.linkedin) {
      linkedinScore = 10;
      score += 10;
      strengths.push("LinkedIn profile linked");
    } else {
      weaknesses.push("Missing LinkedIn profile");
      suggestions.push("Create a professional LinkedIn profile");
    }

    // Portfolio (10)
    if (student.portfolio) {
      portfolioScore = 10;
      score += 10;
      strengths.push("Personal portfolio available");
    }

    // Profile Completeness & Metadata (30 max)
    if (student.selfIntroLink) {
      completenessScore += 5;
    }
    
    if (student.pgPercentage) {
      completenessScore += 5;
      strengths.push("Postgraduate qualification");
    }
    
    // Base metadata points
    if (student.email && student.mobile) completenessScore += 10;
    if (student.department) completenessScore += 10;

    score += completenessScore;

    // Cap at 100
    const overallScore = Math.min(score, 100);

    return {
      studentId: student.id,
      overallScore,
      academicScore,
      resumeScore,
      githubScore,
      linkedinScore,
      portfolioScore,
      profileCompleteness: completenessScore,
      strengths,
      weaknesses,
      suggestions
    };
  },

  getScoreDistribution(students: any[], results: Map<string, AnalysisResult>) {
    const dist = { excellent: 0, veryGood: 0, good: 0, needsImprovement: 0 };
    students.forEach(s => {
      const score = results.get(s.id)?.overallScore || 0;
      if (score >= 90) dist.excellent++;
      else if (score >= 80) dist.veryGood++;
      else if (score >= 70) dist.good++;
      else dist.needsImprovement++;
    });
    return dist;
  },

  calculateJDMatch(student: any, jd: any, baseResult: AnalysisResult): AnalysisResult {
    const baseMatch = baseResult.overallScore;
    
    let jdBonus = 0;
    const strengths = [...baseResult.strengths];
    const weaknesses = [...baseResult.weaknesses];
    
    // Skill matching if JD has skills
    let matchedSkills = 0;
    if (jd && jd.skills && jd.skills.length > 0) {
      // Mock deterministic check: student dept/github implies certain skills
      const deptLower = (student.department || "").toLowerCase();
      const techStudent = deptLower.includes("cse") || deptLower.includes("it");
      
      jd.skills.forEach((skill: string) => {
        // If they are a tech student, they have a higher chance of matching tech skills
        const hasSkill = techStudent ? 
          (student.id.length + skill.length) % 2 === 0 : 
          (student.id.length + skill.length) % 4 === 0;
          
        if (hasSkill) matchedSkills++;
      });
      
      const skillMatchPercent = matchedSkills / jd.skills.length;
      if (skillMatchPercent > 0.7) {
        jdBonus += 15;
        strengths.push("Strong match for required skills");
      } else if (skillMatchPercent > 0.4) {
        jdBonus += 5;
        strengths.push("Partial match for required skills");
      } else {
        jdBonus -= 10;
        weaknesses.push("Missing core skills required by the JD");
      }
    } else if (jd && jd.title && student.department) {
      const titleLower = jd.title.toLowerCase();
      const deptLower = student.department.toLowerCase();
      if ((titleLower.includes("software") || titleLower.includes("developer") || titleLower.includes("engineer")) && (deptLower.includes("cse") || deptLower.includes("it"))) {
        jdBonus += 5;
        strengths.push("Academic background aligns with role");
      }
    }
    
    // Generate a stable pseudo-random modifier between -5 and +5
    const modifier = jd ? ((student.id.length + (jd.id?.length || 0)) % 11) - 5 : 0;
    
    const finalScore = Math.min(Math.max(baseMatch + jdBonus + modifier, 0), 100);
    
    return {
      ...baseResult,
      strengths,
      weaknesses,
      jdMatchScore: finalScore
    };
  }
};
