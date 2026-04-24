// src/app/(dashboard)/departments/page.tsx
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { DepartmentCard } from "@/src/components/departments/departement-card";
import { Button } from "@/src/components/ui/button";
import { Plus, Building2, Users, UserCog } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
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

  const canManage = ["owner", "admin", "hr"].includes(currentEmployee.role);

  const [departments, totalEmployees, employeesWithDept] = await Promise.all([
    prisma.department.findMany({
      where: { organizationId: currentEmployee.organizationId },
      include: {
        manager: { select: { firstName: true, lastName: true, email: true } },
        employees: { select: { id: true, status: true } },
      },
      orderBy: { name: "asc" },
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
        departmentId: { not: null },
      },
    }),
  ]);

  const employeesWithoutDept = totalEmployees - employeesWithDept;

  const departmentData = departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    description: dept.description ?? "",
    managerName: dept.manager
      ? `${dept.manager.firstName} ${dept.manager.lastName}`
      : "No Manager",
    managerEmail: dept.manager?.email ?? "",
    employeeCount: dept.employees.filter((e) => e.status === "active").length,
    totalEmployees: dept.employees.length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage organizational departments
          </p>
        </div>
        {canManage && (
          <Link href="/departments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Departments",
            value: departments.length,
            color: "blue",
            icon: <Building2 className="h-5 w-5 text-blue-600" />,
          },
          {
            label: "Total Employees",
            value: totalEmployees,
            color: "green",
            icon: <Users className="h-5 w-5 text-green-600" />,
          },
          {
            label: "With Department",
            value: employeesWithDept,
            color: "green",
            icon: <UserCog className="h-5 w-5 text-green-600" />,
          },
          {
            label: "No Department",
            value: employeesWithoutDept,
            color: "yellow",
            icon: <Users className="h-5 w-5 text-yellow-600" />,
          },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`mt-1 text-3xl font-bold text-${color}-600`}>
                  {value}
                </p>
              </div>
              <div className={`rounded-full bg-${color}-100 p-3`}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Department grid */}
      {departmentData.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-4 text-base font-medium text-gray-900">
            No departments yet
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Create your first department to get started
          </p>
          {canManage && (
            <Link href="/departments/new">
              <Button className="mt-5">
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {departmentData.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
