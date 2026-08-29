"use client";

import { BarChart3, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" /> 
            Placement Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Download and view placement reports.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Download size={16} /> PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["Student-wise", "Company-wise", "Department-wise", "Drive-wise", "Offer-wise", "CTC Analysis", "ATS Score"].map(report => (
          <div key={report} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                <BarChart3 size={24} />
              </div>
              <Download size={20} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{report} Report</h3>
            <p className="text-sm text-gray-500 mt-1">Generate comprehensive analytics for {report.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
