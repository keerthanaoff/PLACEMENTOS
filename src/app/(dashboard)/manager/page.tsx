"use client";

import { Building2, Users, CalendarDays, FileText } from "lucide-react";

export default function ManagerDashboard() {
  const kpis = [
    { name: "Total Students", value: "2,451", icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { name: "Authorized Companies", value: "45", icon: Building2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { name: "Ongoing Drives", value: "8", icon: CalendarDays, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { name: "Active JDs", value: "12", icon: FileText, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of students, authorized companies, and reports.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">You have no new notifications.</p>
      </div>
    </div>
  );
}
