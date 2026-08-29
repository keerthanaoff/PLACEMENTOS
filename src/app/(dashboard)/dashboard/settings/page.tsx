"use client";

import { Settings, RefreshCw, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { resetDemoData } from "@/services/storageService";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data to the initial demo state? This will delete all your local changes.")) {
      resetDemoData();
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="text-indigo-600 dark:text-indigo-400" /> 
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your application preferences and data.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-8">
        
        {/* Appearance */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Appearance</h3>
          <div className="flex gap-4">
            <button 
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium border-2 transition-colors ${theme === 'light' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <Sun size={20} /> Light Mode
            </button>
            <button 
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium border-2 transition-colors ${theme === 'dark' ? 'border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <Moon size={20} /> Dark Mode
            </button>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        {/* Notifications */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notifications</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Bell className="text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Enable Push Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts for new approvals and imports.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        {/* Danger Zone */}
        <div>
          <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">Reset Demo Data</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">Wipe all local storage and reset to initial MVP state.</p>
            </div>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <RefreshCw size={16} /> Reset Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
