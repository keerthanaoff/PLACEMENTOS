"use client";

import { UserSquare2, Plus, Mail, Phone } from "lucide-react";
import { MOCK_RECRUITERS, MOCK_COMPANIES } from "@/lib/mock-data";

export default function RecruitersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserSquare2 className="text-indigo-600 dark:text-indigo-400" /> 
            Recruiters
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage external contacts and hiring managers.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          <span>Add Recruiter</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Contact Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {MOCK_RECRUITERS.map((recruiter) => {
                const company = MOCK_COMPANIES.find(c => c.id === recruiter.companyId);
                return (
                  <tr key={recruiter.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {recruiter.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{recruiter.name}</p>
                          <p className="text-xs text-gray-500">{recruiter.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {company?.name || recruiter.companyId}
                    </td>
                    <td className="px-6 py-4">{recruiter.designation}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1 text-xs">
                        <span className="flex items-center gap-1"><Mail size={12}/> {recruiter.email}</span>
                        <span className="flex items-center gap-1"><Phone size={12}/> {recruiter.mobile}</span>
                      </div>
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
