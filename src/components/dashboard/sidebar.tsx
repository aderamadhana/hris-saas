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
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
  organizationName?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    icon: Clock,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    label: "Leave",
    href: "/dashboard/leave",
    icon: CalendarDays,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    label: "Payslip",
    href: "/dashboard/payslip",
    icon: FileText,
    roles: ["employee", "manager", "hr", "admin", "owner"],
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
    roles: ["manager", "hr", "admin", "owner"],
    badge: "Management",
  },
  {
    label: "Departments",
    href: "/dashboard/departments",
    icon: Building2,
    roles: ["hr", "admin", "owner"],
  },
  {
    label: "Payroll",
    href: "/dashboard/payroll",
    icon: Wallet,
    roles: ["hr", "admin", "owner"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["admin", "owner"],
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    roles: ["owner"],
  },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Administrator",
  hr: "HR Manager",
  manager: "Manager",
  employee: "Employee",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-red-100 text-red-700",
  admin: "bg-orange-100 text-orange-700",
  hr: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  employee: "bg-gray-100 text-gray-700",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({
  userRole,
  userName,
  userEmail,
  organizationName,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole),
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const NavContent = (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            H
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {organizationName ?? "HRIS Platform"}
            </p>
            <p className="truncate text-xs text-gray-400">
              HR Information System
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User footer ── */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {userName}
            </p>
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                ROLE_COLORS[userRole] ?? ROLE_COLORS.employee,
              )}
            >
              {ROLE_LABELS[userRole] ?? userRole}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop ── */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        {NavContent}
      </aside>

      {/* ── Mobile toggle ── */}
      <button
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden">
            {NavContent}
          </aside>
        </>
      )}
    </>
  );
}
