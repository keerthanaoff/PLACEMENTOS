export interface UserSession {
  employeeId: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "LEAD";
  title: string;
  email: string;
}

const ACCOUNTS = [
  {
    role: "ADMIN",
    employeeIds: ["ADM001", "SIVASUBRAMANIAM", "ADMIN"],
    displayId: "ADM001",
    passwords: ["admin123", "Admin@123", "admin@123"],
    name: "Sivasubramaniam",
    title: "Administrator",
    email: "admin@placementos.ai"
  },
  {
    role: "MANAGER",
    employeeIds: ["MGR001", "JAYAKANNAN", "MANAGER"],
    displayId: "MGR001",
    passwords: ["manager123", "Manager@123"],
    name: "Jayakannan",
    title: "Placement Manager",
    email: "manager@placementos.ai"
  },
  {
    role: "LEAD",
    employeeIds: ["LED001", "LEAD"],
    displayId: "LED001",
    passwords: ["lead123", "Lead@123", "lead@123"],
    name: "Placement Lead",
    title: "Placement Lead",
    email: "lead@placementos.ai"
  }
];

const isBrowser = typeof window !== "undefined";

export const authService = {
  login(selectedRole: string, employeeIdInput: string, passwordInput: string): { success: boolean; user?: UserSession; error?: string } {
    const trimmedId = (employeeIdInput || "").trim();
    const trimmedPassword = (passwordInput || "").trim();
    const normalizedRole = (selectedRole || "").trim().toUpperCase();

    if (!trimmedId) {
      return { success: false, error: "Invalid Employee ID." };
    }

    if (!trimmedPassword) {
      return { success: false, error: "Invalid password." };
    }

    // Step 1: Check if Employee ID exists anywhere in the system
    const accountById = ACCOUNTS.find(acc => 
      acc.employeeIds.some(id => id.toUpperCase() === trimmedId.toUpperCase())
    );

    if (!accountById) {
      return { success: false, error: "Invalid Employee ID." };
    }

    // Step 2: Check Password
    const isPasswordValid = accountById.passwords.some(p => p === trimmedPassword);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid password." };
    }

    // Step 3: Check Role Match
    if (accountById.role !== normalizedRole) {
      return { success: false, error: "Employee does not have access to this role." };
    }

    // Login Success!
    const userSession: UserSession = {
      employeeId: accountById.displayId,
      name: accountById.name,
      role: accountById.role as "ADMIN" | "MANAGER" | "LEAD",
      title: accountById.title,
      email: accountById.email
    };

    if (isBrowser) {
      localStorage.setItem("currentUser", JSON.stringify(userSession));
      localStorage.setItem("userRole", userSession.role);
    }

    return { success: true, user: userSession };
  },

  logout(): void {
    if (!isBrowser) return;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
  },

  getCurrentUser(): UserSession | null {
    if (!isBrowser) return null;
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    const role = localStorage.getItem("userRole");
    if (role === "ADMIN") {
      return { employeeId: "ADM001", name: "Sivasubramaniam", role: "ADMIN", title: "Administrator", email: "admin@placementos.ai" };
    } else if (role === "MANAGER") {
      return { employeeId: "MGR001", name: "Jayakannan", role: "MANAGER", title: "Placement Manager", email: "manager@placementos.ai" };
    } else if (role === "LEAD") {
      return { employeeId: "LED001", name: "Placement Lead", role: "LEAD", title: "Placement Lead", email: "lead@placementos.ai" };
    }
    return null;
  },

  isAuthenticated(): boolean {
    if (!isBrowser) return false;
    return !!localStorage.getItem("userRole");
  },

  canAccessRoute(pathname: string, role: string): boolean {
    if (!role) return false;
    const normalizedRole = role.toUpperCase();

    // ADMIN can access everything
    if (normalizedRole === "ADMIN") return true;

    // MANAGER permissions
    if (normalizedRole === "MANAGER") {
      const denied = ["/dashboard/audit-logs", "/dashboard/settings", "/dashboard/team"];
      return !denied.some(route => pathname === route || pathname.startsWith(route + "/"));
    }

    // LEAD permissions
    if (normalizedRole === "LEAD") {
      const denied = [
        "/dashboard/jds",
        "/dashboard/recruiters",
        "/dashboard/team",

        "/dashboard/audit-logs",
        "/dashboard/settings"
      ];
      return !denied.some(route => pathname === route || pathname.startsWith(route + "/"));
    }

    return false;
  }
};
