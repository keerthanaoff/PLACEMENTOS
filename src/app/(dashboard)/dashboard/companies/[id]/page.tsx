"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, ArrowLeft, MapPin, Globe, ExternalLink, Calendar, 
  Users, Award, Briefcase, FileText, CheckCircle2, Edit, ChevronRight
} from "lucide-react";
import { companyService } from "@/services/companyService";
import { studentService } from "@/services/studentService";
import { jdService, driveService } from "@/services/storageService";

export default function CompanyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;

  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [jds, setJds] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [placedStudents, setPlacedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Define CompanyRecord locally to avoid type conflicts
  interface CompanyRecord {
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
    status: string;
    approvalStatus: string;
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
    type?: string;
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

  useEffect(() => {
    // Fetch company from real database key (placementos_companies)
    const foundCompany = companyService.getCompanyById(companyId) as any as CompanyRecord;
    setCompany(foundCompany || null);

    if (foundCompany) {
      // Fetch associated JDs from storageService
      const allJds = jdService.getAll().filter(j => 
        j.companyId === companyId || 
        j.companyName?.toLowerCase() === foundCompany.name.toLowerCase()
      );
      setJds(allJds);

      // Fetch associated drives from storageService
      const allDrives = driveService.getAll().filter(d => 
        d.companyId === companyId || 
        d.company?.toLowerCase() === foundCompany.name.toLowerCase()
      );
      setDrives(allDrives);

      // Fetch placed students from placementos_students key
      const allStudents = studentService.getStudents().filter(s => 
        s.placementStatus === "PLACED" && 
        s.companyPlaced?.toLowerCase() === foundCompany.name.toLowerCase()
      );
      setPlacedStudents(allStudents);
    }
    
    setLoading(false);
  }, [companyId]);

  // Construct dynamic Google Maps search link (name + location)
  const mapsUrl = useMemo(() => {
    if (!company || !company.location || company.location === "N/A") return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.name} ${company.location}`)}`;
  }, [company]);

  // Website validator helper
  const getValidWebsiteUrl = (url: string) => {
    if (!url || url === "N/A") return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle Company Not Found
  if (!company) {
    return (
      <div className="space-y-6">
        <Link 
          href="/dashboard/companies" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Companies
        </Link>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Company Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            The company with ID <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">{companyId}</code> could not be located.
          </p>
          <Link 
            href="/dashboard/companies" 
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  // Demo statistics calculation
  const totalDrivesCount = drives.length || 2;
  const totalApplicantsCount = placedStudents.length * 4 + 18;
  const shortlistedCount = placedStudents.length * 2 + 6;
  const selectedCount = placedStudents.length || 3;
  const placementRate = Math.round((selectedCount / (shortlistedCount || 1)) * 100);
  const avgPackage = company.salaryPackage || company.ctc || "6.0 LPA";

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Dashboard</Link>
            <ChevronRight size={12} />
            <Link href="/dashboard/companies" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Company Intelligence</Link>
            <ChevronRight size={12} />
            <span className="text-gray-900 dark:text-white font-semibold">{company.name}</span>
          </nav>

          <Link 
            href="/dashboard/companies" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft size={16} /> Back to Companies
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Redirect to main page with edit query param to reuse existing edit modal */}
          <Link 
            href={`/dashboard/companies?edit=${company.id}`}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
          >
            <Edit size={16} /> Edit Company
          </Link>
          <a href="#drives" className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            <Calendar size={16} /> View Placement Drives
          </a>
          <a href="#students" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Users size={16} /> View Students
          </a>
        </div>
      </div>

      {/* Header Banner Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border border-white/20">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                  {company.companyType || company.type || "MNC"}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-4">
                <span>Company ID: <strong className="text-gray-700 dark:text-gray-300">{company.id}</strong></span>
                <span>•</span>
                <span>Industry: <strong className="text-gray-700 dark:text-gray-300">{company.industry}</strong></span>
                {company.location && company.location !== "N/A" && (
                  <>
                    <span>•</span>
                    <a 
                      href={mapsUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-750 font-medium cursor-pointer"
                      title="Open Google Maps location"
                    >
                      <MapPin size={14} className="text-red-500" />
                      <span>{company.location}</span>
                      <ExternalLink size={12} />
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getValidWebsiteUrl(company.website) ? (
              <a 
                href={getValidWebsiteUrl(company.website)!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-55 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-750 transition-colors group"
              >
                <Globe size={16} className="text-indigo-500" />
                <span>Visit Website</span>
                <ExternalLink size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white" />
              </a>
            ) : (
              <span className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                Website not available
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Placement Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Placement Performance Overview
          </h2>
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
            DEMO STATISTICS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Total Drives</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalDrivesCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Applicants</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalApplicantsCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Shortlisted</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{shortlistedCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Selected</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Conversion Rate</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{placementRate}%</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase">Avg Package</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{avgPackage}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Details Breakdown */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Building2 size={18} className="text-indigo-500" /> Company Overview
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">Company Name</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.name}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">Company ID</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{company.id}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">Industry</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.industry}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">Company Type</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.companyType || company.type || "Not available"}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">Location</span>
              {company.location && company.location !== "N/A" ? (
                <a 
                  href={mapsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <MapPin size={13} className="text-red-500" />
                  <span>{company.location}</span>
                </a>
              ) : (
                <span className="text-gray-400 italic">Not available</span>
              )}
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">Official Website</span>
              {getValidWebsiteUrl(company.website) ? (
                <a 
                  href={getValidWebsiteUrl(company.website)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                >
                  <span>{company.website}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-gray-400 italic">Not available</span>
              )}
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">HR Contact Person</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.hrName || company.contactPerson || "Not available"}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">HR Contact Email</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.hrEmail || company.email || "Not available"}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">HR Contact Phone</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.hrPhone || company.mobile || "Not available"}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500 font-semibold">Eligibility Criteria</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.eligibilityCriteria || "Not available"}</span>
            </div>
          </div>
        </div>

        {/* Job Roles / JDs */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" /> Job Roles & Job Descriptions
          </h2>

          <div className="space-y-4">
            {jds.map((jd) => (
              <div key={jd.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{jd.jobTitle}</h3>
                    <p className="text-xs text-gray-500">Department: {jd.department || "All departments"} • Required: {jd.qualifications || "Any Graduate"}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold text-sm w-fit">
                    {jd.salary || "CTC TBD"}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60 flex flex-wrap items-center justify-between text-xs text-gray-600 dark:text-gray-400 gap-2 font-semibold">
                  <span><strong>Required Skills:</strong> {jd.skillsRequired || "Java, Python, SQL"}</span>
                  <span className="font-mono text-gray-400">{jd.id}</span>
                </div>
              </div>
            ))}

            {jds.length === 0 && (
              <div className="p-4 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{company.jobRoles || company.jobRole || "Software Trainee"}</h3>
                    <p className="text-xs text-gray-500">Department: Engineering & Tech • Eligibility: {company.eligibilityCriteria || "60%+"}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold text-sm">
                    {avgPackage}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700/60 font-semibold">
                  <strong>Required Skills:</strong> {company.requiredSkills || "Java, Data Structures, SQL"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Building2 size={18} className="text-indigo-500" /> About {company.name}
        </h2>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 leading-5">
          {company.description || company.jd || "No additional description available."}
        </p>
      </div>

      {/* Placement Drives Table */}
      <div id="drives" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" /> Placement Drives
          </h2>
          <span className="text-xs text-gray-500 font-medium">{totalDrivesCount} Drive(s) Conducted</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Drive ID / Type</th>
                <th className="px-6 py-3.5">Target Job Role</th>
                <th className="px-6 py-3.5">Drive Date</th>
                <th className="px-6 py-3.5">Eligibility</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {drives.map((drive) => (
                <tr key={drive.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white">{drive.driveType || "Campus Drive"}</span>
                    <span className="block text-xs text-gray-400 font-mono mt-0.5">{drive.id}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {jds.find(j => j.companyId === companyId)?.jobTitle || company.jobRoles || company.jobRole || "Software Trainee"}
                  </td>
                  <td className="px-6 py-4">{drive.driveDate || "2026-09-15"}</td>
                  <td className="px-6 py-4">{drive.eligibility || "60%+"}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {drive.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}

              {drives.length === 0 && (
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white">Campus Recruitment Drive</span>
                    <span className="block text-[10px] text-gray-400 font-mono mt-0.5">D-MOCK-{company.id}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{company.jobRoles || company.jobRole || "Software Engineer Trainee"}</td>
                  <td className="px-6 py-4">2026-09-20</td>
                  <td className="px-6 py-4">{company.eligibilityCriteria || "UG 60%+ No Standing Arrears"}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200">
                      Upcoming
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Students Placed Section */}
      <div id="students" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={18} className="text-emerald-500" /> Students Placed ({placedStudents.length})
          </h2>
          <span className="text-xs text-gray-550 font-semibold bg-gray-50 dark:bg-gray-800 px-2.5 py-1 border border-gray-150 dark:border-gray-850 rounded-xl">Click student name to view complete profile</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Roll Number</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Job Role</th>
                <th className="px-6 py-3.5">Package</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {placedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-semibold">
                    <Link 
                      href={`/dashboard/students/${student.id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2 font-bold"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {student.name.charAt(0)}
                      </div>
                      <span>{student.name}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-500">{student.rollNumber}</td>
                  <td className="px-6 py-4 font-bold">{student.department}</td>
                  <td className="px-6 py-4">{student.roleOffered || company.jobRoles || company.jobRole || "Graduate Engineer Trainee"}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{student.packageCtc || avgPackage}</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/students/${student.id}`}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Profile →
                    </Link>
                  </td>
                </tr>
              ))}

              {placedStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                    No placed student records attached yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
