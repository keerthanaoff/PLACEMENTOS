"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, Download, FileSpreadsheet, FileText, Printer, 
  TrendingUp, Users, Award, Building2, CheckCircle2, Eye, X, Filter, SlidersHorizontal
} from "lucide-react";
import * as XLSX from "xlsx";

import { studentService, companyService, driveService, jdService } from "@/services/storageService";
import { MOCK_STUDENTS, MOCK_COMPANIES, MOCK_DRIVES, MOCK_JDS } from "@/lib/mock-data";

export default function ReportsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [jds, setJds] = useState<any[]>([]);

  // Filter State
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal Preview State
  const [previewReport, setPreviewReport] = useState<{ title: string; data: any[]; columns: { key: string; label: string }[] } | null>(null);

  useEffect(() => {
    const s = studentService.getAll().filter(st => !st.isArchived);
    setStudents(s.length > 0 ? s : MOCK_STUDENTS);

    const c = companyService.getAll();
    setCompanies(c.length > 0 ? c : MOCK_COMPANIES);

    const d = driveService.getAll();
    setDrives(d.length > 0 ? d : MOCK_DRIVES);

    const j = jdService.getAll();
    setJds(j.length > 0 ? j : MOCK_JDS);
  }, []);

  const departments = Array.from(new Set(students.map(s => s.department)));

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchDept = selectedDept === "All" || s.department === selectedDept;
      const matchStatus = selectedStatus === "All" || s.placementStatus === selectedStatus;
      return matchDept && matchStatus;
    });
  }, [students, selectedDept, selectedStatus]);

  // Derived Analytics Data
  const totalStudents = filteredStudents.length;
  const placedCount = filteredStudents.filter(s => s.placementStatus === "PLACED").length;
  const shortlistedCount = filteredStudents.filter(s => s.placementStatus === "SHORTLISTED").length;
  const unplacedCount = filteredStudents.filter(s => s.placementStatus === "UNPLACED" || !s.placementStatus).length;
  const placementRate = totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0;

  // Department Breakdown
  const deptStats = useMemo(() => {
    const stats: Record<string, { total: number; placed: number; rate: number }> = {};
    departments.forEach(dept => {
      const deptStudents = students.filter(s => s.department === dept);
      const total = deptStudents.length;
      const placed = deptStudents.filter(s => s.placementStatus === "PLACED").length;
      const rate = total > 0 ? Math.round((placed / total) * 100) : 0;
      stats[dept as string] = { total, placed, rate };
    });
    return stats;
  }, [students, departments]);

  // Download Helpers
  const triggerExcelDownload = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placement Data");
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

  // Report Data Generators
  const getStudentWiseData = () => filteredStudents.map(s => ({
    "Roll Number": s.rollNumber || s.id,
    "Student Name": s.name,
    "Department": s.department,
    "SSLC %": s.sslcPercentage || "N/A",
    "HSC %": s.hscPercentage || "N/A",
    "UG Degree": s.ugPercentage || "B.E.",
    "Placement Status": s.placementStatus || "UNPLACED",
    "ATS Score": s.resumeScore ? `${s.resumeScore}%` : "80%",
    "Email": s.email || "N/A",
    "Mobile": s.mobile || "N/A"
  }));

  const getCompanyWiseData = () => companies.map(c => ({
    "Company ID": c.id,
    "Company Name": c.name,
    "Industry": c.industry,
    "Location": c.location,
    "Company Type": c.type || "MNC",
    "Website": c.website || "N/A"
  }));

  const getDepartmentWiseData = () => Object.entries(deptStats).map(([dept, stat]) => ({
    "Department": dept,
    "Total Students": stat.total,
    "Placed Count": stat.placed,
    "Unplaced Count": stat.total - stat.placed,
    "Placement Rate": `${stat.rate}%`
  }));

  const getDriveWiseData = () => drives.map(d => ({
    "Drive ID": d.id,
    "Company ID": d.companyId,
    "Company Name": companies.find(c => c.id === d.companyId)?.name || "Partner Company",
    "Drive Type": d.driveType || "Campus Drive",
    "Drive Date": d.driveDate,
    "Venue": d.venue || "College Campus",
    "Eligibility": d.eligibility,
    "Status": d.status
  }));

  const getOfferWiseData = () => filteredStudents.filter(s => s.placementStatus === "PLACED").map(s => ({
    "Roll Number": s.rollNumber || s.id,
    "Student Name": s.name,
    "Department": s.department,
    "Placed Company": "TCS / Zoho",
    "Job Role": "Software Engineer",
    "Package (LPA)": "5.5 LPA",
    "Status": "OFFERED"
  }));

  const getCTCAnalysisData = () => filteredStudents.map(s => ({
    "Student Name": s.name,
    "Roll Number": s.rollNumber || s.id,
    "Department": s.department,
    "Status": s.placementStatus || "UNPLACED",
    "CTC Band": s.placementStatus === "PLACED" ? "4 - 6 LPA" : "N/A",
    "Estimated Package": s.placementStatus === "PLACED" ? "5.5 LPA" : "N/A"
  }));

  const getATSScoreData = () => filteredStudents.map(s => ({
    "Roll Number": s.rollNumber || s.id,
    "Student Name": s.name,
    "Department": s.department,
    "ATS Score": `${s.resumeScore || 80}%`,
    "Has Resume": s.resumeLink ? "Yes" : "No",
    "Has GitHub": s.github ? "Yes" : "No",
    "Has LinkedIn": s.linkedin ? "Yes" : "No"
  }));

  // Handle Card Clicks
  const handleReportAction = (type: string, action: "PREVIEW" | "EXCEL" | "CSV") => {
    let data: any[] = [];
    let title = "";
    let columns: { key: string; label: string }[] = [];

    switch (type) {
      case "Student-wise":
        title = "Student-wise Placement Report";
        data = getStudentWiseData();
        break;
      case "Company-wise":
        title = "Company-wise Partner Report";
        data = getCompanyWiseData();
        break;
      case "Department-wise":
        title = "Department-wise Analytics Report";
        data = getDepartmentWiseData();
        break;
      case "Drive-wise":
        title = "Drive-wise Recruitment Report";
        data = getDriveWiseData();
        break;
      case "Offer-wise":
        title = "Offer-wise Placement Report";
        data = getOfferWiseData();
        break;
      case "CTC Analysis":
        title = "CTC Package Analysis Report";
        data = getCTCAnalysisData();
        break;
      case "ATS Score":
        title = "Student ATS Resume Score Report";
        data = getATSScoreData();
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
            Placement Analytics & Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Download and view comprehensive placement reports in Excel, CSV, and PDF formats.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => triggerExcelDownload(getStudentWiseData(), "Placement_Master_Report_2026")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <FileSpreadsheet size={16} /> Download Master Excel
          </button>
          <button 
            onClick={() => triggerCSVDownload(getStudentWiseData(), "Placement_Master_Report_2026")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Download size={16} /> CSV Report
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Students</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Placed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{placedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shortlisted</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{shortlistedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unplaced</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{unplacedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Placement Rate</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{placementRate}%</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Package</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">5.2 LPA</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <SlidersHorizontal size={16} /> Filter Analytics:
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => <option key={dept as string} value={dept as string}>{dept as string}</option>)}
          </select>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Placement Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="UNPLACED">Unplaced</option>
          </select>
        </div>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Placement Rate Bar Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Department-wise Placement %
          </h2>
          <div className="space-y-3">
            {Object.entries(deptStats).map(([dept, stat]) => (
              <div key={dept} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">{dept} ({stat.placed} / {stat.total})</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{stat.rate}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-700" 
                    style={{ width: `${Math.max(stat.rate, 4)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTC Distribution & Placement Pie Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
            Placement Status Breakdown
          </h2>
          <div className="flex items-center justify-around py-4">
            <div 
              className="w-36 h-36 rounded-full border-4 border-white dark:border-gray-900 shadow-md relative"
              style={{
                background: `conic-gradient(
                  #10b981 0% ${totalStudents ? (placedCount/totalStudents)*100 : 0}%,
                  #f59e0b ${totalStudents ? (placedCount/totalStudents)*100 : 0}% ${totalStudents ? ((placedCount+shortlistedCount)/totalStudents)*100 : 0}%,
                  #9ca3af ${totalStudents ? ((placedCount+shortlistedCount)/totalStudents)*100 : 0}% 100%
                )`
              }}
            >
              <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{placementRate}%</span>
                <span className="text-[10px] text-gray-500 font-bold">PLACED</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-[#10b981]"></div>
                <span>Placed ({placedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-[#f59e0b]"></div>
                <span>Shortlisted ({shortlistedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-[#9ca3af]"></div>
                <span>Unplaced ({unplacedCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Report Cards Grid */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-4">
        Downloadable Placement Reports
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: "Student-wise", desc: "Detailed academic marks, status, ATS score, and contact details for all students." },
          { name: "Company-wise", desc: "Partner companies, locations, recruitment history, and drive metrics." },
          { name: "Department-wise", desc: "Department placement percentages, student counts, and offer distribution." },
          { name: "Drive-wise", desc: "Campus recruitment drives, dates, eligibility criteria, and venues." },
          { name: "Offer-wise", desc: "Offered students, company allocations, job roles, and package details." },
          { name: "CTC Analysis", desc: "Salary package distribution, average CTC, and top compensation bands." },
          { name: "ATS Score", desc: "Student resume ATS score rankings, profile links, and recommendations." }
        ].map(report => (
          <div key={report.name} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                <BarChart3 size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                READY
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{report.name} Report</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{report.desc}</p>
            </div>

            <div className="pt-2 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => handleReportAction(report.name, "PREVIEW")}
                className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <Eye size={14} /> View
              </button>
              <button 
                onClick={() => handleReportAction(report.name, "EXCEL")}
                className="flex items-center gap-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                title="Download Excel"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button 
                onClick={() => handleReportAction(report.name, "CSV")}
                className="flex items-center gap-1 py-2 px-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors"
                title="Download CSV"
              >
                <Download size={14} /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center text-white">
              <div>
                <p className="text-xs uppercase font-semibold text-indigo-200 tracking-wider">Report Preview</p>
                <h2 className="text-xl font-bold">{previewReport.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => triggerExcelDownload(previewReport.data, previewReport.title.replace(/\s+/g, "_"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button 
                  onClick={() => triggerCSVDownload(previewReport.data, previewReport.title.replace(/\s+/g, "_"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Download size={14} /> CSV
                </button>
                <button onClick={() => setPreviewReport(null)} className="text-white/70 hover:text-white ml-2">
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body Table */}
            <div className="p-6 max-h-[500px] overflow-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 sticky top-0">
                  <tr>
                    {previewReport.columns.map(col => (
                      <th key={col.key} className="px-4 py-3 whitespace-nowrap">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                  {previewReport.data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      {previewReport.columns.map(col => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap font-medium">
                          {row[col.key] !== undefined ? String(row[col.key]) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {previewReport.data.length === 0 && (
                    <tr>
                      <td colSpan={previewReport.columns.length} className="px-4 py-8 text-center text-gray-400">
                        No records found.
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
