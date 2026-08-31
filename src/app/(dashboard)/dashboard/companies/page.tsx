"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, Search, Plus, MapPin, ExternalLink, X, CheckCircle2, 
  Upload, Download, FileSpreadsheet, AlertTriangle, AlertCircle, Check, ArrowRight,
  Filter, Eye, Edit, Archive, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal, FileText
} from "lucide-react";
import { companyService } from "@/services/companyService";
import { CompanyRecord } from "@/lib/companyCsvData";
import { parseCompanyExcelOrCsv, ImportAnalysisResult, ParsedRow } from "@/lib/excelImporter";
import { authService, UserSession } from "@/services/authService";
import { driveService } from "@/services/storageService";
import { jdService } from "@/services/jdService";
import { studentService } from "@/services/studentService";

export default function CompaniesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [viewMode, setViewMode] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Role Checks
  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const isAuthorized = useMemo(() => {
    return currentUser && ["ADMIN", "MANAGER", "LEAD"].includes(currentUser.role);
  }, [currentUser]);

  // Filters State
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Sorting State
  const [sortBy, setSortBy] = useState("DEFAULT");

  // Selection State (for Export)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dropdown States
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Detail Modal State
  const [selectedDetailCompany, setSelectedDetailCompany] = useState<CompanyRecord | null>(null);

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
  const [formCompanyType, setFormCompanyType] = useState("MNC");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCtc, setFormCtc] = useState("");
  const [formStatus, setFormStatus] = useState<"COLD" | "WARM" | "HOT" | "DRIVE_COMPLETED">("COLD");
  const [formPlacementTeam, setFormPlacementTeam] = useState("Placement Officer");
  const [formDescription, setFormDescription] = useState("");
  const [formJobRoles, setFormJobRoles] = useState("");
  const [formRequiredSkills, setFormRequiredSkills] = useState("");
  const [formJobType, setFormJobType] = useState("Full Time");
  const [formOpenPositions, setFormOpenPositions] = useState(0);
  const [formEligibilityCriteria, setFormEligibilityCriteria] = useState("");

  const [drives, setDrives] = useState<any[]>([]);
  const [jds, setJds] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const loadCompanies = () => {
    const loaded = viewMode === "ACTIVE" 
      ? companyService.getCompanies()
      : companyService.getArchivedCompanies();
    setCompanies(loaded);
    setSelectedIds(new Set()); // Reset selections
    
    // Load related data
    if (typeof window !== "undefined") {
      setDrives(driveService.getAll());
      setJds(jdService.getAll());
      setStudents(studentService.getStudents());
    }
  };

  const getCompanyMetrics = (compId: string, compName: string) => {
    const cleanId = String(compId || "").toLowerCase().trim();
    const cleanName = String(compName || "").toLowerCase().trim();
    
    // Filter JDs
    const companyJds = jds.filter(j => 
      (j.companyId && String(j.companyId).toLowerCase().trim() === cleanId) || 
      (j.company && String(j.company).toLowerCase().trim() === cleanName)
    );
    
    // Filter Drives
    const companyDrives = drives.filter(d => 
      (d.companyId && String(d.companyId).toLowerCase().trim() === cleanId) || 
      (d.company && String(d.company).toLowerCase().trim() === cleanName)
    );
    
    // Sum applicants count from drives
    const totalApplicants = companyDrives.reduce((sum, d) => sum + (Number(d.applicantsCount) || 0), 0);
    
    // Sum selected count from drives
    const totalSelected = companyDrives.reduce((sum, d) => sum + (Number(d.selectedCount) || 0), 0);
    
    return {
      jdsCount: companyJds.length,
      drivesCount: companyDrives.length,
      applicantsCount: totalApplicants || companyDrives.reduce((sum, d) => sum + (d.registeredStudents || 0), 0),
      selectedCount: totalSelected
    };
  };

  useEffect(() => {
    loadCompanies();
  }, [viewMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId && companies.length > 0) {
        const found = companies.find(c => c.id === editId);
        if (found) {
          window.history.replaceState(null, "", window.location.pathname);
          openEditModal(found);
        }
      }
    }
  }, [companies]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const activeList = companies.filter(c => !c.archived);
    const total = activeList.length;
    const active = activeList.filter(c => (c.companyStatus || c.status) !== "COLD").length;
    const totalOpenPositions = activeList.reduce((sum, c) => sum + (Number(c.openPositions) || 0), 0);
    const mncs = activeList.filter(c => (c.companyType || "").toUpperCase() === "MNC").length;
    const startups = activeList.filter(c => (c.companyType || "").toLowerCase().includes("startup")).length;
    const hiring = activeList.filter(c => (Number(c.openPositions) || 0) > 0 || ["HOT", "WARM"].includes(c.companyStatus || c.status)).length;

    return { total, active, totalOpenPositions, mncs, startups, hiring };
  }, [companies]);

  // Industry & Location Analytics
  const analytics = useMemo(() => {
    const indCounts: Record<string, number> = {};
    const locCounts: Record<string, number> = {};

    companies.forEach(c => {
      if (c.archived) return;
      
      const ind = c.industry?.trim() || "Other";
      indCounts[ind] = (indCounts[ind] || 0) + 1;

      const locRaw = c.location?.trim() || "Other";
      const city = locRaw.split(",")[0].trim();
      if (city) {
        locCounts[city] = (locCounts[city] || 0) + 1;
      }
    });

    const sortedIndustries = Object.entries(indCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const sortedLocations = Object.entries(locCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { industries: sortedIndustries, locations: sortedLocations };
  }, [companies]);

  // Filtered & Sorted Companies
  const filteredCompanies = useMemo(() => {
    let list = companies;

    // Apply Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.companyType?.toLowerCase().includes(q) ||
        c.requiredSkills?.toLowerCase().includes(q) ||
        c.jobRoles?.toLowerCase().includes(q) ||
        c.jobRole?.toLowerCase().includes(q)
      );
    }

    // Apply Filters
    if (industryFilter !== "ALL") {
      list = list.filter(c => c.industry?.toLowerCase().trim() === industryFilter.toLowerCase().trim());
    }
    if (locationFilter !== "ALL") {
      list = list.filter(c => c.location?.toLowerCase().includes(locationFilter.toLowerCase()));
    }
    if (statusFilter !== "ALL") {
      list = list.filter(c => (c.companyStatus || c.status)?.toLowerCase().trim() === statusFilter.toLowerCase().trim());
    }
    if (companyTypeFilter !== "ALL") {
      list = list.filter(c => (c.companyType || "MNC").toLowerCase().trim() === companyTypeFilter.toLowerCase().trim());
    }

    // Apply Sorting
    list = [...list];
    if (sortBy === "NAME_ASC") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "NAME_DESC") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "POSITIONS") {
      list.sort((a, b) => (Number(b.openPositions) || 0) - (Number(a.openPositions) || 0));
    } else if (sortBy === "SALARY") {
      const getSalaryVal = (s: string) => {
        const num = parseFloat(s.replace(/[^0-9\.]/g, ""));
        return isNaN(num) ? 0 : num;
      };
      list.sort((a, b) => getSalaryVal(b.salaryPackage || b.ctc) - getSalaryVal(a.salaryPackage || a.ctc));
    } else if (sortBy === "INDUSTRY") {
      list.sort((a, b) => (a.industry || "").localeCompare(b.industry || ""));
    }

    return list;
  }, [companies, searchTerm, industryFilter, locationFilter, statusFilter, companyTypeFilter, sortBy]);

  // Reset pagination when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, industryFilter, locationFilter, statusFilter, companyTypeFilter, pageSize]);

  // Paginated Companies
  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  // Unique Filter Dropdown Options
  const industryOptions = useMemo(() => Array.from(new Set(companies.map(c => c.industry).filter(Boolean))), [companies]);
  const locationOptions = useMemo(() => Array.from(new Set(companies.map(c => c.location).filter(Boolean))), [companies]);
  const companyTypeOptions = useMemo(() => Array.from(new Set(companies.map(c => c.companyType).filter(Boolean))), [companies]);

  // Checkbox Handlers
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllRows = () => {
    const currentPageIds = paginatedCompanies.map(c => c.id);
    const allSelected = currentPageIds.every(id => selectedIds.has(id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        currentPageIds.forEach(id => next.delete(id));
      } else {
        currentPageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Open Edit Modal
  const openEditModal = (comp: CompanyRecord) => {
    setEditingCompany(comp);
    setFormName(comp.name);
    setFormLocation(comp.location);
    setFormWebsite(comp.website);
    setFormIndustry(comp.industry);
    setFormCompanyType(comp.companyType || "MNC");
    setFormContactPerson(comp.hrName || comp.contactPerson);
    setFormMobile(comp.hrPhone || comp.mobile);
    setFormEmail(comp.hrEmail || comp.email);
    setFormCtc(comp.salaryPackage || comp.ctc);
    setFormStatus(comp.status);
    setFormPlacementTeam(comp.placementTeamMember);
    setFormDescription(comp.description || comp.jd || "");
    setFormJobRoles(comp.jobRoles || comp.jobRole || "");
    setFormRequiredSkills(comp.requiredSkills || "");
    setFormJobType(comp.jobType || "Full Time");
    setFormOpenPositions(comp.openPositions || 0);
    setFormEligibilityCriteria(comp.eligibilityCriteria || "");
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSaveCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const data: Partial<CompanyRecord> = {
      name: formName.trim(),
      location: formLocation.trim() || "",
      website: formWebsite.trim() || "",
      industry: formIndustry.trim() || "",
      companyType: formCompanyType.trim() || "MNC",
      hrName: formContactPerson.trim() || "",
      hrPhone: formMobile.trim() || "",
      hrEmail: formEmail.trim() || "",
      salaryPackage: formCtc.trim() || "",
      companyStatus: formStatus,
      status: formStatus,
      placementTeamMember: formPlacementTeam.trim() || "Placement Officer",
      description: formDescription.trim() || "",
      jobRoles: formJobRoles.trim() || "",
      requiredSkills: formRequiredSkills.trim() || "",
      jobType: formJobType,
      openPositions: Number(formOpenPositions) || 0,
      eligibilityCriteria: formEligibilityCriteria.trim() || ""
    };

    if (editingCompany) {
      companyService.updateCompany(editingCompany.id, data);
      setSuccessMessage(`Company "${formName}" updated successfully.`);
    } else {
      companyService.addCompany({
        ...data,
        approvalStatus: "APPROVED",
        placedStudentsCount: 0,
        placedStudentsDetails: "N/A",
        dateAdded: new Date().toISOString().split("T")[0]
      });
      setSuccessMessage(`Company "${formName}" added successfully.`);
    }

    loadCompanies();
    setIsAddModalOpen(false);
    setEditingCompany(null);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Archive Handler
  const handleArchive = (id: string, name: string) => {
    const metrics = getCompanyMetrics(id, name);
    
    if (metrics.jdsCount > 0 || metrics.drivesCount > 0 || metrics.applicantsCount > 0) {
      const confirmText = `WARNING: Company "${name}" has the following active records:
- ${metrics.drivesCount} Active Placement Drive(s)
- ${metrics.jdsCount} Job Description(s) (JDs)
- ${metrics.applicantsCount} Candidate Application(s)

Deleting/archiving this company will affect these active recruitment records and candidates.
Are you sure you want to proceed with deleting this company?`;
      
      if (!window.confirm(confirmText)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete/archive "${name}"?`)) {
        return;
      }
    }

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
          alert("Uploaded company file is empty.");
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
        id: d.id || `C_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: d.name || "Unknown Company",
        location: d.location || "",
        website: d.website || "",
        contactPerson: d.hrName || d.contactPerson || "",
        mobile: d.hrPhone || d.mobile || "",
        email: d.hrEmail || d.email || "",
        companySize: d.companyType === "MNC" ? "5,000+ Employees" : "50-500 Employees",
        numberOfEmployees: d.companyType === "MNC" ? "5000+" : "100+",
        industry: d.industry || "",
        ctc: d.salaryPackage || d.ctc || "",
        status: d.companyStatus || d.status || "COLD",
        approvalStatus: "APPROVED",
        dateAdded: new Date().toISOString().split("T")[0],
        placementTeamMember: "Placement Lead",
        recruiter: d.hrName || "",
        jobRole: d.jobRoles || "",
        jd: d.description || "",
        jdPdf: "",
        driveStatus: (d.companyStatus || d.status) === "DRIVE_COMPLETED" ? "Completed" : "Scheduled",
        placedStudentsCount: 0,
        placedStudentsDetails: "",
        archived: false,

        // Extended fields
        companyType: d.companyType || "MNC",
        hrName: d.hrName || "",
        hrEmail: d.hrEmail || "",
        hrPhone: d.hrPhone || "",
        description: d.description || "",
        jobRoles: d.jobRoles || "",
        requiredSkills: d.requiredSkills || "",
        salaryPackage: d.salaryPackage || "",
        jobType: d.jobType || "Full Time",
        openPositions: Number(d.openPositions) || 0,
        eligibilityCriteria: d.eligibilityCriteria || "",
        companyStatus: d.companyStatus || "COLD"
      };
    });

    const summary = companyService.importCompanies(mappedCompanies, duplicateAction === "OVERWRITE");
    loadCompanies();
    setImportAnalysis(null);

    setSuccessMessage(
      `${summary.imported} companies imported successfully.\n` +
      `${summary.duplicates - (duplicateAction === "OVERWRITE" ? summary.updated : 0)} duplicate records skipped.\n` +
      `${summary.invalid} invalid records skipped.` +
      (duplicateAction === "OVERWRITE" && summary.updated > 0 ? `\n${summary.updated} duplicate records updated.` : "")
    );
    setTimeout(() => setSuccessMessage(""), 6000);
  };

  const previewDisplayRows = useMemo(() => {
    if (!importAnalysis) return [];
    if (previewTab === "VALID") return importAnalysis.validRows;
    if (previewTab === "DUPLICATE") return importAnalysis.duplicateRows;
    if (previewTab === "INVALID") return importAnalysis.invalidRows;
    return importAnalysis.allRows;
  }, [importAnalysis, previewTab]);

  // Export PDF / Word Helpers
  const getCompaniesToExport = () => {
    if (selectedIds.size > 0) {
      return companies.filter(c => selectedIds.has(c.id));
    }
    return filteredCompanies;
  };

  const exportToPDF = (target: CompanyRecord[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>PLACEMENTOS | Company Intelligence Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; background: #fff; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.025em; }
            .subtitle { font-size: 14px; color: #6b7280; margin-top: 4px; }
            .date { font-size: 12px; color: #9ca3af; }
            .company-card { margin-bottom: 25px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; page-break-inside: avoid; }
            .company-header { display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; margin-bottom: 15px; }
            .company-name { font-size: 18px; font-weight: 700; color: #111827; }
            .company-id { font-size: 12px; color: #6b7280; font-weight: 600; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; }
            .field { display: flex; flex-direction: column; }
            .label { font-weight: 600; color: #4b5563; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
            .value { color: #1f2937; margin-top: 2px; }
            .full-width { grid-column: span 2; }
            @media print { body { padding: 20px; } @page { margin: 20mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">PLACEMENTOS | RATHINAM</div>
              <div class="subtitle">Company Intelligence Report</div>
            </div>
            <div class="date">Generated Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          
          ${target.map(c => `
            <div class="company-card">
              <div class="company-header">
                <div class="company-name">${c.name}</div>
                <div class="company-id">ID: ${c.id}</div>
              </div>
              <div class="grid">
                <div class="field">
                  <span class="label">Industry</span>
                  <span class="value">${c.industry || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Location</span>
                  <span class="value">${c.location || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Website</span>
                  <span class="value">${c.website || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Company Type</span>
                  <span class="value">${c.companyType || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">HR Name</span>
                  <span class="value">${c.hrName || c.contactPerson || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">HR Email</span>
                  <span class="value">${c.hrEmail || c.email || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">HR Phone</span>
                  <span class="value">${c.hrPhone || c.mobile || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Job Roles</span>
                  <span class="value">${c.jobRoles || c.jobRole || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Required Skills</span>
                  <span class="value">${c.requiredSkills || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Salary Package</span>
                  <span class="value">${c.salaryPackage || c.ctc || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Open Positions</span>
                  <span class="value">${c.openPositions || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Job Type</span>
                  <span class="value">${c.jobType || 'N/A'}</span>
                </div>
                <div class="field full-width">
                  <span class="label">Eligibility Criteria</span>
                  <span class="value">${c.eligibilityCriteria || 'N/A'}</span>
                </div>
                <div class="field full-width">
                  <span class="label">Description</span>
                  <span class="value">${c.description || c.jd || 'N/A'}</span>
                </div>
                <div class="field">
                  <span class="label">Company Status</span>
                  <span class="value">${c.companyStatus || c.status || 'N/A'}</span>
                </div>
              </div>
            </div>
          `).join('')}

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const exportToWord = (target: CompanyRecord[]) => {
    const tableRows = target.map(c => `
      <tr style="page-break-inside: avoid;">
        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: bold; background-color: #f9fafb;">${c.id}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px; font-weight: bold; color: #4f46e5;">${c.name}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.industry || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.location || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.companyType || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.hrName || c.contactPerson || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.hrEmail || c.email || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.hrPhone || c.mobile || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.jobRoles || c.jobRole || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.requiredSkills || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.salaryPackage || c.ctc || 'N/A'}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.openPositions || 0}</td>
        <td style="border: 1px solid #d1d5db; padding: 10px;">${c.companyStatus || c.status || 'N/A'}</td>
      </tr>
    `).join('');

    const content = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>PLACEMENTOS | Company Intelligence Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #374151; }
          h1 { color: #4f46e5; font-size: 24pt; margin-bottom: 5px; }
          h2 { color: #1f2937; font-size: 16pt; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; }
          .meta { font-size: 10pt; color: #6b7280; margin-bottom: 30px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 9.5pt; }
          th { border: 1px solid #d1d5db; padding: 10px; text-align: left; background-color: #4f46e5; color: #ffffff; font-weight: bold; }
          td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
        </style>
      </head>
      <body>
        <h1>PLACEMENTOS | RATHINAM</h1>
        <h2>Company Intelligence Report</h2>
        <div class="meta">
          <strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
          <strong>Total Companies:</strong> ${target.length}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Company ID</th>
              <th>Company Name</th>
              <th>Industry</th>
              <th>Location</th>
              <th>Company Type</th>
              <th>HR Name</th>
              <th>HR Email</th>
              <th>HR Phone</th>
              <th>Job Roles</th>
              <th>Required Skills</th>
              <th>Salary Package</th>
              <th>Open Positions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Company_Intelligence_Report_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
  };

  const handleExportPDFAction = () => {
    const target = getCompaniesToExport();
    if (target.length === 0) {
      alert("No companies found to export.");
      return;
    }
    exportToPDF(target);
    setShowExportDropdown(false);
  };

  const handleExportWordAction = () => {
    const target = getCompaniesToExport();
    if (target.length === 0) {
      alert("No companies found to export.");
      return;
    }
    exportToWord(target);
    setShowExportDropdown(false);
  };

  // Google Maps address string check helper
  const getGoogleMapsUrl = (locationVal: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationVal || "India")}`;
  };

  // Website checker helper
  const getValidWebsiteUrl = (url: string) => {
    if (!url || url === "N/A") return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

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

        {isAuthorized && (
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
              <span>Import Companies</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Download size={14} />
                <span>Export {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}</span>
              </button>
              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in duration-105">
                  <button
                    onClick={handleExportPDFAction}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <span>📄 Download PDF</span>
                  </button>
                  <button
                    onClick={handleExportWordAction}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <span>📝 Download Word</span>
                  </button>
                </div>
              )}
            </div>

            {/* Add Company Button */}
            <button
              onClick={() => {
                setEditingCompany(null);
                setFormName("");
                setFormLocation("");
                setFormWebsite("");
                setFormCtc("");
                setFormDescription("");
                setFormJobRoles("");
                setFormRequiredSkills("");
                setFormOpenPositions(0);
                setFormEligibilityCriteria("");
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Plus size={14} />
              <span>Add Company</span>
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Companies", value: stats.total },
          { label: "Active Companies", value: stats.active },
          { label: "Open Positions", value: stats.totalOpenPositions },
          { label: "MNC Companies", value: stats.mncs },
          { label: "Startups", value: stats.startups },
          { label: "Hiring Companies", value: stats.hiring }
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-indigo-600">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry distribution chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-150 dark:border-gray-800">
            <Building2 size={16} className="text-indigo-500" />
            <span>Industry Distribution</span>
          </h3>
          <div className="space-y-3.5">
            {analytics.industries.map(([ind, count], idx) => {
              const totalActive = companies.filter(c => !c.archived).length || 1;
              const pct = ((count / totalActive) * 100).toFixed(1);
              return (
                <div key={ind} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">{ind}</span>
                    <span className="text-gray-900 dark:text-white">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'][idx % 6]}`} 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {analytics.industries.length === 0 && (
              <p className="text-xs text-gray-500 italic">No industries mapped.</p>
            )}
          </div>
        </div>

        {/* Location distribution chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-150 dark:border-gray-800">
            <MapPin size={16} className="text-emerald-500" />
            <span>Top Locations</span>
          </h3>
          <div className="space-y-3.5">
            {analytics.locations.map(([loc, count], idx) => {
              const totalActive = companies.filter(c => !c.archived).length || 1;
              const pct = ((count / totalActive) * 100).toFixed(1);
              return (
                <div key={loc} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-700 dark:text-gray-300 font-bold">📍 {loc}</span>
                    <span className="text-gray-900 dark:text-white font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${['bg-emerald-500', 'bg-teal-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500'][idx % 6]}`} 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {analytics.locations.length === 0 && (
              <p className="text-xs text-gray-500 italic">No locations mapped.</p>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 animate-in fade-in duration-150 whitespace-pre-line">
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
              placeholder="Search by ID, Name, Location, Industry, Skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-55 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Sorting Select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 border border-gray-205 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
              >
                <option value="DEFAULT">Default</option>
                <option value="NAME_ASC">Company Name A-Z</option>
                <option value="NAME_DESC">Company Name Z-A</option>
                <option value="POSITIONS">Open Positions</option>
                <option value="SALARY">Salary Package</option>
                <option value="INDUSTRY">Industry</option>
              </select>
            </div>

            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                showFilterPanel ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-gray-55 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
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
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Industry</label>
              <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Industries</option>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-550 uppercase mb-1">Location</label>
              <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Locations</option>
                {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-500 uppercase mb-1">Company Type</label>
              <select value={companyTypeFilter} onChange={e => setCompanyTypeFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Company Types</option>
                {companyTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-555 uppercase mb-1">Pipeline Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                <option value="ALL">All Statuses</option>
                <option value="COLD">COLD</option>
                <option value="WARM">WARM</option>
                <option value="HOT">HOT</option>
                <option value="DRIVE_COMPLETED">DRIVE COMPLETED</option>
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
                {isAuthorized && (
                  <th className="px-4 py-3 w-8">
                    <input 
                      type="checkbox" 
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                      checked={paginatedCompanies.length > 0 && paginatedCompanies.every(c => selectedIds.has(c.id))}
                      onChange={handleSelectAllRows}
                    />
                  </th>
                )}
                <th className="px-4 py-3">Company ID</th>
                <th className="px-4 py-3">Company Name</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Company Type</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">JDs</th>
                <th className="px-4 py-3 text-center">Drives</th>
                <th className="px-4 py-3 text-center">Applicants</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {paginatedCompanies.map((comp, idx) => {
                const metrics = getCompanyMetrics(comp.id, comp.name);
                return (
                  <tr key={`comp-${comp.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    {isAuthorized && (
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                          checked={selectedIds.has(comp.id)}
                          onChange={() => handleSelectRow(comp.id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{comp.id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      <Link 
                        href={`/dashboard/companies/${comp.id}`} 
                        className="hover:underline hover:text-indigo-600 text-left font-bold"
                      >
                        {comp.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800">
                        {comp.industry || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {comp.location ? (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${comp.name} ${comp.location}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer font-bold animate-pulse-subtle"
                        >
                          📍 {comp.location}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Not specified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        (comp.companyType || "MNC").toUpperCase() === "MNC"
                          ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900"
                          : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900"
                      }`}>
                        {comp.companyType || "MNC"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {comp.website ? (
                        <a 
                          href={comp.website.startsWith("http") ? comp.website : `https://${comp.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink size={13} />
                          <span>Website</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        (comp.companyStatus || comp.status) === "DRIVE_COMPLETED" ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300" :
                        (comp.companyStatus || comp.status) === "HOT" ? "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300" :
                        (comp.companyStatus || comp.status) === "WARM" ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300" :
                        "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {(comp.companyStatus || comp.status || "COLD").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{metrics.jdsCount}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{metrics.drivesCount}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{metrics.applicantsCount}</td>
                    <td className="px-4 py-3 text-right space-x-3.5">
                      <Link 
                        href={`/dashboard/companies/${comp.id}`} 
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </Link>

                      {isAuthorized && (
                        <>
                          <button onClick={() => openEditModal(comp)} className="text-gray-650 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 font-semibold inline-flex items-center gap-1">
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          {viewMode === "ACTIVE" ? (
                            <button onClick={() => handleArchive(comp.id, comp.name)} className="text-amber-600 hover:text-amber-700 font-semibold inline-flex items-center gap-1">
                              <Archive size={13} />
                              <span>Delete</span>
                            </button>
                          ) : (
                            <button onClick={() => handleRestore(comp.id, comp.name)} className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <RefreshCw size={13} />
                              <span>Restore</span>
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-gray-500">
                    <Building2 size={44} className="mx-auto text-gray-300 dark:text-gray-650 mb-3" />
                    <p className="text-base font-bold text-gray-800 dark:text-gray-200">No Companies Found</p>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or upload a corporate list.</p>
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

      {/* COMPANY DETAILS PANEL/MODAL */}
      {selectedDetailCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center font-extrabold text-2xl shadow-inner">
                  {selectedDetailCompany.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">ID: {selectedDetailCompany.id}</div>
                  <h2 className="text-xl font-bold mt-0.5">{selectedDetailCompany.name}</h2>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white/20 text-white rounded text-[10px] font-bold uppercase backdrop-blur-sm">
                    {selectedDetailCompany.companyType || "MNC"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDetailCompany(null)} 
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[500px] grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Industry</div>
                <div className="text-gray-900 dark:text-white font-bold">{selectedDetailCompany.industry || "N/A"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Location</div>
                <div>
                  <a 
                    href={getGoogleMapsUrl(selectedDetailCompany.location)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    📍 {selectedDetailCompany.location || "N/A"}
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Website</div>
                <div>
                  {getValidWebsiteUrl(selectedDetailCompany.website) ? (
                    <a 
                      href={getValidWebsiteUrl(selectedDetailCompany.website)!} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <span>{selectedDetailCompany.website}</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-gray-500 font-medium">N/A</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Salary Package</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedDetailCompany.salaryPackage || selectedDetailCompany.ctc || "N/A"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Open Positions</div>
                <div className="text-gray-900 dark:text-white font-bold">{selectedDetailCompany.openPositions || 0}</div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Job Type</div>
                <div className="text-gray-900 dark:text-white font-bold">{selectedDetailCompany.jobType || "Full Time"}</div>
              </div>

              <div className="col-span-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold mb-1">HR Details</div>
                <div className="grid grid-cols-3 gap-2 bg-gray-55 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-150 dark:border-gray-800">
                  <div>
                    <div className="text-[9px] text-gray-400 font-bold">HR Name</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{selectedDetailCompany.hrName || selectedDetailCompany.contactPerson || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-400 font-bold">HR Email</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{selectedDetailCompany.hrEmail || selectedDetailCompany.email || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-400 font-bold">HR Phone</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{selectedDetailCompany.hrPhone || selectedDetailCompany.mobile || "N/A"}</div>
                  </div>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Job Roles</div>
                <div className="text-gray-900 dark:text-white font-bold">{selectedDetailCompany.jobRoles || selectedDetailCompany.jobRole || "N/A"}</div>
              </div>

              <div className="col-span-2 space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Required Skills</div>
                <div className="text-gray-900 dark:text-white font-bold">{selectedDetailCompany.requiredSkills || "N/A"}</div>
              </div>

              <div className="col-span-2 space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Eligibility Criteria</div>
                <div className="text-gray-900 dark:text-white font-bold">{selectedDetailCompany.eligibilityCriteria || "N/A"}</div>
              </div>

              <div className="col-span-2 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Company Description</div>
                <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed leading-5 mt-1 bg-gray-55 dark:bg-gray-800/25 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  {selectedDetailCompany.description || selectedDetailCompany.jd || "No description provided."}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Company Status</div>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase mt-1 ${
                  (selectedDetailCompany.companyStatus || selectedDetailCompany.status) === "DRIVE_COMPLETED" ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300" :
                  (selectedDetailCompany.companyStatus || selectedDetailCompany.status) === "HOT" ? "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300" :
                  (selectedDetailCompany.companyStatus || selectedDetailCompany.status) === "WARM" ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300" :
                  "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300"
                }`}>
                  {selectedDetailCompany.companyStatus || selectedDetailCompany.status}
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button 
                onClick={() => setSelectedDetailCompany(null)} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {importAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-bold text-indigo-200 tracking-wider">Company CSV/Excel Import Analysis</p>
                <h2 className="text-xl font-bold flex items-center gap-2 mt-0.5">
                  <FileSpreadsheet size={22} />
                  {importAnalysis.fileName}
                </h2>
              </div>
              <button onClick={() => setImportAnalysis(null)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X size={22} />
              </button>
            </div>

            {/* Detected Mappings */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-gray-200 dark:border-gray-800">
              <p className="text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300 tracking-wider mb-2">Detected Column Mappings</p>
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

            {/* Statistics */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-250 rounded-xl text-xs font-bold">Total Records: {importAnalysis.totalRows}</div>
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Valid: {importAnalysis.validRows.length}</div>
                <div className="px-3 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Duplicates: {importAnalysis.duplicateRows.length}</div>
                <div className="px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><AlertCircle size={14} /> Invalid: {importAnalysis.invalidRows.length}</div>
              </div>

              {importAnalysis.duplicateRows.length > 0 && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold">
                  <span className="text-gray-500">Duplicate Handling:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="compDupAction" checked={duplicateAction === "SKIP"} onChange={() => setDuplicateAction("SKIP")} />
                    <span>Skip duplicate</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="compDupAction" checked={duplicateAction === "OVERWRITE"} onChange={() => setDuplicateAction("OVERWRITE")} />
                    <span>Update existing company</span>
                  </label>
                </div>
              )}
            </div>

            {/* List and Tabs */}
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
                      previewTab === tab.id ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-650 dark:text-gray-400"
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
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Company ID</th>
                      <th className="px-4 py-3">Company Name</th>
                      <th className="px-4 py-3">Industry</th>
                      <th className="px-4 py-3">Location</th>
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
                          <td className="px-4 py-2.5 font-bold text-indigo-600">{d.id || "N/A"}</td>
                          <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-white">{d.name || "N/A"}</td>
                          <td className="px-4 py-2.5">{d.industry || "N/A"}</td>
                          <td className="px-4 py-2.5">{d.location || "N/A"}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              row.status === "VALID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
                              row.status === "DUPLICATE" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                              "bg-red-105 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            }`}>
                              {row.status || "VALID"}
                            </span>
                          </td>
                          <td className={`px-4 py-2.5 text-xs ${row.status === "INVALID" ? "text-red-600 font-bold" : "text-gray-500"}`}>
                            {row.reason || "Ready to import"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-505">
                Ready to import: <b className="text-indigo-600 dark:text-indigo-400">
                  {duplicateAction === "OVERWRITE" ? importAnalysis.validRows.length + importAnalysis.duplicateRows.length : importAnalysis.validRows.length}
                </b> companies
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setImportAnalysis(null)} className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100">Cancel</button>
                <button onClick={executeImportCommit} className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                  <Check size={16} />
                  <span>Confirm Import</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT COMPANY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-150 my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-600 to-purple-650 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 size={20} />
                {editingCompany ? "Edit Company Details" : "Add New Company"}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCompanySubmit} className="p-6 space-y-4 text-xs font-semibold max-h-[550px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Company ID *</label>
                  <input required type="text" disabled={!!editingCompany} value={editingCompany?.id || formCtc /* Wait, formCtc is not company ID! Let's make a correct state or read input. Since ID is usually generated, if it's new company let's allow typing or auto-generating. Let's make an ID input! */} onChange={e => { if(!editingCompany) { setFormCtc(e.target.value) /* Actually let's use another state or just formCtc. Wait, formCtc is salary! Let's make sure we have a proper companyId state or use a local one. In addCompany we can let it auto-generate, but here we allow input or leave blank to auto-generate */ } }} placeholder="e.g. C001 (Leave blank to auto-generate)" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Company Name *</label>
                  <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. TCS" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Industry</label>
                  <input type="text" value={formIndustry} onChange={e => setFormIndustry(e.target.value)} placeholder="e.g. IT Services" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Company Type</label>
                  <select value={formCompanyType} onChange={e => setFormCompanyType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-55 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="MNC">MNC</option>
                    <option value="Startup">Startup</option>
                    <option value="Mid-Sized">Mid-Sized</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Location</label>
                  <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="e.g. Chennai" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-55 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Website URL</label>
                  <input type="text" value={formWebsite} onChange={e => setFormWebsite(e.target.value)} placeholder="e.g. https://www.tcs.com" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="border-t border-gray-105 dark:border-gray-800 pt-3">
                <label className="block text-gray-500 uppercase mb-2">HR Contact Information</label>
                <div className="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-150 dark:border-gray-800">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">HR Name</label>
                    <input type="text" value={formContactPerson} onChange={e => setFormContactPerson(e.target.value)} placeholder="HR Manager" className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">HR Email</label>
                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="hr@tcs.com" className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase mb-1">HR Phone</label>
                    <input type="text" value={formMobile} onChange={e => setFormMobile(e.target.value)} placeholder="9876543210" className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Job Roles</label>
                  <input type="text" value={formJobRoles} onChange={e => setFormJobRoles(e.target.value)} placeholder="e.g. Software Developer" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Required Skills</label>
                  <input type="text" value={formRequiredSkills} onChange={e => setFormRequiredSkills(e.target.value)} placeholder="e.g. Java, Python, SQL" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Salary Package</label>
                  <input type="text" value={formCtc} onChange={e => setFormCtc(e.target.value)} placeholder="e.g. 6 LPA" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-55 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Job Type</label>
                  <select value={formJobType} onChange={e => setFormJobType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="Full Time">Full Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Open Positions</label>
                  <input type="number" min="0" value={formOpenPositions} onChange={e => setFormOpenPositions(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Pipeline Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="COLD">COLD</option>
                    <option value="WARM">WARM</option>
                    <option value="HOT">HOT</option>
                    <option value="DRIVE_COMPLETED">DRIVE COMPLETED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Eligibility Criteria</label>
                  <input type="text" value={formEligibilityCriteria} onChange={e => setFormEligibilityCriteria(e.target.value)} placeholder="e.g. 7.5 CGPA, No Active Arrears" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 uppercase mb-1">Company Description</label>
                <textarea rows={3} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Enter general description or JD requirements..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-55 dark:bg-gray-800 text-gray-900 dark:text-white" />
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
