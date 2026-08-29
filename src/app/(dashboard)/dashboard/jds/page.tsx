"use client";

import { FileText, Plus, Bell } from "lucide-react";
import { useJD } from "@/context/JDContext";
import Link from "next/link";
import { useState } from "react";

export default function JDsPage() {
  const { jds, notifications, markNotificationsAsRead } = useJD();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-indigo-600 dark:text-indigo-400" /> 
            Job Descriptions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and review active Job Descriptions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (showNotifications) markNotificationsAsRead();
              }}
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
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-sm text-center text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-gray-100 dark:border-gray-800 text-sm ${notif.read ? 'opacity-60' : 'bg-indigo-50/50 dark:bg-indigo-900/10'}`}>
                        <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
                        <span className="text-[10px] text-gray-500 mt-1 block">{new Date(notif.date).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href="/dashboard/jds/new" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} />
            <span>Add JD</span>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {jds.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Job Descriptions</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">You haven't added any JDs yet. Add them manually or upload an Excel file to get started.</p>
            <Link href="/dashboard/jds/new" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
              <Plus size={18} /> Add Your First JD
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">JD ID</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Skills</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {jds.map((jd) => (
                  <tr key={jd.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-xs">{jd.id}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      <a href={jd.jdLink || "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {jd.companyName || jd.companyId}
                      </a>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{jd.jobTitle}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">{jd.skillsRequired || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      {jd.status === "PENDING" && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">Pending</span>}
                      {jd.status === "ACTIVE" && <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">Active</span>}
                      {jd.status === "REJECTED" && <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">Rejected</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">{jd.salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
