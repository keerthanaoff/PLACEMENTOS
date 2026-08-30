export interface CompanyRecord {
  id: string;
  name: string;
  location: string;
  website: string;
  contactPerson: string;
  mobile: string;
  email: string;
  companySize: string;
  numberOfEmployees: string;
  industry: string;
  ctc: string;
  status: "COLD" | "WARM" | "HOT" | "DRIVE_COMPLETED";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  dateAdded: string;
  placementTeamMember: string;
  recruiter: string;
  jobRole: string;
  jd: string;
  jdPdf: string;
  driveStatus: string;
  placedStudentsCount: number;
  placedStudentsDetails: string;
  archived: boolean;
  
  // Extended fields
  companyType?: string;
  hrName?: string;
  hrEmail?: string;
  hrPhone?: string;
  description?: string;
  jobRoles?: string;
  requiredSkills?: string;
  salaryPackage?: string;
  jobType?: string;
  openPositions?: number;
  eligibilityCriteria?: string;
  companyStatus?: string;
}

export const INITIAL_COMPANY_CSV_DATA: CompanyRecord[] = [
  {
    "id": "C001",
    "name": "TCS",
    "companyType": "MNC",
    "industry": "IT Services & Consulting",
    "location": "Chennai",
    "website": "https://tcs.com",
    "contactPerson": "Ananya Sharma",
    "mobile": "+91 98765 43210",
    "email": "campus@tcs.com",
    "companySize": "10,000+ Employees",
    "numberOfEmployees": "10000+",
    "ctc": "6.0 LPA",
    "salaryPackage": "6.0 LPA",
    "status": "HOT",
    "approvalStatus": "APPROVED",
    "dateAdded": "2026-08-01",
    "placementTeamMember": "Placement Director",
    "recruiter": "Ananya Sharma",
    "jobRole": "Software Engineer",
    "jd": "Software engineering for IT services and consulting.",
    "jdPdf": "https://example.com/jd/tcs.pdf",
    "driveStatus": "Scheduled",
    "placedStudentsCount": 6,
    "placedStudentsDetails": "6 students placed",
    "archived": false,
    "eligibilityCriteria": "60%+"
  },
  {
    "id": "C002",
    "name": "Infosys",
    "companyType": "MNC",
    "industry": "IT Services & Digital Transformation",
    "location": "Bengaluru",
    "website": "https://infosys.com",
    "contactPerson": "Rohan Das",
    "mobile": "+91 87654 32109",
    "email": "campus@infosys.com",
    "companySize": "10,000+ Employees",
    "numberOfEmployees": "10000+",
    "ctc": "6.5 LPA",
    "salaryPackage": "6.5 LPA",
    "status": "WARM",
    "approvalStatus": "APPROVED",
    "dateAdded": "2026-08-05",
    "placementTeamMember": "Placement Director",
    "recruiter": "Rohan Das",
    "jobRole": "Systems Engineer",
    "jd": "Digital transformation and systems engineering.",
    "jdPdf": "https://example.com/jd/infosys.pdf",
    "driveStatus": "Scheduled",
    "placedStudentsCount": 5,
    "placedStudentsDetails": "5 students placed",
    "archived": false,
    "eligibilityCriteria": "65%+"
  },
  {
    "id": "C003",
    "name": "CodePulse",
    "companyType": "Startup",
    "industry": "Artificial Intelligence & Software",
    "location": "Chennai",
    "website": "https://codepulse.ai",
    "contactPerson": "Vikram Singh",
    "mobile": "+91 99887 76655",
    "email": "careers@codepulse.ai",
    "companySize": "50-200 Employees",
    "numberOfEmployees": "150",
    "ctc": "8.0 LPA",
    "salaryPackage": "8.0 LPA",
    "status": "HOT",
    "approvalStatus": "APPROVED",
    "dateAdded": "2026-08-10",
    "placementTeamMember": "Placement Director",
    "recruiter": "Vikram Singh",
    "jobRole": "AI/ML Engineer",
    "jd": "Building advanced AI software solutions.",
    "jdPdf": "https://example.com/jd/codepulse.pdf",
    "driveStatus": "Scheduled",
    "placedStudentsCount": 4,
    "placedStudentsDetails": "4 students placed",
    "archived": false,
    "eligibilityCriteria": "70%+"
  },
  {
    "id": "C004",
    "name": "Krea",
    "companyType": "Startup",
    "industry": "AI, SaaS & Product Technology",
    "location": "Bengaluru",
    "website": "https://krea.io",
    "contactPerson": "Priya Nair",
    "mobile": "+91 77665 54433",
    "email": "jobs@krea.io",
    "companySize": "10-50 Employees",
    "numberOfEmployees": "45",
    "ctc": "7.5 LPA",
    "salaryPackage": "7.5 LPA",
    "status": "WARM",
    "approvalStatus": "APPROVED",
    "dateAdded": "2026-08-12",
    "placementTeamMember": "Placement Director",
    "recruiter": "Priya Nair",
    "jobRole": "Full Stack Developer",
    "jd": "Developing scalable SaaS platforms and AI tools.",
    "jdPdf": "https://example.com/jd/krea.pdf",
    "driveStatus": "Scheduled",
    "placedStudentsCount": 5,
    "placedStudentsDetails": "5 students placed",
    "archived": false,
    "eligibilityCriteria": "65%+"
  },
  {
    "id": "C005",
    "name": "Data Edge",
    "companyType": "Startup",
    "industry": "Data Analytics & AI",
    "location": "Hyderabad",
    "website": "https://dataedge.co",
    "contactPerson": "Arun Kumar",
    "mobile": "+91 88776 65544",
    "email": "hr@dataedge.co",
    "companySize": "200-500 Employees",
    "numberOfEmployees": "300",
    "ctc": "7.0 LPA",
    "salaryPackage": "7.0 LPA",
    "status": "WARM",
    "approvalStatus": "APPROVED",
    "dateAdded": "2026-08-15",
    "placementTeamMember": "Placement Director",
    "recruiter": "Arun Kumar",
    "jobRole": "Data Analyst",
    "jd": "Data processing and business intelligence analytics.",
    "jdPdf": "https://example.com/jd/dataedge.pdf",
    "driveStatus": "Scheduled",
    "placedStudentsCount": 3,
    "placedStudentsDetails": "3 students placed",
    "archived": false,
    "eligibilityCriteria": "60%+"
  }
];
