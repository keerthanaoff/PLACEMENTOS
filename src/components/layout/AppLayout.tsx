"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Building2, Briefcase, 
  CalendarDays, FileText, ClipboardList, Award, 
  UserSquare2, BrainCircuit, Users2, BarChart3, 
  CheckCircle2, Bell, ShieldAlert, Settings,
  LogOut, Search, Moon, Sun, Menu, X, Plus
} from "lucide-react";
import { useTheme } from "next-themes";
import { initializeData } from "@/services/storageService";

const adminNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Student Intelligence", href: "/dashboard/students", icon: Users },
  { name: "Company Intelligence", href: "/dashboard/companies", icon: Building2 },
  { name: "Placement Drives", href: "/dashboard/drives", icon: CalendarDays },
  { name: "JD Intelligence", href: "/dashboard/jds", icon: FileText },
  { name: "Recruiters", href: "/dashboard/recruiters", icon: UserSquare2 },
  { name: "Placement Pipeline", href: "/dashboard/pipeline", icon: Briefcase },
  { name: "Applications", href: "/dashboard/applications", icon: ClipboardList },
  { name: "Offers", href: "/dashboard/offers", icon: Award },
  { name: "Placement Analytics", href: "/dashboard/reports", icon: BarChart3 },
  { name: "AI Resume", href: "/dashboard/ai-resume", icon: BrainCircuit },
  { name: "Placement Team", href: "/dashboard/team", icon: Users2 },
  { name: "Approval Center", href: "/dashboard/approvals", icon: CheckCircle2 },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: ShieldAlert },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const managerNav = [
  { name: "Manager Dashboard", href: "/manager", icon: LayoutDashboard },
  { name: "Students", href: "/manager/students", icon: Users },
  { name: "Companies", href: "/manager/companies", icon: Building2 },
  { name: "Drives", href: "/manager/drives", icon: CalendarDays },
  { name: "JDs", href: "/manager/jds", icon: FileText },
  { name: "Recruiters", href: "/manager/recruiters", icon: UserSquare2 },
  { name: "Reports", href: "/manager/reports", icon: BarChart3 },
];

const leadNav = [
  { name: "Lead Dashboard", href: "/lead", icon: LayoutDashboard },
  { name: "Companies", href: "/lead/companies", icon: Building2 },
  { name: "Drives", href: "/lead/drives", icon: CalendarDays },
  { name: "JDs", href: "/lead/jds", icon: FileText },
  { name: "Students", href: "/lead/students", icon: Users },
  { name: "Recruiters", href: "/lead/recruiters", icon: UserSquare2 },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Initialize data on load
    initializeData();

    const userRole = localStorage.getItem("userRole");
    if (!userRole) {
      router.push("/login");
    } else {
      setRole(userRole);
    }
  }, [router]);

  const navItems = role === "ADMIN" ? adminNav : role === "MANAGER" ? managerNav : role === "LEAD" ? leadNav : [];

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  if (!role) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">PLACEMENTOS</span>
          </div>
          <button className="lg:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold mr-3">
              {role.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{role} User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">placementos.ai</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center">
            <button 
              className="mr-4 lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex relative w-64 md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Global Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              />
              {searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 p-4">
                  <p className="text-sm text-gray-500">Searching for "{searchQuery}"...</p>
                  <div className="mt-2 text-sm text-indigo-600">No matching mock results yet.</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative">
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
              <Bell size={20} />
            </button>
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                className="hidden sm:flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                <span>Quick Add</span>
              </button>
              {isQuickAddOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <Link href="/dashboard/students" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Add Student</Link>
                  <Link href="/dashboard/companies" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Add Company</Link>
                  <Link href="/dashboard/jds/new" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Add JD</Link>
                  <Link href="/dashboard/drives" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Add Drive</Link>
                  <Link href="/dashboard/ai-resume" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800">Analyze Resume</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
