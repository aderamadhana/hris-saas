// src/app/(dashboard)/employees/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, UserCheck, Users, UserX, ShieldCheck } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { EmployeeTable } from "@/src/components/employees/employee-table";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
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

  const canAdd = ["hr", "admin", "owner"].includes(currentEmployee.role);

  const employees = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
    },
    include: {
      department: {
        select: {
          name: true,
        },
      },
      manager: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const employeeData = employees.map((emp) => ({
    id: emp.id,
    employeeId: emp.employeeId,
    name:
      `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() ||
      "Unnamed employee",
    email: emp.email,
    position: emp.position || "-",
    department: emp.department?.name ?? "-",
    role: emp.role,
    status: emp.status,
    joinDate: formatDateInputValue(emp.joinDate),
    hasAuth: Boolean(emp.authId),
    manager: emp.manager
      ? `${emp.manager.firstName ?? ""} ${emp.manager.lastName ?? ""}`.trim() ||
        null
      : null,
  }));

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (emp) => emp.status === "active",
  ).length;
  const inactiveEmployees = employees.filter(
    (emp) => emp.status !== "active",
  ).length;
  const employeesWithAccess = employees.filter((emp) =>
    Boolean(emp.authId),
  ).length;

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Employees
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage employee records, roles, departments, managers, and account
              access.
            </p>
          </div>

          {canAdd && (
            <Link href="/employees/new">
              <Button className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Total"
          value={totalEmployees}
          description="Employee records"
          icon={<Users className="h-5 w-5" />}
        />

        <SummaryItem
          label="Active"
          value={activeEmployees}
          description="Currently employed"
          icon={<UserCheck className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Inactive"
          value={inactiveEmployees}
          description="Not active"
          icon={<UserX className="h-5 w-5" />}
          tone="orange"
        />

        <SummaryItem
          label="Account access"
          value={employeesWithAccess}
          description="Can sign in"
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="green"
        />
      </section>

      <EmployeeTable
        data={employeeData}
        currentUserRole={currentEmployee.role}
      />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  tone?: "default" | "green" | "orange";
}) {
  const iconClass = {
    default: "border-gray-200 bg-gray-50 text-gray-600",
    green: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
    orange: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
  }[tone];

  const valueClass = {
    default: "text-gray-950",
    green: "text-[#0B5A43]",
    orange: "text-[#7A5A00]",
  }[tone];

  return (
    <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tracking-tight ${valueClass}`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
