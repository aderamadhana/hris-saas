import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  ReceiptText,
  User,
  XCircle,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

type PayslipDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    icon: Clock,
    className: "border-gray-200 bg-gray-50 text-gray-700",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle,
    className: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default async function PayslipDetailPage({
  params,
}: PayslipDetailPageProps) {
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

  const payroll = await prisma.payroll.findFirst({
    where: {
      id,
      organizationId: currentEmployee.organizationId,
      ...(["employee", "manager"].includes(currentEmployee.role)
        ? { employeeId: currentEmployee.id }
        : {}),
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          position: true,
          email: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!payroll) {
    notFound();
  }

  const employeeName = `${payroll.employee.firstName ?? ""} ${
    payroll.employee.lastName ?? ""
  }`.trim();

  const statusConfig =
    STATUS_CONFIG[payroll.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.draft;

  const StatusIcon = statusConfig.icon;

  const earnings = [
    {
      label: "Base salary",
      amount: toNumber(payroll.baseSalary),
      always: true,
    },
    { label: "Allowances", amount: toNumber(payroll.allowances) },
    { label: "Overtime pay", amount: toNumber(payroll.overtime) },
    { label: "Bonus", amount: toNumber(payroll.bonus) },
  ].filter((item) => item.always || item.amount > 0);

  const deductions = [
    {
      label: "BPJS Kesehatan",
      amount: toNumber(payroll.bpjsKesehatan),
    },
    {
      label: "BPJS Ketenagakerjaan",
      amount: toNumber(payroll.bpjsKetenagakerjaan),
    },
    {
      label: "PPh 21",
      amount: toNumber(payroll.pph21),
    },
    {
      label: "Other deductions",
      amount: toNumber(payroll.otherDeductions),
    },
  ].filter((item) => item.amount > 0);

  const monthLabel = formatMonthYear(payroll.month, payroll.year);

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/payslip"
              className="mb-4 inline-flex items-center text-sm font-semibold text-[#0B5A43] hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to payslips
            </Link>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  Payslip Detail
                </h1>
                <p className="mt-1 text-sm text-gray-500">{monthLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </span>

            {payroll.paidDate && (
              <p className="text-xs text-gray-500">
                Paid on {formatDate(payroll.paidDate)}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-3">
        <SummaryItem
          label="Net salary"
          value={formatCurrency(payroll.netSalary)}
          description="Take-home pay"
          icon={<DollarSign className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Gross salary"
          value={formatCurrency(payroll.grossSalary)}
          description="Before deductions"
          icon={<ReceiptText className="h-5 w-5" />}
        />

        <SummaryItem
          label="Total deductions"
          value={formatCurrency(payroll.totalDeductions)}
          description="Tax and deductions"
          icon={<ReceiptText className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Employee information
          </h2>
        </div>

        <div className="grid gap-0 border-gray-200 sm:grid-cols-2">
          <DetailItem
            icon={<User className="h-4 w-4" />}
            label="Employee"
            value={employeeName || "Unnamed employee"}
          />
          <DetailItem
            icon={<FileText className="h-4 w-4" />}
            label="Employee ID"
            value={payroll.employee.employeeId}
          />
          <DetailItem
            icon={<User className="h-4 w-4" />}
            label="Position"
            value={payroll.employee.position || "Not assigned"}
          />
          <DetailItem
            icon={<User className="h-4 w-4" />}
            label="Department"
            value={payroll.employee.department?.name || "No department"}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <PayrollSection
          title="Earnings"
          totalLabel="Gross salary"
          totalAmount={toNumber(payroll.grossSalary)}
          totalTone="default"
        >
          {earnings.map((item) => (
            <AmountRow
              key={item.label}
              label={item.label}
              amount={item.amount}
            />
          ))}
        </PayrollSection>

        <PayrollSection
          title="Deductions"
          totalLabel="Total deductions"
          totalAmount={toNumber(payroll.totalDeductions)}
          totalTone="red"
        >
          {deductions.length > 0 ? (
            deductions.map((item) => (
              <AmountRow
                key={item.label}
                label={item.label}
                amount={item.amount}
                negative
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">No deductions recorded.</p>
          )}
        </PayrollSection>
      </div>

      <section className="border border-[#0B5A43]/20 bg-[#EAF5F0] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0B5A43]">Net salary</p>
            <p className="mt-1 text-sm text-gray-600">
              Final amount after earnings and deductions.
            </p>
          </div>

          <p className="text-2xl font-semibold tracking-tight text-[#0B5A43]">
            {formatCurrency(payroll.netSalary)}
          </p>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Attendance summary
          </h2>
        </div>

        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Work days"
            value={payroll.workDays ?? "—"}
          />
          <DetailItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Absent days"
            value={payroll.absentDays ?? 0}
          />
          <DetailItem
            icon={<Clock className="h-4 w-4" />}
            label="Late days"
            value={payroll.lateDays ?? 0}
          />
          <DetailItem
            icon={<Clock className="h-4 w-4" />}
            label="Overtime hours"
            value={
              payroll.overtimeHours != null
                ? `${Number(payroll.overtimeHours).toFixed(1)} hrs`
                : "—"
            }
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Link href="/payslip">
          <Button
            variant="outline"
            className="border-[#0B5A43]/30 text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to payslips
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PayrollSection({
  title,
  totalLabel,
  totalAmount,
  totalTone = "default",
  children,
}: {
  title: string;
  totalLabel: string;
  totalAmount: number;
  totalTone?: "default" | "red";
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      </div>

      <div className="space-y-3 p-5">
        {children}

        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <span className="text-sm font-semibold text-gray-950">
            {totalLabel}
          </span>
          <span
            className={
              totalTone === "red"
                ? "text-sm font-semibold text-red-700"
                : "text-sm font-semibold text-gray-950"
            }
          >
            {totalTone === "red" ? "− " : ""}
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </section>
  );
}

function AmountRow({
  label,
  amount,
  negative = false,
}: {
  label: string;
  amount: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={
          negative
            ? "text-sm font-medium text-red-700"
            : "text-sm font-medium text-gray-950"
        }
      >
        {negative ? "− " : ""}
        {formatCurrency(amount)}
      </span>
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
    <div className="border-b border-gray-200 p-4 sm:border-r even:sm:border-r-0 last:border-b-0">
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

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatMonthYear(month: number, year: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
