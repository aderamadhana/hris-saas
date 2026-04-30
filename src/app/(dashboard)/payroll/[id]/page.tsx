import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  ReceiptText,
  User,
  XCircle,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { Button } from "@/src/components/ui/button";
import { PayrollEditForm } from "@/src/components/payroll/payroll-edit-form";
import { getMonthName, formatCurrency } from "@/src/lib/payroll/calculations";

export const dynamic = "force-dynamic";

export default async function PayrollDetailPage({
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
      role: true,
      organizationId: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  if (!["hr", "admin", "owner"].includes(currentEmployee.role)) {
    redirect("/payroll");
  }

  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          position: true,
          email: true,
          phoneNumber: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!payroll || payroll.organizationId !== currentEmployee.organizationId) {
    notFound();
  }

  const payrollData = {
    ...payroll,
    baseSalary: payroll.baseSalary.toNumber(),
    allowances: payroll.allowances.toNumber(),
    overtime: payroll.overtime.toNumber(),
    bonus: payroll.bonus.toNumber(),
    grossSalary: payroll.grossSalary.toNumber(),
    bpjsKesehatan: payroll.bpjsKesehatan.toNumber(),
    bpjsKetenagakerjaan: payroll.bpjsKetenagakerjaan.toNumber(),
    pph21: payroll.pph21.toNumber(),
    otherDeductions: payroll.otherDeductions.toNumber(),
    totalDeductions: payroll.totalDeductions.toNumber(),
    netSalary: payroll.netSalary.toNumber(),
    overtimeHours: payroll.overtimeHours.toNumber(),
  };

  const employeeName =
    `${payroll.employee.firstName ?? ""} ${
      payroll.employee.lastName ?? ""
    }`.trim() || "Unnamed employee";

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/payroll"
              className="mb-4 inline-flex items-center text-sm font-semibold text-[#0B5A43] hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to payroll
            </Link>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  Payroll Details
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {getMonthName(payroll.month)} {payroll.year} · {employeeName}
                </p>
              </div>
            </div>
          </div>

          <StatusBadge status={payroll.status} />
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-3">
        <SummaryItem
          label="Net salary"
          value={formatCurrency(payrollData.netSalary)}
          description="Take-home pay"
          icon={<DollarSign className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Gross salary"
          value={formatCurrency(payrollData.grossSalary)}
          description="Before deductions"
          icon={<ReceiptText className="h-5 w-5" />}
        />

        <SummaryItem
          label="Deductions"
          value={formatCurrency(payrollData.totalDeductions)}
          description="Tax and deductions"
          icon={<ReceiptText className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Employee Information
          </h2>
        </div>

        <div className="grid gap-0 border-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            icon={<User className="h-4 w-4" />}
            label="Employee"
            value={employeeName}
          />
          <DetailItem
            icon={<FileText className="h-4 w-4" />}
            label="Employee ID"
            value={payroll.employee.employeeId}
          />
          <DetailItem
            icon={<Briefcase className="h-4 w-4" />}
            label="Position"
            value={payroll.employee.position || "Not assigned"}
          />
          <DetailItem
            icon={<Building2 className="h-4 w-4" />}
            label="Department"
            value={payroll.employee.department?.name || "No department"}
          />
          <DetailItem
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={payroll.employee.email}
          />
          <DetailItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Period"
            value={`${formatDate(payroll.periodStart)} - ${formatDate(
              payroll.periodEnd,
            )}`}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <PayrollSection
          title="Earnings"
          totalLabel="Gross salary"
          totalAmount={payrollData.grossSalary}
        >
          <AmountRow label="Base salary" amount={payrollData.baseSalary} />
          <AmountRow label="Allowances" amount={payrollData.allowances} />
          <AmountRow
            label={`Overtime (${payrollData.overtimeHours}h)`}
            amount={payrollData.overtime}
          />
          <AmountRow label="Bonus" amount={payrollData.bonus} />
        </PayrollSection>

        <PayrollSection
          title="Deductions"
          totalLabel="Total deductions"
          totalAmount={payrollData.totalDeductions}
          totalTone="red"
        >
          <AmountRow
            label="BPJS Kesehatan"
            amount={payrollData.bpjsKesehatan}
            negative
          />
          <AmountRow
            label="BPJS Ketenagakerjaan"
            amount={payrollData.bpjsKetenagakerjaan}
            negative
          />
          <AmountRow label="PPh21" amount={payrollData.pph21} negative />
          <AmountRow
            label="Other deductions"
            amount={payrollData.otherDeductions}
            negative
          />
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

          <div className="sm:text-right">
            <p className="text-2xl font-semibold tracking-tight text-[#0B5A43]">
              {formatCurrency(payrollData.netSalary)}
            </p>

            {payroll.paidDate && (
              <p className="mt-1 text-xs text-gray-600">
                Paid on {formatDate(payroll.paidDate)}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Attendance Summary
          </h2>
        </div>

        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Work days"
            value={payrollData.workDays}
          />
          <DetailItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Absent days"
            value={payrollData.absentDays}
          />
          <DetailItem
            icon={<Clock className="h-4 w-4" />}
            label="Late days"
            value={payrollData.lateDays}
          />
          <DetailItem
            icon={<Clock className="h-4 w-4" />}
            label="Overtime hours"
            value={`${payrollData.overtimeHours}h`}
          />
        </div>
      </section>

      {payrollData.status !== "paid" && (
        <section className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-950">
              Edit Payroll
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Adjust allowances, bonus, deductions, or payroll status before
              payment.
            </p>
          </div>

          <div className="p-5">
            <PayrollEditForm payroll={payrollData} />
          </div>
        </section>
      )}

      {payrollData.notes && (
        <section className="border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950">Notes</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {payrollData.notes}
          </p>
        </section>
      )}

      <section className="border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-950">Metadata</h2>

        <div className="mt-4 grid gap-3 text-sm text-gray-600">
          <p>
            <span className="font-medium text-gray-900">Created:</span>{" "}
            {formatDate(payrollData.createdAt)}
          </p>

          {payrollData.approvedBy && (
            <p>
              <span className="font-medium text-gray-900">Approved by:</span>{" "}
              {payrollData.approvedBy}
            </p>
          )}

          <p>
            <span className="font-medium text-gray-900">Last updated:</span>{" "}
            {formatDate(payrollData.updatedAt)}
          </p>
        </div>
      </section>
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
            {totalTone === "red" ? "- " : ""}
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
  if (amount === 0) return null;

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
        {negative ? "- " : ""}
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

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "paid"
      ? {
          label: "Paid",
          icon: CheckCircle,
          className: "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]",
        }
      : status === "approved"
        ? {
            label: "Approved",
            icon: CheckCircle,
            className: "border-gray-200 bg-gray-50 text-gray-700",
          }
        : status === "rejected"
          ? {
              label: "Rejected",
              icon: XCircle,
              className: "border-red-200 bg-red-50 text-red-700",
            }
          : {
              label: "Draft",
              icon: Clock,
              className: "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]",
            };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function formatDate(value: Date | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
