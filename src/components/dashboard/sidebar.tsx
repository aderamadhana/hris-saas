"use client";

// src/components/dashboard/sidebar.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
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
  Bell,
  LogOut,
} from "lucide-react";

function ArsadayaIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
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

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  roles: string[];
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
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
    roles: ["owner"],
  },
];

// Group labels
const GROUP_LABELS: Record<string, string> = {
  "/employees": "Management",
  "/settings": "System",
  "/billing": "System",
};

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> =
  {
    owner: { label: "Owner", bg: "#FEF9C3", color: "#713F12" },
    admin: { label: "Admin", bg: "#FEE2E2", color: "#7F1D1D" },
    hr: { label: "HR", bg: "#EDE9FE", color: "#3B0764" },
    manager: { label: "Manager", bg: "#DBEAFE", color: "#1E3A5F" },
    employee: { label: "Employee", bg: "#F0FDF4", color: "#14532D" },
  };

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({
  userRole = "employee",
  userName = "User",
  userEmail = "",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(userRole));
  const badge = ROLE_BADGE[userRole] ?? ROLE_BADGE.employee;

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Build grouped nav
  let managementLabelShown = false;
  let systemLabelShown = false;

  return (
    <aside
      className="flex flex-col h-full w-[220px] shrink-0"
      style={{ background: "white", borderRight: "1px solid #E5E7EB" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-5 h-14 shrink-0"
        style={{ borderBottom: "1px solid #E5E7EB" }}
      >
        <ArsadayaIcon size={26} />
        <span
          className="font-bold tracking-widest text-sm"
          style={{ color: "#111B15", fontFamily: "Georgia, serif" }}
        >
          ARSADAYA
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {items.map((item, idx) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          // Group headers
          let groupLabel: string | null = null;
          if (item.href === "/employees" && !managementLabelShown) {
            managementLabelShown = true;
            groupLabel = "Management";
          }
          if (
            (item.href === "/settings" || item.href === "/billing") &&
            !systemLabelShown
          ) {
            systemLabelShown = true;
            groupLabel = "System";
          }

          return (
            <div key={item.href}>
              {groupLabel && (
                <p
                  className="text-[10px] font-semibold tracking-widest uppercase px-3 pt-4 pb-1"
                  style={{ color: "#9CA3AF" }}
                >
                  {groupLabel}
                </p>
              )}
              <Link
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5"
                style={{
                  background: active ? "#F0FDF4" : "transparent",
                  color: active ? "#2D6A50" : "#6B7280",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: active ? "#2D6A50" : "#9CA3AF" }}
                />
                <span className="truncate">{item.name}</span>
                {active && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#2D6A50" }}
                  />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
            style={{ background: "#F0FDF4", color: "#2D6A50" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium truncate leading-tight"
              style={{ color: "#111827" }}
            >
              {userName}
            </p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-block mt-0.5"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#DC2626";
            e.currentTarget.style.background = "#FEF2F2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#9CA3AF";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
