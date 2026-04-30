// src/app/(dashboard)/employees/[id]/edit/page.tsx

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, UserPen } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { EmployeeForm } from "@/src/components/employees/employee-form";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const canEditEmployee = ["hr", "admin", "owner"].includes(
    currentEmployee.role,
  );

  if (!canEditEmployee) {
    redirect("/employees");
  }

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!employee || employee.organizationId !== currentEmployee.organizationId) {
    notFound();
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

  const employeeData = {
    id: employee.id,
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    email: employee.email,
    phoneNumber: employee.phoneNumber ?? "",
    employeeId: employee.employeeId,
    position: employee.position ?? "",
    departmentId: employee.departmentId ?? "",
    role: employee.role,
    employmentType: employee.employmentType,
    baseSalary: employee.baseSalary.toNumber(),
    joinDate: formatDateInputValue(employee.joinDate),
  };

  const fullName =
    `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
    "Unnamed employee";

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
              <UserPen className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                Edit Employee
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Update employee identity, role, department, salary, and access
                details.
              </p>
            </div>
          </div>

          <Link href={`/employees/${employee.id}`}>
            <Button
              variant="outline"
              className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to detail
            </Button>
          </Link>
        </div>
      </header>

      <section className="border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-950">{fullName}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {employee.employeeId}
          {employee.position ? ` · ${employee.position}` : ""}
          {employee.department?.name ? ` · ${employee.department.name}` : ""}
        </p>
      </section>

      {departments.length === 0 && (
        <section className="border border-[#F7A81B]/40 bg-[#FFF4D9] p-4">
          <p className="text-sm font-semibold text-[#0B5A43]">
            No departments found
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#7A5A00]">
            Department selection may be unavailable until departments are added.
          </p>
        </section>
      )}

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Employee information
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Review the employee data carefully before saving changes.
          </p>
        </div>

        <div className="p-5">
          <EmployeeForm
            departments={departments}
            mode="edit"
            employee={employeeData}
            currentUserRole={currentEmployee.role}
          />
        </div>
      </section>
    </div>
  );
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
