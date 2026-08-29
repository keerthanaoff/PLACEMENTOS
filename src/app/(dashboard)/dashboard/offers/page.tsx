"use client";

import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { offerService } from "@/services/storageService";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    setOffers(offerService.getAll());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="text-indigo-600 dark:text-indigo-400" /> 
          Offers
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track finalized offers and CTCs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
          <h3 className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">Total Offers</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{offers.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {offers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No offers generated yet.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">CTC</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{o.studentName}</td>
                  <td className="px-6 py-4">{o.companyName}</td>
                  <td className="px-6 py-4">{o.role}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">{o.ctc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
