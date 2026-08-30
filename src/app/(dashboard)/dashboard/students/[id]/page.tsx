"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  FileText, ExternalLink, Award, Briefcase, BookOpen, User, Globe, CheckCircle2, Video, Camera,
  Star, ChevronRight, TrendingUp
} from "lucide-react";
import { studentService } from "@/services/studentService";
import { jdService, StoredJD } from "@/services/jdService";

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [recommendedJobs, setRecommendedJobs] = useState<Array<{ jd: StoredJD; score: number }>>([]);
  
  const student = studentService.getStudentById(resolvedParams.id) || {
    id: resolvedParams.id,
    rollNumber: resolvedParams.id,
    name: "Student Record",
    department: "General",
    gender: "N/A",
    residenceType: "N/A",
    sslc: "N/A",
    hsc: "N/A",
    ug: "N/A",
    pg: "N/A",
    email: "N/A",
    mobile: "N/A",
    github: "N/A",
    linkedin: "N/A",
    resumeLink: "N/A",
    selfIntroLink: "N/A",
    photoLink: "N/A",
    portfolioLink: "N/A",
    graduationYear: 2027,
    skills: "N/A",
    education: "N/A",
    experience: "Fresher",
    project: "N/A",
    jobRole: "N/A",
    location: "N/A",
    placementStatus: "YET_TO_BE_PLACED" as const,
    companyPlaced: "N/A",
    roleOffered: "N/A",
    packageCtc: "N/A",
    resumeScore: "N/A",
    archived: false
  };

  useEffect(() => {
    const jds = jdService.getAll();
    if (jds.length > 0 && student) {
      const scored = jds.map(jd => ({
        jd,
        score: jdService.calculateMatch(student, jd).overallScore,
      }));
      scored.sort((a, b) => b.score - a.score);
      setRecommendedJobs(scored.slice(0, 5));
    }
  }, [resolvedParams.id]);

  const hasPersonal = student.name || student.rollNumber || student.gender || student.location || student.email || student.mobile;
  const hasEducation = student.education || student.sslc || student.hsc || student.ug || student.pg || student.graduationYear;
  const hasProfessional = student.jobRole || student.experience || student.skills || student.companyPlaced;
  const hasProject = student.project && student.project !== "N/A";
  const hasOnlineProfiles = student.github || student.linkedin || student.portfolioLink || student.resumeLink || student.selfIntroLink || student.photoLink;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{student.name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {student.rollNumber || student.id}
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs font-medium">
            {student.department} • Class of {student.graduationYear}
          </p>
        </div>
      </div>

      {/* Top Placement Banner */}
      <div className={`p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        student.placementStatus === 'PLACED' 
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-teal-500/10 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
          : 'bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-orange-500/10 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <CheckCircle2 size={24} className={student.placementStatus === 'PLACED' ? 'text-emerald-600' : 'text-amber-600'} />
          <div>
            <p className="text-xs uppercase font-extrabold tracking-wider">Placement Status</p>
            <h3 className="text-lg font-bold">{student.placementStatus}</h3>
          </div>
        </div>

        {student.placementStatus === 'PLACED' && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div><span className="text-gray-500">Company:</span> <b className="text-gray-900 dark:text-white">{student.companyPlaced}</b></div>
            <div><span className="text-gray-500">Role:</span> <b className="text-gray-900 dark:text-white">{student.roleOffered || student.jobRole}</b></div>
            <div><span className="text-gray-500">Package:</span> <b className="text-emerald-600 dark:text-emerald-400">{student.packageCtc}</b></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. PERSONAL INFORMATION */}
        {hasPersonal && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <User size={16} />
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">Full Name</span>
                <span className="font-bold text-gray-900 dark:text-white">{student.name}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Roll Number / ID</span>
                <span className="font-bold text-gray-900 dark:text-white">{student.rollNumber || student.id}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Gender</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{student.gender || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Residence Type</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{student.residenceType || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Location</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{student.location || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Mobile Number</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{student.mobile || "N/A"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 font-medium block">Email Address</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{student.email || "N/A"}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. EDUCATION */}
        {hasEducation && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <BookOpen size={16} />
              Education & Academics
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">Degree / Course</span>
                <span className="font-bold text-gray-900 dark:text-white">{student.education || student.department}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Graduation Year</span>
                <span className="font-bold text-gray-900 dark:text-white">{student.graduationYear || 2027}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">SSLC (10th) %</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{student.sslc || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">HSC (12th) %</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{student.hsc || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">UG Percentage / CGPA</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{student.ug || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">PG Percentage</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">{student.pg || "N/A"}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. PROFESSIONAL PROFILE */}
        {hasProfessional && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Briefcase size={16} />
              Professional Profile
            </h2>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 font-medium block">Target / Placed Job Role</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.jobRole || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Experience Level</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{student.experience || "Fresher"}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 font-medium block mb-1">Technical Skills</span>
                <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-medium text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700">
                  {student.skills || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-medium block mb-1">Resume Match Score</span>
                <span className="font-bold text-gray-500">{student.resumeScore || "N/A"}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. PROJECT */}
        {hasProject && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Award size={16} />
              Featured Project
            </h2>
            <div className="text-xs space-y-2">
              <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-semibold text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700">
                {student.project}
              </p>
            </div>
          </div>
        )}

        {/* 5. ONLINE PROFILES & DOCUMENTS */}
        {hasOnlineProfiles && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <Globe size={16} />
              Online Profiles & Verified Documents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {student.github && student.github !== "N/A" && (
                <a href={student.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-700 dark:text-gray-300" />
                    <span className="font-bold text-gray-800 dark:text-gray-200">GitHub Profile</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </a>
              )}

              {student.linkedin && student.linkedin !== "N/A" && (
                <a href={student.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" />
                    <span className="font-bold text-gray-800 dark:text-gray-200">LinkedIn Profile</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </a>
              )}

              {student.resumeLink && student.resumeLink !== "N/A" && (
                <a href={student.resumeLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between hover:bg-indigo-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-indigo-600" />
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">Resume Document</span>
                  </div>
                  <ExternalLink size={14} className="text-indigo-500" />
                </a>
              )}

              {student.portfolioLink && student.portfolioLink !== "N/A" && (
                <a href={student.portfolioLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-emerald-600" />
                    <span className="font-bold text-gray-800 dark:text-gray-200">Portfolio Website</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </a>
              )}

              {student.photoLink && student.photoLink !== "N/A" && (
                <a href={student.photoLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-purple-600" />
                    <span className="font-bold text-gray-800 dark:text-gray-200">Student Photo</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </a>
              )}

              {student.selfIntroLink && student.selfIntroLink !== "N/A" && (
                <a href={student.selfIntroLink} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-red-500" />
                    <span className="font-bold text-gray-800 dark:text-gray-200">Self Introduction Video</span>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RECOMMENDED JOB OPPORTUNITIES */}
      {recommendedJobs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <Star size={16} />
            Recommended Job Opportunities
          </h2>
          <div className="space-y-3">
            {recommendedJobs.map(({ jd, score }, i) => (
              <div key={jd.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Link href={`/dashboard/jds/${jd.id}`} className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 truncate block">
                      {jd.jobTitle}
                    </Link>
                    <p className="text-xs text-gray-500">{jd.company} • {jd.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className={`text-lg font-extrabold ${
                      score >= 90 ? "text-emerald-600 dark:text-emerald-400" :
                      score >= 75 ? "text-blue-600 dark:text-blue-400" :
                      score >= 60 ? "text-amber-600 dark:text-amber-400" :
                      "text-red-600 dark:text-red-400"
                    }`}>
                      {score}%
                    </span>
                    <p className="text-[10px] text-gray-400">Match</p>
                  </div>
                  <Link href={`/dashboard/jds/${jd.id}`} className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 transition-colors">
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/dashboard/ai-resume" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              <TrendingUp size={12} /> View Full AI Analysis
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
