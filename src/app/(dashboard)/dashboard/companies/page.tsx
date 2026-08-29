"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, Search, Plus, MapPin, ExternalLink, X, CheckCircle2, 
  Upload, FileSpreadsheet, AlertTriangle, AlertCircle, Check, ArrowRight,
  Filter, Eye, Edit, Archive, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal
} from "lucide-react";
import { companyService } from "@/services/companyService";
import { CompanyRecord } from "@/lib/companyCsvData";
import { parseCompanyExcelOrCsv, ImportAnalysisResult, ParsedRow } from "@/lib/excelImporter";

export default function CompaniesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [viewMode, setViewMode] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters State
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [approvalFilter, setApprovalFilter] = useState("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Import Preview Modal State
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysisResult<ParsedRow> | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"SKIP" | "OVERWRITE">("SKIP");
  const [previewTab, setPreviewTab] = useState<"ALL" | "VALID" | "DUPLICATE" | "INVALID">("ALL");

  // Add/Edit Company Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);

  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formIndustry, setFormIndustry] = useState("Software & Technology");
  const [formCompanySize, setFormCompanySize] = useState("5,000+ Employees");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCtc, setFormCtc] = useState("");
  const [formStatus, setFormStatus] = useState<"COLD" | "WARM" | "HOT" | "DRIVE_COMPLETED">("COLD");
  const [formPlacementTeam, setFormPlacementTeam] = useState("Placement Officer");

  const loadCompanies = () => {
    const loaded = viewMode === "ACTIVE" 
      ? companyService.getCompanies()
      : companyService.getArchivedCompanies();
    setCompanies(loaded);
  };

  useEffect(() => {
    loadCompanies();
  }, [viewMode]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    let list = companies;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.recruiter?.toLowerCase().includes(q) ||
        c.jobRole?.toLowerCase().includes(q) ||
        c.ctc?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }

    if (industryFilter !== "ALL") list = list.filter(c => c.industry === industryFilter);
    if (locationFilter !== "ALL") list = list.filter(c => c.location?.toLowerCase().includes(locationFilter.toLowerCase()));
    if (statusFilter !== "ALL") list = list.filter(c => c.status === statusFilter);
    if (approvalFilter !== "ALL") list = list.filter(c => c.approvalStatus === approvalFilter);

    return list;
  }, [companies, searchTerm, industryFilter, locationFilter, statusFilter, approvalFilter]);

  // Reset pagination when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, industryFilter, locationFilter, statusFilter, approvalFilter, pageSize]);

  // Paginated Companies
  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  // Unique Filter Dropdown Options
  const industryOptions = useMemo(() => Array.from(new Set(companies.map(c => c.industry).filter(Boolean))), [companies]);
  const locationOptions = useMemo(() => Array.from(new Set(companies.map(c => c.location).filter(Boolean))), [companies]);

  // Open Edit Modal
  const openEditModal = (comp: CompanyRecord) => {
    setEditingCompany(comp);
    setFormName(comp.name);
    setFormLocation(comp.location);
    setFormWebsite(comp.website);
    setFormIndustry(comp.industry);
    setFormCompanySize(comp.companySize);
    setFormContactPerson(comp.contactPerson);
    setFormMobile(comp.mobile);
    setFormEmail(comp.email);
    setFormCtc(comp.ctc);
    setFormStatus(comp.status);
    setFormPlacementTeam(comp.placementTeamMember);
  };

  // Submit Add / Edit Form
  const handleSaveCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCompany) {
      companyService.updateCompany(editingCompany.id, {
        name: formName.trim(),
        location: formLocation.trim() || "N/A",
        website: formWebsite.trim() || "N/A",
        industry: formIndustry.trim() || "Software & Technology",
        companySize: formCompanySize.trim() || "N/A",
        contactPerson: formContactPerson.trim() || "N/A",
        mobile: formMobile.trim() || "N/A",
        email: formEmail.trim() || "N/A",
        ctc: formCtc.trim() || "N/A",
        status: formStatus,
        placementTeamMember: formPlacementTeam.trim() || "Placement Officer"
      });
      setSuccessMessage(`Company "${formName}" updated successfully.`);
    } else {
      companyService.addCompany({
        name: formName.trim(),
        location: formLocation.trim() || "N/A",
        website: formWebsite.trim() || "N/A",
        industry: formIndustry.trim() || "Software & Technology",
        companySize: formCompanySize.trim() || "N/A",
        contactPerson: formContactPerson.trim() || "N/A",
        mobile: formMobile.trim() || "N/A",
        email: formEmail.trim() || "N/A",
        ctc: formCtc.trim() || "N/A",
        status: formStatus,
        approvalStatus: "PENDING",
        placementTeamMember: formPlacementTeam.trim() || "Placement Officer"
      });
      setSuccessMessage(`Company "${formName}" added successfully (Pending Approval).`);
    }

    loadCompanies();
    setIsAddModalOpen(false);
    setEditingCompany(null);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Archive Handler
  const handleArchive = (id: string, name: string) => {
    companyService.archiveCompany(id);
    loadCompanies();
    setSuccessMessage(`Company "${name}" moved to archives.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Restore Handler
  const handleRestore = (id: string, name: string) => {
    companyService.restoreCompany(id);
    loadCompanies();
    setSuccessMessage(`Company "${name}" restored to active list.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const analysis = parseCompanyExcelOrCsv(bstr, file.name);

        if (analysis.totalRows === 0) {
          alert("Uploaded company CSV file is empty.");
          return;
        }

        setImportAnalysis(analysis);
        setPreviewTab("ALL");
        setDuplicateAction("SKIP");
      } catch (err: any) {
        alert(err?.message || "Failed to parse company file.");
      }
    };

    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  // Commit Company Import
  const executeImportCommit = () => {
    if (!importAnalysis) return;

    const rowsToImport = duplicateAction === "OVERWRITE" 
      ? [...importAnalysis.validRows, ...importAnalysis.duplicateRows]
      : importAnalysis.validRows;

    if (rowsToImport.length === 0) {
      alert("No valid records selected to import.");
      setImportAnalysis(null);
      return;
    }

    const mappedCompanies: CompanyRecord[] = rowsToImport.map((r: any) => {
      const d = r.data || r;
      return {
        id: `C_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: d.name || d.companyName || d.company || "Unknown Company",
        location: d.location || "N/A",
        website: d.website || "N/A",
        contactPerson: d.contactPerson || d.recruiter || "N/A",
        mobile: d.mobile || d.phone || "N/A",
        email: d.email || "N/A",
        companySize: d.companySize || "N/A",
        numberOfEmployees: d.numberOfEmployees || "N/A",
        industry: d.industry || "Software & Technology",
        ctc: d.ctc || d.salary || "N/A",
        status: d.status || "COLD",
        approvalStatus: d.approvalStatus || "PENDING",
        dateAdded: new Date().toISOString().split("T")[0],
        placementTeamMember: "Placement Lead",
        recruiter: d.recruiter || d.contactPerson || "N/A",
        jobRole: d.jobRole || "N/A",
        jd: d.jd || "N/A",
        jdPdf: "N/A",
        driveStatus: d.driveStatus || "Scheduled",
        placedStudentsCount: 0,
        placedStudentsDetails: "N/A",
        archived: false
      };
    });

    const summary = companyService.importCompanies(mappedCompanies);
    loadCompanies();
    setImportAnalysis(null);

    setSuccessMessage(`COMPANY IMPORT COMPLETE: ${summary.imported} companies imported. ${summary.duplicates} duplicates skipped.`);
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
            <Building2 className="text-indigo-600 dark:text-indigo-400" />
            Company Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Corporate directory, recruitment drives, and partner organizations ({companies.length} {viewMode.toLowerCase()} companies).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/companies/pipeline"
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span>Pipeline Kanban</span>
            <ArrowRight size={14} />
          </Link>

          {/* View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === "ACTIVE" ? "ARCHIVED" : "ACTIVE")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
          >
            <Archive size={14} />
            <span>{viewMode === "ACTIVE" ? "Archived View" : "Active Companies"}</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Upload size={14} />
            <span>+ Import Companies</span>
          </button>

          {/* Add Company Button */}
          <button
            onClick={() => {
              setEditingCompany(null);
              setFormName("");
              setFormLocation("");
              setFormWebsite("");
              setFormCtc("");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Plus size={14} />
            <span>+ Add Company</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-150">
          <CheckCircle2 size={18} />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Company, Location, Industry, Role, CTC, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                showFilterPanel ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
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

        {/* Expandable Filters */}
        {showFilterPanel && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Industry</label>
              <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Industries</option>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Location</label>
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Locations</option>
                {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Pipeline Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Statuses</option>
                <option value="COLD">COLD</option>
                <option value="WARM">WARM</option>
                <option value="HOT">HOT</option>
                <option value="DRIVE_COMPLETED">DRIVE COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Approval Status</label>
              <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Approvals</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Company Intelligence Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">S.No</th>
                <th className="px-4 py-3">Company Name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Company Size</th>
                <th className="px-4 py-3">CTC Package</th>
                <th className="px-4 py-3">Recruiter / Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Date Added</th>
                <th className="px-4 py-3">Placement Team</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {paginatedCompanies.map((comp, idx) => {
                const sno = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr key={`comp-${comp.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-400">{sno}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      <Link href={`/dashboard/companies/${encodeURIComponent(comp.id)}`} className="hover:underline hover:text-indigo-600">
                        {comp.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{comp.location}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800">
                        {comp.industry}
                      </span>
                    </td>
                    <td className="px-4 py-3">{comp.companySize}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{comp.ctc}</td>
                    <td className="px-4 py-3 font-medium">{comp.contactPerson || comp.recruiter}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        comp.status === "DRIVE_COMPLETED" ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300" :
                        comp.status === "HOT" ? "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300" :
                        comp.status === "WARM" ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300" :
                        "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        comp.approvalStatus === "APPROVED" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" :
                        comp.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      }`}>
                        {comp.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{comp.dateAdded}</td>
                    <td className="px-4 py-3">{comp.placementTeamMember}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/dashboard/companies/${encodeURIComponent(comp.id)}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1">
                        <Eye size={13} />
                        <span>View</span>
                      </Link>

                      <button onClick={() => openEditModal(comp)} className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 font-semibold">
                        <Edit size={13} />
                      </button>

                      {viewMode === "ACTIVE" ? (
                        <button onClick={() => handleArchive(comp.id, comp.name)} className="text-amber-600 hover:text-amber-700 font-semibold">
                          <Archive size={13} />
                        </button>
                      ) : (
                        <button onClick={() => handleRestore(comp.id, comp.name)} className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <RefreshCw size={13} />
                          <span>Restore</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-16 text-center text-gray-500">
                    <Building2 size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-bold text-gray-800 dark:text-gray-200">No Companies Found</p>
                    <p className="text-xs text-gray-500 mt-1">Upload an Excel/CSV company list or click "+ Add Company".</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="font-semibold text-gray-500">
            Showing {filteredCompanies.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, filteredCompanies.length)} of {filteredCompanies.length} companies
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-gray-800 dark:text-gray-200 px-2">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100"
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
                <p className="text-xs uppercase font-bold text-indigo-200 tracking-wider">Company CSV Import Analysis</p>
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
              <p className="text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300 tracking-wider mb-2">Detected Columns & Field Mapping</p>
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
                    <input type="radio" name="compDupAction" checked={duplicateAction === "SKIP"} onChange={() => setDuplicateAction("SKIP")} />
                    <span>Skip</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="compDupAction" checked={duplicateAction === "OVERWRITE"} onChange={() => setDuplicateAction("OVERWRITE")} />
                    <span>Overwrite</span>
                  </label>
                </div>
              )}
            </div>

            {/* Table */}
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
                      <th className="px-4 py-3">Company Name</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">CTC Package</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Validation Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                    {previewDisplayRows.map((row: any, idx: number) => {
                      const d = row.data || row;
                      return (
                        <tr key={`cprev-${row.rowNumber || idx}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                          <td className="px-4 py-2.5 font-bold text-gray-400">{row.rowNumber || idx + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">{d.name || d.companyName || d.company || "N/A"}</td>
                          <td className="px-4 py-2.5">{d.location || "N/A"}</td>
                          <td className="px-4 py-2.5 font-bold text-emerald-600">{d.ctc || d.salary || "N/A"}</td>
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
                </b> companies
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setImportAnalysis(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100">Cancel</button>
                <button onClick={executeImportCommit} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                  <Check size={16} />
                  <span>Import Companies</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT COMPANY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 size={20} className="text-indigo-600" />
                {editingCompany ? "Edit Company Details" : "Add New Company"}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCompanySubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Company Name *</label>
                <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Google India" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Location</label>
                  <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Bengaluru, India" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">CTC Package</label>
                  <input type="text" value={formCtc} onChange={e => setFormCtc(e.target.value)} placeholder="₹ 18.5 LPA" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Industry</label>
                  <input type="text" value={formIndustry} onChange={e => setFormIndustry(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Pipeline Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="COLD">COLD</option>
                    <option value="WARM">WARM</option>
                    <option value="HOT">HOT</option>
                    <option value="DRIVE_COMPLETED">DRIVE COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Contact Person</label>
                  <input type="text" value={formContactPerson} onChange={e => setFormContactPerson(e.target.value)} placeholder="Recruiter Name" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Contact Mobile</label>
                  <input type="text" value={formMobile} onChange={e => setFormMobile(e.target.value)} placeholder="+91 80 0000 0000" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Contact Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="careers@company.com" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
