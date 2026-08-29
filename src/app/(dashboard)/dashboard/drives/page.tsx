"use client";

import { CalendarDays, Plus } from "lucide-react";
import { MOCK_DRIVES, MOCK_COMPANIES } from "@/lib/mock-data";

export default function DrivesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="text-indigo-600 dark:text-indigo-400" /> 
            Placement Drives
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule and manage campus and pool drives.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          <span>New Drive</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Drive ID</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Venue</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {MOCK_DRIVES.map((drive) => {
                const company = MOCK_COMPANIES.find(c => c.id === drive.companyId);
                return (
                  <tr key={drive.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{drive.id}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">{company?.name || drive.companyId}</td>
                    <td className="px-6 py-4">{drive.driveType}</td>
                    <td className="px-6 py-4">{new Date(drive.driveDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{drive.venue}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        drive.status === 'Active' || drive.status === 'Interview' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        drive.status === 'Upcoming' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {drive.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
