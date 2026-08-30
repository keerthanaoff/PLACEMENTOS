// Generic LocalStorage helper with Safe SSR Check
const isBrowser = typeof window !== "undefined";

export const storageService = {
  get: <T>(key: string, defaultValue: T): T => {
    if (!isBrowser) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  },
  remove: (key: string): void => {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  }
};

// Helper: Ensure every record in an array has a guaranteed unique ID
const sanitizeAndUnique = (items: any[], prefix: string): any[] => {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  return items.map((item, idx) => {
    let currentId = item?.id ? String(item.id).trim() : "";
    if (!currentId || seenIds.has(currentId)) {
      currentId = `${prefix}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
    }
    seenIds.add(currentId);
    return { ...item, id: currentId };
  });
};

// Initial Seed Drives Data
const INITIAL_DRIVES_DATA = [
  {
    id: "D001",
    companyId: "C001",
    company: "TCS",
    title: "Software Engineer",
    jobRole: "Software Engineer",
    industry: "IT Services & Consulting",
    location: "Chennai",
    eligibility: "60%+",
    minCgpa: "6.0",
    package: "6.0 LPA",
    openings: 50,
    driveDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    applicationDeadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    driveType: "Campus Drive",
    workMode: "On-site",
    status: "Active",
    applicantsCount: 42,
    shortlistedCount: 18,
    selectedCount: 6
  },
  {
    id: "D002",
    companyId: "C002",
    company: "Infosys",
    title: "Systems Engineer",
    jobRole: "Systems Engineer",
    industry: "IT Services & Digital Transformation",
    location: "Bengaluru",
    eligibility: "65%+",
    minCgpa: "6.5",
    package: "6.5 LPA",
    openings: 40,
    driveDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    driveType: "Pool Drive",
    workMode: "Hybrid",
    status: "Upcoming",
    applicantsCount: 35,
    shortlistedCount: 15,
    selectedCount: 5
  },
  {
    id: "D003",
    companyId: "C003",
    company: "CodePulse",
    title: "AI/ML Engineer",
    jobRole: "AI/ML Engineer",
    industry: "Artificial Intelligence & Software",
    location: "Chennai",
    eligibility: "70%+",
    minCgpa: "7.0",
    package: "8.0 LPA",
    openings: 10,
    driveDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    applicationDeadline: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    driveType: "Campus Drive",
    workMode: "Hybrid",
    status: "Active",
    applicantsCount: 28,
    shortlistedCount: 12,
    selectedCount: 4
  },
  {
    id: "D004",
    companyId: "C004",
    company: "Krea",
    title: "Full Stack Developer",
    jobRole: "Full Stack Developer",
    industry: "AI, SaaS & Product Technology",
    location: "Bengaluru",
    eligibility: "65%+",
    minCgpa: "6.5",
    package: "7.5 LPA",
    openings: 15,
    driveDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    applicationDeadline: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    driveType: "Campus Drive",
    workMode: "Remote",
    status: "Interview",
    applicantsCount: 31,
    shortlistedCount: 14,
    selectedCount: 5
  },
  {
    id: "D005",
    companyId: "C005",
    company: "Data Edge",
    title: "Data Analyst",
    jobRole: "Data Analyst",
    industry: "Data Analytics & AI",
    location: "Hyderabad",
    eligibility: "60%+",
    minCgpa: "6.0",
    package: "7.0 LPA",
    openings: 20,
    driveDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    driveType: "Off-Campus",
    workMode: "On-site",
    status: "Upcoming",
    applicantsCount: 25,
    shortlistedCount: 10,
    selectedCount: 3
  }
];

// Seed function to initialize demo data if missing
export const initializeData = () => {
  if (!isBrowser) return;
  
  // Wipe student and company data as requested
  storageService.set("pos_students", []);
  storageService.set("pos_companies", []);
  if (!localStorage.getItem("pos_jds")) storageService.set("pos_jds", []);
  if (!localStorage.getItem("pos_drives")) storageService.set("pos_drives", INITIAL_DRIVES_DATA);
  if (!localStorage.getItem("pos_recruiters")) storageService.set("pos_recruiters", []);
};

export const resetDemoData = () => {
  if (!isBrowser) return;
  storageService.set("pos_students", []);
  storageService.set("pos_companies", []);
  storageService.set("pos_jds", []);
  storageService.set("pos_drives", INITIAL_DRIVES_DATA);
  storageService.set("pos_recruiters", []);
  storageService.set("pos_applications", []);
  storageService.set("pos_offers", []);
  initializeData();
};

// Data Services
export const studentService = {
  getAll: () => {
    const raw = storageService.get<any[]>("pos_students", []);
    return sanitizeAndUnique(raw, "S");
  },
  getById: (id: string) => studentService.getAll().find(s => s.id === id),
  save: (data: any) => {
    const all = studentService.getAll();
    const targetId = data.id || data.rollNumber;
    const existingIndex = all.findIndex(s => (s.id || s.rollNumber) === targetId);
    if (existingIndex > -1) {
      all[existingIndex] = { ...all[existingIndex], ...data };
    } else {
      const newId = targetId || `S_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      all.push({ ...data, id: newId });
    }
    storageService.set("pos_students", all);
  },
  delete: (id: string) => {
    const filtered = studentService.getAll().filter(s => s.id !== id);
    storageService.set("pos_students", filtered);
  }
};

export const companyService = {
  getAll: () => {
    const raw = storageService.get<any[]>("pos_companies", []);
    return sanitizeAndUnique(raw, "C");
  },
  getById: (id: string) => companyService.getAll().find(c => c.id === id),
  save: (data: any) => {
    const all = companyService.getAll();
    const targetId = data.id || (data.name ? `C_${data.name.toLowerCase().trim().replace(/[^a-z0-9]/g, "")}` : null);
    const existingIndex = all.findIndex(c => c.id === targetId || (c.name && data.name && c.name.toLowerCase().trim() === data.name.toLowerCase().trim()));
    
    if (existingIndex > -1) {
      all[existingIndex] = { ...all[existingIndex], ...data };
    } else {
      const newId = targetId || `C_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      all.push({ ...data, id: newId });
    }
    storageService.set("pos_companies", all);
  },
  updateStatus: (id: string, status: string) => {
    const all = companyService.getAll();
    const existing = all.find(c => c.id === id);
    if (existing) {
      existing.status = status;
      storageService.set("pos_companies", all);
    }
  }
};

export const jdService = {
  getAll: () => {
    const raw = storageService.get<any[]>("pos_jds", []);
    return sanitizeAndUnique(raw, "JD");
  },
  getById: (id: string) => jdService.getAll().find(j => j.id === id),
  save: (data: any) => {
    const all = jdService.getAll();
    const targetId = data.id || `JD_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const existingIndex = all.findIndex(j => j.id === targetId);
    if (existingIndex > -1) all[existingIndex] = { ...all[existingIndex], ...data };
    else all.push({ ...data, id: targetId });
    storageService.set("pos_jds", all);
  }
};

export const driveService = {
  getAll: () => {
    const raw = storageService.get<any[]>("pos_drives", []);
    return sanitizeAndUnique(raw, "D");
  },
  getById: (id: string) => driveService.getAll().find(d => d.id === id),
  save: (data: any) => {
    const all = driveService.getAll();
    const targetId = data.id || `D_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const existingIndex = all.findIndex(d => d.id === targetId);
    if (existingIndex > -1) all[existingIndex] = { ...all[existingIndex], ...data };
    else all.push({ ...data, id: targetId });
    storageService.set("pos_drives", all);
  }
};

export const applicationService = {
  getAll: () => storageService.get<any[]>("pos_applications", []),
  save: (data: any) => {
    const all = applicationService.getAll();
    all.push({ ...data, id: `APP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, appliedDate: new Date().toISOString() });
    storageService.set("pos_applications", all);
  }
};

