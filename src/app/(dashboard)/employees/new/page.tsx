// src/app/(dashboard)/employees/new/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { EmployeeForm } from "@/src/components/employees/employee-form";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
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
      organizationId: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  const canCreateEmployee = ["hr", "admin", "owner"].includes(
    currentEmployee.role,
  );

  if (!canCreateEmployee) {
    redirect("/employees");
  }

  const departments = await prisma.department.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
              <UserPlus className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                Add Employee
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Create a new employee record and assign basic employment
                information.
              </p>
            </div>
          </div>

          <Link href="/employees">
            <Button
              variant="outline"
              className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to employees
            </Button>
          </Link>
        </div>
      </header>

      {departments.length === 0 && (
        <section className="border border-[#F7A81B]/40 bg-[#FFF4D9] p-4">
          <p className="text-sm font-semibold text-[#0B5A43]">
            No departments found
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#7A5A00]">
            You can still create an employee, but department selection may be
            unavailable until departments are added.
          </p>
        </section>
      )}

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Employee information
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Fill in employee identity, role, department, manager, salary, and
            access details.
          </p>
        </div>

        <div className="p-5">
          <EmployeeForm
            departments={departments}
            mode="create"
            currentUserRole={currentEmployee.role}
          />
        </div>
      </section>
    </div>
  );
}
