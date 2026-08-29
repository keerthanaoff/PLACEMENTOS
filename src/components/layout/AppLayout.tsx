"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Building2, Briefcase, 
  CalendarDays, FileText, ClipboardList, Award, 
  UserSquare2, BrainCircuit, Users2, BarChart3, 
  CheckCircle2, Bell, ShieldAlert, Settings,
  LogOut, Search, Moon, Sun, Menu, X, Plus, ShieldX, ArrowLeft
} from "lucide-react";
import { useTheme } from "next-themes";
import { initializeData } from "@/services/storageService";
import { authService, UserSession } from "@/services/authService";

const allNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "Student Intelligence", href: "/dashboard/students", icon: Users, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "Company Intelligence", href: "/dashboard/companies", icon: Building2, roles: ["ADMIN", "MANAGER"] },
  { name: "Placement Drives", href: "/dashboard/drives", icon: CalendarDays, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "JD Intelligence", href: "/dashboard/jds", icon: FileText, roles: ["ADMIN", "MANAGER"] },
  { name: "Recruiters", href: "/dashboard/recruiters", icon: UserSquare2, roles: ["ADMIN", "MANAGER"] },
  { name: "Placement Pipeline", href: "/dashboard/pipeline", icon: Briefcase, roles: ["ADMIN", "MANAGER"] },
  { name: "Applications", href: "/dashboard/applications", icon: ClipboardList, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "Offers", href: "/dashboard/offers", icon: Award, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "Placement Analytics", href: "/dashboard/reports", icon: BarChart3, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "AI Resume", href: "/dashboard/ai-resume", icon: BrainCircuit, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "Placement Team", href: "/dashboard/team", icon: Users2, roles: ["ADMIN"] },
  { name: "Approval Center", href: "/dashboard/approvals", icon: CheckCircle2, roles: ["ADMIN"] },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["ADMIN", "MANAGER", "LEAD"] },
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: ShieldAlert, roles: ["ADMIN"] },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["ADMIN"] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<UserSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    initializeData();

    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    setCheckingAuth(false);
  }, [router, pathname]);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter Nav items according to Role
  const allowedNavItems = allNavItems.filter(item => item.roles.includes(user.role));
  
  // Check if current route is authorized for active user
  const isAuthorized = authService.canAccessRoute(pathname, user.role);

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
            <img src="/logo.png" alt="PlacementOS Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">PLACEMENTOS</span>
          </div>
          <button className="lg:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' 
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

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">ID: {user.employeeId}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
              user.role === "ADMIN" ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300" :
              user.role === "MANAGER" ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300" :
              "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}>
              {user.role}
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout Session</span>
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
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Header Role Badge */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase border hidden sm:inline-block ${
              user.role === "ADMIN" ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300" :
              user.role === "MANAGER" ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300" :
              "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}>
              {user.role} ROLE
            </span>

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
                  {user.role !== "LEAD" && <Link href="/dashboard/companies" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Add Company</Link>}
                  {user.role !== "LEAD" && <Link href="/dashboard/jds/new" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Add JD</Link>}
                  <Link href="/dashboard/drives" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Add Drive</Link>
                  <Link href="/dashboard/ai-resume" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800">Analyze Resume</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content / Route Guard Evaluation */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {isAuthorized ? (
              children
            ) : (
              /* Access Denied View */
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm max-w-xl mx-auto my-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <ShieldX size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                    Your current role (<strong className="text-indigo-600 dark:text-indigo-400">{user.role}</strong>) does not have authorization to view this module.
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-center gap-4">
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                  >
                    <ArrowLeft size={16} /> Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
