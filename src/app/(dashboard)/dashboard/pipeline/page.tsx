"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { companyService } from "@/services/storageService";

export default function PipelinePage() {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    setCompanies(companyService.getAll());
  }, []);

  const cols = ["COLD", "WARM", "HOT", "DRIVE COMPLETED"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Layers className="text-indigo-600 dark:text-indigo-400" /> 
          Placement Pipeline
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage company statuses via Kanban.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cols.map(status => (
          <div key={status} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 min-h-[500px]">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-4">{status}</h3>
            <div className="space-y-3">
              {companies.filter(c => c.status === status).map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{c.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{c.location}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
