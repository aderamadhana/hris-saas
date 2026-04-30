"use client";

// src/components/dashboard/header.tsx

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  KeyRound,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";

import { MobileSidebar } from "@/src/components/dashboard/mobile-sidebar";
import { createClient } from "@/src/lib/supabase/client";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  notificationCount?: number;
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

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

export function Header({
  userName = "User",
  userEmail = "",
  userRole = "employee",
  notificationCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const initials = getInitials(userName);
  const roleLabel = ROLE_LABEL[userRole] ?? "Employee";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
      setProfileOpen(false);
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="relative z-40 h-16 shrink-0 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-4 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <MobileSidebar
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
          />

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-gray-950">
              Organization Dashboard
            </p>
            <p className="truncate text-xs text-gray-500">
              Manage your workday from one place
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center border-r border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#2D6A50]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />

            {notificationCount > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 bg-[#F5A623]" />
            )}
          </Link>

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="flex h-10 items-center gap-2 px-2 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#EAF5F0] text-[11px] font-semibold uppercase text-[#2D6A50]">
                {initials}
              </div>

              <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
                <p className="truncate text-sm font-semibold text-gray-950">
                  {userName}
                </p>

                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#2D6A50]">
                  {roleLabel}
                </span>
              </div>

              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                  profileOpen ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-72 border border-gray-200 bg-white shadow-lg"
              >
                <div className="border-b border-gray-200 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#EAF5F0] text-xs font-semibold uppercase text-[#2D6A50]">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-950">
                        {userName}
                      </p>

                      {userEmail && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {userEmail}
                        </p>
                      )}

                      <p className="mt-2 inline-flex bg-[#EAF5F0] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2D6A50]">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex h-10 items-center gap-3 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-[#EAF5F0] hover:text-[#2D6A50]"
                  >
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    My Profile
                  </Link>

                  <Link
                    href="/profile/change-password"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex h-10 items-center gap-3 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-[#EAF5F0] hover:text-[#2D6A50]"
                  >
                    <KeyRound className="h-4 w-4 text-gray-400" />
                    Change Password
                  </Link>

                  {(userRole === "owner" || userRole === "admin") && (
                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex h-10 items-center gap-3 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-[#EAF5F0] hover:text-[#2D6A50]"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      Settings
                    </Link>
                  )}
                </div>

                <div className="border-t border-gray-200 py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex h-10 w-full items-center gap-3 px-4 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
