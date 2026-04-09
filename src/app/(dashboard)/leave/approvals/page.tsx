// src/app/(dashboard)/leave/approvals/page.tsx
// Leave Approvals Page - For Managers and HR

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaveApprovals } from "@/src/components/leave/leave-approvals";

export default async function LeaveApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and approve pending leave requests
        </p>
      </div>

      {/* Approvals Component */}
      <LeaveApprovals />
    </div>
  );
}
