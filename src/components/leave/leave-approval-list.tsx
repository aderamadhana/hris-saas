"use client";

// components/leave/leave-approval-list.tsx
// Wrapper tipis untuk LeaveApprovals yang sudah ada.
// Di-import oleh leave-page-client.tsx sebagai tab "Pending Approvals".

import { LeaveApprovals } from "@/components/leave/leave-approvals";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function LeaveApprovalList() {
  // Ambil userRole dari API /api/auth/me agar komponen ini bisa
  // berdiri sendiri tanpa prop dari server component.
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.employee?.role) setUserRole(data.employee.role);
      })
      .catch(() => setUserRole("employee"));
  }, []);

  if (!userRole) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-[#0B5A43]" />
      </div>
    );
  }

  return <LeaveApprovals userRole={userRole} />;
}
