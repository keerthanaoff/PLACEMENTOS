"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Search, Plus, Filter, Eye, Edit, Archive,
  GraduationCap, Download, Upload, SlidersHorizontal, X,
  FileSpreadsheet, FileText, FileCode2, Trophy, ArrowUpDown, 
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, AlertTriangle, Check, ArrowRight
} from "lucide-react";

import { studentService } from "@/services/storageService";
import { authService } from "@/services/authService";
import { usePathname } from "next/navigation";
import { MOCK_STUDENTS } from "@/lib/mock-data";
import { parseStudentExcelOrCsv, ImportAnalysisResult, ParsedStudentRow } from "@/lib/excelImporter";

export default function StudentsPage() {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"DEFAULT" | "CGPA" | "AI_SCORE">("DEFAULT");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Import Preview Modal State
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "OVERWRITE">("SKIP");
  const [previewTab, setPreviewTab] = useState<"ALL" | "VALID" | "DUPLICATE" | "INVALID">("ALL");

  // Notification State
  const [notification, setNotification] = useState<{ type: "SUCCESS" | "ERROR"; message: string } | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Manual Student Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const loadStudents = () => {
    const loaded = studentService.getAll().filter(s => !s.isArchived);
    setStudents(loaded.length > 0 ? loaded : MOCK_STUDENTS);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const departments = Array.from(new Set(students.map(s => s.department).filter(Boolean)));
  const years = Array.from(new Set(students.map(s => s.yearOfGraduation || s.graduation_year || 2026).filter(Boolean))).sort();

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    let result = students.filter(student => {
      const matchSearch = 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.skills?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDept = departmentFilter === "All" || student.department === departmentFilter;
      const matchYear = yearFilter === "All" || String(student.yearOfGraduation || student.graduation_year) === String(yearFilter);
      const matchStatus = statusFilter === "All" || student.placementStatus === statusFilter;

      return matchSearch && matchDept && matchYear && matchStatus;
    });

    if (sortBy === "CGPA") {
      result.sort((a, b) => {
        const valA = parseFloat(a.ugPercentageNum || a.ugPercentage || a.ug || 0);
        const valB = parseFloat(b.ugPercentageNum || b.ugPercentage || b.ug || 0);
        return valB - valA;
      });
    } else if (sortBy === "AI_SCORE") {
      result.sort((a, b) => (b.resumeScore || 0) - (a.resumeScore || 0));
    }

    return result;
  }, [students, searchTerm, departmentFilter, yearFilter, statusFilter, sortBy]);

  // Paginated Students
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // Top 5 AI Leaderboard Students
  const topRankedStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => (b.resumeScore || 0) - (a.resumeScore || 0))
      .slice(0, 5);
  }, [students]);

  // Excel/CSV Import Click Handler
  const handleImportClick = () => {
    const user = authService.getCurrentUser();
    if (!user) {
      setNotification({ type: "ERROR", message: "Authorization required to import students." });
      return;
    }
    fileInputRef.current?.click();
  };

  // File Upload Handler using parseStudentExcelOrCsv
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();

    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls") && !lowerName.endsWith(".csv")) {
      setNotification({ type: "ERROR", message: "Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV file." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const analysis = parseStudentExcelOrCsv(bstr, fileName);

        if (analysis.totalRows === 0) {
          setNotification({ type: "ERROR", message: "Uploaded Excel/CSV file is empty." });
          return;
        }

        setImportAnalysis(analysis);
        setPreviewTab("ALL");
        setDuplicateAction("SKIP");
      } catch (err: any) {
        setNotification({ type: "ERROR", message: err?.message || "Failed to parse file." });
      }
    };

    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  // Commit Import Action (Save Valid/Duplicate Records)
  const executeImportCommit = () => {
    if (!importAnalysis) return;

    let rowsToImport: ParsedStudentRow[] = [];
    if (duplicateAction === "OVERWRITE") {
      rowsToImport = [...importAnalysis.validRows, ...importAnalysis.duplicateRows];
    } else {
      rowsToImport = importAnalysis.validRows;
    }

    if (rowsToImport.length === 0) {
      setNotification({ type: "ERROR", message: "No valid records selected to import." });
      setImportAnalysis(null);
      return;
    }

    let insertedCount = 0;
    let updatedCount = 0;

    const existingStudents = studentService.getAll();

    rowsToImport.forEach(row => {
      const isExisting = existingStudents.some(s => 
        (s.rollNumber || s.id || "").toLowerCase().trim() === row.studentId.toLowerCase().trim()
      );

      const studentObject = {
        id: row.studentId,
        rollNumber: row.studentId,
        name: row.name,
        email: row.email,
        mobile: row.phone,
        department: row.department,
        yearOfGraduation: row.year,
        ugPercentage: row.cgpa,
        ugPercentageNum: parseFloat(row.cgpa) || 75,
        skills: row.skills,
        resumeLink: row.resumeLink,
        placementStatus: row.placementStatus,
        resumeScore: Math.floor(Math.random() * (95 - 70 + 1)) + 70,
        isArchived: false
      };

      studentService.save(studentObject);
      if (isExisting) updatedCount++;
      else insertedCount++;
    });

    loadStudents();
    setImportAnalysis(null);

    const totalImported = insertedCount + updatedCount;
    setNotification({
      type: "SUCCESS",
      message: `${totalImported} students imported successfully.`
    });
  };

  // Export Word (.docx) Handler
  const exportToWord = () => {
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const dataToExport = filteredStudents;

    let tableRows = dataToExport.map(s => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.rollNumber || s.id}</td>
        <td style="border: 1px solid #ddd; padding: 8px;"><b>${s.name}</b></td>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.department}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.yearOfGraduation || 2026}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.ugPercentageNum || s.ugPercentage}%</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.resumeScore}%</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.placementStatus || "UNPLACED"}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.email || "N/A"}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>PlacementOS Student Report</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4f46e5; margin-bottom: 5px;">PLACEMENTOS AI — STUDENT INTELLIGENCE REPORT</h1>
        <p style="color: #666; font-size: 14px;"><b>Report Date:</b> ${dateStr} | <b>Total Records:</b> ${dataToExport.length}</p>
        <p style="color: #666; font-size: 12px;"><b>Filters Applied:</b> Department: ${departmentFilter} | Year: ${yearFilter} | Status: ${statusFilter}</p>
        <hr style="border: 1px solid #eee; margin-bottom: 20px;" />
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #4f46e5; color: white;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Student ID</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Student Name</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Department</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Year</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">CGPA</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">AI Score</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Status</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Email</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PlacementOS_Student_Report_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsExportMenuOpen(false);
  };

  // Export PDF Handler
  const exportToPDF = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  // Manual Student Add/Edit Handlers
  const openAddModal = () => {
    setModalMode("ADD");
    setEditingStudent({
      name: "", rollNumber: "", department: "CSE", gender: "Male", studentType: "Day Scholar",
      sslcPercentage: "85", hscPercentage: "85", ugPercentage: "80", pgPercentage: "",
      email: "", mobile: "", yearOfGraduation: 2026,
      github: "", linkedin: "", portfolio: "", resumeLink: "", selfIntroLink: "", photoUrl: "",
      placementStatus: "UNPLACED", resumeScore: Math.floor(Math.random() * (95 - 65 + 1)) + 65
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: any) => {
    setModalMode("EDIT");
    setEditingStudent({ ...student });
    setIsModalOpen(true);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    studentService.save(editingStudent);
    loadStudents();
    setIsModalOpen(false);
    setNotification({ type: "SUCCESS", message: `Student "${editingStudent.name}" saved successfully!` });
  };

  const handleArchive = (id: string) => {
    if (window.confirm("Are you sure you want to archive/delete this student?")) {
      const student = studentService.getById(id);
      if (student) {
        student.isArchived = true;
        studentService.save(student);
        loadStudents();
      }
    }
  };

  // Derived Rows for Preview Modal
  const previewDisplayRows = useMemo(() => {
    if (!importAnalysis) return [];
    if (previewTab === "VALID") return importAnalysis.validRows;
    if (previewTab === "DUPLICATE") return importAnalysis.duplicateRows;
    if (previewTab === "INVALID") return importAnalysis.invalidRows;
    return importAnalysis.allRows;
  }, [importAnalysis, previewTab]);

  const importTargetCount = useMemo(() => {
    if (!importAnalysis) return 0;
    if (duplicateAction === "OVERWRITE") {
      return importAnalysis.validRows.length + importAnalysis.duplicateRows.length;
    }
    return importAnalysis.validRows.length;
  }, [importAnalysis, duplicateAction]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Excel/CSV Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-indigo-600 dark:text-indigo-400" /> 
            Student Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage, rank, import, and export student placement profiles.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import Button */}
          <button 
            onClick={handleImportClick}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Upload size={16} />
            <span>Import Students</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 transition-colors shadow-sm"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
                <button 
                  onClick={exportToPDF}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-left"
                >
                  <FileText size={16} className="text-red-500" />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={exportToWord}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-left border-t border-gray-100 dark:border-gray-800"
                >
                  <FileCode2 size={16} className="text-blue-500" />
                  <span>Download Word (.docx)</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Student Button */}
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between border shadow-sm animate-in fade-in duration-200 ${
          notification.type === "SUCCESS" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === "SUCCESS" ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" /> : <AlertCircle size={20} className="text-red-600 shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
      )}

      {/* AI Leaderboard Banner ("Top Students") */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400 w-6 h-6" />
            <h2 className="text-lg font-bold">Top AI-Ranked Candidates</h2>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-indigo-200 font-medium">Real-Time AI Resume Ranking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {topRankedStudents.map((st, idx) => (
            <div key={`top-${st.id || st.rollNumber || idx}-${idx}`} className="bg-white/10 backdrop-blur-md border border-white/15 p-3 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs ${
                  idx === 0 ? "bg-amber-400 text-gray-900" : idx === 1 ? "bg-gray-300 text-gray-900" : idx === 2 ? "bg-amber-700 text-white" : "bg-white/20 text-white"
                }`}>
                  {idx + 1}
                </span>
                <span className="text-xs font-bold text-emerald-300">{st.resumeScore}% AI</span>
              </div>
              <div className="mt-2">
                <p className="font-bold text-sm truncate">{st.name}</p>
                <p className="text-[11px] text-indigo-200 truncate">{st.department} • CGPA {st.ugPercentageNum || st.ugPercentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, skills..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
          />
        </div>
        
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => <option key={dept as string} value={dept as string}>{dept as string}</option>)}
          </select>

          <select 
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Graduation Years</option>
            {years.map(yr => <option key={String(yr)} value={String(yr)}>{String(yr)}</option>)}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="UNPLACED">Unplaced</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="PLACED">Placed</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="DEFAULT">Sort By: Default</option>
            <option value="CGPA">Sort By: Highest CGPA</option>
            <option value="AI_SCORE">Sort By: Highest AI Score</option>
          </select>
        </div>
      </div>

      {/* Main Student Intelligence Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">Year</th>
                <th className="px-6 py-4 text-center">CGPA</th>
                <th className="px-6 py-4 text-center">AI Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {paginatedStudents.map((student, idx) => (
                <tr key={`student-${student.id || student.rollNumber || idx}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">
                    {student.rollNumber || student.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{student.department}</td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 font-medium">
                    {student.yearOfGraduation || student.graduation_year || 2026}
                  </td>
                  <td className="px-6 py-4 text-center font-bold">
                    {student.ugPercentageNum || student.ugPercentage || student.ug || "75"}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                      student.resumeScore >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      student.resumeScore >= 70 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {student.resumeScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      student.placementStatus === 'PLACED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' :
                      student.placementStatus === 'SHORTLISTED' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' :
                      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                    }`}>
                      {student.placementStatus || "UNPLACED"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`${pathname}/${student.id}`} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                        <Eye size={18} />
                      </Link>
                      <button 
                        onClick={() => openEditModal(student)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleArchive(student.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Archive size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Showing {paginatedStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students</span>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* IMPORT PREVIEW MODAL */}
      {importAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-bold text-indigo-200 tracking-wider">Excel / CSV Import Analysis</p>
                <h2 className="text-xl font-bold flex items-center gap-2 mt-0.5">
                  <FileSpreadsheet size={22} />
                  {importAnalysis.fileName}
                </h2>
              </div>
              <button 
                onClick={() => setImportAnalysis(null)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X size={22} />
              </button>
            </div>

            {/* DETECTED COLUMNS SECTION (Requirement #6) */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-gray-200 dark:border-gray-800">
              <p className="text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300 tracking-wider mb-2">
                Detected Columns & Field Mapping
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {importAnalysis.detectedColumns.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">{col.excelColumn}</span>
                    <ArrowRight size={12} className="text-indigo-500 shrink-0" />
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{col.appField}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary KPI Badges */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold">
                  Total Rows: {importAnalysis.totalRows}
                </div>
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Valid: {importAnalysis.validRows.length}
                </div>
                <div className="px-3 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Duplicates: {importAnalysis.duplicateRows.length}
                </div>
                <div className="px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} /> Invalid: {importAnalysis.invalidRows.length}
                </div>
              </div>

              {/* Duplicate Handling Options */}
              {importAnalysis.duplicateRows.length > 0 && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
                  <span className="text-gray-500">Duplicate Handling:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="dupAction" 
                      checked={duplicateAction === "SKIP"} 
                      onChange={() => setDuplicateAction("SKIP")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Skip Duplicate</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="dupAction" 
                      checked={duplicateAction === "OVERWRITE"} 
                      onChange={() => setDuplicateAction("OVERWRITE")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Update Existing Student</span>
                  </label>
                </div>
              )}
            </div>

            {/* Filter Tabs & Preview Table */}
            <div className="p-6 space-y-4">
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                {[
                  { id: "ALL", label: `All (${importAnalysis.totalRows})` },
                  { id: "VALID", label: `Valid (${importAnalysis.validRows.length})` },
                  { id: "DUPLICATE", label: `Duplicates (${importAnalysis.duplicateRows.length})` },
                  { id: "INVALID", label: `Invalid (${importAnalysis.invalidRows.length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setPreviewTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewTab === tab.id 
                        ? "bg-indigo-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="max-h-[300px] overflow-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Row #</th>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">CGPA</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Validation Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                    {previewDisplayRows.map(row => (
                      <tr key={row.rowNumber} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-2.5 font-bold text-gray-400">{row.rowNumber}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{row.studentId || "—"}</td>
                        <td className="px-4 py-2.5 font-semibold">{row.name || "—"}</td>
                        <td className="px-4 py-2.5">{row.department}</td>
                        <td className="px-4 py-2.5 font-bold">{row.cgpa}%</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            row.status === "VALID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                            row.status === "DUPLICATE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                            "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {row.reason}
                        </td>
                      </tr>
                    ))}
                    {previewDisplayRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No records in this tab.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions with Dynamic Button (Requirement #12) */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                Ready to import: <b className="text-indigo-600 dark:text-indigo-400">{importTargetCount}</b> records
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setImportAnalysis(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={importTargetCount === 0}
                  onClick={executeImportCommit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>
                    Import {importTargetCount} Valid Student{importTargetCount === 1 ? "" : "s"}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Manual Student Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {modalMode === "ADD" ? "Add New Student" : "Edit Student Profile"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleModalSave} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Basic Details */}
                <div className="col-span-1 md:col-span-3 pb-2 border-b border-gray-100 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3></div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input required type="text" value={editingStudent?.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Roll Number *</label>
                  <input required type="text" value={editingStudent?.rollNumber} onChange={e => setEditingStudent({...editingStudent, rollNumber: e.target.value, id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                  <input required type="text" value={editingStudent?.department} onChange={e => setEditingStudent({...editingStudent, department: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input required type="email" value={editingStudent?.email} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                  <input type="text" value={editingStudent?.mobile} onChange={e => setEditingStudent({...editingStudent, mobile: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Graduation Year</label>
                  <input type="number" value={editingStudent?.yearOfGraduation} onChange={e => setEditingStudent({...editingStudent, yearOfGraduation: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                {/* Academics */}
                <div className="col-span-1 md:col-span-3 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Academic Details</h3></div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UG % / CGPA</label>
                  <input type="text" value={editingStudent?.ugPercentageNum || editingStudent?.ugPercentage} onChange={e => setEditingStudent({...editingStudent, ugPercentageNum: e.target.value, ugPercentage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HSC %</label>
                  <input type="text" value={editingStudent?.hscPercentage} onChange={e => setEditingStudent({...editingStudent, hscPercentage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SSLC %</label>
                  <input type="text" value={editingStudent?.sslcPercentage} onChange={e => setEditingStudent({...editingStudent, sslcPercentage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                {/* Links */}
                <div className="col-span-1 md:col-span-3 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white">Profiles & Status</h3></div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub Username</label>
                  <input type="text" value={editingStudent?.github} onChange={e => setEditingStudent({...editingStudent, github: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn Profile</label>
                  <input type="text" value={editingStudent?.linkedin} onChange={e => setEditingStudent({...editingStudent, linkedin: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio Link</label>
                  <input type="text" value={editingStudent?.portfolio} onChange={e => setEditingStudent({...editingStudent, portfolio: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placement Status</label>
                  <select value={editingStudent?.placementStatus} onChange={e => setEditingStudent({...editingStudent, placementStatus: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="UNPLACED">Unplaced</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="PLACED">Placed</option>
                  </select>
                </div>
                
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
                  {modalMode === "ADD" ? "Add Student" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
