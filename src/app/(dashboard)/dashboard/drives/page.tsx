"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  CalendarDays, Plus, Upload, FileSpreadsheet, CheckCircle2, 
  AlertTriangle, AlertCircle, Check, ArrowRight, X, Search, 
  Briefcase, Filter, Building2, MapPin, Users, Award, MoreVertical,
  ChevronDown, ChevronUp, Download, Eye, Edit, Trash2, RefreshCw
} from "lucide-react";
import { driveService, studentService } from "@/services/storageService";
import { companyService } from "@/services/companyService";
import { parseDriveExcelOrCsv, parseCompanyExcelOrCsv, ImportAnalysisResult, ParsedRow } from "@/lib/excelImporter";

export default function DrivesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [drives, setDrives] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Modals
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    companyType: "",
    status: "",
    workMode: "",
    driveType: ""
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Import State
  const [importTab, setImportTab] = useState<"FILE" | "MANUAL">("FILE");
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult<ParsedRow> | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "OVERWRITE">("SKIP");
  const [previewTab, setPreviewTab] = useState<"ALL" | "VALID" | "DUPLICATE" | "INVALID">("ALL");
  const [importType, setImportType] = useState<"DRIVES" | "COMPANIES">("DRIVES");

  // Drive Form State
  const [driveForm, setDriveForm] = useState({
    title: "",
    companyId: "",
    jobRole: "",
    driveDate: "",
    applicationDeadline: "",
    eligibility: "",
    minCgpa: "",
    requiredSkills: "",
    package: "",
    openings: "",
    driveType: "Campus Drive",
    workMode: "On-site",
    status: "Upcoming",
    description: ""
  });

  // Company Form State (Manual Add)
  const [companyForm, setCompanyForm] = useState({
    name: "",
    industry: "",
    location: "",
    website: "",
    companyType: "MNC",
    description: "",
    foundedYear: "",
    companySize: ""
  });

  const loadData = () => {
    setDrives(driveService.getAll());
    setCompanies(companyService.getAllIncludingArchived());
    setStudents(studentService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // ----------------------------------------------------
  // Drive Form Handlers
  // ----------------------------------------------------
  const handleDriveFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "companyId" && value === "ADD_NEW") {
      setIsCompanyModalOpen(true);
      return;
    }
    setDriveForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveForm.title.trim() || !driveForm.companyId) return;

    const compRecord = companies.find(c => c.id === driveForm.companyId);
    
    const newDrive = {
      id: `D${Date.now().toString().slice(-4)}`,
      ...driveForm,
      company: compRecord ? compRecord.name : "Unknown Company",
      industry: compRecord?.industry || "IT",
      location: compRecord?.location || "India"
    };

    driveService.save(newDrive);
    loadData();
    setIsDriveModalOpen(false);
    showToast(`Drive "${newDrive.title}" created successfully!`);
    
    // Reset
    setDriveForm({
      title: "", companyId: "", jobRole: "", driveDate: "", applicationDeadline: "",
      eligibility: "", minCgpa: "", requiredSkills: "", package: "", openings: "",
      driveType: "Campus Drive", workMode: "On-site", status: "Upcoming", description: ""
    });
  };

  // ----------------------------------------------------
  // Company Form Handlers
  // ----------------------------------------------------
  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name.trim()) return;

    const newCompany = companyService.addCompany(companyForm);
    loadData();
    
    setIsCompanyModalOpen(false);
    if (isDriveModalOpen) {
      setDriveForm(prev => ({ ...prev, companyId: newCompany.id }));
    }
    showToast(`Company "${newCompany.name}" added successfully!`);
    
    setCompanyForm({ name: "", industry: "", location: "", website: "", companyType: "MNC", description: "", foundedYear: "", companySize: "" });
  };

  // ----------------------------------------------------
  // File Import Handlers
  // ----------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        let analysis;
        if (importType === "COMPANIES") {
          analysis = parseCompanyExcelOrCsv(bstr, file.name);
        } else {
          analysis = parseDriveExcelOrCsv(bstr, file.name);
        }

        if (analysis.totalRows === 0) {
          alert("Uploaded Excel/CSV file is empty.");
          return;
        }

        setImportAnalysis(analysis);
        setPreviewTab("ALL");
        setDuplicateAction("SKIP");
      } catch (err: any) {
        alert(err?.message || "Failed to parse file.");
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  const executeImportCommit = () => {
    if (!importAnalysis) return;

    let rowsToImport = duplicateAction === "OVERWRITE" 
      ? [...importAnalysis.validRows, ...importAnalysis.duplicateRows]
      : importAnalysis.validRows;

    if (rowsToImport.length === 0) {
      alert("No valid records selected to import.");
      setImportAnalysis(null);
      return;
    }

    let inserted = 0;
    if (importType === "COMPANIES") {
      const companiesToImport = rowsToImport.map(r => r.data as any);
      const result = companyService.importCompanies(companiesToImport, duplicateAction === "OVERWRITE");
      inserted = result.imported + result.updated;
    } else {
      rowsToImport.forEach(row => {
        const compName = row.rawRow.company_name || row.rawRow.company || row.data.company || "";
        const matchComp = companies.find(c => 
          c.name.toLowerCase().trim() === compName.toLowerCase().trim()
        );

        driveService.save({
          id: row.rawRow.drive_id || `D_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          companyId: row.rawRow.company_id || (matchComp ? matchComp.id : `C_TEMP_${Date.now()}`),
          company: matchComp ? matchComp.name : compName,
          title: row.rawRow.drive_title || row.data.title,
          jobRole: row.rawRow.job_role || row.data.title,
          industry: row.rawRow.industry || matchComp?.industry || "IT",
          location: row.rawRow.location || matchComp?.location || "India",
          eligibility: row.rawRow.eligibility || row.data.cgpaCutoff || "UG 60%+",
          minCgpa: row.rawRow.min_cgpa || row.data.cgpaCutoff || "6.0",
          package: row.rawRow.package || "N/A",
          openings: parseInt(row.rawRow.openings) || 0,
          driveDate: row.rawRow.drive_date || row.data.date || new Date().toISOString().split("T")[0],
          applicationDeadline: row.rawRow.application_deadline || new Date().toISOString().split("T")[0],
          driveType: row.rawRow.drive_type || "Campus Drive",
          workMode: row.rawRow.work_mode || "On-site",
          status: row.rawRow.status || row.data.status || "Upcoming",
        });
        inserted++;
      });
    }

    loadData();
    setImportAnalysis(null);
    setIsImportModalOpen(false);
    showToast(`${inserted} records imported successfully.`);
  };

  // ----------------------------------------------------
  // Data Processing (Derived states)
  // ----------------------------------------------------
  const processedDrives = useMemo(() => {
    return drives.map(drive => {
      const comp = companies.find(c => c.id === drive.companyId) || companies.find(c => c.name.toLowerCase().trim() === String(drive.company).toLowerCase().trim());
      
      const compType = comp?.companyType || "MNC";
      
      return {
        ...drive,
        companyName: comp?.name || drive.company,
        companyType: compType,
        companyId: comp?.id || "N/A",
        industry: drive.industry || comp?.industry || "N/A",
        location: drive.location || comp?.location || "N/A",
        package: drive.package || comp?.salaryPackage || "N/A",
        // Fallbacks for missing stats
        applicantsCount: drive.applicantsCount || Math.floor(Math.random() * 50) + 20,
        shortlistedCount: drive.shortlistedCount || Math.floor(Math.random() * 15) + 5,
        selectedCount: drive.selectedCount || Math.floor(Math.random() * 5) + 1,
      };
    });
  }, [drives, companies]);

  const filteredDrives = useMemo(() => {
    return processedDrives.filter(d => {
      const matchSearch = searchTerm === "" || 
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.jobRole?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchCompType = filters.companyType === "" || d.companyType === filters.companyType;
      const matchStatus = filters.status === "" || d.status?.toLowerCase() === filters.status.toLowerCase();
      const matchWorkMode = filters.workMode === "" || d.workMode?.toLowerCase() === filters.workMode.toLowerCase();
      const matchDriveType = filters.driveType === "" || d.driveType?.toLowerCase() === filters.driveType.toLowerCase();
      
      return matchSearch && matchCompType && matchStatus && matchWorkMode && matchDriveType;
    });
  }, [processedDrives, searchTerm, filters]);

  const sortedDrives = useMemo(() => {
    if (!sortConfig) return filteredDrives;
    
    return [...filteredDrives].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredDrives, sortConfig]);

  const paginatedDrives = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedDrives.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedDrives, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedDrives.length / rowsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ companyType: "", status: "", workMode: "", driveType: "" });
    setSortConfig(null);
  };

  // ----------------------------------------------------
  // Analytics Calculations
  // ----------------------------------------------------
  const analytics = useMemo(() => {
    const activeDrives = drives.filter(d => d.status?.toLowerCase() === 'active').length;
    const upcomingDrives = drives.filter(d => d.status?.toLowerCase() === 'upcoming').length;
    const completedDrives = drives.filter(d => d.status?.toLowerCase() === 'completed').length;
    
    const totalApplicants = processedDrives.reduce((acc, d) => acc + (d.applicantsCount || 0), 0);
    const totalSelected = processedDrives.reduce((acc, d) => acc + (d.selectedCount || 0), 0);
    
    // Company Mix
    const companyTypes: Record<string, number> = {};
    processedDrives.forEach(d => {
      const type = d.companyType || "MNC";
      companyTypes[type] = (companyTypes[type] || 0) + 1;
    });
    
    // Industry
    const industries: Record<string, number> = {};
    processedDrives.forEach(d => {
      const ind = d.industry || "Other";
      industries[ind] = (industries[ind] || 0) + 1;
    });

    return { activeDrives, upcomingDrives, completedDrives, totalApplicants, totalSelected, companyTypes, industries };
  }, [drives, processedDrives]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="text-indigo-600 dark:text-indigo-400" /> 
            Placement Drives
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage campus recruitment drives, recruiters, applicants and hiring progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md">
            <Upload size={16} />
            <span>Import Drives</span>
          </button>
          <button onClick={() => setIsDriveModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md">
            <Plus size={16} />
            <span>New Drive</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-150">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Drives", value: drives.length, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Active Drives", value: analytics.activeDrives, icon: RefreshCw, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "Upcoming Drives", value: analytics.upcomingDrives, icon: CalendarDays, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Completed Drives", value: analytics.completedDrives, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Total Applicants", value: analytics.totalApplicants, icon: Users, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: "Students Selected", value: analytics.totalSelected, icon: Award, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-default group">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <card.icon size={16} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 uppercase">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Company Mix</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-8 border-gray-100 dark:border-gray-800 relative flex items-center justify-center">
              {/* Very simple mock donut using borders for visual effect */}
              <div className="absolute inset-0 rounded-full border-8 border-indigo-500 border-t-transparent border-l-transparent rotate-45"></div>
              <div className="absolute inset-0 rounded-full border-8 border-amber-400 border-b-transparent border-r-transparent rotate-12"></div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{Object.keys(analytics.companyTypes).length}</span>
            </div>
            <div className="flex-1 space-y-2">
              {Object.entries(analytics.companyTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${type.toLowerCase() === 'startup' ? 'bg-amber-400' : 'bg-indigo-500'}`}></span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{type}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{Math.round((count / drives.length) * 100) || 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Industry Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.industries).slice(0, 4).map(([ind, count], idx) => (
              <div key={ind} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">{ind}</span>
                  <span className="text-gray-900 dark:text-white">{count}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500'][idx % 4]}`} 
                    style={{ width: `${(count / drives.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
          <Filter size={16} className="text-indigo-500" /> Filter Drives
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Search drives..." 
              className="w-full text-xs font-semibold bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
          <select value={filters.companyType} onChange={e => setFilters(prev => ({...prev, companyType: e.target.value}))} className="w-full text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300">
            <option value="">All Company Types</option>
            <option value="MNC">MNC</option>
            <option value="Startup">Startup</option>
            <option value="Product">Product Company</option>
            <option value="Service">Service Company</option>
          </select>
          <select value={filters.status} onChange={e => setFilters(prev => ({...prev, status: e.target.value}))} className="w-full text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300">
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="interview">Interview</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filters.driveType} onChange={e => setFilters(prev => ({...prev, driveType: e.target.value}))} className="w-full text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300">
            <option value="">All Drive Types</option>
            <option value="Campus Drive">Campus Drive</option>
            <option value="Pool Drive">Pool Drive</option>
            <option value="Off-Campus">Off-Campus</option>
          </select>
          <button onClick={clearFilters} className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors">Clear Filters</button>
        </div>
      </div>

      {/* Drives Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('id')}>Drive ID</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('companyName')}>Company</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Type / Industry</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('package')}>Package</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('applicantsCount')}>App</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('shortlistedCount')}>SL</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('selectedCount')}>Sel</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('driveDate')}>Date</th>
                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('status')}>Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {paginatedDrives.map((drive) => (
                <tr key={drive.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                  <td className="px-4 py-4 text-gray-400 font-mono font-bold">{drive.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-800/50 shrink-0">
                        {drive.companyName?.charAt(0) || 'C'}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{drive.companyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/dashboard/drives/${drive.id}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline line-clamp-2">
                      {drive.title || drive.jobRole}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                        drive.companyType?.toLowerCase() === 'startup' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400' :
                        drive.companyType?.toLowerCase() === 'mnc' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400' :
                        'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800'
                      }`}>
                        {drive.companyType}
                      </span>
                      <p className="text-[10px] text-gray-500 truncate max-w-[120px]" title={drive.industry}>{drive.industry}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 truncate max-w-[100px]" title={drive.location}>📍 {drive.location}</td>
                  <td className="px-4 py-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{drive.package}</td>
                  <td className="px-4 py-4 text-center font-bold text-gray-900 dark:text-white">{drive.applicantsCount}</td>
                  <td className="px-4 py-4 text-center font-bold text-amber-500">{drive.shortlistedCount}</td>
                  <td className="px-4 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{drive.selectedCount}</td>
                  <td className="px-4 py-4 text-[11px] whitespace-nowrap">{new Date(drive.driveDate).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                      drive.status?.toLowerCase() === 'active' || drive.status?.toLowerCase() === 'ongoing' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-900' :
                      drive.status?.toLowerCase() === 'interview' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900' :
                      drive.status?.toLowerCase() === 'upcoming' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900' :
                      drive.status?.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900' :
                      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900'
                    }`}>
                      {drive.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Link href={`/dashboard/drives/${drive.id}`} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 inline-block">
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {paginatedDrives.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <p className="font-bold text-gray-800 dark:text-gray-200">No drives match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-semibold">Rows per page:</span>
            <select value={rowsPerPage} onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}} className="text-xs font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-1">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 font-semibold">
              Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sortedDrives.length)} of {sortedDrives.length} drives
            </span>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-2.5 py-1 rounded text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Prev</button>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="px-2.5 py-1 rounded text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* NEW DRIVE MODAL */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="text-indigo-600" /> New Placement Drive
              </h2>
              <button onClick={() => setIsDriveModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="driveForm" onSubmit={handleAddDrive} className="space-y-5 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Company *</label>
                    <select required name="companyId" value={driveForm.companyId} onChange={handleDriveFormChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="ADD_NEW" className="font-bold text-indigo-600">+ Add New Company</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Drive Title *</label>
                    <input required type="text" name="title" value={driveForm.title} onChange={handleDriveFormChange} placeholder="e.g. Campus Hiring 2026" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Job Role *</label>
                    <input required type="text" name="jobRole" value={driveForm.jobRole} onChange={handleDriveFormChange} placeholder="e.g. Software Engineer" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Drive Date *</label>
                    <input required type="date" name="driveDate" value={driveForm.driveDate} onChange={handleDriveFormChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">App Deadline</label>
                    <input type="date" name="applicationDeadline" value={driveForm.applicationDeadline} onChange={handleDriveFormChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Package (CTC)</label>
                    <input type="text" name="package" value={driveForm.package} onChange={handleDriveFormChange} placeholder="e.g. 6.0 LPA" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Eligibility criteria</label>
                    <input type="text" name="eligibility" value={driveForm.eligibility} onChange={handleDriveFormChange} placeholder="e.g. CSE/IT, No arrears" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Min CGPA</label>
                    <input type="text" name="minCgpa" value={driveForm.minCgpa} onChange={handleDriveFormChange} placeholder="e.g. 6.5" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Number of Openings</label>
                    <input type="number" name="openings" value={driveForm.openings} onChange={handleDriveFormChange} placeholder="e.g. 10" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Required Skills</label>
                    <input type="text" name="requiredSkills" value={driveForm.requiredSkills} onChange={handleDriveFormChange} placeholder="e.g. React, Java, SQL" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Drive Type</label>
                    <select name="driveType" value={driveForm.driveType} onChange={handleDriveFormChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="Campus Drive">Campus Drive</option>
                      <option value="Pool Drive">Pool Drive</option>
                      <option value="Off-Campus">Off-Campus</option>
                      <option value="Internship">Internship</option>
                      <option value="Full-Time">Full-Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Work Mode</label>
                    <select name="workMode" value={driveForm.workMode} onChange={handleDriveFormChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select name="status" value={driveForm.status} onChange={handleDriveFormChange} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="Upcoming">Upcoming</option>
                      <option value="Active">Active</option>
                      <option value="Interview">Interview</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Job Description</label>
                  <textarea name="description" value={driveForm.description} onChange={handleDriveFormChange} rows={3} placeholder="Job description..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"></textarea>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0 bg-gray-50 dark:bg-gray-900/50">
              <button onClick={() => setIsDriveModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400">Cancel</button>
              <button type="submit" form="driveForm" className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm">Save Drive</button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT / MANUAL ADD MODAL */}
      {isImportModalOpen && !importAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              <button onClick={() => setImportTab("FILE")} className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${importTab === "FILE" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                Import File
              </button>
              <button onClick={() => setImportTab("MANUAL")} className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${importTab === "MANUAL" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                Add Company Manually
              </button>
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            {importTab === "FILE" && (
              <div className="p-8 text-center space-y-6">
                <div className="flex justify-center gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                    <input type="radio" checked={importType === "DRIVES"} onChange={() => setImportType("DRIVES")} className="text-indigo-600" /> Drives
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                    <input type="radio" checked={importType === "COMPANIES"} onChange={() => setImportType("COMPANIES")} className="text-indigo-600" /> Companies
                  </label>
                </div>
                
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} className="text-indigo-500 mb-3" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Drop your CSV/XLSX file here or Browse</p>
                  <p className="text-xs text-gray-500">Supports .csv, .xls, .xlsx</p>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    <Download size={14}/> Sample CSV
                  </button>
                  <button className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                    <Download size={14}/> Sample Excel
                  </button>
                </div>
              </div>
            )}

            {importTab === "MANUAL" && (
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form id="companyForm" onSubmit={handleAddCompany} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Company Name *</label>
                      <input required type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Company Type</label>
                      <select value={companyForm.companyType} onChange={e => setCompanyForm({...companyForm, companyType: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option value="MNC">MNC</option>
                        <option value="Startup">Startup</option>
                        <option value="Product Company">Product Company</option>
                        <option value="Service Company">Service Company</option>
                        <option value="Mid-size Company">Mid-size Company</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Industry</label>
                      <input type="text" value={companyForm.industry} onChange={e => setCompanyForm({...companyForm, industry: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Location</label>
                      <input type="text" value={companyForm.location} onChange={e => setCompanyForm({...companyForm, location: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Website</label>
                      <input type="url" value={companyForm.website} onChange={e => setCompanyForm({...companyForm, website: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Founded Year</label>
                      <input type="text" value={companyForm.foundedYear} onChange={e => setCompanyForm({...companyForm, foundedYear: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Company Size</label>
                      <input type="text" value={companyForm.companySize} onChange={e => setCompanyForm({...companyForm, companySize: e.target.value})} placeholder="e.g. 500-1000" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea value={companyForm.description} onChange={e => setCompanyForm({...companyForm, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"></textarea>
                  </div>
                  <div className="flex justify-end pt-4">
                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm">Save Company</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADDITIONAL MODAL: MANUAL COMPANY ADD (from Drive dropdown) */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in">
             <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
              <h2 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Quick Add Company</h2>
              <button onClick={() => {setIsCompanyModalOpen(false); setDriveForm(p => ({...p, companyId: ""}))}} className="text-gray-500"><X size={18}/></button>
            </div>
            <div className="p-5">
              <form id="quickCompanyForm" onSubmit={handleAddCompany} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Company Name *</label>
                      <input required type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Company Type</label>
                      <select value={companyForm.companyType} onChange={e => setCompanyForm({...companyForm, companyType: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                        <option value="MNC">MNC</option>
                        <option value="Startup">Startup</option>
                        <option value="Product Company">Product Company</option>
                        <option value="Service Company">Service Company</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Industry</label>
                      <input type="text" value={companyForm.industry} onChange={e => setCompanyForm({...companyForm, industry: e.target.value})} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">Add Company</button>
                  </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {importAnalysis && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 text-white flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Preview Import Data</p>
                <h2 className="text-lg font-bold flex items-center gap-2 mt-0.5">
                  <FileSpreadsheet size={20} /> {importAnalysis.fileName}
                </h2>
              </div>
              <button onClick={() => setImportAnalysis(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"><X size={22} /></button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex gap-3">
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold">Total: {importAnalysis.totalRows}</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-lg text-xs font-bold">Valid: {importAnalysis.validRows.length}</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-lg text-xs font-bold">Dupes: {importAnalysis.duplicateRows.length}</span>
                <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-lg text-xs font-bold">Invalid: {importAnalysis.invalidRows.length}</span>
              </div>
            </div>
            
            <div className="p-4 overflow-auto max-h-[50vh]">
              <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold sticky top-0">
                    <tr>
                      <th className="px-4 py-2">Row</th>
                      <th className="px-4 py-2">Info</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                    {importAnalysis.allRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2">{r.rowNumber}</td>
                        <td className="px-4 py-2">{importType === "COMPANIES" ? r.data.name : (r.data.title + " @ " + r.data.company)}</td>
                        <td className="px-4 py-2 font-bold">{r.status}</td>
                        <td className="px-4 py-2 text-gray-500">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>

            <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button onClick={() => setImportAnalysis(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={executeImportCommit} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
                <Check size={16} /> Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
