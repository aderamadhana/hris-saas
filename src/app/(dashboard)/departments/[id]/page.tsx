import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, Edit, Mail, UserCog, Users } from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DepartmentDetailPage({
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
      organizationId: true,
      role: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
        },
      },
      employees: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          status: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      },
    },
  });

  if (
    !department ||
    department.organizationId !== currentEmployee.organizationId
  ) {
    notFound();
  }

  const canManage = ["owner", "admin", "hr"].includes(currentEmployee.role);

  const activeEmployees = department.employees.filter(
    (employee) => employee.status === "active",
  );

  const inactiveEmployees = department.employees.filter(
    (employee) => employee.status !== "active",
  );

  const managerName = department.manager
    ? `${department.manager.firstName ?? ""} ${
        department.manager.lastName ?? ""
      }`.trim() || "Unnamed manager"
    : null;

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/departments"
              className="mb-4 inline-flex items-center text-sm font-semibold text-[#0B5A43] hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to departments
            </Link>

            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
                <Building2 className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  {department.name}
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                  {department.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          {canManage && (
            <Link href={`/departments/${department.id}/edit`}>
              <Button
                variant="outline"
                className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit department
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-3">
        <SummaryItem
          label="Employees"
          value={department.employees.length}
          description="Total assigned"
          icon={<Users className="h-5 w-5" />}
        />

        <SummaryItem
          label="Active"
          value={activeEmployees.length}
          description="Currently active"
          icon={<Users className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Inactive"
          value={inactiveEmployees.length}
          description="Not active"
          icon={<Users className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-950">
              Employees in this department
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing {department.employees.length} employee
              {department.employees.length === 1 ? "" : "s"}.
            </p>
          </div>

          {department.employees.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
                <Users className="h-6 w-6" />
              </div>

              <p className="mt-4 font-semibold text-gray-800">
                No employees assigned
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Employees assigned to this department will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {department.employees.map((employee) => {
                const employeeName =
                  `${employee.firstName ?? ""} ${
                    employee.lastName ?? ""
                  }`.trim() || "Unnamed employee";

                return (
                  <Link
                    key={employee.id}
                    href={`/employees/${employee.id}`}
                    className="grid gap-3 p-4 hover:bg-gray-50 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-sm font-semibold text-[#0B5A43]">
                        {getInitials(employee.firstName, employee.lastName)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-950">
                          {employeeName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {employee.employeeId}
                          {employee.position ? ` · ${employee.position}` : ""}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {employee.email}
                        </p>
                      </div>
                    </div>

                    <StatusPill status={employee.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">
              Department manager
            </h2>

            {department.manager ? (
              <div className="mt-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-sm font-semibold text-[#0B5A43]">
                  {getInitials(
                    department.manager.firstName,
                    department.manager.lastName,
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-950">
                    {managerName}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {department.manager.position || "No position assigned"}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    {department.manager.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <UserCog className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      No manager assigned
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Assign a manager from the edit department page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">Actions</h2>

            <div className="mt-4 grid gap-2">
              <Link href="/departments">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to departments
                </Button>
              </Link>

              {canManage && (
                <Link href={`/departments/${department.id}/edit`}>
                  <Button className="w-full bg-[#0B5A43] text-white hover:bg-[#084735]">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit department
                  </Button>
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>
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

  return (
    <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
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

function StatusPill({ status }: { status: string }) {
  const className =
    status === "active"
      ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
      : "border-gray-200 bg-gray-50 text-gray-600";

  return (
    <span
      className={`w-fit border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {formatText(status)}
    </span>
  );
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "U";
}

function formatText(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
