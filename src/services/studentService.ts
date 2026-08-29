import { INITIAL_STUDENT_CSV_DATA, StudentRecord } from "@/lib/studentCsvData";

const STORAGE_KEY = "placementos_students";
const isBrowser = typeof window !== "undefined";

const getLocalStorage = (): StudentRecord[] => {
  if (!isBrowser) return INITIAL_STUDENT_CSV_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENT_CSV_DATA));
      return INITIAL_STUDENT_CSV_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDENT_CSV_DATA));
      return INITIAL_STUDENT_CSV_DATA;
    }
    return parsed;
  } catch (e) {
    console.error("Error reading placementos_students from localStorage", e);
    return INITIAL_STUDENT_CSV_DATA;
  }
};

const setLocalStorage = (students: StudentRecord[]): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    console.error("Error writing placementos_students to localStorage", e);
  }
};

export const studentService = {
  getStudents: (): StudentRecord[] => {
    return getLocalStorage().filter(s => !s.archived);
  },

  getAllIncludingArchived: (): StudentRecord[] => {
    return getLocalStorage();
  },

  getStudentById: (id: string): StudentRecord | undefined => {
    const all = getLocalStorage();
    const cleanId = String(id).toLowerCase().trim();
    return all.find(s => 
      String(s.id).toLowerCase().trim() === cleanId || 
      String(s.rollNumber).toLowerCase().trim() === cleanId
    );
  },

  addStudent: (student: Partial<StudentRecord>): StudentRecord => {
    const all = getLocalStorage();
    const roll = student.rollNumber || student.id || `STU_${Date.now()}`;
    const newStudent: StudentRecord = {
      id: roll,
      rollNumber: roll,
      name: student.name || "Unknown Student",
      department: student.department || "General",
      gender: student.gender || "N/A",
      residenceType: student.residenceType || "N/A",
      sslc: student.sslc || "N/A",
      hsc: student.hsc || "N/A",
      ug: student.ug || "N/A",
      pg: student.pg || "N/A",
      email: student.email || "N/A",
      mobile: student.mobile || "N/A",
      github: student.github || "N/A",
      linkedin: student.linkedin || "N/A",
      resumeLink: student.resumeLink || "N/A",
      selfIntroLink: student.selfIntroLink || "N/A",
      photoLink: student.photoLink || "N/A",
      portfolioLink: student.portfolioLink || "N/A",
      graduationYear: student.graduationYear || 2027,
      skills: student.skills || "N/A",
      education: student.education || "Undergraduate",
      experience: student.experience || "Fresher",
      project: student.project || "N/A",
      jobRole: student.jobRole || "N/A",
      location: student.location || "N/A",
      placementStatus: (student.placementStatus as any) || "YET_TO_BE_PLACED",
      companyPlaced: student.companyPlaced || "N/A",
      roleOffered: student.roleOffered || "N/A",
      packageCtc: student.packageCtc || "N/A",
      resumeScore: student.resumeScore || "N/A",
      archived: false
    };

    all.unshift(newStudent);
    setLocalStorage(all);
    return newStudent;
  },

  updateStudent: (id: string, updatedData: Partial<StudentRecord>): StudentRecord | null => {
    const all = getLocalStorage();
    const index = all.findIndex(s => s.id === id || s.rollNumber === id);
    if (index === -1) return null;

    all[index] = { ...all[index], ...updatedData };
    setLocalStorage(all);
    return all[index];
  },

  archiveStudent: (id: string): boolean => {
    const all = getLocalStorage();
    const student = all.find(s => s.id === id || s.rollNumber === id);
    if (!student) return false;
    student.archived = true;
    setLocalStorage(all);
    return true;
  },

  restoreStudent: (id: string): boolean => {
    const all = getLocalStorage();
    const student = all.find(s => s.id === id || s.rollNumber === id);
    if (!student) return false;
    student.archived = false;
    setLocalStorage(all);
    return true;
  },

  searchStudents: (query: string): StudentRecord[] => {
    if (!query || !query.trim()) return studentService.getStudents();
    const q = query.toLowerCase().trim();
    return studentService.getStudents().filter(s =>
      s.rollNumber?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.skills?.toLowerCase().includes(q) ||
      s.education?.toLowerCase().includes(q) ||
      s.jobRole?.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  },

  filterStudents: (filters: {
    department?: string;
    gender?: string;
    education?: string;
    jobRole?: string;
    location?: string;
    experience?: string;
    graduationYear?: string | number;
    placementStatus?: string;
  }): StudentRecord[] => {
    let result = studentService.getStudents();

    if (filters.department && filters.department !== "ALL") {
      result = result.filter(s => s.department === filters.department);
    }
    if (filters.gender && filters.gender !== "ALL") {
      result = result.filter(s => s.gender === filters.gender);
    }
    if (filters.education && filters.education !== "ALL") {
      result = result.filter(s => s.education?.includes(filters.education!));
    }
    if (filters.jobRole && filters.jobRole !== "ALL") {
      result = result.filter(s => s.jobRole?.toLowerCase().includes(filters.jobRole!.toLowerCase()));
    }
    if (filters.location && filters.location !== "ALL") {
      result = result.filter(s => s.location?.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters.experience && filters.experience !== "ALL") {
      result = result.filter(s => s.experience === filters.experience);
    }
    if (filters.graduationYear && filters.graduationYear !== "ALL") {
      result = result.filter(s => String(s.graduationYear) === String(filters.graduationYear));
    }
    if (filters.placementStatus && filters.placementStatus !== "ALL") {
      result = result.filter(s => s.placementStatus === filters.placementStatus);
    }

    return result;
  },

  importStudents: (incoming: StudentRecord[]): { imported: number; duplicates: number; invalid: number } => {
    const existing = getLocalStorage();
    const existingMap = new Map<string, number>();
    existing.forEach((s, idx) => {
      if (s.rollNumber) existingMap.set(s.rollNumber.toLowerCase().trim(), idx);
      if (s.id) existingMap.set(s.id.toLowerCase().trim(), idx);
    });

    let imported = 0;
    let duplicates = 0;
    let invalid = 0;

    incoming.forEach(student => {
      if (!student.name || (!student.rollNumber && !student.id)) {
        invalid++;
        return;
      }

      const key = (student.rollNumber || student.id).toLowerCase().trim();
      if (existingMap.has(key)) {
        duplicates++;
      } else {
        existing.unshift(student);
        existingMap.set(key, 0);
        imported++;
      }
    });

    setLocalStorage(existing);
    return { imported, duplicates, invalid };
  }
};
