"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { 
  Users, Search, Filter, Upload, Download, Eye, X, 
  CheckCircle2, AlertCircle, AlertTriangle, ArrowRight, 
  ChevronLeft, ChevronRight, FileSpreadsheet, ExternalLink, Check, SlidersHorizontal 
} from "lucide-react";
import { studentService } from "@/services/studentService";
import { StudentRecord } from "@/lib/studentCsvData";
import { parseStudentExcelOrCsv, ImportAnalysisResult, ParsedStudentRow } from "@/lib/excelImporter";

export default function StudentIntelligencePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filters State
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [educationFilter, setEducationFilter] = useState("ALL");
  const [jobRoleFilter, setJobRoleFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [experienceFilter, setExperienceFilter] = useState("ALL");
  const [gradYearFilter, setGradYearFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    photo: true,
    sno: true,
    roll: true,
    name: true,
    dept: true,
    gender: true,
    education: true,
    experience: true,
    location: true,
    jobRole: true,
    skills: true,
    resumeScore: true,
    status: true,
    actions: true
  });
  const [showColumnToggle, setShowColumnToggle] = useState(false);

  // Import Modal State
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult<any> | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "OVERWRITE">("SKIP");
  const [previewTab, setPreviewTab] = useState<"ALL" | "VALID" | "DUPLICATE" | "INVALID">("ALL");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = () => {
    const data = studentService.getStudents();
    setStudents(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Searched Students
  const filteredStudents = useMemo(() => {
    let list = students;

    // Apply Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(s => 
        s.rollNumber?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.skills?.toLowerCase().includes(q) ||
        s.education?.toLowerCase().includes(q) ||
        s.jobRole?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      );
    }

    // Apply Multi-Filters
    if (departmentFilter !== "ALL") list = list.filter(s => s.department === departmentFilter);
    if (genderFilter !== "ALL") list = list.filter(s => s.gender === genderFilter);
    if (educationFilter !== "ALL") list = list.filter(s => s.education?.includes(educationFilter));
    if (jobRoleFilter !== "ALL") list = list.filter(s => s.jobRole?.toLowerCase().includes(jobRoleFilter.toLowerCase()));
    if (locationFilter !== "ALL") list = list.filter(s => s.location?.toLowerCase().includes(locationFilter.toLowerCase()));
    if (experienceFilter !== "ALL") list = list.filter(s => s.experience === experienceFilter);
    if (gradYearFilter !== "ALL") list = list.filter(s => String(s.graduationYear) === String(gradYearFilter));
    if (statusFilter !== "ALL") list = list.filter(s => s.placementStatus === statusFilter);

    return list;
  }, [
    students, searchTerm, departmentFilter, genderFilter, educationFilter, 
    jobRoleFilter, locationFilter, experienceFilter, gradYearFilter, statusFilter
  ]);

  // Reset Page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm, departmentFilter, genderFilter, educationFilter, 
    jobRoleFilter, locationFilter, experienceFilter, gradYearFilter, statusFilter, pageSize
  ]);

  // Paginated Students
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Unique Filter Options
  const departmentOptions = useMemo(() => Array.from(new Set(students.map(s => s.department).filter(Boolean))), [students]);
  const jobRoleOptions = useMemo(() => Array.from(new Set(students.map(s => s.jobRole).filter(Boolean))), [students]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const analysis = parseStudentExcelOrCsv(bstr, file.name);

        if (analysis.totalRows === 0) {
          alert("Uploaded file is empty.");
          return;
        }

        setImportAnalysis(analysis);
        setPreviewTab("ALL");
        setDuplicateAction("SKIP");
      } catch (err: any) {
        alert(err?.message || "Failed to parse CSV/Excel file.");
      }
    };

    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  // Commit Import
  const executeImportCommit = () => {
    if (!importAnalysis) return;

    const rowsToImport = duplicateAction === "OVERWRITE"
      ? [...importAnalysis.validRows, ...importAnalysis.duplicateRows]
      : importAnalysis.validRows;

    if (rowsToImport.length === 0) {
      alert("No valid records to import.");
      setImportAnalysis(null);
      return;
    }

    const mappedRecords: StudentRecord[] = rowsToImport.map((r: any) => {
      const d = r.data || r;
      return {
        id: d.rollNumber || d.studentId || d.id || `S_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        rollNumber: d.rollNumber || d.studentId || d.id || "N/A",
        name: d.name || "Unknown",
        department: d.department || "General",
        gender: d.gender || "N/A",
        residenceType: d.residenceType || "N/A",
        sslc: d.sslc || "N/A",
        hsc: d.hsc || "N/A",
        ug: d.cgpa || d.ug || "N/A",
        pg: d.pg || "N/A",
        email: d.email || "N/A",
        mobile: d.phone || d.mobile || "N/A",
        github: d.github || "N/A",
        linkedin: d.linkedin || "N/A",
        resumeLink: d.resumeLink || d.resume || "N/A",
        selfIntroLink: d.selfIntroLink || "N/A",
        photoLink: d.photoLink || "N/A",
        portfolioLink: d.portfolioLink || "N/A",
        graduationYear: d.year ? parseInt(String(d.year)) : 2027,
        skills: d.skills || "N/A",
        education: d.education || d.department || "N/A",
        experience: d.experience || "Fresher",
        project: d.project || "N/A",
        jobRole: d.jobRole || "N/A",
        location: d.location || "N/A",
        placementStatus: (d.placementStatus as any) || "YET_TO_BE_PLACED",
        companyPlaced: d.companyPlaced || "N/A",
        roleOffered: d.roleOffered || "N/A",
        packageCtc: d.packageCtc || "N/A",
        resumeScore: "N/A",
        archived: false
      };
    });

    const summary = studentService.importStudents(mappedRecords);
    loadData();
    setImportAnalysis(null);

    setSuccessMessage(`CSV Import Complete: ${summary.imported} students imported successfully. ${summary.duplicates} duplicate records skipped.`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const previewDisplayRows = useMemo(() => {
    if (!importAnalysis) return [];
    if (previewTab === "VALID") return importAnalysis.validRows;
    if (previewTab === "DUPLICATE") return importAnalysis.duplicateRows;
    if (previewTab === "INVALID") return importAnalysis.invalidRows;
    return importAnalysis.allRows;
  }, [importAnalysis, previewTab]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv, .xlsx, .xls" 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-indigo-600 dark:text-indigo-400" />
            Student Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Complete candidate profiles, academic records, and recruitment tracking ({students.length} Total Students).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Column Toggle */}
          <button
            onClick={() => setShowColumnToggle(!showColumnToggle)}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <SlidersHorizontal size={14} />
            <span>Columns</span>
          </button>

          {/* Import Students Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Upload size={14} />
            <span>+ Import Students</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Column Visibility Selector Panel */}
      {showColumnToggle && (
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Toggle Table Columns</p>
          <div className="flex flex-wrap gap-3">
            {Object.keys(visibleColumns).map(col => (
              <label key={col} className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 capitalize cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns[col]}
                  onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>{col.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Roll No, Name, Dept, Skill, Role, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                showFilterPanel ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expandable Multi-Filter Panel */}
        {showFilterPanel && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Department</label>
              <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Departments</option>
                {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Gender</label>
              <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Job Role</label>
              <select value={jobRoleFilter} onChange={e => setJobRoleFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Roles</option>
                {jobRoleOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Placement Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Statuses</option>
                <option value="PLACED">PLACED</option>
                <option value="YET_TO_BE_PLACED">YET_TO_BE_PLACED</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Student Intelligence Table with Horizontal Scroll */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                {visibleColumns.photo && <th className="px-4 py-3">Photo</th>}
                {visibleColumns.sno && <th className="px-4 py-3">S.No</th>}
                {visibleColumns.roll && <th className="px-4 py-3">Roll Number</th>}
                {visibleColumns.name && <th className="px-4 py-3">Name</th>}
                {visibleColumns.dept && <th className="px-4 py-3">Department</th>}
                {visibleColumns.gender && <th className="px-4 py-3">Gender</th>}
                {visibleColumns.education && <th className="px-4 py-3">Education</th>}
                {visibleColumns.experience && <th className="px-4 py-3">Experience</th>}
                {visibleColumns.location && <th className="px-4 py-3">Location</th>}
                {visibleColumns.jobRole && <th className="px-4 py-3">Job Role</th>}
                {visibleColumns.skills && <th className="px-4 py-3">Skills</th>}
                {visibleColumns.resumeScore && <th className="px-4 py-3">Resume Score</th>}
                {visibleColumns.status && <th className="px-4 py-3">Placement Status</th>}
                {visibleColumns.actions && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {paginatedStudents.map((student, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr key={`st-${student.id || student.rollNumber}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    {visibleColumns.photo && (
                      <td className="px-4 py-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shadow-sm">
                          {student.photoLink && student.photoLink.startsWith("http") ? (
                            <img src={student.photoLink} alt={student.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            student.name?.charAt(0) || "S"
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.sno && <td className="px-4 py-2.5 font-bold text-gray-400">{globalIndex}</td>}
                    {visibleColumns.roll && <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">{student.rollNumber || student.id}</td>}
                    {visibleColumns.name && (
                      <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">
                        <Link href={`/dashboard/students/${encodeURIComponent(student.id || student.rollNumber)}`} className="hover:underline hover:text-indigo-600">
                          {student.name}
                        </Link>
                      </td>
                    )}
                    {visibleColumns.dept && <td className="px-4 py-2.5">{student.department}</td>}
                    {visibleColumns.gender && <td className="px-4 py-2.5">{student.gender || "N/A"}</td>}
                    {visibleColumns.education && <td className="px-4 py-2.5">{student.education || "Undergraduate"}</td>}
                    {visibleColumns.experience && <td className="px-4 py-2.5">{student.experience || "Fresher"}</td>}
                    {visibleColumns.location && <td className="px-4 py-2.5">{student.location || "N/A"}</td>}
                    {visibleColumns.jobRole && <td className="px-4 py-2.5 font-semibold">{student.jobRole || "N/A"}</td>}
                    {visibleColumns.skills && (
                      <td className="px-4 py-2.5 max-w-xs truncate" title={student.skills}>
                        {student.skills || "N/A"}
                      </td>
                    )}
                    {visibleColumns.resumeScore && <td className="px-4 py-2.5 font-bold text-gray-400">{student.resumeScore || "N/A"}</td>}
                    {visibleColumns.status && (
                      <td className="px-4 py-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          student.placementStatus === 'PLACED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300'
                        }`}>
                          {student.placementStatus || 'YET_TO_BE_PLACED'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/dashboard/students/${encodeURIComponent(student.id || student.rollNumber)}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Eye size={14} />
                          <span>View Profile</span>
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-6 py-16 text-center text-gray-500">
                    <Users size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-bold text-gray-800 dark:text-gray-200">No Students Found</p>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="font-semibold text-gray-500">
            Showing {filteredStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-gray-800 dark:text-gray-200 px-2">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
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
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-bold text-indigo-200 tracking-wider">CSV Import Analysis & Validation</p>
                <h2 className="text-xl font-bold flex items-center gap-2 mt-0.5">
                  <FileSpreadsheet size={22} />
                  {importAnalysis.fileName}
                </h2>
              </div>
              <button onClick={() => setImportAnalysis(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X size={22} />
              </button>
            </div>

            {/* DETECTED COLUMNS */}
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

            {/* KPI Badges */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold">Total: {importAnalysis.totalRows}</div>
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Valid: {importAnalysis.validRows.length}</div>
                <div className="px-3 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Duplicates: {importAnalysis.duplicateRows.length}</div>
                <div className="px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Invalid: {importAnalysis.invalidRows.length}</div>
              </div>

              {importAnalysis.duplicateRows.length > 0 && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
                  <span className="text-gray-500">Duplicates:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="stDupAction" checked={duplicateAction === "SKIP"} onChange={() => setDuplicateAction("SKIP")} />
                    <span>Skip</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="stDupAction" checked={duplicateAction === "OVERWRITE"} onChange={() => setDuplicateAction("OVERWRITE")} />
                    <span>Overwrite</span>
                  </label>
                </div>
              )}
            </div>

            {/* Table Preview */}
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
                      previewTab === tab.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
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
                      <th className="px-4 py-3">Roll Number</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">UG CGPA</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Validation Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                    {previewDisplayRows.map((row: any, idx: number) => {
                      const d = row.data || row;
                      return (
                        <tr key={`prev-${row.rowNumber || idx}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                          <td className="px-4 py-2.5 font-bold text-gray-400">{row.rowNumber || idx + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">{d.rollNumber || d.studentId || "N/A"}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{d.name || "N/A"}</td>
                          <td className="px-4 py-2.5">{d.department || "N/A"}</td>
                          <td className="px-4 py-2.5 font-bold">{d.cgpa || d.ug || "N/A"}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              row.status === "VALID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                              row.status === "DUPLICATE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                              "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            }`}>
                              {row.status || "VALID"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{row.reason || "Ready to import"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                Ready to import: <b className="text-indigo-600 dark:text-indigo-400">
                  {duplicateAction === "OVERWRITE" ? importAnalysis.validRows.length + importAnalysis.duplicateRows.length : importAnalysis.validRows.length}
                </b> students
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setImportAnalysis(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100">Cancel</button>
                <button onClick={executeImportCommit} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                  <Check size={16} />
                  <span>Import Students</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
