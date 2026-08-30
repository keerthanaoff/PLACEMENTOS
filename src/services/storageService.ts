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
    title: "Software Developer",
    jobRole: "Software Developer",
    industry: "IT Services",
    location: "Chennai",
    eligibility: "B.E/B.Tech/MCA, Minimum 60%, No active backlogs",
    minCgpa: "6.0",
    package: "₹7.0 LPA",
    openings: 12,
    driveDate: "2026-09-10",
    applicationDeadline: "2026-09-08",
    driveType: "On Campus",
    workMode: "On-site",
    status: "Upcoming",
    applicantsCount: 80,
    shortlistedCount: 24,
    selectedCount: 12,
    skills: ["Java", "Python", "SQL", "Data Structures", "Algorithms", "Git"],
    description: "Develop and maintain software applications. Write clean and maintainable code. Work with development and testing teams. Debug and resolve software issues. Participate in code reviews. Work with databases and APIs.",
    eligibilityCriteria: "B.E/B.Tech/MCA, Minimum 60%, No active backlogs",
    recruitmentProcess: ["Aptitude Test", "Technical Interview", "HR Interview"]
  },
  {
    id: "D002",
    companyId: "C002",
    company: "Infosys",
    title: "Java Developer",
    jobRole: "Java Developer",
    industry: "IT Services",
    location: "Bengaluru",
    eligibility: "B.E/B.Tech/MCA",
    minCgpa: "6.5",
    package: "₹6.5 LPA",
    openings: 10,
    driveDate: "2026-09-15",
    applicationDeadline: "2026-09-12",
    driveType: "On Campus",
    workMode: "On-site",
    status: "Upcoming",
    applicantsCount: 65,
    shortlistedCount: 20,
    selectedCount: 10,
    skills: ["Java", "Spring Boot", "SQL", "REST API", "Git"],
    description: "Develop Java applications. Build REST APIs. Debug application issues. Work with databases. Participate in Agile development.",
    eligibilityCriteria: "B.E/B.Tech/MCA",
    recruitmentProcess: ["Online Test", "Technical round", "HR Round"]
  },
  {
    id: "D003",
    companyId: "C003",
    company: "CodePulse",
    title: "Full Stack Developer",
    jobRole: "Full Stack Developer",
    industry: "Software / Technology",
    location: "Bengaluru",
    eligibility: "B.E/B.Tech/MCA or equivalent",
    minCgpa: "7.0",
    package: "₹8.0 LPA",
    openings: 8,
    driveDate: "2026-09-20",
    applicationDeadline: "2026-09-18",
    driveType: "On Campus",
    workMode: "On-site",
    status: "Active",
    applicantsCount: 45,
    shortlistedCount: 15,
    selectedCount: 8,
    skills: ["React", "JavaScript", "Node.js", "MongoDB", "REST API", "Git"],
    description: "Build and improve web applications. Develop frontend and backend features. Integrate APIs. Fix bugs and improve application performance. Work closely with the product team.",
    eligibilityCriteria: "B.E/B.Tech/MCA or equivalent",
    recruitmentProcess: ["Coding Test", "Technical Interview 1", "Technical Interview 2", "HR Interview"]
  },
  {
    id: "D004",
    companyId: "C004",
    company: "Krea Data Edge",
    title: "Data Analyst",
    jobRole: "Data Analyst",
    industry: "Data Analytics / AI",
    location: "Bengaluru",
    eligibility: "UG/PG with basic analytical knowledge",
    minCgpa: "6.5",
    package: "₹7.5 LPA",
    openings: 6,
    driveDate: "2026-09-25",
    applicationDeadline: "2026-09-22",
    driveType: "On Campus",
    workMode: "On-site",
    status: "Upcoming",
    applicantsCount: 40,
    shortlistedCount: 12,
    selectedCount: 6,
    skills: ["SQL", "Python", "Excel", "Power BI", "Statistics"],
    description: "Analyze business data. Build dashboards. Generate reports. Identify business trends. Provide actionable insights.",
    eligibilityCriteria: "UG/PG with basic analytical knowledge",
    recruitmentProcess: ["Aptitude Test", "Technical round", "HR Interview"]
  },
  {
    id: "D005",
    companyId: "C001",
    company: "TCS",
    title: "AI/ML Engineer",
    jobRole: "AI/ML Engineer",
    industry: "Artificial Intelligence",
    location: "Chennai",
    eligibility: "B.E/B.Tech/MCA, ML basics",
    minCgpa: "7.0",
    package: "₹9.0 LPA",
    openings: 9,
    driveDate: "2026-09-05",
    applicationDeadline: "2026-09-02",
    driveType: "On Campus",
    workMode: "On-site",
    status: "Active",
    applicantsCount: 55,
    shortlistedCount: 18,
    selectedCount: 9,
    skills: ["Python", "Machine Learning", "Pandas", "NumPy", "Scikit-learn", "SQL"],
    description: "Build machine learning models. Prepare and analyze datasets. Evaluate model performance. Develop AI-based solutions. Work with engineering and business teams.",
    eligibilityCriteria: "B.E/B.Tech/MCA, ML basics",
    recruitmentProcess: ["AI/ML Hackathon", "Technical Interview", "HR Interview"]
  },
  {
    id: "D006",
    companyId: "C002",
    company: "Infosys",
    title: "Data Scientist",
    jobRole: "Data Scientist",
    industry: "Data Science",
    location: "Bengaluru",
    eligibility: "B.E/B.Tech/MCA, Statistics",
    minCgpa: "7.0",
    package: "₹8.5 LPA",
    openings: 7,
    driveDate: "2026-09-28",
    applicationDeadline: "2026-09-25",
    driveType: "On Campus",
    workMode: "On-site",
    status: "Upcoming",
    applicantsCount: 50,
    shortlistedCount: 15,
    selectedCount: 7,
    skills: ["Python", "Machine Learning", "Statistics", "SQL", "Pandas", "NumPy"],
    description: "Analyze large datasets. Build predictive models. Perform exploratory data analysis. Develop machine learning solutions. Communicate insights to stakeholders.",
    eligibilityCriteria: "B.E/B.Tech/MCA, Statistics",
    recruitmentProcess: ["Math/Coding Test", "Technical interview", "HR Interview"]
  },
  {
    id: "D007",
    companyId: "C003",
    company: "CodePulse",
    title: "AI Engineer",
    jobRole: "AI Engineer",
    industry: "Artificial Intelligence",
    location: "Bengaluru",
    eligibility: "B.E/B.Tech/MCA, GenAI experience",
    minCgpa: "7.5",
    package: "₹10.0 LPA",
    openings: 5,
    driveDate: "2026-10-02",
    applicationDeadline: "2026-09-30",
    driveType: "Off Campus",
    workMode: "Hybrid",
    status: "Upcoming",
    applicantsCount: 35,
    shortlistedCount: 10,
    selectedCount: 5,
    skills: ["Python", "Machine Learning", "Generative AI", "APIs", "SQL"],
    description: "Develop AI-powered features. Experiment with machine learning models. Integrate AI APIs. Build prototypes. Evaluate AI model performance.",
    eligibilityCriteria: "B.E/B.Tech/MCA, GenAI experience",
    recruitmentProcess: ["Take-home Assignment", "Technical discussion", "HR interview"]
  },
  {
    id: "D008",
    companyId: "C004",
    company: "Krea Data Edge",
    title: "Machine Learning Engineer",
    jobRole: "Machine Learning Engineer",
    industry: "AI / Data Science",
    location: "Bengaluru",
    eligibility: "B.E/B.Tech/MCA or equivalent",
    minCgpa: "7.0",
    package: "₹9.5 LPA",
    openings: 4,
    driveDate: "2026-10-08",
    applicationDeadline: "2026-10-05",
    driveType: "On Campus",
    workMode: "On-site",
    status: "Upcoming",
    applicantsCount: 30,
    shortlistedCount: 8,
    selectedCount: 4,
    skills: ["Python", "Machine Learning", "Scikit-learn", "Pandas", "NumPy", "SQL"],
    description: "Develop machine learning models. Prepare training datasets. Evaluate model accuracy. Deploy ML solutions. Work with data scientists and engineers.",
    eligibilityCriteria: "B.E/B.Tech/MCA or equivalent",
    recruitmentProcess: ["Coding Test", "Technical interview", "HR interview"]
  }
];

// Seed function to initialize demo data if missing
export const initializeData = () => {
  if (!isBrowser) return;
  
  // Wipe student and company data as requested
  storageService.set("pos_students", []);
  storageService.set("pos_companies", []);
  if (!localStorage.getItem("pos_jds")) storageService.set("pos_jds", []);
  const drivesRaw = localStorage.getItem("pos_drives");
  if (!drivesRaw || !drivesRaw.includes("D008")) {
    storageService.set("pos_drives", INITIAL_DRIVES_DATA);
  }
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
