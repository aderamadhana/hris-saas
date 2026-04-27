"use client";

// src/components/dashboard/header.tsx
// Header dashboard dengan branding ARSADAYA

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
  owner: "Pemilik",
  admin: "Admin",
  hr: "HR",
  manager: "Manajer",
  employee: "Karyawan",
};

export function Header({
  userName = "Pengguna",
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Kiri — kosong (breadcrumb bisa ditambah di sini) */}
      <div />

      {/* Kanan — notifikasi + profil */}
      <div className="flex items-center gap-3">
        {/* Notifikasi */}
        <Link
          href="/notifications"
          className="relative h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <Bell className="h-4 w-4 text-gray-500" />
          {notificationCount > 0 && (
            <span
              className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
              style={{ background: "#F5A623" }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* Profil dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: "#0A5140", color: "white" }}
            >
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] text-gray-400">
                {roleLabel[userRole] ?? userRole}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown menu */}
          {open && (
            <>
              {/* Overlay transparan untuk tutup saat klik luar */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-100 rounded-xl shadow-md z-20 py-1 overflow-hidden">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-gray-400" />
                  Profil Saya
                </Link>
                {["admin", "owner"].includes(userRole) && (
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Pengaturan
                  </Link>
                )}
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
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
