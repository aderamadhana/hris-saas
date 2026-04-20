// src/app/(dashboard)/employees/page.tsx
import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { EmployeeTable } from "@/src/components/employees/employee-table";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { organizationId: true, role: true },
  });
  if (!currentEmployee) redirect("/login");

  const canAdd = ["hr", "admin", "owner"].includes(currentEmployee.role);

  const employees = await prisma.employee.findMany({
    where: { organizationId: currentEmployee.organizationId },
    include: {
      department: { select: { name: true } },
      manager: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const employeeData = employees.map((emp) => ({
    id: emp.id,
    employeeId: emp.employeeId,
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    position: emp.position,
    department: emp.department?.name ?? "-",
    role: emp.role,
    status: emp.status,
    joinDate: emp.joinDate.toISOString().split("T")[0],
    hasAuth: !!emp.authId,
    manager: emp.manager
      ? `${emp.manager.firstName} ${emp.manager.lastName}`
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's employees
          </p>
        </div>
        {canAdd && (
          <Link href="/employees/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        )}
      </div>

      <EmployeeTable
        data={employeeData}
        currentUserRole={currentEmployee.role}
      />
    </div>
  );
}
