// src/components/sidebar.tsx
// FIXED VERSION - Proper role-based navigation with correct paths

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { CreditCard } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Building2,
  Wallet,
  Settings,
  UserCircle,
  FileText,
} from "lucide-react";

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
}

// Define navigation items per role
const getNavigationItems = (role: string): NavigationItem[] => {
  const commonItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["employee", "manager", "hr", "admin", "owner"],
    },
    {
      name: "My Profile",
      href: "/profile", // ✅ Fixed path
      icon: UserCircle,
      roles: ["employee", "manager", "hr", "admin", "owner"],
    },
  ];

  const attendanceLeaveItems = [
    {
      name: "Attendance",
      href: "/attendance", // ✅ Fixed path
      icon: Clock,
      roles: ["employee", "manager", "hr", "admin", "owner"],
    },
    {
      name: "Leave",
      href: "/leave", // ✅ Fixed path
      icon: CalendarDays,
      roles: ["employee", "manager", "hr", "admin", "owner"],
    },
  ];

  const payslipItems = [
    {
      name: "Payslip", // ✅ Added for employee
      href: "/payslip",
      icon: FileText,
      roles: ["employee", "manager", "hr", "admin", "owner"],
    },
  ];

  const managementItems = [
    {
      name: "Employees",
      href: "/employees", // ✅ Fixed path
      icon: Users,
      roles: ["manager", "hr", "admin", "owner"],
      badge: "Management",
    },
    {
      name: "Departments",
      href: "/departments", // ✅ Fixed path
      icon: Building2,
      roles: ["hr", "admin", "owner"],
    },
  ];

  const payrollSettingsItems = [
    {
      name: "Payroll", // ✅ For HR/Admin to manage
      href: "/payroll",
      icon: Wallet,
      roles: ["hr", "admin", "owner"],
    },
    {
      name: "Settings",
      href: "/settings", // ✅ Fixed path
      icon: Settings,
      roles: ["admin", "owner"],
    },
  ];

  const billingItems = [
    {
      name: "Billing",
      href: "/billing",
      icon: CreditCard,
      roles: ["owner"], // ✅ OWNER ONLY!
    },
  ];

  const canAccessBilling = (role: string) => {
    return role === "owner";
  };
  const canViewBilling = ["owner", "admin"].includes(role);

  // ✅ Order items logically
  const allItems = [
    ...commonItems,
    ...billingItems,
    ...attendanceLeaveItems,
    ...payslipItems, // After Leave, before management
    ...managementItems,
    ...payrollSettingsItems,
  ];

  return allItems.filter((item) => item.roles.includes(role));
};

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const navigationItems = getNavigationItems(userRole);

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      employee: "Employee",
      manager: "Manager",
      hr: "HR Manager",
      admin: "Administrator",
      owner: "Owner",
    };
    return roleMap[role] || "User";
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      employee: "bg-gray-100 text-gray-700",
      manager: "bg-blue-100 text-blue-700",
      hr: "bg-purple-100 text-purple-700",
      admin: "bg-orange-100 text-orange-700",
      owner: "bg-red-100 text-red-700",
    };
    return colorMap[role] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      {/* Logo & Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-lg font-bold text-white">H</span>
          </div>
          <span className="text-xl font-bold text-gray-900">HRIS</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-semibold text-blue-600">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  getRoleColor(userRole),
                )}
              >
                {getRoleDisplayName(userRole)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto text-xs text-gray-500">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Help Section (Optional) */}
      {userRole === "employee" && (
        <div className="border-t p-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-900">Need Help?</p>
            <p className="mt-1 text-xs text-blue-700">
              Contact HR for assistance
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
