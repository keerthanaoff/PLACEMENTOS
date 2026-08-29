"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { applicationService } from "@/services/storageService";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    setApplications(applicationService.getAll());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="text-indigo-600 dark:text-indigo-400" /> 
          Applications
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track student applications and statuses.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {applications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No applications found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Drive</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(a => (
                <tr key={a.id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{a.studentName}</td>
                  <td className="px-6 py-4">{a.companyName}</td>
                  <td className="px-6 py-4">{a.driveName}</td>
                  <td className="px-6 py-4">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
