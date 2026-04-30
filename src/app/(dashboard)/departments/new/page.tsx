import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { DepartmentForm } from "@/src/components/departments/department-form";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewDepartmentPage() {
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
      organizationId: true,
      role: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  if (!["owner", "admin", "hr"].includes(currentEmployee.role)) {
    redirect("/departments");
  }

  const managers = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
      status: "active",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const managerOptions = managers.map((manager) => ({
    id: manager.id,
    name:
      `${manager.firstName ?? ""} ${manager.lastName ?? ""}`.trim() ||
      "Unnamed employee",
    position: manager.position ?? "",
  }));

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                Add Department
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Create a new department and assign a manager if needed.
              </p>
            </div>
          </div>

          <Link href="/departments">
            <Button
              variant="outline"
              className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to departments
            </Button>
          </Link>
        </div>
      </header>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Department information
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Fill in department name, description, and manager.
          </p>
        </div>

        <div className="p-5">
          <DepartmentForm managers={managerOptions} />
        </div>
      </section>
    </div>
  );
}
