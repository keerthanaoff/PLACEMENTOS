import { MOCK_STUDENTS, MOCK_COMPANIES, MOCK_JDS, MOCK_DRIVES, MOCK_RECRUITERS } from "@/lib/mock-data";

// Helper to check if we are in the browser
const isBrowser = typeof window !== 'undefined';

// Generic CRUD Operations for LocalStorage
export const storageService = {
  get<T>(key: string, fallback: T): T {
    if (!isBrowser) return fallback;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  },
  
  set<T>(key: string, value: T): void {
    if (!isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  remove(key: string): void {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  }
};

// Seed function to initialize demo data if missing
export const initializeData = () => {
  if (!isBrowser) return;
  
  const existingStudents = storageService.get<any[]>("pos_students", []);
  if (!existingStudents || existingStudents.length === 0) {
    storageService.set("pos_students", MOCK_STUDENTS.map(s => ({...s, isArchived: false})));
  } else {
    // Sync any missing CSV records from MOCK_STUDENTS into localStorage
    let updated = false;
    MOCK_STUDENTS.forEach(mockS => {
      if (!existingStudents.some(s => s.id === mockS.id || s.rollNumber === mockS.rollNumber)) {
        existingStudents.push({ ...mockS, isArchived: false });
        updated = true;
      }
    });
    if (updated) {
      storageService.set("pos_students", existingStudents);
    }
  }

  if (!localStorage.getItem("pos_companies")) storageService.set("pos_companies", MOCK_COMPANIES.map(c => ({...c, status: "COLD", approvalStatus: "APPROVED", isArchived: false})));
  if (!localStorage.getItem("pos_jds")) storageService.set("pos_jds", MOCK_JDS.map(j => ({...j, status: "ACTIVE", approvalStatus: "APPROVED"})));
  if (!localStorage.getItem("pos_drives")) storageService.set("pos_drives", MOCK_DRIVES);
  if (!localStorage.getItem("pos_recruiters")) storageService.set("pos_recruiters", MOCK_RECRUITERS);
};

// Data Services
export const studentService = {
  getAll: () => storageService.get<any[]>("pos_students", []),
  getById: (id: string) => studentService.getAll().find(s => s.id === id),
  save: (data: any) => {
    const all = studentService.getAll();
    const existingIndex = all.findIndex(s => s.id === data.id);
    if (existingIndex > -1) all[existingIndex] = data;
    else all.push({ ...data, id: `S${Date.now()}` });
    storageService.set("pos_students", all);
  }
};

export const companyService = {
  getAll: () => storageService.get<any[]>("pos_companies", []),
  getById: (id: string) => companyService.getAll().find(c => c.id === id),
  save: (data: any) => {
    const all = companyService.getAll();
    const existingIndex = all.findIndex(c => c.id === data.id);
    if (existingIndex > -1) all[existingIndex] = data;
    else all.push({ ...data, id: `C${Date.now()}` });
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
  getAll: () => storageService.get<any[]>("pos_jds", []),
  getById: (id: string) => jdService.getAll().find(j => j.id === id),
  save: (data: any) => {
    const all = jdService.getAll();
    const existingIndex = all.findIndex(j => j.id === data.id);
    if (existingIndex > -1) all[existingIndex] = data;
    else all.push({ ...data, id: `JD${Date.now()}` });
    storageService.set("pos_jds", all);
  }
};

export const driveService = {
  getAll: () => storageService.get<any[]>("pos_drives", []),
  getById: (id: string) => driveService.getAll().find(d => d.id === id),
  save: (data: any) => {
    const all = driveService.getAll();
    const existingIndex = all.findIndex(d => d.id === data.id);
    if (existingIndex > -1) all[existingIndex] = data;
    else all.push({ ...data, id: `D${Date.now()}` });
    storageService.set("pos_drives", all);
  }
};

export const applicationService = {
  getAll: () => storageService.get<any[]>("pos_applications", []),
  save: (data: any) => {
    const all = applicationService.getAll();
    all.push({ ...data, id: `APP${Date.now()}`, appliedDate: new Date().toISOString() });
    storageService.set("pos_applications", all);
  }
};

export const offerService = {
  getAll: () => storageService.get<any[]>("pos_offers", []),
  save: (data: any) => {
    const all = offerService.getAll();
    all.push({ ...data, id: `OFF${Date.now()}`, offerDate: new Date().toISOString() });
    storageService.set("pos_offers", all);
  }
};

export const notificationService = {
  getAll: () => storageService.get<any[]>("pos_notifications", []),
  add: (message: string) => {
    const all = notificationService.getAll();
    all.unshift({ id: `N${Date.now()}`, message, date: new Date().toISOString(), read: false });
    storageService.set("pos_notifications", all);
  },
  markAllRead: () => {
    const all = notificationService.getAll().map(n => ({...n, read: true}));
    storageService.set("pos_notifications", all);
  }
};

export const auditService = {
  getAll: () => storageService.get<any[]>("pos_audit", []),
  log: (action: string, module: string, description: string) => {
    const all = auditService.getAll();
    const userRole = isBrowser ? localStorage.getItem("userRole") || "Unknown" : "System";
    all.unshift({
      id: `L${Date.now()}`,
      date: new Date().toISOString(),
      user: userRole,
      role: userRole,
      action,
      module,
      description
    });
    storageService.set("pos_audit", all);
  }
};

export const resetDemoData = () => {
  if (!isBrowser) return;
  ["pos_students", "pos_companies", "pos_jds", "pos_drives", "pos_recruiters", "pos_applications", "pos_offers", "pos_team", "pos_notifications", "pos_audit"].forEach(key => localStorage.removeItem(key));
  initializeData();
};
