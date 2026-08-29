import * as XLSX from "xlsx";
import { studentService, companyService, driveService } from "@/services/storageService";

export interface ParsedRow {
  rowNumber: number;
  status: "VALID" | "DUPLICATE" | "INVALID";
  reason: string;
  data: Record<string, any>;
  rawRow: Record<string, any>;
}

export interface ParsedStudentRow {
  rowNumber: number;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: number;
  cgpa: string;
  skills: string;
  resumeLink: string;
  placementStatus: string;
  status: "VALID" | "DUPLICATE" | "INVALID";
  reason: string;
  rawRow: Record<string, any>;
}

export interface DetectedColumnMap {
  excelColumn: string;
  appField: string;
}

export interface ImportAnalysisResult<T = ParsedStudentRow> {
  fileName: string;
  totalRows: number;
  detectedColumns: DetectedColumnMap[];
  validRows: T[];
  duplicateRows: T[];
  invalidRows: T[];
  allRows: T[];
}

// Header Normalizer
export const normalizeHeader = (raw: string): string => {
  return String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
};

// --- STUDENT ALIASES ---
const STUDENT_ALIASES: Record<string, string[]> = {
  student_id: [
    "student_id", "studentid", "student_id_no", "student_no", "student_number", 
    "student_number_id", "studentidno", "student_id_number", "roll_no", "roll_number", 
    "rollno", "roll_number_id", "id", "student_code", "studentcode", "registration_no", 
    "registration_number", "reg_no", "register_no", "register_number"
  ],
  student_name: [
    "student_name", "studentname", "student_name_full", "name", "full_name", 
    "fullname", "candidate_name", "candidate_name_full"
  ],
  first_name: ["first_name", "firstname"],
  last_name: ["last_name", "lastname"],
  department: ["department", "dept", "branch", "stream", "course_department", "course"],
  year: ["year", "graduation_year", "graduationyear", "passing_year", "batch", "academic_year"],
  cgpa: ["cgpa", "gpa", "percentage", "academic_percentage", "ug", "ug_percentage", "ugpercentage"],
  email: ["email", "email_id", "email_address", "student_email"],
  phone: ["phone", "phone_number", "mobile", "mobile_number", "contact_number", "mobile_no"],
  skills: ["skills", "technical_skills", "technicalskills", "skill_set"],
  placement_status: ["placement_status", "status", "placement", "placement_result"],
  resume: ["resume", "resume_url", "resumelink", "resume_link"]
};

const STUDENT_FIELD_LABELS: Record<string, string> = {
  student_id: "Student ID",
  student_name: "Student Name",
  department: "Department",
  year: "Graduation Year",
  cgpa: "CGPA",
  email: "Email",
  phone: "Phone",
  skills: "Skills",
  placement_status: "Placement Status",
  resume: "Resume Link"
};

// --- COMPANY ALIASES ---
const COMPANY_ALIASES: Record<string, string[]> = {
  company_name: ["company_name", "company", "name", "organization", "company_title"],
  industry: ["industry", "domain", "sector", "category"],
  tier: ["tier", "company_tier", "level"],
  location: ["location", "city", "headquarters", "address"],
  website: ["website", "url", "company_website"],
  ctc: ["ctc", "salary", "package", "lpa", "avg_ctc"]
};

const COMPANY_FIELD_LABELS: Record<string, string> = {
  company_name: "Company Name",
  industry: "Industry",
  tier: "Tier",
  location: "Location",
  website: "Website",
  ctc: "CTC Package"
};

// --- DRIVE ALIASES ---
const DRIVE_ALIASES: Record<string, string[]> = {
  title: ["title", "drive_title", "drive_name", "job_role", "role"],
  company: ["company", "company_name", "organization"],
  date: ["date", "drive_date", "schedule_date", "interview_date"],
  cgpa_cutoff: ["eligibility", "min_cgpa", "cgpa_cutoff", "cutoff", "cgpa"],
  departments: ["departments", "eligible_departments", "dept", "branch"],
  status: ["status", "drive_status", "stage"]
};

const DRIVE_FIELD_LABELS: Record<string, string> = {
  title: "Drive Title",
  company: "Company",
  date: "Drive Date",
  cgpa_cutoff: "Eligibility Cutoff",
  departments: "Target Departments",
  status: "Status"
};

const matchFieldKey = (normHeader: string, aliasTable: Record<string, string[]>): string | null => {
  if (!normHeader) return null;
  for (const [fieldKey, aliasArray] of Object.entries(aliasTable)) {
    if (aliasArray.includes(normHeader)) {
      return fieldKey;
    }
  }
  return null;
};

