"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText, Plus, Search, Eye, Trash2, BarChart3, 
  Bell, CheckCircle2, AlertCircle, Building2,
  MapPin, Briefcase, Users, Code, Filter, Calendar
} from "lucide-react";
import { jdService, StoredJD } from "@/services/jdService";
import { useJD } from "@/context/JDContext";

export default function JDsPage() {
  const { notifications, markNotificationsAsRead } = useJD();
  const [jds, setJds] = useState<StoredJD[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setJds(jdService.getAll());
  }, []);

  const refreshJDs = () => setJds(jdService.getAll());

  const handleDelete = (id: string) => {
    if (!confirm("Delete this JD?")) return;
    jdService.delete(id);
    refreshJDs();
  };

  // ── Filtering ─────────────────────────────────────────────────────────
  const filtered = jds.filter(jd => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      jd.jobTitle.toLowerCase().includes(q) || 
      jd.company.toLowerCase().includes(q) || 
      jd.location.toLowerCase().includes(q) || 
      (jd.industry || "").toLowerCase().includes(q) ||
      jd.skills.some(s => s.toLowerCase().includes(q));
    
    const matchStatus = statusFilter === "ALL" || jd.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-indigo-600 dark:text-indigo-400" />
            JD Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {jds.length} Job Descriptions • Analyze requirements and match candidates
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); if (showNotifications) markNotificationsAsRead(); }}
              className="p-2 relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-950">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-center text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 border-b border-gray-100 dark:border-gray-800 text-sm ${n.read ? "opacity-60" : "bg-indigo-50/50 dark:bg-indigo-900/10"}`}>
                        <p className="text-gray-800 dark:text-gray-200">{n.message}</p>
                        <span className="text-[10px] text-gray-500">{new Date(n.date).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href="/dashboard/jds/new" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} />
            Add JD
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, company, industry, location, skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          {["ALL", "ACTIVE", "PENDING"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* JD Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-400 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Job Descriptions</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
              No matching records found. Clear filters or add a new JD.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  {["Job Title", "Company", "Industry", "Location", "Experience", "Skills", "Qualification", "Status", "AI Analysis", "Created", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((jd) => (
                  <tr key={jd.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{jd.jobTitle}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{jd.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{jd.industry}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <MapPin size={12} className="shrink-0" />
                        {jd.location}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{jd.experience}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {jd.skills.slice(0, 3).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-[9px] font-bold rounded border border-purple-100 dark:border-purple-800">
                            {s}
                          </span>
                        ))}
                        {jd.skills.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{jd.skills.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px] block" title={jd.education}>
                        {jd.education}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        jd.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {jd.status === "ACTIVE" && <CheckCircle2 size={10} className="mr-1" />}
                        {jd.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        jd.analysisStatus === "COMPLETED" ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800" :
                        "text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}>
                        {jd.analysisStatus === "COMPLETED" ? "Analyzed" : jd.analysisStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(jd.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/jds/${jd.id}`} className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors" title="View Details">
                          <Eye size={15} />
                        </Link>
                        <Link href={`/dashboard/jds/${jd.id}/match`} className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors" title="Match Candidates">
                          <BarChart3 size={15} />
                        </Link>
                        <button onClick={() => handleDelete(jd.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Summary Cards */}
      {jds.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total JDs", value: jds.length, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
            { label: "Active JDs", value: jds.filter(j => j.status === "ACTIVE").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Unique Skills", value: [...new Set(jds.flatMap(j => j.skills))].length, icon: Code, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { label: "Companies", value: [...new Set(jds.map(j => j.company))].length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          ].map((c, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${c.bg}`}>
                <c.icon size={20} className={c.color} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
