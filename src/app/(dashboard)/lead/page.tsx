"use client";

import { Briefcase, Building2, CalendarDays, Plus } from "lucide-react";

export default function LeadDashboard() {
  const kpis = [
    { name: "My Companies", value: "24", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { name: "Companies in Pipeline", value: "18", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { name: "Upcoming Drives", value: "3", icon: CalendarDays, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your company pipeline and drives.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          <span>Add Company</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className={`p-2 rounded-lg w-fit mb-4 ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{kpi.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pipeline Overview</h3>
        <div className="flex-1 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-lg flex items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 h-64">
          <p className="text-sm text-gray-400">Kanban Board rendering area</p>
        </div>
      </div>
    </div>
  );
}
