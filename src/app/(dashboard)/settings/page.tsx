import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { GeneralSettings } from "@/src/components/settings/general-settings";
import { LeaveSettings } from "@/src/components/settings/leave-settings";
import { WorkHoursSettings } from "@/src/components/settings/work-hours-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
      organizationId: true,
    },
  });

  if (!currentEmployee) {
    return null;
  }

  if (!["owner", "admin"].includes(currentEmployee.role)) {
    redirect("/dashboard");
  }

  let settings = await prisma.organizationSettings.findUnique({
    where: { organizationId: currentEmployee.organizationId },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!settings) {
    settings = await prisma.organizationSettings.create({
      data: {
        organizationId: currentEmployee.organizationId,
        workStartTime: "09:00",
        workEndTime: "17:00",
        annualLeaveQuota: 12,
        sickLeaveQuota: 12,
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Organization Settings
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">
              {settings.organization.name}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Manage company profile, working hours, leave quota, payroll rules,
              and advanced leave policies from one place.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
            <QuickLink
              href="/settings/payroll"
              title="Payroll configuration"
              description="Set BPJS, tax, deductions, overtime, and payroll period."
            />

            <QuickLink
              href="/settings/leave-policy"
              title="Advanced leave policy"
              description="Control leave types, approval rules, documents, and carry-forward."
            />
          </div>
        </div>
      </header>

      <div className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Access level"
          value={formatRole(currentEmployee.role)}
        />
        <SummaryItem label="Work starts" value={settings.workStartTime} />
        <SummaryItem label="Work ends" value={settings.workEndTime} />
        <SummaryItem
          label="Annual leave"
          value={`${settings.annualLeaveQuota} days`}
        />
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-0 border border-gray-200 bg-white p-0 sm:grid-cols-3">
          <TabsTrigger
            value="general"
            className="rounded-none border-b py-3 sm:border-b-0 sm:border-r"
          >
            General
          </TabsTrigger>

          <TabsTrigger
            value="work-hours"
            className="rounded-none border-b py-3 sm:border-b-0 sm:border-r"
          >
            Work Hours
          </TabsTrigger>

          <TabsTrigger value="leave" className="rounded-none py-3">
            Leave Quota
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <SettingsPanel
            title="General information"
            description="Update the organization name and basic company information."
          >
            <GeneralSettings
              organizationId={currentEmployee.organizationId}
              organizationName={settings.organization.name}
            />
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="work-hours" className="mt-0">
          <SettingsPanel
            title="Work hours"
            description="Set the default daily working schedule used by attendance and payroll calculations."
          >
            <WorkHoursSettings settings={settings} />
          </SettingsPanel>
        </TabsContent>

        <TabsContent value="leave" className="mt-0">
          <SettingsPanel
            title="Basic leave quota"
            description="Set default annual and sick leave quota. For detailed rules, use Advanced Leave Policy."
            action={
              <Link
                href="/settings/leave-policy"
                className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Open advanced policy
              </Link>
            }
          >
            <LeaveSettings settings={settings} />
          </SettingsPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[88px] items-center justify-between gap-4 border border-gray-300 bg-white p-4 text-left transition hover:border-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-950 group-hover:text-blue-700">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          {description}
        </p>
      </div>

      <span className="shrink-0 border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
        Open →
      </span>
    </Link>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r last:border-r-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-gray-950">{value}</p>
    </div>
  );
}

function SettingsPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>

        {action}
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

function formatRole(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return role;
}
