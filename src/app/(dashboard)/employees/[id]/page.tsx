// src/app/(dashboard)/employees/[id]/page.tsx

import { createClient } from "@/src/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import prisma from "@/src/lib/prisma";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { SetManagerForm } from "@/src/components/employees/set-manager-form";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-700",
  terminated: "bg-red-100 text-red-800",
};
const ROLE_STYLE: Record<string, string> = {
  owner: "bg-red-100 text-red-800",
  admin: "bg-orange-100 text-orange-800",
  hr: "bg-purple-100 text-purple-800",
  manager: "bg-blue-100 text-blue-800",
  employee: "bg-gray-100 text-gray-700",
};
const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
};

export default async function EmployeeDetailPage({
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
    select: { organizationId: true, role: true, id: true },
  });
  if (!currentEmployee) redirect("/login");

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      manager: {
        select: { id: true, firstName: true, lastName: true, position: true },
      },
    },
  });

  if (!employee || employee.organizationId !== currentEmployee.organizationId) {
    notFound();
  }

  const canManage = ["owner", "admin", "hr"].includes(currentEmployee.role);

  // For set manager dropdown — all active employees except self
  const potentialManagers = canManage
    ? await prisma.employee.findMany({
        where: {
          organizationId: currentEmployee.organizationId,
          status: "active",
          id: { not: id }, // exclude self
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          role: true,
        },
        orderBy: { firstName: "asc" },
      })
    : [];

  // Serialize — no Decimal/Date passed to client
  const managerOptions = potentialManagers.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    position: m.position,
    role: m.role,
  }));

  const formatDate = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "-";

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
            {employee.firstName.charAt(0)}
            {employee.lastName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{employee.position}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[employee.role] ?? "bg-gray-100 text-gray-700"}`}
              >
                {ROLE_LABEL[employee.role] ?? employee.role}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[employee.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {employee.status.charAt(0).toUpperCase() +
                  employee.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <Link href={`/employees/${id}/edit`}>
            <Button variant="outline" size="sm">
              Edit Employee
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Contact
            </h2>
            <div className="space-y-3">
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={employee.email}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={employee.phoneNumber ?? "-"}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={employee.address ?? "-"}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Date of Birth"
                value={formatDate(employee.dateOfBirth)}
              />
            </div>
          </div>

          {/* Employment */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Employment
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Employee ID" value={employee.employeeId} />
              <Detail
                label="Department"
                value={employee.department?.name ?? "None"}
              />
              <Detail label="Employment Type" value={employee.employmentType} />
              <Detail label="Join Date" value={formatDate(employee.joinDate)} />
              <Detail label="Currency" value={employee.currency} />
              <Detail
                label="Account Status"
                value={employee.authId ? "Active" : "Pending invitation"}
              />
            </div>
          </div>

          {/* Manager section */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Direct Manager
            </h2>
            {employee.manager ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 flex-shrink-0">
                  {employee.manager.firstName.charAt(0)}
                  {employee.manager.lastName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {employee.manager.position}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">No manager assigned</p>
            )}

            {/* Set manager form — only for HR/Admin/Owner */}
            {canManage && (
              <SetManagerForm
                employeeId={id}
                currentManagerId={employee.managerId ?? null}
                managers={managerOptions}
              />
            )}
          </div>
        </div>

        {/* Right — sidebar info */}
        <div className="space-y-5">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Organization
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>{employee.department?.name ?? "No department"}</span>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Access
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-gray-400" />
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLE[employee.role] ?? "bg-gray-100 text-gray-700"}`}
              >
                {ROLE_LABEL[employee.role] ?? employee.role}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {employee.authId
                ? "Account is active and can log in"
                : "No login account yet — send an invitation"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5 capitalize">
        {value}
      </p>
    </div>
  );
}
