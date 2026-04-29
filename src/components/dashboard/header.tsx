"use client";

// src/components/header.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, Settings, UserCircle, LogOut } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

interface HeaderProps {
  userName?: string;
  userRole?: string;
  notificationCount?: number;
}

const roleLabel: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

export function Header({
  userName = "User",
  userRole = "employee",
  notificationCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0"
      style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}
    >
      {/* Left slot */}
      <div />

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <Link
          href="/notifications"
          className="relative h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F9FAFB";
            e.currentTarget.style.color = "#6B7280";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#9CA3AF";
          }}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span
              className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
              style={{ background: "#2D6A50" }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ color: "#374151" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
              style={{ background: "#F0FDF4", color: "#2D6A50" }}
            >
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span
                className="text-sm font-medium truncate max-w-[130px]"
                style={{ color: "#111827" }}
              >
                {userName}
              </span>
            </div>
            <ChevronDown
              className="h-3 w-3 hidden sm:block"
              style={{ color: "#9CA3AF" }}
            />
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
              />
              <div
                className="absolute right-0 top-full mt-1.5 w-44 rounded-lg shadow-lg z-20 py-1 overflow-hidden"
                style={{ background: "white", border: "1px solid #E5E7EB" }}
              >
                {/* User info header */}
                <div
                  className="px-3 py-2.5"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: "#111827" }}
                  >
                    {userName}
                  </p>
                  <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                    {roleLabel[userRole] ?? userRole}
                  </p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style={{ color: "#374151" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F9FAFB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <UserCircle
                    className="h-3.5 w-3.5"
                    style={{ color: "#9CA3AF" }}
                  />
                  My Profile
                </Link>

                {["admin", "owner"].includes(userRole) && (
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                    style={{ color: "#374151" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F9FAFB")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Settings
                      className="h-3.5 w-3.5"
                      style={{ color: "#9CA3AF" }}
                    />
                    Settings
                  </Link>
                )}

                <div
                  style={{ borderTop: "1px solid #F3F4F6", margin: "4px 0" }}
                />

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style={{ color: "#DC2626" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#FEF2F2")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
