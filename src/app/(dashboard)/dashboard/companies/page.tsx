"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Search, Plus, MapPin, ExternalLink, Globe } from "lucide-react";
import { companyService } from "@/services/storageService";
import { MOCK_COMPANIES } from "@/lib/mock-data";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loaded = companyService.getAll();
    if (loaded && loaded.length > 0) {
      setCompanies(loaded);
    } else {
      setCompanies(MOCK_COMPANIES);
    }
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-indigo-600 dark:text-indigo-400" /> 
            Company Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage partner companies and recruitment stats.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />
          <span>Add Company</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search companies by name, industry, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Company ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Industry</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
              {filteredCompanies.map((company) => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.name} ${company.location}`)}`;
                
                return (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">{company.id}</td>
                    <td className="px-6 py-4 font-semibold">
                      <Link 
                        href={`/dashboard/companies/${company.id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors flex items-center gap-1.5"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{company.industry}</td>
                    <td className="px-6 py-4">
                      {company.location ? (
                        <a 
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer group transition-colors"
                          title={`Open Google Maps for ${company.name} in ${company.location}`}
                        >
                          <MapPin size={14} className="text-red-500 group-hover:scale-110 transition-transform" />
                          <span>{company.location}</span>
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Not available</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {company.type}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No companies found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