export const offerService = {
  getAll: () => storageService.get<any[]>("pos_offers", []),
  save: (data: any) => {
    const all = offerService.getAll();
    all.push({ ...data, id: `OFF_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, offerDate: new Date().toISOString() });
    storageService.set("pos_offers", all);
  }
};

export const recruiterService = {
  getAll: () => {
    const raw = storageService.get<any[]>("pos_recruiters", []);
    if (raw.length === 0 && isBrowser) {
      const initial = [
        { id: "RCR001", name: "Ananya Sharma", companyId: "C001", designation: "Lead HR Campus Relations", email: "ananya.sharma@tcs.com", mobile: "+91 98765 43210", location: "Chennai", activeDrives: 1, lastActivity: "2026-08-25", status: "ACTIVE" },
        { id: "RCR002", name: "Rohan Das", companyId: "C002", designation: "Talent Acquisition Specialist", email: "rohan.das@infosys.com", mobile: "+91 87654 32109", location: "Bengaluru", activeDrives: 1, lastActivity: "2026-08-28", status: "ACTIVE" },
        { id: "RCR003", name: "Priya Nair", companyId: "C004", designation: "HR Director", email: "priya.nair@zoho.com", mobile: "+91 76543 21098", location: "Chennai", activeDrives: 2, lastActivity: "2026-08-29", status: "ACTIVE" },
      ];
      storageService.set("pos_recruiters", initial);
      return initial;
    }
    return sanitizeAndUnique(raw, "RCR");
  },
  getById: (id: string) => recruiterService.getAll().find(r => r.id === id),
  save: (data: any) => {
    const all = recruiterService.getAll();
    const targetId = data.id || `RCR_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const existingIndex = all.findIndex(r => r.id === targetId);
    if (existingIndex > -1) all[existingIndex] = { ...all[existingIndex], ...data };
    else all.push({ ...data, id: targetId });
    storageService.set("pos_recruiters", all);
  }
};

export const notificationService = {
  getAll: () => storageService.get<any[]>("pos_notifications", []),
  add: (notif: any) => {
    const all = notificationService.getAll();
    all.unshift({ ...notif, id: `NOTIF_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, createdAt: new Date().toISOString(), isRead: false });
    storageService.set("pos_notifications", all.slice(0, 50));
  }
};

export const auditService = {
  getAll: () => storageService.get<any[]>("pos_audit", []),
  log: (action: string, details: string, user: string = "System") => {
    const all = auditService.getAll();
    all.unshift({ id: `AUD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, action, details, user, timestamp: new Date().toISOString() });
    storageService.set("pos_audit", all.slice(0, 100));
  }
};
