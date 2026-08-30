"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, Briefcase, BookOpen, DollarSign,
  Users, Code, CheckCircle2, List, Target, FileText, BarChart3,
  Star, AlertCircle, ChevronRight, Loader2
} from "lucide-react";
import { jdService, StoredJD, MatchResult } from "@/services/jdService";
import { studentService } from "@/services/studentService";

export default function JDDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [jd, setJd] = useState<StoredJD | null>(null);
  const [topMatches, setTopMatches] = useState<Array<MatchResult & { studentName: string; studentRoll: string }>>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    const found = jdService.getById(id);
    setJd(found);

    if (found) {
      computeMatches(found);
    }
  }, [id]);

  const computeMatches = (jd: StoredJD) => {
    setLoadingMatches(true);
    const students = studentService.getStudents().filter((s: any) => !s.isArchived);
    const results = students.map((s: any) => {
      const match = jdService.calculateMatch(s, jd);
      return { ...match, studentName: s.name, studentRoll: s.rollNumber || s.id };
    });
    results.sort((a, b) => b.overallScore - a.overallScore);
    setTopMatches(results.slice(0, 10));
    setLoadingMatches(false);
  };

  if (!jd) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle size={40} className="text-amber-500" />
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">JD Not Found</h3>
          <p className="text-gray-500 mt-1 text-sm">This JD may have been deleted.</p>
        </div>
        <Link href="/dashboard/jds" className="flex items-center gap-2 text-indigo-600 hover:underline text-sm font-medium">
          <ArrowLeft size={16} /> Back to JD Intelligence
        </Link>
      </div>
    );
  }

  const fields = [
    { label: "Company", value: jd.company, icon: Building2 },
    { label: "Location", value: jd.location, icon: MapPin },
    { label: "Experience Required", value: jd.experience, icon: Briefcase },
    { label: "Education Required", value: jd.education, icon: BookOpen },
    { label: "Salary / CTC", value: jd.salary, icon: DollarSign },
    { label: "Openings", value: jd.openings, icon: Users },
    { label: "Industry", value: jd.industry, icon: Building2 },
    { label: "Job Type", value: jd.jobType, icon: Target },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/jds" className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{jd.jobTitle}</h1>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              jd.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700"
            }`}>{jd.status}</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{jd.company} • {jd.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/jds/${id}/match`} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <BarChart3 size={16} /> Full Analysis
          </Link>
        </div>
      </div>

      {/* Source File Info */}
      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center gap-3">
        <FileText size={18} className="text-indigo-600 shrink-0" />
        <div>
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Original JD File</p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">{jd.filename}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Briefcase size={16} /> Job Overview
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.label}>
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1 mb-0.5">
                    <f.icon size={11} /> {f.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          {jd.skills.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Code size={16} /> Required Skills ({jd.skills.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {jd.skills.map(s => (
                  <span key={s} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-lg border border-purple-200 dark:border-purple-800">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {jd.keywords.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target size={16} /> Keywords
              </h2>
              <div className="flex flex-wrap gap-2">
                {jd.keywords.map(k => (
                  <span key={k} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {jd.responsibilities.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <List size={16} /> Responsibilities
              </h2>
              <ul className="space-y-2">
                {jd.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <ChevronRight size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Eligibility */}
          {jd.eligibility.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> Eligibility Criteria
              </h2>
              <ul className="space-y-2">
                {jd.eligibility.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recruitment Process */}
          {jd.recruitmentProcess.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target size={16} /> Recruitment Process
              </h2>
              <ol className="space-y-2">
                {jd.recruitmentProcess.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Top Matching Students Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star size={16} /> Top Matching Students
            </h2>
            {loadingMatches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              </div>
            ) : topMatches.length === 0 ? (
              <div className="text-center py-6">
                <Users size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No students found</p>
                <p className="text-xs text-gray-400 mt-1">Import students to see matches</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topMatches.map((m, i) => (
                  <div key={m.studentId} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/dashboard/students/${m.studentId}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 truncate block">
                          {m.studentName}
                        </Link>
                        <p className="text-[10px] text-gray-400">{m.studentRoll}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold ${jdService.getScoreColor(m.overallScore)}`}>
                        {m.overallScore}%
                      </span>
                      {m.isDemoResume && (
                        <p className="text-[9px] text-amber-500 font-bold">DEMO</p>
                      )}
                    </div>
                  </div>
                ))}
                <Link href={`/dashboard/jds/${id}/match`} className="flex items-center justify-center gap-1 mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  View Full Analysis <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* Raw Text Preview */}
          {jd.rawText && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={14} /> Extracted Text Preview
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {jd.rawText.slice(0, 800)}…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
