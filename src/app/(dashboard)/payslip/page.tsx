// src/app/(dashboard)/payslip/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  DollarSign,
  FileText,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { getMonthName, formatCurrency } from "@/src/lib/payroll/calculations";

export const dynamic = "force-dynamic";

export default async function PayslipPage() {
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
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  const payslips = await prisma.payroll.findMany({
    where: {
      employeeId: currentEmployee.id,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 12,
  });

  const latestPayslip = payslips[0] ?? null;
  const currentYear = new Date().getFullYear();

  const ytdPayslips = payslips.filter(
    (payslip) => payslip.year === currentYear,
  );

  const ytdGross = ytdPayslips.reduce(
    (sum, payslip) => sum + payslip.grossSalary.toNumber(),
    0,
  );

  const ytdNet = ytdPayslips.reduce(
    (sum, payslip) => sum + payslip.netSalary.toNumber(),
    0,
  );

  const ytdTax = ytdPayslips.reduce(
    (sum, payslip) => sum + payslip.pph21.toNumber(),
    0,
  );

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              My Payslips
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View your monthly salary slips and year-to-date payroll summary.
            </p>
          </div>

          {latestPayslip && (
            <Link href={`/payslip/${latestPayslip.id}`}>
              <Button className="w-full bg-[#0B5A43] text-white hover:bg-[#084735] sm:w-auto">
                <FileText className="mr-2 h-4 w-4" />
                View latest payslip
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-4">
        <SummaryItem
          label="Latest pay"
          value={
            latestPayslip
              ? formatCurrency(latestPayslip.netSalary.toNumber())
              : "N/A"
          }
          description={
            latestPayslip
              ? `${getMonthName(latestPayslip.month)} ${latestPayslip.year}`
              : "No payslip yet"
          }
          icon={<DollarSign className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="YTD gross"
          value={formatCurrency(ytdGross)}
          description={`Year ${currentYear}`}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <SummaryItem
          label="YTD net"
          value={formatCurrency(ytdNet)}
          description="After deductions"
          icon={<DollarSign className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="YTD tax"
          value={formatCurrency(ytdTax)}
          description="PPh21"
          icon={<ReceiptText className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              Payslip history
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing your latest {payslips.length} payslip
              {payslips.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        {payslips.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-gray-100">
            {payslips.map((payslip) => (
              <div
                key={payslip.id}
                className="grid gap-4 p-4 hover:bg-gray-50 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-950">
                        {getMonthName(payslip.month)} {payslip.year}
                      </p>
                      <StatusBadge status={payslip.status} />
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                      <span>
                        Net:{" "}
                        <span className="font-medium text-gray-800">
                          {formatCurrency(payslip.netSalary.toNumber())}
                        </span>
                      </span>

                      <span>
                        Gross:{" "}
                        <span className="font-medium text-gray-800">
                          {formatCurrency(payslip.grossSalary.toNumber())}
                        </span>
                      </span>

                      <span>
                        Tax:{" "}
                        <span className="font-medium text-gray-800">
                          {formatCurrency(payslip.pph21.toNumber())}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <Link href={`/payslip/${payslip.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0] sm:w-auto"
                  >
                    View
                  </Button>
                </Link>
              </div>
            ))}
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
  const statusText = formatStatus(status);

  const className =
    status === "paid"
      ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
      : status === "approved"
        ? "border-gray-200 bg-gray-50 text-gray-700"
        : "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]";

  return (
    <span className={`border px-2.5 py-1 text-xs font-medium ${className}`}>
      {statusText}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <CalendarDays className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">No payslips yet</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
        Your payslips will appear here once payroll is generated by HR.
      </p>
    </div>
  );
}

function formatStatus(value: string) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