// Core 2D Sheet Header Auto-Detector
const detectHeaderRowAndMap = (sheetRows: any[][], aliasTable: Record<string, string[]>, labelTable: Record<string, string>) => {
  let headerRowIndex = -1;
  let colIndexToField: Record<number, string> = {};
  let colIndexToRawName: Record<number, string> = {};

  for (let r = 0; r < Math.min(sheetRows.length, 25); r++) {
    const row = sheetRows[r];
    if (!Array.isArray(row)) continue;

    let matchCount = 0;
    const tempFieldMap: Record<number, string> = {};
    const tempRawMap: Record<number, string> = {};

    row.forEach((cellVal, cIdx) => {
      const cellStr = String(cellVal || "").trim();
      if (!cellStr) return;

      const norm = normalizeHeader(cellStr);
      const matchedField = matchFieldKey(norm, aliasTable);

      if (matchedField) {
        matchCount++;
        tempFieldMap[cIdx] = matchedField;
        tempRawMap[cIdx] = cellStr;
      }
    });

    if (matchCount >= 1) {
      headerRowIndex = r;
      colIndexToField = tempFieldMap;
      colIndexToRawName = tempRawMap;
      row.forEach((cellVal, cIdx) => {
        const cellStr = String(cellVal || "").trim();
        if (cellStr && !tempRawMap[cIdx]) {
          tempRawMap[cIdx] = cellStr;
        }
      });
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    const firstRow = sheetRows[0] || [];
    firstRow.forEach((cellVal, cIdx) => {
      const cellStr = String(cellVal || "").trim();
      const norm = normalizeHeader(cellStr);
      const matched = matchFieldKey(norm, aliasTable);
      if (matched) colIndexToField[cIdx] = matched;
      colIndexToRawName[cIdx] = cellStr || `Column ${cIdx + 1}`;
    });
  }

  const detectedColumns: DetectedColumnMap[] = [];
  Object.keys(colIndexToRawName).forEach((cIdxStr) => {
    const cIdx = parseInt(cIdxStr);
    const rawColName = colIndexToRawName[cIdx];
    const fieldKey = colIndexToField[cIdx];
    if (fieldKey) {
      detectedColumns.push({
        excelColumn: rawColName,
        appField: labelTable[fieldKey] || fieldKey
      });
    }
  });

  return { headerRowIndex, colIndexToField, colIndexToRawName, detectedColumns };
};

// --- 1. STUDENT EXCEL/CSV PARSER ---
export const parseStudentExcelOrCsv = (binaryData: string, fileName: string): ImportAnalysisResult<ParsedStudentRow> => {
  const workbook = XLSX.read(binaryData, { type: "binary" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (!sheetRows || sheetRows.length === 0) throw new Error("Uploaded file contains no data.");

  const { headerRowIndex, colIndexToField, colIndexToRawName, detectedColumns } = detectHeaderRowAndMap(sheetRows, STUDENT_ALIASES, STUDENT_FIELD_LABELS);

  const existingStudents = studentService.getAll();
  const dbRolls = new Set(existingStudents.map(s => normalizeHeader(s.rollNumber || s.id)));
  const fileRolls = new Set<string>();

  const allRows: ParsedStudentRow[] = [];
  const validRows: ParsedStudentRow[] = [];
  const duplicateRows: ParsedStudentRow[] = [];
  const invalidRows: ParsedStudentRow[] = [];

  for (let r = headerRowIndex + 1; r < sheetRows.length; r++) {
    const rowArray = sheetRows[r];
    if (!Array.isArray(rowArray) || rowArray.every(cell => String(cell || "").trim() === "")) continue;

    const rowObj: Record<string, string> = {};
    const rawObj: Record<string, any> = {};

    rowArray.forEach((cellVal, cIdx) => {
      const fieldKey = colIndexToField[cIdx];
      const rawHeaderName = colIndexToRawName[cIdx] || `Col_${cIdx}`;
      const cellStr = String(cellVal || "").trim();
      rawObj[rawHeaderName] = cellStr;
      if (fieldKey) rowObj[fieldKey] = cellStr;
    });

    let studentId = (rowObj["student_id"] || "").trim();
    let studentName = (rowObj["student_name"] || "").trim();
    if (!studentName && (rowObj["first_name"] || rowObj["last_name"])) {
      studentName = `${rowObj["first_name"] || ""} ${rowObj["last_name"] || ""}`.trim();
    }

    const email = rowObj["email"] || "";
    const phone = rowObj["phone"] || "";
    const department = rowObj["department"] || "CSE";
    const yearStr = rowObj["year"] || "";
    const year = parseInt(yearStr || "2026") || 2026;
    const cgpa = rowObj["cgpa"] || "75";
    const skills = rowObj["skills"] || "Java, React, SQL";
    const statusStr = (rowObj["placement_status"] || "").toUpperCase();
    const resumeLink = rowObj["resume"] || "";

    const placementStatus = ["PLACED", "SHORTLISTED", "UNPLACED"].includes(statusStr) ? statusStr : "UNPLACED";
    const normId = normalizeHeader(studentId);
    const rowNumber = r + 1;

    let rowStatus: "VALID" | "DUPLICATE" | "INVALID" = "VALID";
    let reason = "Valid record";

    if (!studentId) {
      rowStatus = "INVALID";
      reason = `Row ${rowNumber}: Student ID is missing`;
    } else if (!studentName) {
      rowStatus = "INVALID";
      reason = `Row ${rowNumber}: Student Name is missing`;
    } else if (dbRolls.has(normId)) {
      rowStatus = "DUPLICATE";
      reason = `Student ID "${studentId}" already exists.`;
    } else if (fileRolls.has(normId)) {
      rowStatus = "DUPLICATE";
      reason = `Duplicate Student ID "${studentId}" in uploaded file.`;
    } else {
      fileRolls.add(normId);
    }

    const parsedRow: ParsedStudentRow = {
      rowNumber,
      studentId,
      name: studentName,
      email: email || (studentId ? `${studentId.toLowerCase()}@college.edu` : ""),
      phone,
      department,
      year,
      cgpa,
      skills,
      resumeLink,
      placementStatus,
      status: rowStatus,
      reason,
      rawRow: rawObj
    };

    allRows.push(parsedRow);
    if (rowStatus === "VALID") validRows.push(parsedRow);
    else if (rowStatus === "DUPLICATE") duplicateRows.push(parsedRow);
    else invalidRows.push(parsedRow);
  }

  return { fileName, totalRows: allRows.length, detectedColumns, validRows, duplicateRows, invalidRows, allRows };
};

// --- 2. COMPANY EXCEL/CSV PARSER ---
export const parseCompanyExcelOrCsv = (binaryData: string, fileName: string): ImportAnalysisResult<ParsedRow> => {
  const workbook = XLSX.read(binaryData, { type: "binary" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (!sheetRows || sheetRows.length === 0) throw new Error("Uploaded file contains no data.");

  const { headerRowIndex, colIndexToField, colIndexToRawName, detectedColumns } = detectHeaderRowAndMap(sheetRows, COMPANY_ALIASES, COMPANY_FIELD_LABELS);

  const existingCompanies = companyService.getAll();
  const dbNames = new Set(existingCompanies.map(c => normalizeHeader(c.name)));
  const fileNames = new Set<string>();

  const allRows: ParsedRow[] = [];
  const validRows: ParsedRow[] = [];
  const duplicateRows: ParsedRow[] = [];
  const invalidRows: ParsedRow[] = [];

  for (let r = headerRowIndex + 1; r < sheetRows.length; r++) {
    const rowArray = sheetRows[r];
    if (!Array.isArray(rowArray) || rowArray.every(cell => String(cell || "").trim() === "")) continue;

    const rowObj: Record<string, string> = {};
    const rawObj: Record<string, any> = {};

    rowArray.forEach((cellVal, cIdx) => {
      const fieldKey = colIndexToField[cIdx];
      const rawHeaderName = colIndexToRawName[cIdx] || `Col_${cIdx}`;
      const cellStr = String(cellVal || "").trim();
      rawObj[rawHeaderName] = cellStr;
      if (fieldKey) rowObj[fieldKey] = cellStr;
    });

    const companyName = (rowObj["company_name"] || "").trim();
    const industry = rowObj["industry"] || "IT Services";
    const tier = rowObj["tier"] || "Tier 1";
    const location = rowObj["location"] || "Bangalore, India";
    const website = rowObj["website"] || "";
    const ctc = rowObj["ctc"] || "7 LPA";

    const normName = normalizeHeader(companyName);
    const rowNumber = r + 1;

    let rowStatus: "VALID" | "DUPLICATE" | "INVALID" = "VALID";
    let reason = "Valid company record";

    if (!companyName) {
      rowStatus = "INVALID";
      reason = `Row ${rowNumber}: Company Name is missing`;
    } else if (dbNames.has(normName)) {
      rowStatus = "DUPLICATE";
      reason = `Company "${companyName}" already exists.`;
    } else if (fileNames.has(normName)) {
      rowStatus = "DUPLICATE";
      reason = `Duplicate Company "${companyName}" in file.`;
    } else {
      fileNames.add(normName);
    }

    const parsedRow: ParsedRow = {
      rowNumber,
      status: rowStatus,
      reason,
      data: {
        name: companyName,
        industry,
        tier,
        location,
        website: website.startsWith("http") ? website : website ? `https://${website}` : "",
        ctc,
        status: "WARM",
        approvalStatus: "APPROVED"
      },
      rawRow: rawObj
    };

    allRows.push(parsedRow);
    if (rowStatus === "VALID") validRows.push(parsedRow);
    else if (rowStatus === "DUPLICATE") duplicateRows.push(parsedRow);
    else invalidRows.push(parsedRow);
  }

  return { fileName, totalRows: allRows.length, detectedColumns, validRows, duplicateRows, invalidRows, allRows };
};

// --- 3. DRIVE EXCEL/CSV PARSER ---
export const parseDriveExcelOrCsv = (binaryData: string, fileName: string): ImportAnalysisResult<ParsedRow> => {
  const workbook = XLSX.read(binaryData, { type: "binary" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (!sheetRows || sheetRows.length === 0) throw new Error("Uploaded file contains no data.");

  const { headerRowIndex, colIndexToField, colIndexToRawName, detectedColumns } = detectHeaderRowAndMap(sheetRows, DRIVE_ALIASES, DRIVE_FIELD_LABELS);

  const existingDrives = driveService.getAll();
  const dbTitles = new Set(existingDrives.map(d => normalizeHeader(`${d.company}_${d.title}`)));
  const fileTitles = new Set<string>();

  const allRows: ParsedRow[] = [];
  const validRows: ParsedRow[] = [];
  const duplicateRows: ParsedRow[] = [];
  const invalidRows: ParsedRow[] = [];

  for (let r = headerRowIndex + 1; r < sheetRows.length; r++) {
    const rowArray = sheetRows[r];
    if (!Array.isArray(rowArray) || rowArray.every(cell => String(cell || "").trim() === "")) continue;

    const rowObj: Record<string, string> = {};
    const rawObj: Record<string, any> = {};

    rowArray.forEach((cellVal, cIdx) => {
      const fieldKey = colIndexToField[cIdx];
      const rawHeaderName = colIndexToRawName[cIdx] || `Col_${cIdx}`;
      const cellStr = String(cellVal || "").trim();
      rawObj[rawHeaderName] = cellStr;
      if (fieldKey) rowObj[fieldKey] = cellStr;
    });

    const title = (rowObj["title"] || "").trim();
    const company = (rowObj["company"] || "Top Company").trim();
    const date = rowObj["date"] || new Date().toISOString().split("T")[0];
    const cgpaCutoff = rowObj["cgpa_cutoff"] || "7.5";
    const departments = rowObj["departments"] || "CSE, ECE, IT";
    const statusStr = (rowObj["status"] || "").toUpperCase();

    const status = ["UPCOMING", "ONGOING", "COMPLETED"].includes(statusStr) ? statusStr : "UPCOMING";
    const normKey = normalizeHeader(`${company}_${title}`);
    const rowNumber = r + 1;

    let rowStatus: "VALID" | "DUPLICATE" | "INVALID" = "VALID";
    let reason = "Valid drive record";

    if (!title) {
      rowStatus = "INVALID";
      reason = `Row ${rowNumber}: Drive Title is missing`;
    } else if (dbTitles.has(normKey)) {
      rowStatus = "DUPLICATE";
      reason = `Drive "${company} - ${title}" already exists.`;
    } else if (fileTitles.has(normKey)) {
      rowStatus = "DUPLICATE";
      reason = `Duplicate Drive "${company} - ${title}" in file.`;
    } else {
      fileTitles.add(normKey);
    }

    const parsedRow: ParsedRow = {
      rowNumber,
      status: rowStatus,
      reason,
      data: {
        title,
        company,
        date,
        cgpaCutoff,
        departments: departments.split(",").map(d => d.trim()),
        status,
        registeredStudents: 0
      },
      rawRow: rawObj
    };

    allRows.push(parsedRow);
    if (rowStatus === "VALID") validRows.push(parsedRow);
    else if (rowStatus === "DUPLICATE") duplicateRows.push(parsedRow);
    else invalidRows.push(parsedRow);
  }

  return { fileName, totalRows: allRows.length, detectedColumns, validRows, duplicateRows, invalidRows, allRows };
};
