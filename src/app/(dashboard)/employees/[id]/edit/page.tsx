// src/app/(dashboard)/employees/[id]/edit/page.tsx
import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmployeeForm } from "@/src/components/employees/employee-form";

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
  if (!user) redirect("/login");

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { role: true, organizationId: true },
  });
  if (!currentEmployee) redirect("/login");

  if (!["hr", "admin", "owner"].includes(currentEmployee.role)) {
    redirect("/employees");
  }

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { department: { select: { id: true, name: true } } },
  });

  if (!employee || employee.organizationId !== currentEmployee.organizationId) {
    notFound();
  }

  const departments = await prisma.department.findMany({
    where: { organizationId: currentEmployee.organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const employeeData = {
    ...employee,
    baseSalary: employee.baseSalary.toString(),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
        <p className="mt-1 text-sm text-gray-500">
          {employee.firstName} {employee.lastName} · {employee.employeeId}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <EmployeeForm
          departments={departments}
          mode="edit"
          employee={employeeData}
          currentUserRole={currentEmployee.role}
        />
      </div>
    </div>
  );
}
