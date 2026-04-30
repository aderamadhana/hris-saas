// src/app/(dashboard)/profile/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import {
  Briefcase,
  Building2,
  Calendar,
  Edit,
  KeyRound,
  Mail,
  Phone,
  Shield,
  User,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!employee) {
    redirect("/dashboard");
  }

  const fullName = `${employee.firstName || ""} ${
    employee.lastName || ""
  }`.trim();

  const initials = getInitials(employee.firstName, employee.lastName);

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-gray-200">
              <AvatarFallback className="bg-[#EAF5F0] text-lg font-semibold text-[#0B5A43]">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  {fullName || "Unnamed employee"}
                </h1>
                <StatusPill status={employee.status} />
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {employee.position || "No position assigned"}
              </p>

              <p className="mt-1 text-sm text-gray-500">{employee.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/profile/change-password">
              <Button
                variant="outline"
                className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Change password
              </Button>
            </Link>

            <Link href="/profile/edit">
              <Button className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Edit profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <ProfileSection
            title="Personal information"
            description="Basic contact information used for HR records and notifications."
          >
            <div className="grid gap-0 border border-gray-200 sm:grid-cols-2">
              <DetailItem
                icon={<User className="h-4 w-4" />}
                label="First name"
                value={employee.firstName}
              />
              <DetailItem
                icon={<User className="h-4 w-4" />}
                label="Last name"
                value={employee.lastName}
              />
              <DetailItem
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={employee.email}
              />
              <DetailItem
                icon={<Phone className="h-4 w-4" />}
                label="Phone number"
                value={employee.phoneNumber || "Not provided"}
              />
            </div>
          </ProfileSection>

          <ProfileSection
            title="Employment"
            description="Company information connected to your employee profile."
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
                icon={<Building2 className="h-4 w-4" />}
                label="Organization"
                value={employee.organization.name}
              />
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="Join date"
                value={formatDate(employee.joinDate)}
              />
              <DetailItem
                icon={<Shield className="h-4 w-4" />}
                label="Role"
                value={formatRole(employee.role)}
              />
              <DetailItem
                icon={<Briefcase className="h-4 w-4" />}
                label="Employment type"
                value={formatText(employee.employmentType)}
              />
              <DetailItem
                icon={<Wallet className="h-4 w-4" />}
                label="Base salary"
                value={formatSalary(employee.baseSalary.toNumber())}
              />
            </div>
          </ProfileSection>
        </div>

        <aside className="space-y-5">
          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">
              Account summary
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
            </div>
          </section>

          <section className="border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-gray-950">Security</h2>

            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Keep your password private and update it regularly.
            </p>

            <Link href="/profile/change-password">
              <Button
                variant="outline"
                className="mt-4 w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0]"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Change password
              </Button>
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProfileSection({
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
            {value || "-"}
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

  return (
    <span
      className={
        isActive
          ? "border border-[#0B5A43]/20 bg-[#EAF5F0] px-2.5 py-1 text-xs font-medium text-[#0B5A43]"
          : "border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
      }
    >
      {formatText(status)}
    </span>
  );
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "U";
}

function formatSalary(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function formatText(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRole(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "employee") return "Employee";

  return formatText(role);
}
