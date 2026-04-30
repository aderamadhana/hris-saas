import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DollarSign,
  FileText,
  Plus,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { PayrollFilters } from "@/src/components/payroll/payroll-filters";
import { getMonthName, formatCurrency } from "@/src/lib/payroll/calculations";

export const dynamic = "force-dynamic";

type PayrollPageProps = {
  searchParams?: Promise<{
    month?: string;
    year?: string;
    status?: string;
  }>;
};

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const params = await searchParams;

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
      role: true,
      organizationId: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  if (!["hr", "admin", "owner"].includes(currentEmployee.role)) {
    redirect("/dashboard");
  }

  const selectedMonth = parseMonth(params?.month);
  const selectedYear = parseYear(params?.year);
  const selectedStatus = params?.status;

  const where: {
    organizationId: string;
    month?: number;
    year?: number;
    status?: string;
  } = {
    organizationId: currentEmployee.organizationId,
  };

  if (selectedMonth) where.month = selectedMonth;
  if (selectedYear) where.year = selectedYear;
  if (selectedStatus && selectedStatus !== "all") where.status = selectedStatus;

  const payrolls = await prisma.payroll.findMany({
    where,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          position: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  const totalGross = payrolls.reduce(
    (sum, payroll) => sum + payroll.grossSalary.toNumber(),
    0,
  );

  const totalNet = payrolls.reduce(
    (sum, payroll) => sum + payroll.netSalary.toNumber(),
    0,
  );

  const totalDeductions = payrolls.reduce(
    (sum, payroll) => sum + payroll.totalDeductions.toNumber(),
    0,
  );

  const statusCounts = {
    draft: payrolls.filter((payroll) => payroll.status === "draft").length,
    approved: payrolls.filter((payroll) => payroll.status === "approved")
      .length,
    paid: payrolls.filter((payroll) => payroll.status === "paid").length,
  };

  const today = new Date();
  const currentMonth = selectedMonth ?? today.getMonth() + 1;
  const currentYear = selectedYear ?? today.getFullYear();

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Payroll Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate, review, approve, and track employee payroll records.
            </p>
          </div>

          <Link href="/payroll/generate">
            <Button className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Generate Payroll
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Records"
          value={String(payrolls.length)}
          description="Payroll entries"
          icon={<Users className="h-5 w-5" />}
        />

        <SummaryItem
          label="Gross"
          value={formatCurrency(totalGross)}
          description="Before deductions"
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <SummaryItem
          label="Deductions"
          value={formatCurrency(totalDeductions)}
          description="Tax and deductions"
          icon={<ReceiptText className="h-5 w-5" />}
          tone="orange"
        />

        <SummaryItem
          label="Net"
          value={formatCurrency(totalNet)}
          description="Take-home pay"
          icon={<DollarSign className="h-5 w-5" />}
          tone="green"
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">Filters</h2>
          <p className="mt-1 text-sm text-gray-500">
            Filter payroll records by month, year, and status.
          </p>
        </div>

        <div className="p-5">
          <PayrollFilters
            currentMonth={currentMonth}
            currentYear={currentYear}
            statusCounts={statusCounts}
          />
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              Payroll Records
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing {payrolls.length} payroll record
              {payrolls.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {payrolls.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-gray-100">
            {payrolls.map((payroll) => {
              const employeeName =
                `${payroll.employee.firstName ?? ""} ${
                  payroll.employee.lastName ?? ""
                }`.trim() || "Unnamed employee";

              return (
                <div
                  key={payroll.id}
                  className="grid gap-4 p-4 hover:bg-gray-50 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-950">
                          {employeeName}
                        </p>
                        <StatusBadge status={payroll.status} />
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {payroll.employee.employeeId}
                        {payroll.employee.position
                          ? ` · ${payroll.employee.position}`
                          : ""}
                        {payroll.employee.department?.name
                          ? ` · ${payroll.employee.department.name}`
                          : ""}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                        <span>
                          Period:{" "}
                          <span className="font-medium text-gray-800">
                            {getMonthName(payroll.month)} {payroll.year}
                          </span>
                        </span>

                        <span>
                          Gross:{" "}
                          <span className="font-medium text-gray-800">
                            {formatCurrency(payroll.grossSalary.toNumber())}
                          </span>
                        </span>

                        <span>
                          Net:{" "}
                          <span className="font-medium text-[#0B5A43]">
                            {formatCurrency(payroll.netSalary.toNumber())}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/payroll/${payroll.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
                    >
                      View detail
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
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
  value: string;
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
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-2 break-words text-lg font-semibold text-gray-950">
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

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "paid"
      ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
      : status === "approved"
        ? "border-gray-200 bg-gray-50 text-gray-700"
        : "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]";

  return (
    <span className={`border px-2.5 py-1 text-xs font-medium ${className}`}>
      {formatText(status)}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <FileText className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">
        No payroll records found
      </p>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Generate payroll first or adjust the current filters.
      </p>

      <Link href="/payroll/generate">
        <Button className="mt-5 bg-[#0B5A43] text-white hover:bg-[#084735]">
          <Plus className="mr-2 h-4 w-4" />
          Generate Payroll
        </Button>
      </Link>
    </div>
  );
}

function parseMonth(value?: string) {
  if (!value) return undefined;

  const month = Number(value);
  return month >= 1 && month <= 12 ? month : undefined;
}

function parseYear(value?: string) {
  if (!value) return undefined;

  const year = Number(value);
  return Number.isFinite(year) ? year : undefined;
}

function formatText(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
