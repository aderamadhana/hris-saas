// src/app/(dashboard)/layout.tsx

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find employee — authId first, fallback email + auto-link
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
  if (!employee && user.email) {
    employee = await prisma.employee.findFirst({
      where: { email: user.email },
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
      await prisma.employee
        .update({ where: { id: employee.id }, data: { authId: user.id } })
        .catch(() => null);
    }
  }

  const userName = employee
    ? `${employee.firstName} ${employee.lastName}`.trim()
    : (user.email ?? "User");
  const userRole = employee?.role ?? "employee";
  const userEmail = employee?.email ?? user.email ?? "";

  let notificationCount = 0;
  try {
    if (employee && ["hr", "admin", "owner", "manager"].includes(userRole)) {
      notificationCount = await prisma.leave.count({
        where: { organizationId: employee.organizationId, status: "pending" },
      });
    }
  } catch {
    /* ignore */
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#F4F5F7" }}
    >
      <Sidebar userRole={userRole} userName={userName} userEmail={userEmail} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
        />

        {/* Gray content area — matches reference screenshot */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: "#F4F5F7" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
