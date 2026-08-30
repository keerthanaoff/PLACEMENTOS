"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Building2, Briefcase, FileText, CheckCircle2, Users, Award, ChevronRight, BarChart3, Info } from "lucide-react";
import { driveService, studentService } from "@/services/storageService";
import { companyService } from "@/services/companyService";

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
      const comp = companyService.getCompanyById(loadedDrive.companyId || loadedDrive.company);
      setCompany(comp || null);
    }

    setStudents(studentService.getAll());
    setLoading(false);
  }, [driveId]);

  const statistics = useMemo(() => {
    if (!drive) return { eligible: [], applicants: [], shortlisted: [], selected: [] };

    const compName = company ? company.name : (drive.company || "TCS");

    // 1. Selected Students
    const selected = students.filter(s => 
      s.placementStatus === "PLACED" && s.companyPlaced?.toLowerCase().trim() === compName.toLowerCase().trim()
    );

    // 2. Shortlisted Students
    const shortlisted = students.filter(s => 
      (s.placementStatus === "SHORTLISTED" || s.placementStatus === "PLACED") && 
      s.companyPlaced?.toLowerCase().trim() === compName.toLowerCase().trim()
    );

    // 3. Eligible Students
    const eligibilityText = String(drive.eligibility || company?.eligibilityCriteria || "").toLowerCase();
    
    const eligible = students.filter(s => {
      if (s.archived) return false;
      const ugPercentage = parseFloat(s.ug || "");
      if (!isNaN(ugPercentage) && ugPercentage < 60) return false;
      
      const sDept = String(s.department || "").toLowerCase().trim();
      const hasSpecificDeptFilter = eligibilityText.includes("cse") || eligibilityText.includes("it") || eligibilityText.includes("cyber") || eligibilityText.includes("ece");
      
      if (hasSpecificDeptFilter) {
        if (sDept.includes("cyber") && eligibilityText.includes("cyber")) return true;
        if (sDept.includes("computer") || sDept.includes("cse") && eligibilityText.includes("cse")) return true;
        if (sDept.includes("information") || sDept.includes("it") && eligibilityText.includes("it")) return true;
        if (sDept.includes("electronics") || sDept.includes("ece") && eligibilityText.includes("ece")) return true;
        return false;
      }
      return true;
    });

    const applicants = Array.from(new Set([...shortlisted, ...eligible.slice(0, Math.max(12, selected.length * 3))]));

    // If drive has predefined stats, inject mock data if needed to match visual stats
    // We adjust lengths for visualization if real data is empty but drive has stats.
    const finalSelectedCount = drive.selectedCount || selected.length;
    const finalShortlistedCount = drive.shortlistedCount || shortlisted.length;
    const finalApplicantsCount = drive.applicantsCount || applicants.length;

    return { 
      eligible, applicants, shortlisted, selected, 
      finalSelectedCount, finalShortlistedCount, finalApplicantsCount 
    };
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
        <Link href="/dashboard/drives" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600">
          <ArrowLeft size={16} /> Back to Drives
        </Link>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Drive Not Found</h2>
        </div>
      </div>
    );
  }

  const companyName = company ? company.name : drive.company;
  const driveStatus = drive.status || "UPCOMING";
  const appCount = statistics.finalApplicantsCount;
  const shortCount = statistics.finalShortlistedCount;
  const selCount = statistics.finalSelectedCount;
  
  const selectionRate = appCount > 0 ? ((selCount / appCount) * 100).toFixed(1) : "0.0";
  const shortlistRate = appCount > 0 ? ((shortCount / appCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div>
        <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          <Link href="/dashboard" className="hover:text-indigo-600">Dashboard</Link> <ChevronRight size={12} />
          <Link href="/dashboard/drives" className="hover:text-indigo-600">Placement Drives</Link> <ChevronRight size={12} />
          <span className="text-gray-900 dark:text-white font-semibold">{drive.title || "Drive Details"}</span>
        </nav>
        <Link href="/dashboard/drives" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
          <ArrowLeft size={16} /> Back to Drives
        </Link>
      </div>

      {/* Overview Banner */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl border border-indigo-100 dark:border-indigo-800 shrink-0">
              {companyName?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{drive.title || "Recruitment Drive"}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {driveStatus}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-2 flex flex-wrap items-center gap-4 font-semibold">
                <span className="text-indigo-600 dark:text-indigo-400">🏢 {companyName}</span> •
                <span>Type: <span className="text-gray-900 dark:text-white">{drive.driveType || "Campus"}</span></span> •
                <span>Mode: <span className="text-gray-900 dark:text-white">{drive.workMode || "On-site"}</span></span> •
                <span>Date: <span className="text-gray-900 dark:text-white">{new Date(drive.driveDate || drive.date || Date.now()).toLocaleDateString()}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Details vs Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Drive Details & Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" /> Drive Overview
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs font-semibold">
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Company</span>
                <span className="text-gray-900 dark:text-white font-bold">{companyName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Job Role</span>
                <span className="text-gray-900 dark:text-white font-bold">{drive.jobRole || drive.title}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Company Type</span>
                <span className="text-gray-900 dark:text-white font-bold uppercase">{drive.companyType || company?.companyType || "MNC"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Drive Type</span>
                <span className="text-gray-900 dark:text-white font-bold">{drive.driveType || "On Campus"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Industry</span>
                <span className="text-gray-900 dark:text-white">{drive.industry || company?.industry || "IT"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Location</span>
                <span className="text-gray-900 dark:text-white">📍 {drive.location || company?.location || "India"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Application Deadline</span>
                <span className="text-red-500 font-bold">{drive.applicationDeadline ? new Date(drive.applicationDeadline).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Openings</span>
                <span className="text-gray-900 dark:text-white font-bold">{drive.openings || "Not Specified"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Eligibility & Compensation
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs font-semibold mb-4">
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Salary Package (CTC)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{drive.package || company?.salaryPackage || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Min CGPA</span>
                <span className="text-gray-900 dark:text-white font-bold">{drive.minCgpa || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Eligibility Rules</span>
                <span className="text-gray-900 dark:text-white">{drive.eligibility || company?.eligibilityCriteria || "UG 60%+"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-gray-500">Required Skills</span>
                <span className="text-gray-900 dark:text-white truncate max-w-[150px]" title={drive.requiredSkills}>{drive.requiredSkills || company?.requiredSkills || "N/A"}</span>
              </div>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1">
              <div className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1"><FileText size={12}/> Job Description</div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {drive.description || company?.description || company?.jd || "No detailed job description provided for this drive."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-indigo-500" /> Applicant Analytics
            </h3>
            
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full border-[12px] border-gray-100 dark:border-gray-800 relative flex items-center justify-center">
                {/* Visual donut representation for selected vs applicants */}
                {appCount > 0 && (
                  <div 
                    className="absolute inset-0 rounded-full border-[12px] border-emerald-500 border-t-transparent border-l-transparent rotate-45"
                    style={{ transform: `rotate(${(selCount / appCount) * 180}deg)` }}
                  ></div>
                )}
                <div className="text-center">
                  <span className="block text-xl font-black text-gray-900 dark:text-white">{selectionRate}%</span>
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Selected</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Applicants</span>
                  <span className="text-gray-900 dark:text-white">{appCount}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Shortlisted ({shortlistRate}%)</span>
                  <span className="text-amber-500">{shortCount}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${shortlistRate}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Selected ({selectionRate}%)</span>
                  <span className="text-emerald-500">{selCount}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectionRate}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-start gap-2 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg">
              <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                The selection rate is {selectionRate}%. Ensure you follow up with all shortlisted candidates for the next interview rounds.
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <CalendarDays size={16} className="text-indigo-500" /> Recruitment Process
            </h3>
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-6 pb-2">
               <div className="relative pl-6">
                 <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1 border-2 border-white dark:border-gray-900"></div>
                 <p className="text-xs font-bold text-gray-900 dark:text-white">Registration Closed</p>
                 <p className="text-[10px] text-gray-500">{drive.applicationDeadline ? new Date(drive.applicationDeadline).toLocaleDateString() : "Passed"}</p>
               </div>
               {drive.recruitmentProcess && drive.recruitmentProcess.length > 0 ? (
                 drive.recruitmentProcess.map((step: string, sIdx: number) => (
                   <div key={sIdx} className="relative pl-6">
                     <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 border-2 border-white dark:border-gray-900 ${
                       driveStatus === "Completed" || driveStatus === "COMPLETED" ? "bg-emerald-500" :
                       (driveStatus === "Active" || driveStatus === "ACTIVE") && sIdx === 0 ? "bg-indigo-500 animate-pulse" :
                       (driveStatus === "Interview" || driveStatus === "INTERVIEW") && sIdx === 1 ? "bg-indigo-500 animate-pulse" :
                       "bg-gray-300 dark:bg-gray-600"
                     }`}></div>
                     <p className="text-xs font-bold text-gray-900 dark:text-white">{step}</p>
                   </div>
                 ))
               ) : (
                 <>
                   <div className="relative pl-6">
                     <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 border-2 border-white dark:border-gray-900 ${driveStatus === "Active" || driveStatus === "Interview" || driveStatus === "Completed" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                     <p className="text-xs font-bold text-gray-900 dark:text-white">Aptitude Test</p>
                     <p className="text-[10px] text-gray-500">Technical & Logical reasoning</p>
                   </div>
                   <div className="relative pl-6">
                     <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 border-2 border-white dark:border-gray-900 ${driveStatus === "Completed" ? "bg-emerald-500" : driveStatus === "Interview" ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                     <p className="text-xs font-bold text-gray-900 dark:text-white">Technical Interviews</p>
                     <p className="text-[10px] text-gray-500">Multiple rounds</p>
                   </div>
                   <div className="relative pl-6">
                     <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 border-2 border-white dark:border-gray-900 ${driveStatus === "Completed" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                     <p className="text-xs font-bold text-gray-900 dark:text-white">HR Interview & Selection</p>
                     <p className="text-[10px] text-gray-500">Final offers rolled out</p>
                   </div>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
