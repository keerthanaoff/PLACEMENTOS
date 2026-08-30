"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Building2, MapPin, Briefcase, FileText, CheckCircle2, Users, Award, ChevronRight, ExternalLink } from "lucide-react";
import { driveService } from "@/services/storageService";
import { companyService } from "@/services/companyService";
import { studentService } from "@/services/studentService";

export default function DriveDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const driveId = resolvedParams.id;

  const [drive, setDrive] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedDrive = driveService.getById(driveId);
    setDrive(loadedDrive || null);

    if (loadedDrive) {
      // Find company by ID or name
      const comp = companyService.getCompanyById(loadedDrive.companyId || loadedDrive.company);
      setCompany(comp || null);
    }

    const loadedStudents = studentService.getStudents();
    setStudents(loadedStudents);
    setLoading(false);
  }, [driveId]);

  // Dynamic calculations based on real student records
  const statistics = useMemo(() => {
    if (!drive) return { eligible: [], applicants: [], shortlisted: [], selected: [] };

    const compName = company ? company.name : (drive.company || "TCS");

    // 1. Selected Students (PLACED in this company)
    const selected = students.filter(s => 
      s.placementStatus === "PLACED" && 
      s.companyPlaced?.toLowerCase().trim() === compName.toLowerCase().trim()
    );

    // 2. Shortlisted Students (SHORTLISTED or PLACED in this company)
    const shortlisted = students.filter(s => 
      (s.placementStatus === "SHORTLISTED" || s.placementStatus === "PLACED") && 
      s.companyPlaced?.toLowerCase().trim() === compName.toLowerCase().trim()
    );

    // 3. Eligible Students: Check department match or basic academic criteria
    // Parse drive eligibility rules (e.g. "CSE", "IT", "Cyber Security", "UG 60%")
    const eligibilityText = String(drive.eligibility || company?.eligibilityCriteria || "").toLowerCase();
    
    const eligible = students.filter(s => {
      // Exclude already archived
      if (s.archived) return false;
      
      // Academic Check (e.g. UG percentage)
      const ugPercentage = parseFloat(s.ug || "");
      if (!isNaN(ugPercentage) && ugPercentage < 60) return false; // Default cutoff

      // Department Match Check (if specific departments are mentioned in the eligibility string)
      const sDept = String(s.department || "").toLowerCase().trim();
      const hasSpecificDeptFilter = eligibilityText.includes("cse") || eligibilityText.includes("it") || eligibilityText.includes("cyber") || eligibilityText.includes("ece");
      
      if (hasSpecificDeptFilter) {
        if (sDept.includes("cyber") && eligibilityText.includes("cyber")) return true;
        if (sDept.includes("computer") || sDept.includes("cse") && eligibilityText.includes("cse")) return true;
        if (sDept.includes("information") || sDept.includes("it") && eligibilityText.includes("it")) return true;
        if (sDept.includes("electronics") || sDept.includes("ece") && eligibilityText.includes("ece")) return true;
        return false; // Department did not match targeted filter
      }

      return true; // Default eligible
    });

    // 4. Applicants (derived mock list for details demo - combining shortlisted + eligible sample)
    const applicants = Array.from(new Set([...shortlisted, ...eligible.slice(0, Math.max(12, selected.length * 3))]));

    return { eligible, applicants, shortlisted, selected };
  }, [drive, company, students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="space-y-6">
        <Link 
          href="/dashboard/drives" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
        >
          <ArrowLeft size={16} /> Back to Drives
        </Link>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm">
          <CalendarDays className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Drive Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            The placement drive with ID <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">{driveId}</code> could not be located.
          </p>
          <Link 
            href="/dashboard/drives" 
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Back to Drives
          </Link>
        </div>
      </div>
    );
  }

  const companyName = company ? company.name : (drive.company || "TCS");
  const driveStatus = drive.status || "UPCOMING";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/dashboard/drives" className="hover:text-indigo-600 dark:hover:text-indigo-400">Placement Drives</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 dark:text-white font-semibold">{drive.title || "Drive Details"}</span>
        </nav>
        <Link 
          href="/dashboard/drives" 
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft size={16} /> Back to Drives
        </Link>
      </div>

      {/* Overview Banner */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl shadow-sm border border-indigo-200 dark:border-indigo-800">
              {companyName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{drive.title || "Placement Recruitment Drive"}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                  driveStatus === 'Active' || driveStatus === 'ONGOING' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-350 dark:border-emerald-900' :
                  driveStatus === 'Upcoming' || driveStatus === 'UPCOMING' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-350 dark:border-amber-900' :
                  'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}>
                  {driveStatus}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1.5 flex flex-wrap items-center gap-4">
                {company ? (
                  <Link href={`/dashboard/companies/${company.id}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    🏢 {companyName} ({company.id})
                  </Link>
                ) : (
                  <span className="font-bold">🏢 {companyName}</span>
                )}
                <span>•</span>
                <span>Type: <strong className="text-gray-700 dark:text-gray-300">{drive.driveType || "On-Campus"}</strong></span>
                <span>•</span>
                <span>Date: <strong className="text-gray-700 dark:text-gray-300">{new Date(drive.driveDate || drive.date || Date.now()).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Eligible Students</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{statistics.eligible.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Applicants</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{statistics.applicants.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Shortlisted</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{statistics.shortlisted.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Selected</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{statistics.selected.length}</p>
        </div>
      </div>

      {/* Drive Metadata Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white pb-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-500" /> Drive Overview
          </h3>
          <div className="space-y-2.5 text-xs font-semibold">
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">Corporate Partner</span>
              <span className="text-gray-900 dark:text-white">{companyName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">Industry Sector</span>
              <span className="text-gray-900 dark:text-white">{company ? company.industry : "IT Services"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">Location Office</span>
              <span className="text-gray-900 dark:text-white">📍 {company ? company.location : "Chennai"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">Scheduled Date</span>
              <span className="text-gray-900 dark:text-white">{new Date(drive.driveDate || drive.date || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">Target Salary Package</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{company ? (company.salaryPackage || company.ctc) : "6.0 LPA"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">Cutoff / Eligibility</span>
              <span className="text-gray-900 dark:text-white font-bold">{drive.eligibility || company?.eligibilityCriteria || "UG 60%+"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-gray-800">
              <span className="text-gray-500">Venue</span>
              <span className="text-gray-900 dark:text-white">{drive.venue || "Campus Placement Center"}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white pb-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" /> About Corporate Recruitment
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-5">
            {company ? (company.description || company.jd) : "Campus recruitment drives for graduate freshers. Candidates undergo online tests, technical evaluations, and HR rounds."}
          </p>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2 text-xs font-semibold">
            <div className="text-[10px] uppercase font-bold text-gray-400">Required Technical Skills</div>
            <p className="text-gray-900 dark:text-white">{company ? company.requiredSkills : "Java, Python, Data Structures, SQL, Problem Solving"}</p>
          </div>
        </div>
      </div>

      {/* Selected Students Table */}
      <div id="selected" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={18} className="text-emerald-500" /> Selected Students ({statistics.selected.length})
          </h2>
          <span className="text-xs text-gray-400">Successfully placed records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Roll Number</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-right">Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {statistics.selected.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/students/${student.id}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 font-mono text-gray-500">{student.rollNumber}</td>
                  <td className="px-6 py-3">{student.department}</td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{student.packageCtc || company?.salaryPackage || "6.0 LPA"}</td>
                </tr>
              ))}
              {statistics.selected.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No placements confirmed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shortlisted Students Table */}
      <div id="shortlisted" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 size={18} className="text-amber-500" /> Shortlisted Students ({statistics.shortlisted.length})
          </h2>
          <span className="text-xs text-gray-400">Candidates for final interviews</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Roll Number</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {statistics.shortlisted.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/students/${student.id}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 font-mono text-gray-500">{student.rollNumber}</td>
                  <td className="px-6 py-3">{student.department}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300">
                      {student.placementStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {statistics.shortlisted.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No candidates shortlisted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Eligible Students Table */}
      <div id="eligible" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-indigo-500" /> Eligible Students ({statistics.eligible.length})
          </h2>
          <span className="text-xs text-gray-400">Academically verified eligible profiles (UG GPA &gt;= 60%)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Roll Number</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3 text-center">UG CGPA / %</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-medium">
              {statistics.eligible.slice(0, 100).map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/students/${student.id}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 font-mono text-gray-500">{student.rollNumber}</td>
                  <td className="px-6 py-3">{student.department}</td>
                  <td className="px-6 py-3 text-center font-bold">{student.ug}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      student.placementStatus === "PLACED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-350" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}>
                      {student.placementStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {statistics.eligible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No eligible student records match the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
