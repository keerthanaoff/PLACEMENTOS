"use client";

import { 
  Users, Building2, Briefcase, CalendarDays, 
  Award, TrendingUp, BrainCircuit, ArrowUpRight, FileText
} from "lucide-react";

import { useEffect, useState } from "react";
import { driveService } from "@/services/storageService";
import { studentService } from "@/services/studentService";
import { companyService } from "@/services/companyService";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0, companies: 0, cold: 0, warm: 0, hot: 0, drivesCompleted: 0, drives: 0, placed: 0, avgCtc: "12.6 LPA", jds: 0
  });

  useEffect(() => {
    const students = studentService.getStudents();
    const companies = companyService.getCompanies();
    const drives = driveService.getAll();
    
    // Fetch JDs dynamically
    import("@/services/jdService").then(({ jdService }) => {
      jdService.getAllJDs().then(jdsList => {
        setStats(prev => ({ ...prev, jds: jdsList.length }));
      });
    });

    // Calculate dynamic average CTC package from placed students
    const placedStudents = students.filter(s => s.placementStatus === "PLACED");
    let avg = 6.0;
    if (placedStudents.length > 0) {
      const ctcValues = placedStudents.map(s => {
        const val = parseFloat(s.packageCtc || "");
        return isNaN(val) ? 0 : val;
      }).filter(val => val > 0);
      if (ctcValues.length > 0) {
        avg = ctcValues.reduce((sum, val) => sum + val, 0) / ctcValues.length;
      }
    }

    setStats(prev => ({
      ...prev,
      students: students.length,
      companies: companies.length,
      cold: companies.filter(c => (c.companyStatus || c.status) === "COLD").length,
      warm: companies.filter(c => (c.companyStatus || c.status) === "WARM").length,
      hot: companies.filter(c => (c.companyStatus || c.status) === "HOT").length,
      drivesCompleted: companies.filter(c => (c.companyStatus || c.status) === "DRIVE_COMPLETED").length,
      drives: drives.length || companies.length,
      placed: placedStudents.length,
      avgCtc: `${avg.toFixed(1)} LPA`
    }));
  }, []);

  const kpis = [
    { name: "Total Students", value: stats.students.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { name: "Total Companies", value: stats.companies.toString(), icon: Building2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { name: "Processed JDs", value: stats.jds.toString(), icon: FileText, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { name: "Cold Companies", value: stats.cold.toString(), icon: Briefcase, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20" },
    { name: "Warm Companies", value: stats.warm.toString(), icon: Briefcase, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { name: "Hot Companies", value: stats.hot.toString(), icon: Briefcase, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    { name: "Drives Completed", value: stats.drivesCompleted.toString(), icon: CalendarDays, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
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
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Avg CTC Package</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.avgCtc}</p>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border border-indigo-500/20 backdrop-blur-md text-white flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <span className="text-xs font-semibold uppercase text-indigo-300 tracking-wider">Placement OS AI • Ecosystem Status</span>
          </div>
          <h3 className="text-sm font-semibold">20 Corporate Partners, {stats.jds} Extracted JDs & 100 Authentic Students Mapped across {stats.drives} Drives</h3>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.name}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{kpi.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
