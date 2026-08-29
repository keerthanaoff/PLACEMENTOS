import { INITIAL_COMPANY_CSV_DATA, CompanyRecord } from "@/lib/companyCsvData";
import { auditService, notificationService } from "@/services/storageService";

const STORAGE_KEY = "placementos_companies";
const isBrowser = typeof window !== "undefined";

const getLocalStorage = (): CompanyRecord[] => {
  if (!isBrowser) return INITIAL_COMPANY_CSV_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPANY_CSV_DATA));
      return INITIAL_COMPANY_CSV_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPANY_CSV_DATA));
      return INITIAL_COMPANY_CSV_DATA;
    }
    return parsed;
  } catch (e) {
    console.error("Error reading placementos_companies from localStorage", e);
    return INITIAL_COMPANY_CSV_DATA;
  }
};

const setLocalStorage = (companies: CompanyRecord[]): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  } catch (e) {
    console.error("Error writing placementos_companies to localStorage", e);
  }
};

export const companyService = {
  getCompanies: (): CompanyRecord[] => {
    return getLocalStorage().filter(c => !c.archived);
  },

  getAllIncludingArchived: (): CompanyRecord[] => {
    return getLocalStorage();
  },

  getArchivedCompanies: (): CompanyRecord[] => {
    return getLocalStorage().filter(c => c.archived);
  },

  getCompanyById: (id: string): CompanyRecord | undefined => {
    const all = getLocalStorage();
    const cleanId = String(id).toLowerCase().trim();
    return all.find(c => 
      String(c.id).toLowerCase().trim() === cleanId || 
      String(c.name).toLowerCase().trim() === cleanId
    );
  },

  addCompany: (company: Partial<CompanyRecord>): CompanyRecord => {
    const all = getLocalStorage();
    const newId = company.id || `C_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCompany: CompanyRecord = {
      id: newId,
      name: company.name || "Unknown Company",
      location: company.location || "N/A",
      website: company.website || "N/A",
      contactPerson: company.contactPerson || "N/A",
      mobile: company.mobile || "N/A",
      email: company.email || "N/A",
      companySize: company.companySize || "N/A",
      numberOfEmployees: company.numberOfEmployees || "N/A",
      industry: company.industry || "Software & Technology",
      ctc: company.ctc || "N/A",
      status: (company.status as any) || "COLD",
      approvalStatus: (company.approvalStatus as any) || "PENDING",
      dateAdded: company.dateAdded || new Date().toISOString().split("T")[0],
      placementTeamMember: company.placementTeamMember || "Placement Officer",
      recruiter: company.recruiter || "N/A",
      jobRole: company.jobRole || "N/A",
      jd: company.jd || "N/A",
      jdPdf: company.jdPdf || "N/A",
      driveStatus: company.driveStatus || "Scheduled",
      placedStudentsCount: company.placedStudentsCount || 0,
      placedStudentsDetails: company.placedStudentsDetails || "N/A",
      archived: false
    };

    all.unshift(newCompany);
    setLocalStorage(all);

    auditService.log("ADD_COMPANY", `Added new company ${newCompany.name}`, "User");
    notificationService.add({ title: "New Company Registered", message: `${newCompany.name} has been added.` });

    return newCompany;
  },

  updateCompany: (id: string, updatedData: Partial<CompanyRecord>): CompanyRecord | null => {
    const all = getLocalStorage();
    const index = all.findIndex(c => c.id === id || c.name.toLowerCase().trim() === id.toLowerCase().trim());
    if (index === -1) return null;

    const oldStatus = all[index].status;
    const oldApproval = all[index].approvalStatus;

    all[index] = { ...all[index], ...updatedData };
    setLocalStorage(all);

    if (updatedData.status && updatedData.status !== oldStatus) {
      auditService.log("COMPANY_STATUS_CHANGE", `Company ${all[index].name} status changed from ${oldStatus} to ${updatedData.status}`, "User");
      notificationService.add({ title: "Company Pipeline Updated", message: `${all[index].name} moved to ${updatedData.status}.` });
    }

    if (updatedData.approvalStatus && updatedData.approvalStatus !== oldApproval) {
      auditService.log("COMPANY_APPROVAL_CHANGE", `Company ${all[index].name} approval status changed to ${updatedData.approvalStatus}`, "Admin");
    }

    return all[index];
  },

  archiveCompany: (id: string): boolean => {
    const all = getLocalStorage();
    const company = all.find(c => c.id === id || c.name.toLowerCase().trim() === id.toLowerCase().trim());
    if (!company) return false;
    company.archived = true;
    setLocalStorage(all);

    auditService.log("ARCHIVE_COMPANY", `Archived company ${company.name}`, "User");
    return true;
  },

  restoreCompany: (id: string): boolean => {
    const all = getLocalStorage();
    const company = all.find(c => c.id === id || c.name.toLowerCase().trim() === id.toLowerCase().trim());
    if (!company) return false;
    company.archived = false;
    setLocalStorage(all);

    auditService.log("RESTORE_COMPANY", `Restored company ${company.name}`, "User");
    return true;
  },

  searchCompanies: (query: string): CompanyRecord[] => {
    if (!query || !query.trim()) return companyService.getCompanies();
    const q = query.toLowerCase().trim();
    return companyService.getCompanies().filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.recruiter?.toLowerCase().includes(q) ||
      c.jobRole?.toLowerCase().includes(q) ||
      c.ctc?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  },

  filterCompanies: (filters: {
    industry?: string;
    location?: string;
    companySize?: string;
    ctc?: string;
    status?: string;
    approvalStatus?: string;
    placementTeamMember?: string;
    driveStatus?: string;
  }): CompanyRecord[] => {
    let result = companyService.getCompanies();

    if (filters.industry && filters.industry !== "ALL") {
      result = result.filter(c => c.industry === filters.industry);
    }
    if (filters.location && filters.location !== "ALL") {
      result = result.filter(c => c.location?.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters.companySize && filters.companySize !== "ALL") {
      result = result.filter(c => c.companySize === filters.companySize);
    }
    if (filters.status && filters.status !== "ALL") {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.approvalStatus && filters.approvalStatus !== "ALL") {
      result = result.filter(c => c.approvalStatus === filters.approvalStatus);
    }
    if (filters.placementTeamMember && filters.placementTeamMember !== "ALL") {
      result = result.filter(c => c.placementTeamMember === filters.placementTeamMember);
    }
    if (filters.driveStatus && filters.driveStatus !== "ALL") {
      result = result.filter(c => c.driveStatus === filters.driveStatus);
    }

    return result;
  },

  importCompanies: (incoming: CompanyRecord[]): { imported: number; duplicates: number; invalid: number } => {
    const existing = getLocalStorage();
    const existingSet = new Set<string>();
    existing.forEach(c => {
      const key = `${c.name.toLowerCase().trim()}_${c.location.toLowerCase().trim()}`;
      existingSet.add(key);
    });

    let imported = 0;
    let duplicates = 0;
    let invalid = 0;

    incoming.forEach(company => {
      if (!company.name) {
        invalid++;
        return;
      }

      const key = `${company.name.toLowerCase().trim()}_${(company.location || "").toLowerCase().trim()}`;
      if (existingSet.has(key)) {
        duplicates++;
      } else {
        existing.unshift(company);
        existingSet.add(key);
        imported++;
      }
    });

    setLocalStorage(existing);
    auditService.log("IMPORT_COMPANIES", `Imported ${imported} companies from CSV (${duplicates} duplicates skipped)`, "User");
    return { imported, duplicates, invalid };
  }
};
