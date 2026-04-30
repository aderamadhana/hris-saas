// src/app/(dashboard)/leave/new/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { LeaveRequestForm } from "@/src/components/leave/leave-request-form";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewLeavePage() {
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
      status: true,
    },
  });

  if (!employee) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                Request Leave
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Submit a leave or time-off request for approval.
              </p>
            </div>
          </div>

          <Link href="/leave">
            <Button
              variant="outline"
              className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to leave
            </Button>
          </Link>
        </div>
      </header>

      {employee.status !== "active" && (
        <section className="border border-[#F7A81B]/40 bg-[#FFF4D9] p-4">
          <p className="text-sm font-semibold text-[#0B5A43]">
            Account status notice
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#7A5A00]">
            Your employee status is not active. Leave submission may require HR
            review or may be restricted depending on company policy.
          </p>
        </section>
      )}

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Leave details
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Fill in the required information. Make sure the dates, leave type,
            and reason are correct before submitting.
          </p>
        </div>

        <div className="p-5">
          <LeaveRequestForm />
        </div>
      </section>
    </div>
  );
}
