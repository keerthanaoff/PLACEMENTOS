"use client";

import { use, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  GitBranch, Network, FileText, ExternalLink, 
  Award, Briefcase, BookOpen, BrainCircuit, CheckCircle2, Users
} from "lucide-react";

import { studentService } from "@/services/storageService";

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Mock unwrapping params using `use` (Next.js 15 pattern for params)
  const resolvedParams = use(params);
  
  // Find student or fallback to a dummy if not found
  const student = studentService.getById(resolvedParams.id) || {
    ...studentService.getAll()[0],
    name: "Not Found",
    id: resolvedParams.id
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed intelligence and placement activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info & AI Score */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-3xl text-indigo-600 dark:text-indigo-400 font-bold mb-4">
              {student.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{student.name}</h2>
            <p className="text-sm font-medium text-gray-500">{student.rollNumber} • {student.department}</p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50">
              {student.placementStatus}
            </div>

            <div className="w-full mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-left space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4" /> <span>{student.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4" /> <span>{student.mobile}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" /> <span>Class of {student.yearOfGraduation}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" /> <span>{student.studentType} ({student.residence || student.studentType})</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 mt-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                <span className="font-semibold text-xs uppercase">Gender:</span> <span>{student.gender}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-sm p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-6 h-6 text-indigo-200" />
                <h3 className="font-bold text-lg">AI Resume Match Score</h3>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold">{student.resumeScore}%</span>
                <span className="text-indigo-200 mb-1">
                  {student.resumeScore >= 80 ? 'Excellent' : student.resumeScore >= 70 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <p className="text-sm text-indigo-100 mt-4 leading-relaxed">
                Resume strongly matches top-tier tech requirements. High proficiency in React and Node.js detected.
              </p>
              <button className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm border border-white/20">
                View Detailed AI Analysis
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Links & Profiles</h3>
            <div className="space-y-3">
              <a href={`https://${student.linkedin}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <Network className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>
              <a href={`https://${student.github}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-5 h-5 text-gray-800 dark:text-white" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white" />
              </a>
              <a href={student.resumeLink} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors group">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resume PDF</span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </a>
              {student.portfolio && (
                <a href={student.portfolio} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Portfolio</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Academics & Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-500">Applications</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.applications}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-500">Interviews</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.interviews}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-medium text-gray-500">Offers</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.offers}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Academic Record</h3>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">UG</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{student.ugPercentage}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">HSC Percentage</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{student.hscPercentage}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">SSLC Percentage</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{student.sslcPercentage}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">PG</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{student.pgPercentage || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Recent Applications</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { company: "TechCorp Inc", role: "Frontend Developer", date: "Oct 12, 2025", status: "SHORTLISTED" },
                    { company: "DataSystems", role: "Software Engineer", date: "Oct 05, 2025", status: "INTERVIEW" },
                    { company: "CloudNet", role: "Cloud Architect", date: "Sep 28, 2025", status: "APPLIED" },
                  ].map((app, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{app.company}</td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{app.role}</td>
                      <td className="px-5 py-4 text-gray-500">{app.date}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md border ${
                          app.status === 'INTERVIEW' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800' :
                          app.status === 'SHORTLISTED' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' :
                          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
