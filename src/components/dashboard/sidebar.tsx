"use client";

// src/components/dashboard/sidebar.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  Building2,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  UserCircle,
  Users,
  Wallet,
  BarChart3,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/client";

function ArsadayaIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect width="200" height="200" rx="42" fill="#2D6A50" />
      <line
        x1="100"
        y1="52"
        x2="44"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="52"
        x2="156"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="65"
        y1="122"
        x2="135"
        y2="122"
        stroke="white"
        strokeWidth="19"
        strokeLinecap="round"
      />
      <circle cx="100" cy="38" r="16" fill="#F5A623" />
    </svg>
  );
}

type UserRole = "employee" | "manager" | "hr" | "admin" | "owner";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
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
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
        roles: ["employee", "manager", "hr", "admin", "owner"],
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        name: "Employees",
        href: "/employees",
        icon: Users,
        roles: ["manager", "hr", "admin", "owner"],
      },
      {
        name: "Departments",
        href: "/departments",
        icon: Building2,
        roles: ["hr", "admin", "owner"],
      },
      {
        name: "Performance",
        href: "/performance",
        icon: Award,
        roles: ["manager", "hr", "admin", "owner"],
      },
    ],
  },
  {
    title: "Company",
    items: [
      {
        name: "Announcements",
        href: "/announcements",
        icon: Megaphone,
        roles: ["employee", "manager", "hr", "admin", "owner"],
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        roles: ["employee", "manager", "hr", "admin", "owner"],
      },
      {
        name: "Documents",
        href: "/documents",
        icon: FolderOpen,
        roles: ["hr", "admin", "owner"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        name: "Payroll",
        href: "/payroll",
        icon: Wallet,
        roles: ["hr", "admin", "owner"],
      },
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
        roles: ["hr", "admin", "owner"],
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["admin", "owner"],
      },
      {
        name: "Billing",
        href: "/billing",
        icon: CreditCard,
        roles: ["owner"],
      },
    ],
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

function normalizeRole(role?: string): UserRole {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "hr" ||
    role === "manager" ||
    role === "employee"
  ) {
    return role;
  }

  return "employee";
}

function getInitials(name?: string) {
  const cleanedName = name?.trim();

  if (!cleanedName) return "U";

  return cleanedName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar({
  userRole = "employee",
  userName = "User",
  userEmail = "",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const role = normalizeRole(userRole);
  const initials = getInitials(userName);

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 px-5">
        <ArsadayaIcon size={30} />

        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-[0.2em] text-gray-950">
            ARSADAYA
          </p>
          <p className="truncate text-[11px] text-gray-500">HR Management</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {visibleSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "group flex h-10 items-center gap-3 border-l-4 px-3 text-sm font-medium transition-colors",
                        active
                          ? "border-[#F5A623] bg-[#EAF5F0] pl-2 text-[#2D6A50]"
                          : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#2D6A50]",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-4 w-4 shrink-0",
                          active
                            ? "text-[#2D6A50]"
                            : "text-gray-400 group-hover:text-[#2D6A50]",
                        ].join(" ")}
                      />

                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 border-t border-gray-200 px-3 py-2.5">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#EAF5F0] text-[11px] font-semibold text-[#2D6A50]">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-semibold leading-5 text-gray-950">
                {userName || "User"}
              </p>

              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-[#2D6A50]">
                {ROLE_LABEL[role]}
              </span>
            </div>

            {userEmail && (
              <p className="truncate text-[11px] leading-4 text-gray-500">
                {userEmail}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 flex h-8 w-full items-center gap-2 px-1 text-xs font-medium text-gray-500 transition-colors hover:text-red-700"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
