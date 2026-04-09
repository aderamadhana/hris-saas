// src/app/(dashboard)/leave/page.tsx
// Leave List Page - Fixed with proper data display

import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { LeaveList } from "@/src/components/leave/leave-list";

export default async function LeavePage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your leave requests and approvals
          </p>
        </div>

        <Link href="/leave/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </Link>
      </div>

      {/* Leave List */}
      <LeaveList />
    </div>
  );
}
