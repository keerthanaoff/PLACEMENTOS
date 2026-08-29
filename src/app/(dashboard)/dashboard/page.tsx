"use client";

import { 
  Users, Building2, Briefcase, CalendarDays, 
  Award, TrendingUp, BrainCircuit, ArrowUpRight 
} from "lucide-react";

import { useEffect, useState } from "react";
import { studentService, companyService, driveService } from "@/services/storageService";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0, companies: 0, cold: 0, warm: 0, hot: 0, drives: 0, placed: 0
  });

  useEffect(() => {
    const students = studentService.getAll();
    const companies = companyService.getAll();
    const drives = driveService.getAll();

    setStats({
      students: students.length,
      companies: companies.length,
      cold: companies.filter(c => c.status === "COLD").length,
      warm: companies.filter(c => c.status === "WARM").length,
      hot: companies.filter(c => c.status === "HOT").length,
      drives: drives.length,
      placed: students.filter(s => s.placementStatus === "PLACED").length,
    });
  }, []);

  const kpis = [
    { name: "Total Students", value: stats.students.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { name: "Total Companies", value: stats.companies.toString(), icon: Building2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { name: "Cold Companies", value: stats.cold.toString(), icon: Briefcase, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20" },
    { name: "Warm Companies", value: stats.warm.toString(), icon: Briefcase, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { name: "Hot Companies", value: stats.hot.toString(), icon: Briefcase, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { name: "Drives", value: stats.drives.toString(), icon: CalendarDays, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
    { name: "Students Placed", value: stats.placed.toString(), icon: Award, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Placement Command Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor your complete placement ecosystem.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Avg CTC</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">8.5 LPA</p>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <div className="relative z-10 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">AI Placement Intelligence</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-indigo-100 text-sm">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> 6 companies are currently HOT.</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 12 JDs require approval.</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> 48 students have resume matches above 80%.</span>
            </div>
          </div>
          <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-50 transition-colors mt-2 sm:mt-0">
            View Details
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                +12% <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{kpi.name}</p>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}
