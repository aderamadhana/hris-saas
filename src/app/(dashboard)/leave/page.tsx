import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { LeavePageClient } from "@/src/components/leave/leave-page-client";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
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
      id: true,
      role: true,
    },
  });

  if (!employee) {
    redirect("/dashboard");
  }

  const canApprove = ["manager", "hr", "admin", "owner"].includes(
    employee.role,
  );

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="flex flex-col gap-4 border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
            Leave Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Request leave and track approval status.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canApprove && (
            <Link href="/leave/approvals">
              <Button
                variant="outline"
                className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
              >
                Approvals
              </Button>
            </Link>
          )}

          <Link href="/leave/new">
            <Button className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Request Leave
            </Button>
          </Link>
        </div>
      </header>

      <LeavePageClient canApprove={canApprove} />
    </div>
  );
}
