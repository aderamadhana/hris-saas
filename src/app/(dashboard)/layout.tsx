// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Satu query saja — ambil semua field yang dibutuhkan sekaligus ──────────
  // Versi lama query findUnique DUA KALI (sekali untuk data, sekali untuk
  // notificationCount) → double DB round-trip yang tidak perlu.
  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      id: true, // ← dibutuhkan untuk notificationCount
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      organizationId: true,
    },
  });

  if (!employee) {
    redirect("/login");
  }

  const userName = `${employee.firstName} ${employee.lastName}`.trim();
  const userEmail = employee.email;
  const userRole = employee.role;

  // ── Notifikasi — pakai employee.id dari query di atas, tanpa query ulang ──
  let notificationCount = 0;
  try {
    notificationCount = await prisma.notification.count({
      where: {
        recipientId: employee.id,
        isRead: false,
      },
    });
  } catch {
    notificationCount = 0;
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#F4F5F7]">
      {/*
        Set role cookie via inline script.
        Middleware membaca cookie ini untuk fast role-based redirect
        tanpa perlu DB call di setiap request.
        HttpOnly=false sengaja agar middleware (Edge) bisa membacanya.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.cookie = "user-role=${userRole}; path=/; SameSite=Lax; max-age=86400";`,
        }}
      />

      <div className="flex h-full overflow-hidden">
        {/* Desktop sidebar: hidden on mobile/tablet, visible on large screens */}
        <div className="hidden h-full shrink-0 lg:flex">
          <Sidebar
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
          />
        </div>

        {/* Main layout: fullscreen on mobile */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            notificationCount={notificationCount}
          />

          <main className="min-h-0 flex-1 overflow-y-auto bg-[#F4F5F7] px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
