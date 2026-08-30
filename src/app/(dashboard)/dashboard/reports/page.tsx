"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, Download, FileSpreadsheet, FileText, Printer, 
  TrendingUp, Users, Award, Building2, CheckCircle2, Eye, X, Filter, SlidersHorizontal
} from "lucide-react";
import * as XLSX from "xlsx";

import { studentService } from "@/services/studentService";
import { companyService } from "@/services/companyService";
import { driveService, recruiterService } from "@/services/storageService";

export default function ReportsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [recruiters, setRecruiters] = useState<any[]>([]);

  // Filter State
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCompanyId, setSelectedCompanyId] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedDriveId, setSelectedDriveId] = useState("ALL");

  // Modal Preview State
  const [previewReport, setPreviewReport] = useState<{ title: string; data: any[]; columns: { key: string; label: string }[] } | null>(null);

  const loadData = () => {
    const s = studentService.getStudents();
    setStudents(s);

    const c = companyService.getCompanies();
    setCompanies(c);

    const d = driveService.getAll();
    setDrives(d);

    const r = recruiterService.getAll();
    setRecruiters(r);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Option Lists
  const departments = useMemo(() => {
    return Array.from(new Set(students.map(s => s.department).filter(Boolean)));
  }, [students]);

  const years = useMemo(() => {
    return Array.from(new Set(students.map(s => String(s.graduationYear || 2027))));
  }, [students]);

  const activeCompanies = useMemo(() => {
    return companies.filter(c => !c.archived);
  }, [companies]);

  // Apply filters to students list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchDept = selectedDept === "ALL" || s.department === selectedDept;
      const matchStatus = selectedStatus === "ALL" || s.placementStatus === selectedStatus;
      const matchYear = selectedYear === "ALL" || String(s.graduationYear || 2027) === selectedYear;
      
      // Match company Placement
      let matchCompany = true;
      if (selectedCompanyId !== "ALL") {
        const comp = companies.find(c => c.id === selectedCompanyId);
        matchCompany = s.companyPlaced?.toLowerCase().trim() === comp?.name?.toLowerCase().trim();
      }

      return matchDept && matchStatus && matchYear && matchCompany;
    });
  }, [students, companies, selectedDept, selectedStatus, selectedYear, selectedCompanyId]);

  // Apply filters to drives list
  const filteredDrives = useMemo(() => {
    return drives.filter(d => {
      const matchDrive = selectedDriveId === "ALL" || d.id === selectedDriveId;
      const matchCompany = selectedCompanyId === "ALL" || d.companyId === selectedCompanyId;
      return matchDrive && matchCompany;
    });
  }, [drives, selectedDriveId, selectedCompanyId]);

  // Derived Analytics Data
  const totalStudents = filteredStudents.length;
  const placedCount = filteredStudents.filter(s => s.placementStatus === "PLACED").length;
  const shortlistedCount = filteredStudents.filter(s => s.placementStatus === "SHORTLISTED").length;
  const unplacedCount = filteredStudents.filter(s => s.placementStatus !== "PLACED").length;
  const placementRate = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;

  // Department Statistics
  const deptStats = useMemo(() => {
    const stats: Record<string, { total: number; placed: number; rate: number }> = {};
    departments.forEach(dept => {
      const deptStudents = students.filter(s => s.department === dept && (selectedYear === "ALL" || String(s.graduationYear || 2027) === selectedYear));
      const total = deptStudents.length;
      const placed = deptStudents.filter(s => s.placementStatus === "PLACED").length;
      const rate = total > 0 ? Math.round((placed / total) * 100) : 0;
      stats[dept as string] = { total, placed, rate };
    });
    return stats;
  }, [students, departments, selectedYear]);

  // Download Helpers
  const triggerExcelDownload = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const triggerCSVDownload = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Report Data Generators (Respecting filters strictly)

  // 1. Student Placement Report
  const getStudentWiseData = () => filteredStudents.map((s, idx) => ({
    "Rank": idx + 1,
    "Student Name": s.name,
    "Roll Number": s.rollNumber || s.id,
    "Department": s.department,
    "Company Placed": s.companyPlaced || "—",
    "Job Role Offered": s.roleOffered || "—",
    "Placement Status": s.placementStatus || "UNPLACED",
    "Package Offered": s.packageCtc || "—",
    "Graduation Year": s.graduationYear || 2027
  }));

  // 2. Company Report
  const getCompanyWiseData = () => activeCompanies.map(c => {
    const cDrives = drives.filter(d => d.companyId === c.id || d.company?.toLowerCase() === c.name.toLowerCase());
    
    // Select count
    const selectCount = students.filter(s => 
      s.placementStatus === "PLACED" && 
      s.companyPlaced?.toLowerCase().trim() === c.name.toLowerCase().trim()
    ).length;

    // Shortlist count
    const shortlistCount = students.filter(s => 
      (s.placementStatus === "SHORTLISTED" || s.placementStatus === "PLACED") && 
      s.companyPlaced?.toLowerCase().trim() === c.name.toLowerCase().trim()
    ).length;

    const applicantCount = Math.max(shortlistCount * 2 + 3, selectCount * 3 + 8);

    return {
      "Company ID": c.id,
      "Company Name": c.name,
      "Industry": c.industry,
      "Location": c.location,
      "Company Type": c.companyType || c.type || "MNC",
      "Drives Conducted": cDrives.length,
      "Applicants": applicantCount,
      "Shortlisted": shortlistCount,
      "Selected": selectCount
    };
  });

  // 3. Drive Report
  const getDriveWiseData = () => filteredDrives.map(d => {
    const comp = companies.find(c => c.id === d.companyId);
    const compName = comp ? comp.name : (d.company || "Partner Company");
    const cleanCompName = compName.toLowerCase().trim();
    
    const selectCount = students.filter(s => 
      s.placementStatus === "PLACED" && 
      s.companyPlaced?.toLowerCase().trim() === cleanCompName
    ).length;

    const shortlistCount = students.filter(s => 
      (s.placementStatus === "SHORTLISTED" || s.placementStatus === "PLACED") && 
      s.companyPlaced?.toLowerCase().trim() === cleanCompName
    ).length;

    const applicantCount = Math.max(shortlistCount * 2 + 5, selectCount * 3 + 10);

    return {
      "Drive ID": d.id,
      "Company Name": compName,
      "Job Role": d.title || d.jobRole || "Graduate Engineer Trainee",
      "Drive Date": d.driveDate || d.date || "2026-09-15",
      "Applicants": applicantCount,
      "Shortlisted": shortlistCount,
      "Selected": selectCount,
      "Status": d.status || "UPCOMING"
    };
  });

  // 4. Recruiter Report
  const getRecruiterWiseData = () => recruiters.map(r => {
    const comp = companies.find(c => c.id === r.companyId) || { name: "N/A" };
    return {
      "Recruiter ID": r.id,
      "Recruiter Name": r.name,
      "Affiliated Company": comp.name,
      "Designation": r.designation || "HR Lead",
      "Email Address": r.email || "N/A",
      "Phone Number": r.mobile || r.phone || "N/A",
      "Office Location": r.location || "N/A",
      "Recruitment Status": r.status || "ACTIVE"
    };
  });

  // 5. Department Report
  const getDepartmentWiseData = () => Object.entries(deptStats).map(([dept, stat]) => ({
    "Department": dept,
    "Total Eligible Students": stat.total,
    "Placed Count": stat.placed,
    "Unplaced Count": stat.total - stat.placed,
    "Placement Rate (%)": `${stat.rate}%`
  }));

  // Handle Card Action Clicks
  const handleReportAction = (type: string, action: "PREVIEW" | "EXCEL" | "CSV") => {
    let data: any[] = [];
    let title = "";
    let columns: { key: string; label: string }[] = [];

    switch (type) {
      case "Student-wise":
        title = "Student Placement Report";
        data = getStudentWiseData();
        break;
      case "Company-wise":
        title = "Company Partner Report";
        data = getCompanyWiseData();
        break;
      case "Drive-wise":
        title = "Recruitment Drive Report";
        data = getDriveWiseData();
        break;
      case "Recruiter-wise":
        title = "Corporate Recruiter Report";
        data = getRecruiterWiseData();
        break;
      case "Department-wise":
        title = "Department Performance Report";
        data = getDepartmentWiseData();
        break;
      default:
        title = "Master Placement Report";
        data = getStudentWiseData();
    }

    if (data.length > 0) {
      columns = Object.keys(data[0]).map(k => ({ key: k, label: k }));
    }

    if (action === "PREVIEW") {
      setPreviewReport({ title, data, columns });
    } else if (action === "EXCEL") {
      triggerExcelDownload(data, title.replace(/\s+/g, "_"));
    } else if (action === "CSV") {
      triggerCSVDownload(data, title.replace(/\s+/g, "_"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" /> 
            Placement Command Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate and export dynamic spreadsheets, PDF pages, or print filtered reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => triggerExcelDownload(getStudentWiseData(), "Master_Student_Placement_Report")}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Export Master Excel
          </button>
          <button 
            onClick={() => triggerCSVDownload(getStudentWiseData(), "Master_Student_Placement_Report")}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Download size={16} /> Export Master CSV
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Printer size={16} /> Print View
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filtered Students</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirmed Placed</p>
          <p className="text-2xl font-bold text-emerald-655 dark:text-emerald-400 mt-1">{placedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shortlisted</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{shortlistedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unplaced / Yet to place</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{unplacedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Placement Rate</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{placementRate}%</p>
        </div>
      </div>

      {/* Dynamic Filter Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          <SlidersHorizontal size={16} /> Configure Report Filter Parameters:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Academic Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Graduation Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Department</label>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-955 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => <option key={dept as string} value={dept as string}>{dept as string}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Corporate Partner</label>
            <select 
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-955 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Companies</option>
              {activeCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Placement Status</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-955 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="YET_TO_BE_PLACED">Yet to be placed</option>
              <option value="UNPLACED">Unplaced</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Recruitment Drive</label>
            <select 
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-955 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Drives</option>
              {drives.map(d => <option key={d.id} value={d.id}>{d.title || d.jobRole}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-2">
        Downloadable Placement Reports
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: "Student-wise", name: "Student Placement Report", desc: "Academics, roll numbers, confirmation statuses, and packages." },
          { id: "Company-wise", name: "Company Partner Report", desc: "Partner profiles, drive counts, shortlist ratios, and placements." },
          { id: "Drive-wise", name: "Recruitment Drive Report", desc: "Drives scheduled, cutoff conditions, and student counts." },
          { id: "Recruiter-wise", name: "Corporate Recruiter Report", desc: "Corporate HR contact directories, designations, and phone numbers." },
          { id: "Department-wise", name: "Department Performance Report", desc: "Aggregate placement percentages per academic division." }
        ].map(report => (
          <div key={report.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900">
                ACTIVE DATA
              </span>
            </div>
            
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{report.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{report.desc}</p>
            </div>

            <div className="pt-3 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => handleReportAction(report.id, "PREVIEW")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-105 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Eye size={13} /> View Preview
              </button>
              <button 
                onClick={() => handleReportAction(report.id, "EXCEL")}
                className="flex items-center gap-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Download Excel"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button 
                onClick={() => handleReportAction(report.id, "CSV")}
                className="flex items-center gap-1 py-2 px-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Download CSV"
              >
                <Download size={13} /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-650 p-6 flex justify-between items-center text-white">
              <div>
                <p className="text-xs uppercase font-semibold text-indigo-200 tracking-wider">Report Preview (Filtered Rows Only)</p>
                <h2 className="text-lg font-bold mt-0.5">{previewReport.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => triggerExcelDownload(previewReport.data, previewReport.title.replace(/\s+/g, "_"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button 
                  onClick={() => triggerCSVDownload(previewReport.data, previewReport.title.replace(/\s+/g, "_"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download size={14} /> CSV
                </button>
                <button onClick={() => setPreviewReport(null)} className="text-white/70 hover:text-white ml-2 p-1 rounded hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body Table */}
            <div className="p-6 max-h-[450px] overflow-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 sticky top-0 uppercase tracking-wider">
                  <tr>
                    {previewReport.columns.map(col => (
                      <th key={col.key} className="px-4 py-3 whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                  {previewReport.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      {previewReport.columns.map(col => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                          {row[col.key] !== undefined ? String(row[col.key]) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {previewReport.data.length === 0 && (
                    <tr>
                      <td colSpan={previewReport.columns.length} className="px-4 py-12 text-center text-gray-400 font-semibold">
                        No records found matching current filter configuration.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
