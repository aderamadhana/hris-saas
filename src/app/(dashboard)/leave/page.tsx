// src/app/(dashboard)/leave/page.tsx
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { LeavePageClient } from "@/src/components/leave/leave-page-client";

export default async function LeavePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { role: true },
  });

  const canApprove = ["manager", "hr", "admin", "owner"].includes(
    employee?.role ?? "",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your leave and time-off requests
          </p>
        </div>
        <Link href="/leave/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </Link>
      </div>

      <LeavePageClient canApprove={canApprove} />
    </div>
  );
}
