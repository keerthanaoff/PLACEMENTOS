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
  
  if (!localStorage.getItem("pos_students")) storageService.set("pos_students", []);
  if (!localStorage.getItem("pos_companies")) storageService.set("pos_companies", []);
  if (!localStorage.getItem("pos_jds")) storageService.set("pos_jds", []);
  if (!localStorage.getItem("pos_drives")) storageService.set("pos_drives", []);
  if (!localStorage.getItem("pos_recruiters")) storageService.set("pos_recruiters", []);
};

// Data Services
export const studentService = {
  getAll: () => storageService.get<any[]>("pos_students", []),
  getById: (id: string) => studentService.getAll().find(s => s.id === id),
  save: (data: any) => {
    const all = studentService.getAll();
    const targetId = data.id || data.rollNumber;
    const existingIndex = all.findIndex(s => (s.id || s.rollNumber) === targetId);
    if (existingIndex > -1) {
      all[existingIndex] = { ...all[existingIndex], ...data };
    } else {
      all.push({ ...data, id: targetId || `S${Date.now()}_${Math.random().toString(36).substring(2, 7)}` });
    }
    storageService.set("pos_students", all);
  },
  delete: (id: string) => {
    const filtered = studentService.getAll().filter(s => s.id !== id);
    storageService.set("pos_students", filtered);
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
