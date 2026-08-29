"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { auditService } from "@/services/storageService";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs(auditService.getAll());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="text-indigo-600 dark:text-indigo-400" /> 
          Audit Logs
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track all system activities and changes.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No activity logs recorded yet.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="px-6 py-4 text-xs font-mono">{new Date(log.date).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold">{log.user}</td>
                  <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400">{log.action}</td>
                  <td className="px-6 py-4"><span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{log.module}</span></td>
                  <td className="px-6 py-4 text-gray-500">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
