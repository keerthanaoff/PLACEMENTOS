"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BrainCircuit, Play, FileText, User, Users, TrendingUp, 
  Award, Search, SlidersHorizontal, BarChart3, PieChart,
  Eye, CheckCircle2, ChevronRight, X, ExternalLink
} from "lucide-react";

import { studentService, companyService, jdService } from "@/services/storageService";
import { resumeAnalysisService, AnalysisResult } from "@/services/resumeAnalysisService";

export default function AIResumePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [jds, setJds] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  
  // Analysis State
  const [analysisResults, setAnalysisResults] = useState<Map<string, AnalysisResult>>(new Map());
  
  // UI State
  const [activeChart, setActiveChart] = useState<"BAR" | "PIE">("BAR");
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Highest Score");

  // JD Matcher State
  const [selectedJD, setSelectedJD] = useState("");
  const [selectedSingleStudent, setSelectedSingleStudent] = useState("");
  const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [jdMatchMode, setJdMatchMode] = useState(false);

  useEffect(() => {
    const loadedStudents = studentService.getAll().filter(s => !s.isArchived);
    setStudents(loadedStudents);
    setJds(jdService.getAll());
    setCompanies(companyService.getAll());

    if (loadedStudents.length > 0) {
      setSelectedSingleStudent(loadedStudents[0].id);
    }
    const allJds = jdService.getAll();
    if (allJds.length > 0) {
      setSelectedJD(allJds[0].id);
    }

    // Pre-calculate base scores for everyone
    const resultsMap = new Map<string, AnalysisResult>();
    loadedStudents.forEach(s => {
      resultsMap.set(s.id, resumeAnalysisService.analyzeStudentProfile(s));
    });
    setAnalysisResults(resultsMap);
  }, []);

  const departments = Array.from(new Set(students.map(s => s.department)));

  // Derived Data
  const filteredAndSortedStudents = useMemo(() => {
    return students
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = departmentFilter === "All" || s.department === departmentFilter;
        
        const score = analysisResults.get(s.id)?.overallScore || 0;
        let matchesScore = true;
        if (scoreFilter === "90+") matchesScore = score >= 90;
        else if (scoreFilter === "80+") matchesScore = score >= 80;
        else if (scoreFilter === "70+") matchesScore = score >= 70;
        else if (scoreFilter === "Below 70") matchesScore = score < 70;

        return matchesSearch && matchesDept && matchesScore;
      })
      .sort((a, b) => {
        const scoreA = jdMatchMode 
          ? (analysisResults.get(a.id)?.jdMatchScore || 0) 
          : (analysisResults.get(a.id)?.overallScore || 0);
        const scoreB = jdMatchMode 
          ? (analysisResults.get(b.id)?.jdMatchScore || 0) 
          : (analysisResults.get(b.id)?.overallScore || 0);

        if (sortBy === "Highest Score") return scoreB - scoreA;
        if (sortBy === "Lowest Score") return scoreA - scoreB;
        if (sortBy === "Name A-Z") return a.name.localeCompare(b.name);
        if (sortBy === "Department") return a.department.localeCompare(b.department);
        return 0;
      });
  }, [students, searchTerm, departmentFilter, scoreFilter, sortBy, analysisResults, jdMatchMode]);

  const topStudents = filteredAndSortedStudents.slice(0, 10);
  
  // Summary Stats
  const totalStudents = students.length;
  const scores = Array.from(analysisResults.values()).map(r => r.overallScore);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;
  const above80 = scores.filter(s => s >= 80).length;
  const above90 = scores.filter(s => s >= 90).length;

  const dist = resumeAnalysisService.getScoreDistribution(students, analysisResults);

  const handleAnalyzeAllJD = () => {
    setIsAnalyzingBatch(true);
    setJdMatchMode(true);
    setBatchProgress({ current: 0, total: students.length });
    
    const jd = jds.find(j => j.id === selectedJD);
    
    // Simulate batch processing
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setBatchProgress({ current, total: students.length });
      
      if (current >= students.length) {
        clearInterval(interval);
        
        // Calculate all JD matches
        const newResults = new Map(analysisResults);
        students.forEach(s => {
          const baseResult = newResults.get(s.id)!;
          newResults.set(s.id, resumeAnalysisService.calculateJDMatch(s, jd, baseResult));
        });
        setAnalysisResults(newResults);
        setSortBy("Highest Score"); // Force resort
        setIsAnalyzingBatch(false);
      }
    }, 50); // Fast simulation
  };

  const openAnalysisModal = (student: any) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="text-indigo-600 dark:text-indigo-400" /> 
            AI Resume Analysis
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analyze and rank every student's profile using deterministic scoring.</p>
        </div>
        {jdMatchMode && (
          <button 
            onClick={() => setJdMatchMode(false)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Clear JD Match
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-2"><Users size={14}/> Total Students</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-2"><TrendingUp size={14}/> Average Score</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{avgScore}%</div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-2"><Award size={14}/> Top Score</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{topScore}%</div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-2"><CheckCircle2 size={14}/> Above 80%</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{above80}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase mb-2"><Award size={14} className="text-amber-500"/> Above 90%</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{above90}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <SlidersHorizontal size={16} /> Filters:
          </div>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept as string} value={dept as string}>{dept as string}</option>
            ))}
          </select>
          <select value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="All">All Scores</option>
            <option value="90+">90+</option>
            <option value="80+">80+</option>
            <option value="70+">70+</option>
            <option value="Below 70">Below 70</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold">
            <option value="Highest Score">Highest Score</option>
            <option value="Lowest Score">Lowest Score</option>
            <option value="Name A-Z">Name A-Z</option>
            <option value="Department">Department</option>
          </select>
        </div>
      </div>

      {/* Visualizations */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {jdMatchMode ? "Top Students for Selected Job" : "Top Students by AI Resume Score"}
          </h2>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveChart("BAR")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeChart === "BAR" ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <BarChart3 size={16}/> Bar Chart
            </button>
            <button 
              onClick={() => setActiveChart("PIE")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeChart === "PIE" ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <PieChart size={16}/> Pie Chart
            </button>
          </div>
        </div>

        {activeChart === "BAR" && (
          <div className="space-y-4">
            {topStudents.slice(0, 5).map(student => {
              const score = jdMatchMode 
                ? (analysisResults.get(student.id)?.jdMatchScore || 0)
                : (analysisResults.get(student.id)?.overallScore || 0);
              
              return (
                <div key={student.id} className="flex items-center gap-4 group">
                  <div className="w-32 truncate text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                    {student.name}
                  </div>
                  <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-r-lg rounded-l-sm relative flex items-center">
                    <div 
                      className={`h-full rounded-r-lg rounded-l-sm transition-all duration-1000 flex items-center justify-end px-3 ${
                        score >= 90 ? 'bg-indigo-500' : score >= 80 ? 'bg-indigo-400' : score >= 70 ? 'bg-indigo-300' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.max(score, 5)}%` }}
                    >
                      <span className="text-white font-bold text-xs shadow-sm">{score}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {topStudents.length === 0 && <div className="text-center text-gray-500 py-8">No students found.</div>}
          </div>
        )}

        {activeChart === "PIE" && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-12">
              {/* CSS Conic Gradient Pie Chart */}
              <div 
                className="w-48 h-48 rounded-full border-4 border-white dark:border-gray-900 shadow-lg relative"
                style={{
                  background: `conic-gradient(
                    #10b981 0% ${(dist.excellent/totalStudents)*100}%,
                    #6366f1 ${(dist.excellent/totalStudents)*100}% ${((dist.excellent+dist.veryGood)/totalStudents)*100}%,
                    #f59e0b ${((dist.excellent+dist.veryGood)/totalStudents)*100}% ${((dist.excellent+dist.veryGood+dist.good)/totalStudents)*100}%,
                    #ef4444 ${((dist.excellent+dist.veryGood+dist.good)/totalStudents)*100}% 100%
                  )`
                }}
              >
                <div className="absolute inset-0 m-auto w-32 h-32 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</span>
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Students</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#10b981]"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Excellent (90-100)</span>
                  <span className="text-sm font-bold">{dist.excellent}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#6366f1]"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Very Good (80-89)</span>
                  <span className="text-sm font-bold">{dist.veryGood}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#f59e0b]"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Good (70-79)</span>
                  <span className="text-sm font-bold">{dist.good}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#ef4444]"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Needs Impr. (&lt;70)</span>
                  <span className="text-sm font-bold">{dist.needsImprovement}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm">Top Students Ranked</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 text-center">Rank</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">UG %</th>
                <th className="px-6 py-4 text-center">AI Score</th>
                <th className="px-6 py-4 text-center">Links</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {topStudents.map((student, index) => {
                const result = analysisResults.get(student.id);
                const score = jdMatchMode ? (result?.jdMatchScore || 0) : (result?.overallScore || 0);

                return (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-gray-400">#{index + 1}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.rollNumber}</p>
                    </td>
                    <td className="px-6 py-4"><span className="text-gray-700 dark:text-gray-300 font-medium">{student.department}</span></td>
                    <td className="px-6 py-4 text-center font-medium">{student.ugPercentageNum || student.ugPercentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        score >= 90 ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400' :
                        score >= 70 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {student.resumeLink && <span title="Resume"><FileText className="w-4 h-4 text-indigo-500" /></span>}
                        {student.github && <span title="GitHub"><User className="w-4 h-4 text-gray-700 dark:text-gray-300" /></span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openAnalysisModal(student)}
                        className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-xs ml-auto transition-colors bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg"
                      >
                        <BrainCircuit size={14} /> View Analysis
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JD Matching Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Description AI Matching</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-indigo-500" /> Select Job Description (JD)
            </label>
            <select 
              value={selectedJD}
              onChange={(e) => setSelectedJD(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {jds.map(j => {
                const comp = companies.find(c => c.id === j.companyId);
                return <option key={j.id} value={j.id}>{comp?.name || 'Company'} - {j.jobTitle}</option>
              })}
            </select>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleAnalyzeAllJD}
              disabled={isAnalyzingBatch}
              className="flex-1 flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {isAnalyzingBatch ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div> 
                  Analyzing {batchProgress.current} / {batchProgress.total}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play size={18} /> Analyze All Students
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Modal */}
      {isModalOpen && selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-start text-white">
              <div>
                <p className="text-indigo-100 font-semibold text-sm uppercase tracking-wider mb-1">Profile-based Analysis</p>
                <h2 className="text-2xl font-bold">{selectedStudentForModal.name}</h2>
                <p className="text-indigo-100">{selectedStudentForModal.department} • {selectedStudentForModal.rollNumber} • Class of {selectedStudentForModal.yearOfGraduation || "2024"}</p>
              </div>
              <div className="text-right">
                <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors mb-2">
                  <X size={24} />
                </button>
                <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                  <span className="text-3xl font-extrabold">{
                    jdMatchMode 
                      ? analysisResults.get(selectedStudentForModal.id)?.jdMatchScore 
                      : analysisResults.get(selectedStudentForModal.id)?.overallScore
                  }%</span>
                  <p className="text-[10px] uppercase font-bold tracking-wider">{jdMatchMode ? "JD Match" : "Overall Score"}</p>
                </div>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left: Breakdowns */}
                <div className="space-y-5">
                  <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">Score Breakdown</h3>
                  
                  {[
                    { label: "Academic Score", val: analysisResults.get(selectedStudentForModal.id)?.academicScore, max: 25 },
                    { label: "Resume Availability", val: analysisResults.get(selectedStudentForModal.id)?.resumeScore, max: 15 },
                    { label: "GitHub Profile", val: analysisResults.get(selectedStudentForModal.id)?.githubScore, max: 10 },
                    { label: "LinkedIn Profile", val: analysisResults.get(selectedStudentForModal.id)?.linkedinScore, max: 10 },
                    { label: "Portfolio", val: analysisResults.get(selectedStudentForModal.id)?.portfolioScore, max: 10 },
                    { label: "Profile Completeness", val: analysisResults.get(selectedStudentForModal.id)?.profileCompleteness, max: 30 }
                  ].map((cat, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600 dark:text-gray-400 uppercase tracking-wider">{cat.label}</span>
                        <span className="text-gray-900 dark:text-white">{cat.val} / {cat.max}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${((cat.val || 0) / cat.max) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right: Insights */}
                <div className="space-y-6">
                  
                  <div>
                    <h3 className="font-bold text-emerald-600 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-900/30 pb-2 mb-3">Key Strengths</h3>
                    <ul className="space-y-2">
                      {analysisResults.get(selectedStudentForModal.id)?.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                      {analysisResults.get(selectedStudentForModal.id)?.strengths.length === 0 && (
                        <li className="text-sm text-gray-500 italic">No notable strengths identified.</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/30 pb-2 mb-3">Missing Information</h3>
                    <ul className="space-y-2">
                      {analysisResults.get(selectedStudentForModal.id)?.weaknesses.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2"></div>
                          <span>{s}</span>
                        </li>
                      ))}
                      {analysisResults.get(selectedStudentForModal.id)?.weaknesses.length === 0 && (
                        <li className="text-sm text-gray-500 italic">Profile is comprehensive.</li>
                      )}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  {analysisResults.get(selectedStudentForModal.id)?.suggestions.length ? (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
                      <h4 className="font-bold text-amber-800 dark:text-amber-500 text-sm mb-2">Improvement Suggestions</h4>
                      <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-1">
                        {analysisResults.get(selectedStudentForModal.id)?.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
