"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap, Briefcase, BrainCircuit } from "lucide-react";

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

    // DEVELOPMENT DEMO CREDENTIALS
    if (identifier === "admin" && password === "admin123") {
      // Use local storage for mock auth state
      localStorage.setItem("userRole", "ADMIN");
      router.push("/dashboard");
    } else if (identifier === "manager" && password === "manager123") {
      localStorage.setItem("userRole", "MANAGER");
      router.push("/manager");
    } else if (identifier === "lead" && password === "lead123") {
      localStorage.setItem("userRole", "LEAD");
      router.push("/lead");
    } else {
      setError("Invalid credentials. Please use demo credentials.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left side visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
        {/* Abstract shapes / Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-900 to-black opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 p-12 text-white flex flex-col items-start max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <BrainCircuit className="w-8 h-8 text-indigo-300" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">PLACEMENTOS AI</h1>
          </div>
          <h2 className="text-4xl font-extrabold mb-6 leading-tight">
            From Student Potential <br />
            <span className="text-indigo-400">to Placement Success</span>
          </h2>
          <p className="text-lg text-indigo-200 mb-12">
            The next-generation command center for managing campus placements, 
            driven by artificial intelligence and seamless workflows.
          </p>

          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <GraduationCap className="w-6 h-6 mb-3 text-indigo-300" />
              <h3 className="font-semibold text-lg">Student Intelligence</h3>
              <p className="text-sm text-indigo-200/80 mt-1">Smart resume parsing and matching.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <Briefcase className="w-6 h-6 mb-3 text-indigo-300" />
              <h3 className="font-semibold text-lg">Company Pipeline</h3>
              <p className="text-sm text-indigo-200/80 mt-1">Track recruiters from Cold to Hot.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex flex-1 flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">PLACEMENTOS AI</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Sign in to your account to continue.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}


          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Registration Number / Employee ID
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your ID"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-gray-700 dark:bg-gray-900"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-[0.98]"
            >
              Sign in to Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
