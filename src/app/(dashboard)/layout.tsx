import { redirect } from "next/navigation";

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

  const userName = `${employee.firstName} ${employee.lastName}`.trim();
  const userEmail = employee.email;
  const userRole = employee.role;

  let notificationCount = 0;

  try {
    const notificationModel = (prisma as any).notification;

    if (notificationModel?.count) {
      notificationCount = await notificationModel.count({
        where: {
          organizationId: employee.organizationId,
          isRead: false,
        },
      });
    }
  } catch {
    notificationCount = 0;
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#F4F5F7]">
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
