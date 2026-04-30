// src/app/(dashboard)/departments/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Plus, UserCog, Users } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { DepartmentCard } from "@/src/components/departments/departement-card";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
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

  const canManage = ["owner", "admin", "hr"].includes(currentEmployee.role);

  const [departments, totalEmployees, employeesWithDept] = await Promise.all([
    prisma.department.findMany({
      where: {
        organizationId: currentEmployee.organizationId,
      },
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        employees: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.employee.count({
      where: {
        organizationId: currentEmployee.organizationId,
        status: "active",
      },
    }),

    prisma.employee.count({
      where: {
        organizationId: currentEmployee.organizationId,
        status: "active",
        departmentId: {
          not: null,
        },
      },
    }),
  ]);

  const employeesWithoutDept = Math.max(totalEmployees - employeesWithDept, 0);

  const departmentData = departments.map((department) => {
    const managerName = department.manager
      ? `${department.manager.firstName ?? ""} ${
          department.manager.lastName ?? ""
        }`.trim()
      : "";

    return {
      id: department.id,
      name: department.name,
      description: department.description ?? "",
      managerName: managerName || "No Manager",
      managerEmail: department.manager?.email ?? "",
      employeeCount: department.employees.filter(
        (employee) => employee.status === "active",
      ).length,
      totalEmployees: department.employees.length,
    };
  });

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Departments
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage departments, managers, and employee distribution.
            </p>
          </div>

          {canManage && (
            <Link href="/departments/new">
              <Button className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Departments"
          value={departments.length}
          description="Total departments"
          icon={<Building2 className="h-5 w-5" />}
        />

        <SummaryItem
          label="Employees"
          value={totalEmployees}
          description="Active employees"
          icon={<Users className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Assigned"
          value={employeesWithDept}
          description="With department"
          icon={<UserCog className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Unassigned"
          value={employeesWithoutDept}
          description="No department"
          icon={<Users className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      {departmentData.length === 0 ? (
        <section className="border border-gray-200 bg-white px-4 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
            <Building2 className="h-6 w-6" />
          </div>

          <p className="mt-4 font-semibold text-gray-800">No departments yet</p>

          <p className="mt-1 text-sm text-gray-500">
            Create your first department to organize employees.
          </p>

          {canManage && (
            <Link href="/departments/new">
              <Button className="mt-5 bg-[#0B5A43] text-white hover:bg-[#084735]">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </Link>
          )}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departmentData.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              canManage={canManage}
            />
          ))}
        </section>
      )}
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
