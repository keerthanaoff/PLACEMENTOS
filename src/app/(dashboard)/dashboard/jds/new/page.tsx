"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useJD } from "@/context/JDContext";
import * as xlsx from "xlsx";
import { 
  ArrowLeft, FileSpreadsheet, Edit3, UploadCloud, 
  Download, CheckCircle, XCircle, AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function AddJDPage() {
  const router = useRouter();
  const { addJD, addMultipleJDs } = useJD();
  
  const [activeTab, setActiveTab] = useState<"MANUAL" | "EXCEL">("MANUAL");
  
  // Manual Form State
  const [formData, setFormData] = useState({
    companyName: "",
    jobTitle: "",
    location: "",
    salary: "",
    eligibilityCriteria: "",
    minCGPA: "",
    skillsRequired: "",
    jobDescription: "",
    applicationDeadline: "",
    jdLink: "",
    driveDate: ""
  });

  // Excel Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // --- Manual Form Handlers ---
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addJD({
      companyId: formData.companyName, // Mock fallback
      companyName: formData.companyName,
      jobTitle: formData.jobTitle,
      department: "Cross-Departmental", // Default
      skillsRequired: formData.skillsRequired,
      salary: formData.salary,
      location: formData.location,
      eligibilityCriteria: formData.eligibilityCriteria,
      minCGPA: formData.minCGPA,
      jobDescription: formData.jobDescription,
      applicationDeadline: formData.applicationDeadline,
      jdLink: formData.jdLink,
      driveDate: formData.driveDate,
    });
    router.push("/dashboard/jds");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- Excel Upload Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setErrorMsg("");
    const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Invalid file format. Please upload .xlsx, .xls, or .csv");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File is too large. Maximum size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (data) {
        try {
          const workbook = xlsx.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const parsed = xlsx.utils.sheet_to_json(sheet);
          
          let errors = 0;
          const validatedData = parsed.map((row: any) => {
            const isValid = !!row["Company Name"] && !!row["Job Role"] && !!row["CTC"];
            if (!isValid) errors++;
            return { ...row, _isValid: isValid };
          });

          setParsedData(validatedData);
          setErrorCount(errors);
        } catch (err) {
          setErrorMsg("Failed to parse the file. Please check the format.");
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = () => {
    if (parsedData.length === 0 || errorCount > 0) return;
    
    const formattedData = parsedData.map(row => ({
      companyId: row["Company Name"],
      companyName: row["Company Name"],
      jobTitle: row["Job Role"],
      department: "N/A",
      skillsRequired: row["Required Skills"] || "",
      salary: row["CTC"],
      location: row["Location"] || "",
      eligibilityCriteria: row["Eligibility Criteria"] || "",
      minCGPA: row["Minimum CGPA"] ? String(row["Minimum CGPA"]) : "",
      jobDescription: row["Job Description"] || "",
      applicationDeadline: row["Application Deadline"] || "",
      jdLink: row["JD Link"] || "",
      driveDate: row["Drive Date"] || "",
    }));

    addMultipleJDs(formattedData);
    router.push("/dashboard/jds");
  };

  const downloadTemplate = () => {
    const ws = xlsx.utils.json_to_sheet([
      {
        "Company Name": "Example Corp",
        "Job Role": "Software Engineer",
        "Location": "Bengaluru",
        "CTC": "12 LPA",
        "Eligibility Criteria": "B.E/B.Tech",
        "Minimum CGPA": "7.5",
        "Required Skills": "React, Node.js, AWS",
        "Job Description": "Full stack development role.",
        "Application Deadline": "2024-12-31",
        "JD Link": "https://example.com/jobs",
        "Drive Date": "2024-11-15"
      }
    ]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");
    xlsx.writeFile(wb, "JD_Upload_Template.xlsx");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/jds" className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Job Description</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create a new JD entry manually or upload in bulk.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("MANUAL")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "MANUAL" 
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm" 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Edit3 size={16} /> Manual Entry
        </button>
        <button
          onClick={() => setActiveTab("EXCEL")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "EXCEL" 
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm" 
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FileSpreadsheet size={16} /> Excel Upload
        </button>
      </div>

      {/* Manual Entry Form */}
      {activeTab === "MANUAL" && (
        <form onSubmit={handleManualSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name *</label>
              <input required name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Google" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Role *</label>
              <input required name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Frontend Developer" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">CTC (LPA) *</label>
              <input required name="salary" value={formData.salary} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 15 LPA" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input name="location" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Bengaluru" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Minimum CGPA</label>
              <input name="minCGPA" value={formData.minCGPA} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 7.5" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Eligibility Criteria</label>
              <input name="eligibilityCriteria" value={formData.eligibilityCriteria} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. B.E/B.Tech (CS/IT)" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Required Skills</label>
              <input name="skillsRequired" value={formData.skillsRequired} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. React, Node.js, Python" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Description</label>
              <textarea name="jobDescription" value={formData.jobDescription} onChange={handleInputChange} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter brief job description..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Application Deadline</label>
              <input type="date" name="applicationDeadline" value={formData.applicationDeadline} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Drive Date</label>
              <input type="date" name="driveDate" value={formData.driveDate} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JD Link (External)</label>
              <input name="jdLink" value={formData.jdLink} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <Link href="/dashboard/jds" className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Cancel
            </Link>
            <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
              Save JD
            </button>
          </div>
        </form>
      )}

      {/* Excel Upload Form */}
      {activeTab === "EXCEL" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Batch Import</h3>
                <p className="text-sm text-gray-500">Download our template to ensure correct formatting.</p>
              </div>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Download size={16} /> Download Template
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {parsedData.length === 0 ? (
            <div 
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all bg-white dark:bg-gray-900 ${
                dragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full mb-4">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upload JD Excel File</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">
                Drag & Drop your .xlsx or .csv file here. Maximum file size: 10 MB.
              </p>
              
              <input type="file" ref={fileInputRef} onChange={handleChange} accept=".xlsx, .xls, .csv" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <div className="flex gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle size={16} /> {parsedData.length - errorCount} Valid
                  </span>
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <XCircle size={16} /> {errorCount} Invalid
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setParsedData([]); setErrorCount(0); }} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                    Replace File
                  </button>
                  <button 
                    onClick={handleImport}
                    disabled={errorCount > 0}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                  >
                    Import JDs
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white dark:bg-gray-900 sticky top-0 shadow-sm text-gray-500 dark:text-gray-400 font-medium z-10">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Company Name</th>
                      <th className="px-4 py-3">Job Role</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">CTC</th>
                      <th className="px-4 py-3">Skills</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className={!row._isValid ? "bg-red-50 dark:bg-red-900/10" : ""}>
                        <td className="px-4 py-3">
                          {row._isValid ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{row["Company Name"] || "-"}</td>
                        <td className="px-4 py-3">{row["Job Role"] || "-"}</td>
                        <td className="px-4 py-3">{row["Location"] || "-"}</td>
                        <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">{row["CTC"] || "-"}</td>
                        <td className="px-4 py-3 text-xs truncate max-w-[200px]">{row["Required Skills"] || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
