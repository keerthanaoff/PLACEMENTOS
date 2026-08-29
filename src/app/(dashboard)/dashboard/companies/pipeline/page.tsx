"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, DollarSign, User, Shield, CheckCircle2, ChevronRight } from "lucide-react";
import { companyService } from "@/services/companyService";
import { CompanyRecord } from "@/lib/companyCsvData";

const PIPELINE_COLUMNS: { id: "COLD" | "WARM" | "HOT" | "DRIVE_COMPLETED"; title: string; color: string; border: string }[] = [
  { id: "COLD", title: "COLD (Prospects)", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700" },
  { id: "WARM", title: "WARM (In Discussions)", color: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  { id: "HOT", title: "HOT (Active Hiring)", color: "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
  { id: "DRIVE_COMPLETED", title: "DRIVE COMPLETED", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
];

export default function CompanyPipelinePage() {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);

  const loadData = () => {
    setCompanies(companyService.getCompanies());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (id: string, newStatus: "COLD" | "WARM" | "HOT" | "DRIVE_COMPLETED") => {
    companyService.updateCompany(id, { status: newStatus });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              Company Recruitment Pipeline
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs font-medium">
              Interactive Kanban board tracking company engagement from Cold lead to Drive Completion ({companies.length} Total Companies).
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/companies"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
        >
          View Table List →
        </Link>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {PIPELINE_COLUMNS.map((column) => {
          const columnCompanies = companies.filter(c => c.status === column.id);
          return (
            <div key={column.id} className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-4">
              <div className={`p-3 rounded-xl border ${column.border} ${column.color} flex items-center justify-between`}>
                <h3 className="text-xs font-extrabold tracking-wider">{column.title}</h3>
                <span className="w-5 h-5 rounded-full bg-white dark:bg-gray-900 font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                  {columnCompanies.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {columnCompanies.map((comp) => (
                  <div key={comp.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/dashboard/companies/${encodeURIComponent(comp.id)}`} className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 hover:underline">
                          {comp.name}
                        </Link>
                        <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          <span>{comp.location}</span>
                        </p>
                      </div>

                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">
                        {comp.ctc}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium">Industry:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{comp.industry}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium">Recruiter:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{comp.recruiter || comp.contactPerson}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium">Placement Lead:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{comp.placementTeamMember}</span>
                      </div>
                    </div>

                    {/* Move Status Selector */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Move Pipeline Stage</label>
                      <select
                        value={comp.status}
                        onChange={(e) => handleStatusChange(comp.id, e.target.value as any)}
                        className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-[11px] font-bold text-gray-900 dark:text-white"
                      >
                        <option value="COLD">COLD</option>
                        <option value="WARM">WARM</option>
                        <option value="HOT">HOT</option>
                        <option value="DRIVE_COMPLETED">DRIVE COMPLETED</option>
                      </select>
                    </div>
                  </div>
                ))}

                {columnCompanies.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 text-xs">
                    No companies in this stage.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
