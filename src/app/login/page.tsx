"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap, Briefcase, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = authService.login(role, identifier, password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Invalid credentials.");
    }
  };

  const fillDemo = (demoRole: string, demoId: string, demoPass: string) => {
    setRole(demoRole);
    setIdentifier(demoId);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left side visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-900 to-black opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 p-12 text-white flex flex-col items-start max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <img src="/logo.png" alt="PlacementOS Logo" className="w-10 h-10 object-contain rounded-lg" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PLACEMENTOS AI</h1>
          </div>
          <h2 className="text-4xl font-extrabold mb-6 leading-tight">
            From Student Potential <br />
            <span className="text-indigo-400">to Placement Success</span>
          </h2>
          <p className="text-lg text-indigo-200 mb-8">
            The next-generation command center for managing campus placements with Role-Based Access Control.
          </p>

          {/* Quick Demo Credentials Assistant */}
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Demo Role Credentials (Click to fill)</p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => fillDemo("Admin", "ADM001", "Admin@123")}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors border border-white/10"
              >
                <span className="block font-bold text-xs text-purple-300">ADMIN</span>
                <span className="block text-[11px] text-white/80">ADM001</span>
              </button>
              <button 
                onClick={() => fillDemo("Manager", "MGR001", "Manager@123")}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors border border-white/10"
              >
                <span className="block font-bold text-xs text-blue-300">MANAGER</span>
                <span className="block text-[11px] text-white/80">MGR001</span>
              </button>
              <button 
                onClick={() => fillDemo("Lead", "LED001", "Lead@123")}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors border border-white/10"
              >
                <span className="block font-bold text-xs text-emerald-300">LEAD</span>
                <span className="block text-[11px] text-white/80">LED001</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex flex-1 flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 bg-indigo-600 rounded-xl shadow-md">
                <img src="/logo.png" alt="PlacementOS Logo" className="w-8 h-8 object-contain rounded-lg" />
              </div>
              <h1 className="text-2xl font-bold">PLACEMENTOS AI</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Role Portal Sign In
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Select your authorization role and enter your Employee ID.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Target Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-medium"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Employee ID *
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. ADM001, MGR001, LED001"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Quick Demo fill bar for mobile/small screens */}
            <div className="lg:hidden p-3 bg-gray-100 dark:bg-gray-800/60 rounded-xl space-y-2 text-xs">
              <span className="font-semibold text-gray-500">Quick Fill Demo:</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => fillDemo("Admin", "ADM001", "Admin@123")} className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded">Admin</button>
                <button type="button" onClick={() => fillDemo("Manager", "MGR001", "Manager@123")} className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">Manager</button>
                <button type="button" onClick={() => fillDemo("Lead", "LED001", "Lead@123")} className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded">Lead</button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-[0.98]"
            >
              Sign in to Portal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
