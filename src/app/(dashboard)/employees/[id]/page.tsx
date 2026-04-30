import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  Edit,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { SetManagerForm } from "@/src/components/employees/set-manager-form";

export const dynamic = "force-dynamic";

type EmployeeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
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
}: EmployeeDetailPageProps) {
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
      id: true,
      organizationId: true,
      role: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
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
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
  });

  if (!employee || employee.organizationId !== currentEmployee.organizationId) {
    notFound();
  }

  const canManage = ["owner", "admin", "hr"].includes(currentEmployee.role);
  const isOwnProfile = currentEmployee.id === employee.id;

  const potentialManagers = canManage
    ? await prisma.employee.findMany({
        where: {
          organizationId: currentEmployee.organizationId,
          status: "active",
          id: {
            not: id,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          role: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
    : [];

  const managerOptions = potentialManagers.map((manager) => ({
    id: manager.id,
    name:
      `${manager.firstName ?? ""} ${manager.lastName ?? ""}`.trim() ||
      "Unnamed employee",
    position: manager.position,
    role: manager.role,
  }));

  const fullName =
    `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() ||
    "Unnamed employee";

  const managerName = employee.manager
    ? `${employee.manager.firstName ?? ""} ${
        employee.manager.lastName ?? ""
      }`.trim() || "Unnamed manager"
    : null;

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/employees"
              className="mb-4 inline-flex items-center text-sm font-semibold text-[#0B5A43] hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to employees
            </Link>

            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-lg font-semibold text-[#0B5A43]">
                {getInitials(employee.firstName, employee.lastName)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                    {fullName}
                  </h1>

                  <StatusPill status={employee.status} />
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {employee.position || "No position assigned"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <RolePill role={employee.role} />
                  <span className="border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {employee.employeeId}
                  </span>
                  <span className="border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {employee.department?.name || "No department"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {canManage && (
            <Link href={`/employees/${employee.id}/edit`}>
              <Button
                variant="outline"
                className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit employee
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <InfoSection
            title="Contact information"
            description="Basic contact information for this employee."
          >
            <div className="grid gap-0 border border-gray-200 sm:grid-cols-2">
              <DetailItem
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={employee.email}
              />
              <DetailItem
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={employee.phoneNumber || "Not provided"}
              />
              <DetailItem
                icon={<MapPin className="h-4 w-4" />}
                label="Address"
                value={employee.address || "Not provided"}
              />
              <DetailItem
                icon={<CalendarDays className="h-4 w-4" />}
                label="Date of birth"
                value={formatDate(employee.dateOfBirth)}
              />
            </div>
          </InfoSection>

          <InfoSection
            title="Employment details"
            description="Work-related details connected to this employee record."
          >
            <div className="grid gap-0 border border-gray-200 sm:grid-cols-2">
              <DetailItem
                icon={<Briefcase className="h-4 w-4" />}
                label="Employee ID"
                value={employee.employeeId}
              />
              <DetailItem
                icon={<Briefcase className="h-4 w-4" />}
                label="Position"
                value={employee.position || "Not assigned"}
              />
              <DetailItem
                icon={<Building2 className="h-4 w-4" />}
                label="Department"
                value={employee.department?.name || "No department"}
              />
              <DetailItem
                icon={<UserRound className="h-4 w-4" />}
                label="Manager"
                value={managerName || "No manager assigned"}
              />
              <DetailItem
                icon={<CalendarDays className="h-4 w-4" />}
                label="Join date"
                value={formatDate(employee.joinDate)}
              />
              <DetailItem
                icon={<Briefcase className="h-4 w-4" />}
                label="Employment type"
                value={formatText(employee.employmentType)}
              />
              <DetailItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Role"
                value={formatRole(employee.role)}
              />
              <DetailItem
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Account access"
                value={employee.authId ? "Active" : "Pending invitation"}
              />

              {canManage && (
                <>
                  <DetailItem
                    icon={<Wallet className="h-4 w-4" />}
                    label="Base salary"
                    value={formatSalary(toNumber(employee.baseSalary))}
                  />
                  <DetailItem
                    icon={<Wallet className="h-4 w-4" />}
                    label="Currency"
                    value={employee.currency || "IDR"}
                  />
                </>
              )}
            </div>
          </InfoSection>

          {canManage && (
            <InfoSection
              title="Direct manager"
              description="Assign or update this employee's reporting manager."
            >
              <div className="border border-gray-200 bg-gray-50 p-4">
                {employee.manager ? (
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-sm font-semibold text-[#0B5A43]">
                      {getInitials(
                        employee.manager.firstName,
                        employee.manager.lastName,
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-950">
                        {managerName}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {employee.manager.position || "No position assigned"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-gray-500">
                    No manager assigned.
                  </p>
                )}

                <SetManagerForm
                  employeeId={employee.id}
                  currentManagerId={employee.managerId ?? null}
                  managers={managerOptions}
                />
              </div>
            </InfoSection>
          )}
        </div>

        <aside className="space-y-5">
          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">
              Employee summary
            </h2>

            <div className="mt-4 space-y-3">
              <SummaryRow label="Status" value={formatText(employee.status)} />
              <SummaryRow label="Role" value={formatRole(employee.role)} />
              <SummaryRow
                label="Department"
                value={employee.department?.name || "No department"}
              />
              <SummaryRow
                label="Joined"
                value={formatDate(employee.joinDate)}
              />
              <SummaryRow
                label="Account"
                value={employee.authId ? "Active" : "Pending invitation"}
              />
            </div>
          </section>

          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">Access</h2>

            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              {isOwnProfile
                ? "This is your own employee record."
                : canManage
                  ? "You have permission to manage this employee record."
                  : "You can view this employee record based on your organization access."}
            </p>

            {canManage && (
              <Link href={`/employees/${employee.id}/edit`}>
                <Button className="mt-4 w-full bg-[#0B5A43] text-white hover:bg-[#084735]">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit employee
                </Button>
              </Link>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {description}
        </p>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="border-b border-gray-200 p-4 sm:border-r even:sm:border-r-0 [&:nth-last-child(-n+2)]:sm:border-b-0 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[#0B5A43]">{icon}</span>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-medium text-gray-950">
            {value ?? "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-right text-sm font-medium text-gray-950">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === "active";
  const isTerminated = status === "terminated";

  const className = isActive
    ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
    : isTerminated
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-gray-200 bg-gray-50 text-gray-600";

  return (
    <span className={`border px-2.5 py-1 text-xs font-medium ${className}`}>
      {formatText(status)}
    </span>
  );
}

function RolePill({ role }: { role: string }) {
  const className =
    role === "owner" || role === "admin" || role === "hr"
      ? "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]"
      : "border-gray-200 bg-gray-50 text-gray-600";

  return (
    <span className={`border px-2.5 py-1 text-xs font-medium ${className}`}>
      {formatRole(role)}
    </span>
  );
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "U";
}

function formatRole(role: string) {
  return ROLE_LABEL[role] || formatText(role);
}

function formatText(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSalary(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
