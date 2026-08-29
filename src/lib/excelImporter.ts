import * as XLSX from "xlsx";
import { studentService } from "@/services/storageService";

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

export interface ImportAnalysisResult {
  fileName: string;
  totalRows: number;
  detectedColumns: DetectedColumnMap[];
  validRows: ParsedStudentRow[];
  duplicateRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  allRows: ParsedStudentRow[];
}

// 1. Header Normalizer
export const normalizeHeader = (raw: string): string => {
  return String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
};

// Aliases lookup table
const ALIASES: Record<string, string[]> = {
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

const FIELD_LABELS: Record<string, string> = {
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

// Map normalized header to application field name
const matchFieldKey = (normHeader: string): string | null => {
  if (!normHeader) return null;
  for (const [fieldKey, aliasArray] of Object.entries(ALIASES)) {
    if (aliasArray.includes(normHeader)) {
      return fieldKey;
    }
  }
  return null;
};

export const parseStudentExcelOrCsv = (binaryData: string, fileName: string): ImportAnalysisResult => {
  const workbook = XLSX.read(binaryData, { type: "binary" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert worksheet to 2D array (header: 1)
  const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

  if (!sheetRows || sheetRows.length === 0) {
    throw new Error("Uploaded file contains no data.");
  }

  // 1. Locate Header Row (First row containing at least 1 header matching known field aliases)
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
      const matchedField = matchFieldKey(norm);

      if (matchedField) {
        matchCount++;
        tempFieldMap[cIdx] = matchedField;
        tempRawMap[cIdx] = cellStr;
      }
    });

    if (matchCount >= 1) { // Header row found!
      headerRowIndex = r;
      colIndexToField = tempFieldMap;
      colIndexToRawName = tempRawMap;
      // Map all non-empty headers for raw display
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
    // Fallback: Use row 0 as header row
    headerRowIndex = 0;
    const firstRow = sheetRows[0] || [];
    firstRow.forEach((cellVal, cIdx) => {
      const cellStr = String(cellVal || "").trim();
      const norm = normalizeHeader(cellStr);
      const matched = matchFieldKey(norm);
      if (matched) colIndexToField[cIdx] = matched;
      colIndexToRawName[cIdx] = cellStr || `Column ${cIdx + 1}`;
    });
  }

  // Build Detected Columns List for UI (Requirement #6)
  const detectedColumns: DetectedColumnMap[] = [];
  Object.keys(colIndexToRawName).forEach((cIdxStr) => {
    const cIdx = parseInt(cIdxStr);
    const rawColName = colIndexToRawName[cIdx];
    const fieldKey = colIndexToField[cIdx];
    if (fieldKey) {
      detectedColumns.push({
        excelColumn: rawColName,
        appField: FIELD_LABELS[fieldKey] || fieldKey
      });
    }
  });

  // Log to Console for Developer Debugging (Requirement #17)
  console.log("==========================================");
  console.log("PLACEMENTOS EXCEL/CSV PARSER DEBUG:");
  console.log("File Name:", fileName);
  console.log("Header Row Index:", headerRowIndex + 1);
  console.log("Detected Excel Headers:", Object.values(colIndexToRawName));
  console.log("Detected Field Mapping:", detectedColumns);
  console.log("==========================================");

  // 2. Parse Data Rows
  const existingStudents = studentService.getAll();
  const dbRolls = new Set(existingStudents.map(s => normalizeHeader(s.rollNumber || s.id)));
  const fileRolls = new Set<string>();

  const allRows: ParsedStudentRow[] = [];
  const validRows: ParsedStudentRow[] = [];
  const duplicateRows: ParsedStudentRow[] = [];
  const invalidRows: ParsedStudentRow[] = [];

  for (let r = headerRowIndex + 1; r < sheetRows.length; r++) {
    const rowArray = sheetRows[r];
    if (!Array.isArray(rowArray)) continue;

    // Check if row is completely blank
    const isBlank = rowArray.every(cell => String(cell || "").trim() === "");
    if (isBlank) continue;

    const rowObj: Record<string, string> = {};
    const rawObj: Record<string, any> = {};

    rowArray.forEach((cellVal, cIdx) => {
      const fieldKey = colIndexToField[cIdx];
      const rawHeaderName = colIndexToRawName[cIdx] || `Col_${cIdx}`;
      const cellStr = String(cellVal || "").trim();

      rawObj[rawHeaderName] = cellStr;
      if (fieldKey) {
        rowObj[fieldKey] = cellStr;
      }
    });

    // Extract values
    let studentId = (rowObj["student_id"] || "").trim();
    let studentName = (rowObj["student_name"] || "").trim();

    // Fallback: If student_name is missing, try combining first_name & last_name
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
    const rowNumber = r + 1; // 1-indexed Excel row

    let rowStatus: "VALID" | "DUPLICATE" | "INVALID" = "VALID";
    let reason = "Valid record";

    // Row Validation
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
      studentId: studentId || "",
      name: studentName || "",
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

  return {
    fileName,
    totalRows: allRows.length,
    detectedColumns,
    validRows,
    duplicateRows,
    invalidRows,
    allRows
  };
};
