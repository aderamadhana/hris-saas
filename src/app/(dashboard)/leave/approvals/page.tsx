// app/(dashboard)/leave/approvals/page.tsx

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { LeaveApprovals } from "@/components/leave/leave-approvals";

export const dynamic = "force-dynamic";

export default async function LeaveApprovalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  const canApprove = ["manager", "hr", "admin", "owner"].includes(
    currentEmployee.role,
  );

  if (!canApprove) {
    redirect("/leave");
  }

  return (
    <div className="mx-auto w-full pb-8">
      <LeaveApprovals userRole={currentEmployee.role} />
    </div>
  );
}
