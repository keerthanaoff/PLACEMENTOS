"use client";

import { use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Building2, MapPin, Globe, Phone, Mail, 
  Briefcase, FileText, CheckCircle2, AlertTriangle, Users, Award, ExternalLink 
} from "lucide-react";
import { companyService } from "@/services/companyService";

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const company = companyService.getCompanyById(resolvedParams.id) || {
    id: resolvedParams.id,
    name: "Company Profile",
    location: "N/A",
    website: "N/A",
    contactPerson: "N/A",
    mobile: "N/A",
    email: "N/A",
    companySize: "N/A",
    numberOfEmployees: "N/A",
    industry: "Software & Technology",
    ctc: "N/A",
    status: "COLD" as const,
    approvalStatus: "PENDING" as const,
    dateAdded: "2026-08-01",
    placementTeamMember: "Placement Lead",
    recruiter: "N/A",
    jobRole: "N/A",
    jd: "N/A",
    jdPdf: "N/A",
    driveStatus: "N/A",
    placedStudentsCount: 0,
    placedStudentsDetails: "N/A",
    archived: false
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-indigo-600 dark:text-indigo-400" />
            <span>{company.name}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs font-medium">
            {company.industry} • {company.location}
          </p>
        </div>
      </div>

      {/* Top Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Pipeline Status</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            {company.status}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Approval Status</p>
          <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold ${
            company.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" :
            company.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
            "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
          }`}>
            {company.approvalStatus}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">CTC Package Offered</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{company.ctc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. COMPANY INFORMATION */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Building2 size={16} />
            Company Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-medium block">Company Name</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Industry Sector</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.industry}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Headquarters / Location</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{company.location}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Company Size</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{company.companySize}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 font-medium block">Official Careers Website</span>
              {company.website && company.website !== "N/A" ? (
                <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
                  <Globe size={14} />
                  <span>{company.website}</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. CONTACT */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Mail size={16} />
            Recruiter & Contact Details
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400 font-medium block">Contact Person / Recruiter</span>
              <span className="font-bold text-gray-900 dark:text-white">{company.contactPerson || company.recruiter}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Contact Email</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{company.email}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Contact Mobile</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{company.mobile}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Placement Team Lead</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{company.placementTeamMember}</span>
            </div>
          </div>
        </div>

        {/* 3. PLACEMENT DETAILS */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
          <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <Briefcase size={16} />
            Job Openings, Drive Status & Selections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 font-medium block mb-1">Target Job Role</span>
              <p className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700">
                {company.jobRole}
              </p>
            </div>
            <div>
              <span className="text-gray-400 font-medium block mb-1">Placed Students ({company.placedStudentsCount})</span>
              <p className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl font-semibold text-emerald-900 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                {company.placedStudentsDetails}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 font-medium block mb-1">Job Description (JD) Summary</span>
              <p className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 leading-relaxed">
                {company.jd}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
