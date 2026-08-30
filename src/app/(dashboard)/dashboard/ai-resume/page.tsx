"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  BrainCircuit, Users, FileText, TrendingUp, Award, Search,
  SlidersHorizontal, BarChart3, PieChart, Eye, X, Download,
  CheckCircle2, AlertTriangle, XCircle, ChevronUp, ChevronDown, Loader2,
  Target, Code, Zap, BookOpen
} from "lucide-react";
import Link from "next/link";
import { studentService } from "@/services/studentService";
import { jdService, StoredJD, MatchResult, ScoreCategory } from "@/services/jdService";

// ─────────────────────── Types ────────────────────────────────────────────
interface ComputedMatch extends MatchResult {
  studentName: string;
  studentRoll: string;
  studentDept: string;
  jdTitle: string;
  jdCompany: string;
  rank: number;
}

// ─────────────────────── Score helpers ───────────────────────────────────
function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-blue-600 dark:text-blue-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function scoreBadge(score: number) {
  if (score >= 90) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  if (score >= 75) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (score >= 60) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800";
}
function scoreLabel(score: number): ScoreCategory {
  return jdService.getScoreCategory(score);
}
function recIcon(rec: MatchResult["recommendation"]) {
  if (rec === "STRONGLY_RECOMMENDED") return <span className="text-emerald-500 font-bold text-xs">🟢 Strongly Recommended</span>;
  if (rec === "RECOMMENDED") return <span className="text-blue-500 font-bold text-xs">🔵 Recommended</span>;
  if (rec === "CONSIDER") return <span className="text-amber-500 font-bold text-xs">🟡 Consider</span>;
  return <span className="text-red-500 font-bold text-xs">🔴 Not Recommended</span>;
}

