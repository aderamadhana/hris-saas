// src/app/(dashboard)/layout.tsx
// Layout dashboard — fetch data user nyata dari DB untuk header & sidebar

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Sidebar } from "@/src/components/dashboard/sidebar";
import { Header } from "@/src/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Cek session Supabase
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Ambil data employee dari database
  //    Coba cari via authId dulu, fallback ke email
  let employee = await prisma.employee.findFirst({
    where: { authId: user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      organizationId: true,
    },
  });

  if (!employee) {
    // Fallback: cari via email & auto-link
    employee = await prisma.employee.findFirst({
      where: { email: user.email ?? "" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });
    if (employee) {
      // Auto-link authId supaya next request langsung ketemu
      await prisma.employee.update({
        where: { id: employee.id },
        data: { authId: user.id },
      });
    }
  }

  // 3. Siapkan nilai display
  const userName = employee
    ? `${employee.firstName} ${employee.lastName}`.trim()
    : (user.email ?? "Pengguna");

  const userRole = employee?.role ?? "employee";
  const userEmail = employee?.email ?? user.email ?? "";

  // 4. Hitung notifikasi pending (opsional — hapus jika model belum ada)
  let notificationCount = 0;
  try {
    // Contoh: hitung cuti pending yang perlu diapprove oleh user ini
    if (["hr", "admin", "owner", "manager"].includes(userRole) && employee) {
      notificationCount = await prisma.leave.count({
        where: {
          organizationId: employee.organizationId,
          status: "pending",
        },
      });
    }
  } catch {
    // Abaikan error jika model belum ada
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8F7]">
      {/* Sidebar kiri */}
      <Sidebar userRole={userRole} userName={userName} userEmail={userEmail} />

      {/* Area konten kanan */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header atas */}
        <Header
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
        />

        {/* Konten halaman */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
