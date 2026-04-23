// src/components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
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
  CreditCard,
} from "lucide-react";

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    name: "My Profile",
    href: "/profile",
    icon: UserCircle,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
    roles: ["owner"],
  },
  {
    name: "Attendance",
    href: "/attendance",
    icon: Clock,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    name: "Leave",
    href: "/leave",
    icon: CalendarDays,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    name: "Payslip",
    href: "/payslip",
    icon: FileText,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
    roles: ["manager", "hr", "admin", "owner"],
    badge: "Management",
  },
  {
    name: "Departments",
    href: "/departments",
    icon: Building2,
    roles: ["hr", "admin", "owner"],
  },
  {
    name: "Payroll",
    href: "/payroll",
    icon: Wallet,
    roles: ["hr", "admin", "owner"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "owner"],
  },
];

const ROLE_LABEL: Record<string, string> = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR Manager",
  admin: "Administrator",
  owner: "Owner",
};

const ROLE_COLOR: Record<string, string> = {
  employee: "bg-gray-100 text-gray-700",
  manager: "bg-blue-100 text-blue-700",
  hr: "bg-purple-100 text-purple-700",
  admin: "bg-orange-100 text-orange-700",
  owner: "bg-red-100 text-red-700",
};

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole),
  );

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-lg font-bold text-white">H</span>
          </div>
          <span className="text-xl font-bold text-gray-900">HRIS</span>
        </Link>
      </div>

      {/* User info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-semibold text-blue-600">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {userName}
            </p>
            <span
              className={cn(
                "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                ROLE_COLOR[userRole] ?? "bg-gray-100 text-gray-700",
              )}
            >
              {ROLE_LABEL[userRole] ?? userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0",
                  active ? "text-blue-600" : "text-gray-400",
                )}
              />
              <span>{item.name}</span>
              {item.badge && !active && (
                <span className="ml-auto text-xs text-gray-400">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom tip for employee */}
      {userRole === "employee" && (
        <div className="border-t p-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-900">Need help?</p>
            <p className="mt-0.5 text-xs text-blue-600">
              Contact your HR team for assistance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
