// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import prisma from "@/src/lib/prisma";
import { createClient } from "@/src/lib/supabase/server";
import { Header } from "@/src/components/dashboard/header";
import { Sidebar } from "@/src/components/dashboard/sidebar";

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

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
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

  // ── Simpan role di cookie agar middleware bisa baca tanpa DB call ──────────
  // Cookie ini dipakai oleh middleware.ts untuk fast role-based redirect.
  // HttpOnly=false sengaja agar middleware (edge) bisa baca.
  const cookieStore = await cookies();
  const existingRole = cookieStore.get("user-role")?.value;
  if (existingRole !== employee.role) {
    // Set via response header — layout tidak bisa set cookie langsung,
    // jadi kita set di sini dan Next.js akan forward ke response.
    // Alternatif: gunakan middleware untuk set setelah auth check.
    // Cookie akan ter-set pada response berikutnya via supabase SSR flow.
  }

  const userName = `${employee.firstName} ${employee.lastName}`.trim();
  const userEmail = employee.email;
  const userRole = employee.role;

  let notificationCount = 0;

  try {
    // Cari employee.id dulu untuk query notifikasi
    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true },
    });

    if (currentEmployee) {
      notificationCount = await prisma.notification.count({
        where: {
          recipientId: currentEmployee.id, // ← pakai recipientId sesuai schema
          isRead: false,
        },
      });
    }
  } catch {
    notificationCount = 0;
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#F4F5F7]">
      {/*
        Set role cookie via meta tag yang dibaca oleh script kecil.
        Cara paling reliable untuk set cookie dari Server Component
        tanpa perlu API route tambahan.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.cookie = "user-role=${userRole}; path=/; SameSite=Lax; max-age=86400";`,
        }}
      />

      <div className="flex h-full overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden h-full shrink-0 lg:flex">
          <Sidebar
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
          />
        </div>

        {/* Main layout */}
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
