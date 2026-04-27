import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { Download, ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: Clock, cls: "bg-gray-100 text-gray-600" },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    cls: "bg-blue-100 text-blue-700",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle,
    cls: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    cls: "bg-red-100 text-red-600",
  },
};

export default async function PayslipDetailPage({
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
    select: { id: true, organizationId: true, role: true },
  });
  if (!currentEmployee) redirect("/login");

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
          department: { select: { name: true } },
        },
      },
    },
  });

  if (!payroll) notFound();

  const emp = payroll.employee;
  const statusCfg =
    STATUS_CONFIG[payroll.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  const earnings = [
    { label: "Base Salary", amount: Number(payroll.baseSalary) },
    ...(Number(payroll.allowances) > 0
      ? [{ label: "Allowances", amount: Number(payroll.allowances) }]
      : []),
    ...(Number(payroll.overtime) > 0
      ? [{ label: "Overtime Pay", amount: Number(payroll.overtime) }]
      : []),
    ...(Number(payroll.bonus) > 0
      ? [{ label: "Bonus", amount: Number(payroll.bonus) }]
      : []),
  ];

  const deductions = [
    ...(Number(payroll.bpjsKesehatan) > 0
      ? [
          {
            label: "BPJS Kesehatan (1%)",
            amount: Number(payroll.bpjsKesehatan),
          },
        ]
      : []),
    ...(Number(payroll.bpjsKetenagakerjaan) > 0
      ? [
          {
            label: "BPJS Ketenagakerjaan (2%)",
            amount: Number(payroll.bpjsKetenagakerjaan),
          },
        ]
      : []),
    ...(Number(payroll.pph21) > 0
      ? [{ label: "Income Tax (PPh 21)", amount: Number(payroll.pph21) }]
      : []),
    ...(Number(payroll.otherDeductions) > 0
      ? [{ label: "Other Deductions", amount: Number(payroll.otherDeductions) }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Back ── */}
      <Link
        href="/payslip"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payslips
      </Link>

      {/* ── Header card ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Payslip —{" "}
              {new Date(payroll.year, payroll.month - 1).toLocaleString("en", {
                month: "long",
                year: "numeric",
              })}
            </h1>
            <div className="mt-1 space-y-0.5 text-sm text-gray-500">
              <p>
                {emp.firstName} {emp.lastName}
              </p>
              <p>
                {emp.position}
                {emp.department?.name ? ` · ${emp.department.name}` : ""}
              </p>
              <p className="text-xs text-gray-400">
                {emp.employeeId} · {emp.email}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusCfg.cls}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </span>
            {payroll.paidDate && (
              <p className="text-xs text-gray-400">
                Paid on {format(new Date(payroll.paidDate), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Earnings ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Earnings
        </h2>
        <div className="space-y-2">
          {earnings.map((e) => (
            <div
              key={e.label}
              className="flex items-center justify-between py-1"
            >
              <span className="text-gray-600">{e.label}</span>
              <span className="font-mono text-gray-900">
                {formatCurrency(e.amount)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="font-semibold text-gray-900">Gross Salary</span>
            <span className="font-semibold font-mono text-gray-900">
              {formatCurrency(Number(payroll.grossSalary))}
            </span>
          </div>
        </div>
      </div>

      {/* ── Deductions ── */}
      {deductions.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Deductions
          </h2>
          <div className="space-y-2">
            {deductions.map((d) => (
              <div
                key={d.label}
                className="flex items-center justify-between py-1"
              >
                <span className="text-gray-600">{d.label}</span>
                <span className="font-mono text-red-600">
                  − {formatCurrency(d.amount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="font-semibold text-gray-900">
                Total Deductions
              </span>
              <span className="font-semibold font-mono text-red-600">
                − {formatCurrency(Number(payroll.totalDeductions))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Net salary ── */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Net Salary</p>
            <p className="text-xs text-blue-500">
              Take-home pay after all deductions
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-700 font-mono">
            {formatCurrency(Number(payroll.netSalary))}
          </p>
        </div>
      </div>

      {/* ── Attendance ── */}
      {(payroll.workDays != null || payroll.overtimeHours != null) && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Attendance Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Days Worked", value: payroll.workDays ?? "—" },
              { label: "Days Absent", value: payroll.absentDays ?? 0 },
              { label: "Late Days", value: payroll.lateDays ?? 0 },
              {
                label: "Overtime (hrs)",
                value:
                  payroll.overtimeHours != null
                    ? Number(payroll.overtimeHours).toFixed(1)
                    : "—",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-gray-50 p-3 text-center"
              >
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {payroll.notes && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <strong>Notes:</strong> {payroll.notes}
        </div>
      )}

      {/* ── Download ── */}
      <div className="flex justify-end pb-6">
        <Button variant="outline" className="gap-2" disabled>
          <Download className="h-4 w-4" />
          Download PDF
          <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
            Coming soon
          </span>
        </Button>
      </div>
    </div>
  );
}