// ─────────────────────── Mini Chart Components ────────────────────────────
function PieChartSVG({ data }: { data: Array<{ label: string; count: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>;
  
  let cumAngle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 70;
  const segments = data.map(d => {
    const angle = (d.count / total) * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    return { ...d, start, end: cumAngle, angle };
  });
  
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={160} height={160} viewBox="0 0 160 160">
        {segments.map((s, i) => {
          if (s.angle < 0.01) return null;
          const x1 = cx + r * Math.cos(s.start);
          const y1 = cy + r * Math.sin(s.start);
          const x2 = cx + r * Math.cos(s.end);
          const y2 = cy + r * Math.sin(s.end);
          const large = s.angle > Math.PI ? 1 : 0;
          return (
            <path
              key={i}
              d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
              fill={s.color}
              stroke="white"
              strokeWidth={2}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={30} fill="white" className="dark:fill-gray-900" />
        <text x={cx} y={cy + 4} textAnchor="middle" className="text-[10px]" fontSize={10} fill="currentColor">{total}</text>
      </svg>
      <div className="space-y-2">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-gray-700 dark:text-gray-300">{s.label}</span>
            <span className="font-bold text-gray-900 dark:text-white">{s.count}</span>
            <span className="text-gray-400">({total > 0 ? Math.round(s.count / total * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChartSVG({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barH = 20, gap = 6, labelW = 130, valueW = 35;
  const totalH = data.length * (barH + gap);
  const chartW = 260;
  
  return (
    <svg width={labelW + chartW + valueW} height={totalH} viewBox={`0 0 ${labelW + chartW + valueW} ${totalH}`}>
      {data.map((d, i) => {
        const y = i * (barH + gap);
        const barW = (d.value / max) * chartW;
        return (
          <g key={i}>
            <text x={labelW - 6} y={y + barH - 5} textAnchor="end" fontSize={10} fill="currentColor" className="text-gray-600 dark:text-gray-400">
              {d.label.length > 16 ? d.label.slice(0, 16) + "…" : d.label}
            </text>
            <rect x={labelW} y={y} width={Math.max(barW, 4)} height={barH} fill={d.color} rx={3} />
            <text x={labelW + barW + 5} y={y + barH - 5} fontSize={10} fill="currentColor" fontWeight="bold" className="text-gray-900 dark:text-white">
              {d.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────── Main Component ───────────────────────────────────
export default function AIResumePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [jds, setJds] = useState<StoredJD[]>([]);
  const [allMatches, setAllMatches] = useState<ComputedMatch[]>([]);
  const [computing, setComputing] = useState(false);
  const [hasComputed, setHasComputed] = useState(false);

  // Selected JD for analysis
  const [selectedJD, setSelectedJD] = useState<string>("ALL");
  
  // Modal state
  const [modalMatch, setModalMatch] = useState<ComputedMatch | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState("All");
  const [recFilter, setRecFilter] = useState("All");
  const [sortKey, setSortKey] = useState<"overallScore" | "skillsScore" | "studentName">("overallScore");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Chart mode
  const [activeChart, setActiveChart] = useState<"PIE" | "BAR" | "JD_BAR" | "SKILL_BAR">("PIE");

  useEffect(() => {
    const loadedStudents = studentService.getStudents().filter((s: any) => !s.isArchived);
    setStudents(loadedStudents);
    const allJDs = jdService.getAll();
    setJds(allJDs);
  }, []);

  // ── Compute all matches ───────────────────────────────────────────────
  const computeMatches = () => {
    if (jds.length === 0 || students.length === 0) return;
    setComputing(true);
    
    // Use setTimeout to let the UI render the loading state first
    setTimeout(() => {
      const matches: ComputedMatch[] = [];
      
      // For each JD, compute student matches
      const targetJDs = selectedJD === "ALL" ? jds : jds.filter(j => j.id === selectedJD);
      
      targetJDs.forEach(jd => {
        students.forEach((s: any, i) => {
          const m = jdService.calculateMatch(s, jd);
          matches.push({
            ...m,
            studentName: s.name,
            studentRoll: s.rollNumber || s.id,
            studentDept: s.department || "N/A",
            jdTitle: jd.jobTitle,
            jdCompany: jd.company,
            rank: 0,
          });
        });
      });
      
      // Sort and rank
      matches.sort((a, b) => b.overallScore - a.overallScore);
      matches.forEach((m, i) => { m.rank = i + 1; });
      
      setAllMatches(matches);
      setComputing(false);
      setHasComputed(true);
    }, 100);
  };

  // ── Filters ───────────────────────────────────────────────────────────
  const depts = useMemo(() => ["All", ...Array.from(new Set(students.map((s: any) => s.department).filter(Boolean)))], [students]);
  
  const filtered = useMemo(() => {
    return allMatches.filter(m => {
      const q = search.toLowerCase();
      const matchQ = !q || m.studentName.toLowerCase().includes(q) || m.studentRoll.toLowerCase().includes(q) || m.jdTitle.toLowerCase().includes(q) || m.jdCompany.toLowerCase().includes(q);
      const matchDept = deptFilter === "All" || m.studentDept === deptFilter;
      const matchRec = recFilter === "All" || m.recommendation === recFilter;
      
      let matchScore = true;
      if (scoreFilter === "90%+") matchScore = m.overallScore >= 90;
      else if (scoreFilter === "80%+") matchScore = m.overallScore >= 80;
      else if (scoreFilter === "70%+") matchScore = m.overallScore >= 70;
      else if (scoreFilter === "60%+") matchScore = m.overallScore >= 60;
      else if (scoreFilter === "Below 60%") matchScore = m.overallScore < 60;
      
      return matchQ && matchDept && matchRec && matchScore;
    }).sort((a, b) => {
      const valA = sortKey === "studentName" ? a.studentName : a[sortKey];
      const valB = sortKey === "studentName" ? b.studentName : b[sortKey];
      if (typeof valA === "string") return sortDir === "asc" ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
      return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [allMatches, search, deptFilter, recFilter, scoreFilter, sortKey, sortDir]);

  // ── Chart Data ────────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const cats = { Excellent: 0, Good: 0, Moderate: 0, Low: 0 };
    filtered.forEach(m => { cats[scoreLabel(m.overallScore)]++; });
    return [
      { label: "Excellent (90-100)", count: cats.Excellent, color: "#10b981" },
      { label: "Good (75-89)", count: cats.Good, color: "#3b82f6" },
      { label: "Moderate (60-74)", count: cats.Moderate, color: "#f59e0b" },
      { label: "Low (<60)", count: cats.Low, color: "#ef4444" },
    ];
  }, [filtered]);

  const topBarData = useMemo(() => {
    const top10 = [...filtered].sort((a, b) => b.overallScore - a.overallScore).slice(0, 10);
    return top10.map(m => ({
      label: `${m.studentName.split(" ")[0]} – ${m.jdTitle.slice(0, 20)}`,
      value: m.overallScore,
      color: m.overallScore >= 90 ? "#10b981" : m.overallScore >= 75 ? "#3b82f6" : m.overallScore >= 60 ? "#f59e0b" : "#ef4444",
    }));
  }, [filtered]);

  const jdBarData = useMemo(() => {
    const byJD: Record<string, number[]> = {};
    allMatches.forEach(m => {
      if (!byJD[m.jdTitle]) byJD[m.jdTitle] = [];
      byJD[m.jdTitle].push(m.overallScore);
    });
    return Object.entries(byJD).map(([jdTitle, scores]) => ({
      label: jdTitle,
      value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      color: "#6366f1",
    })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [allMatches]);

  const skillBarData = useMemo(() => {
    const byJD: Record<string, number[]> = {};
    allMatches.forEach(m => {
      if (!byJD[m.jdTitle]) byJD[m.jdTitle] = [];
      byJD[m.jdTitle].push(m.skillsScore);
    });
    return Object.entries(byJD).map(([jdTitle, scores]) => ({
      label: jdTitle,
      value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      color: "#8b5cf6",
    })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [allMatches]);

  // ── Summary KPIs ─────────────────────────────────────────────────────
  const avgScore = allMatches.length > 0
    ? Math.round(allMatches.reduce((s, m) => s + m.overallScore, 0) / allMatches.length)
    : 0;
  const highlyMatched = allMatches.filter(m => m.overallScore >= 75).length;
  const interviewRec = allMatches.filter(m => m.recommendation === "STRONGLY_RECOMMENDED" || m.recommendation === "RECOMMENDED").length;
  const lowMatch = allMatches.filter(m => m.overallScore < 60).length;

  // ── Export CSV ────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = "Rank,Student,Student ID,Department,JD,Company,Skills Match,Exp Match,Edu Match,Project Match,Overall Score,Recommendation,Missing Skills\n";
    const rows = filtered.map((m, i) =>
      `${i + 1},"${m.studentName}","${m.studentRoll}","${m.studentDept}","${m.jdTitle}","${m.jdCompany}",${m.skillsScore}%,${m.experienceScore}%,${m.educationScore}%,${m.projectScore}%,${m.overallScore}%,${m.recommendation},"${m.missingSkills.join("; ")}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ai_resume_matches.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: typeof sortKey }) => {
    if (sortKey !== field) return null;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const handleSort = (field: typeof sortKey) => {
    if (sortKey === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(field); setSortDir("desc"); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="text-indigo-600 dark:text-indigo-400" />
            AI Resume Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Weighted JD ↔ Resume matching engine with skill gap analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasComputed && (
            <button onClick={exportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download size={16} /> Export CSV
            </button>
          )}
          <button
            onClick={computeMatches}
            disabled={computing || jds.length === 0 || students.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {computing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {computing ? "Computing…" : hasComputed ? "Re-Analyze" : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* JD Selector */}
      {jds.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <FileText size={14} /> Analyze for:
          </span>
          <select
            value={selectedJD}
            onChange={e => setSelectedJD(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All JDs ({jds.length})</option>
            {jds.map(jd => (
              <option key={jd.id} value={jd.id}>{jd.jobTitle} – {jd.company}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">
            {students.length} students × {selectedJD === "ALL" ? jds.length : 1} JD(s) = {students.length * (selectedJD === "ALL" ? jds.length : 1)} potential matches
          </span>
        </div>
      )}

      {/* No JDs prompt */}
      {jds.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle size={24} className="text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300">No JDs available</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Import JD PDFs from the{" "}
              <Link href="/dashboard/jds" className="underline font-bold">JD Intelligence</Link>{" "}
              module to enable matching.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {hasComputed && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Resumes", value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Total JDs", value: jds.length, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { label: "Total Matches", value: allMatches.length, icon: Target, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { label: "Avg Match Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Highly Matched", value: highlyMatched, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Interview Ready", value: interviewRec, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Low Matches", value: lowMatch, icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "Avg Skills Match", value: `${allMatches.length > 0 ? Math.round(allMatches.reduce((s, m) => s + m.skillsScore, 0) / allMatches.length) : 0}%`, icon: Code, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {hasComputed && allMatches.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" /> Analytics Charts
            </h2>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {([["PIE", "Match Distribution"], ["BAR", "Top Candidates"], ["JD_BAR", "Avg by JD"], ["SKILL_BAR", "Skills by JD"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveChart(key)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${activeChart === key ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            {activeChart === "PIE" && <PieChartSVG data={pieData} />}
            {activeChart === "BAR" && (
              <div>
                <p className="text-xs text-gray-500 mb-3">Top 10 students by overall match score</p>
                <BarChartSVG data={topBarData} />
              </div>
            )}
            {activeChart === "JD_BAR" && (
              <div>
                <p className="text-xs text-gray-500 mb-3">Average match score per JD</p>
                <BarChartSVG data={jdBarData} />
              </div>
            )}
            {activeChart === "SKILL_BAR" && (
              <div>
                <p className="text-xs text-gray-500 mb-3">Average skill match score per JD</p>
                <BarChartSVG data={skillBarData} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters for Table */}
      {hasComputed && (
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search student, JD, company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500">
            {depts.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500">
            {["All", "90%+", "80%+", "70%+", "60%+", "Below 60%"].map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={recFilter} onChange={e => setRecFilter(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500">
            {["All", "STRONGLY_RECOMMENDED", "RECOMMENDED", "CONSIDER", "NOT_RECOMMENDED"].map(s => <option key={s}>{s}</option>)}
          </select>
          <span className="text-xs text-gray-400 flex items-center">{filtered.length} results</span>
        </div>
      )}

      {/* Matching Results Table */}
      {hasComputed && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">JD Resume Matching Results</h3>
            <span className="text-xs text-gray-500">{filtered.length} matches</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  {["#", "Student", "JD / Company", "Skills", "Exp", "Edu", "Projects", "Overall", "Recommendation", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.slice(0, 50).map((m, i) => (
                  <tr key={`${m.studentId}_${m.jdId}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/students/${m.studentId}`} className="text-sm font-semibold text-indigo-600 hover:underline">{m.studentName}</Link>
                      <p className="text-[10px] text-gray-400">{m.studentRoll} • {m.studentDept}</p>
                      {m.isDemoResume && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">DEMO RESUME</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/jds/${m.jdId}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 block">{m.jdTitle}</Link>
                      <p className="text-[10px] text-gray-400">{m.jdCompany}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`text-sm font-bold ${scoreColor(m.skillsScore)}`}>{m.skillsScore}%</span></td>
                    <td className="px-4 py-3"><span className={`text-sm font-bold ${scoreColor(m.experienceScore)}`}>{m.experienceScore}%</span></td>
                    <td className="px-4 py-3"><span className={`text-sm font-bold ${scoreColor(m.educationScore)}`}>{m.educationScore}%</span></td>
                    <td className="px-4 py-3"><span className={`text-sm font-bold ${scoreColor(m.projectScore)}`}>{m.projectScore}%</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-sm font-extrabold border ${scoreBadge(m.overallScore)}`}>
                        {m.overallScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3">{recIcon(m.recommendation)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setModalMatch(m)} className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 transition-colors" title="View Skill Gap">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Showing 50 of {filtered.length} matches. Use filters to narrow results or export CSV for all.
              </div>
            )}
          </div>
        </div>
      )}

      {/* No analysis yet */}
      {!hasComputed && !computing && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
            <BrainCircuit size={40} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Analyze</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-6">
            {jds.length === 0
              ? "Import JDs from JD Intelligence first, then click Run Analysis."
              : `Click "Run Analysis" to compute match scores for ${students.length} students across ${jds.length} JDs using the weighted scoring formula.`}
          </p>
          {jds.length > 0 && (
            <button onClick={computeMatches} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors">
              <Zap size={16} /> Run Analysis Now
            </button>
          )}
        </div>
      )}

      {/* Skill Gap Modal */}
      {modalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Skill Gap Analysis</h3>
                <p className="text-sm text-gray-500">{modalMatch.studentName} → {modalMatch.jdTitle}</p>
              </div>
              <button onClick={() => setModalMatch(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Overall Score */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="font-bold text-gray-700 dark:text-gray-300">Overall Match</span>
                <span className={`text-2xl font-extrabold ${scoreColor(modalMatch.overallScore)}`}>{modalMatch.overallScore}%</span>
              </div>

              {/* Score Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Score Breakdown</h4>
                <div className="space-y-2">
                  {[
                    { label: "Skills Match", score: modalMatch.skillsScore, weight: "35%" },
                    { label: "Experience Match", score: modalMatch.experienceScore, weight: "15%" },
                    { label: "Education Match", score: modalMatch.educationScore, weight: "10%" },
                    { label: "Projects Match", score: modalMatch.projectScore, weight: "15%" },
                    { label: "Keyword Match", score: modalMatch.keywordScore, weight: "10%" },
                    { label: "Role Match", score: modalMatch.roleScore, weight: "10%" },
                    { label: "Certifications", score: modalMatch.certScore, weight: "5%" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-36 shrink-0">{item.label} <span className="text-gray-400">({item.weight})</span></span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.score}%`, backgroundColor: item.score >= 75 ? "#10b981" : item.score >= 60 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right ${scoreColor(item.score)}`}>{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched Skills */}
              {modalMatch.matchedSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Matched Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {modalMatch.matchedSkills.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 size={10} /> {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {modalMatch.missingSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <XCircle size={14} className="text-red-500" /> Missing Skills (Gap: {modalMatch.missingSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {modalMatch.missingSkills.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-1">
                        <XCircle size={10} /> {s}
                      </span>
                    ))}
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">📚 Recommended to Learn</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">{modalMatch.missingSkills.slice(0, 5).join(" • ")}</p>
                  </div>
                </div>
              )}

              {/* Demo Resume Notice */}
              {modalMatch.isDemoResume && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <AlertTriangle size={12} /> Analysis based on demo/test resume data
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">This student's skills are extracted from their profile data (department, role, projects). Upload an actual resume for more accurate matching.</p>
                </div>
              )}

              <div className="text-center">
                {recIcon(modalMatch.recommendation)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
