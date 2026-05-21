// app/(dashboard)/payslip/[id]/page.tsx

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  User,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCurrency, getMonthName } from "@/lib/payroll/calculations";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PayslipDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { id: true, role: true, organizationId: true },
  });
  if (!currentEmployee) redirect("/dashboard");

  const isHRAdmin = ["hr", "admin", "owner"].includes(currentEmployee.role);

  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          position: true,
          employmentType: true,
          department: { select: { name: true } },
        },
      },
      organization: { select: { name: true } },
    },
  });

  if (!payroll) notFound();
  if (!isHRAdmin && payroll.employeeId !== currentEmployee.id)
    redirect("/payslip");

  const emp = payroll.employee;
  const fullName = `${emp.firstName} ${emp.lastName}`;

  const earnings = [
    { label: "Base Salary", value: payroll.baseSalary.toNumber() },
    { label: "Allowances", value: payroll.allowances.toNumber() },
    { label: "Overtime", value: payroll.overtime.toNumber() },
    { label: "Bonus", value: payroll.bonus.toNumber() },
  ].filter((r) => r.value > 0);

  const deductions = [
    { label: "BPJS Kesehatan", value: payroll.bpjsKesehatan.toNumber() },
    {
      label: "BPJS Ketenagakerjaan",
      value: payroll.bpjsKetenagakerjaan.toNumber(),
    },
    { label: "PPh21", value: payroll.pph21.toNumber() },
    { label: "Other Deductions", value: payroll.otherDeductions.toNumber() },
  ].filter((r) => r.value > 0);

  const paidDateStr = payroll.paidDate
    ? new Date(payroll.paidDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      {/* ── Print stylesheet ────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          /* Hide everything except the payslip */
          body > * { display: none !important; }
          #payslip-root { display: block !important; }

          /* Reset page */
          @page {
            size: A4 portrait;
            margin: 16mm 14mm;
          }

          #payslip-root {
            font-family: sans-serif;
            font-size: 11pt;
            color: #111;
            background: #fff;
          }

          /* Hide screen-only elements */
          .no-print { display: none !important; }

          /* Remove borders/shadows that print poorly */
          .print-card {
            border: 1px solid #d1d5db !important;
            border-radius: 4px;
            break-inside: avoid;
          }

          /* Net salary block */
          .print-net {
            background: #0B5A43 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Earnings/Deductions grid → side by side on A4 */
          .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

          table { width: 100%; border-collapse: collapse; }
          td, th { padding: 5px 8px; font-size: 10pt; }
          tr + tr td { border-top: 1px solid #e5e7eb; }
        }
      `}</style>

      <div
        id="payslip-root"
        className="mx-auto w-full max-w-3xl space-y-5 pb-8"
      >
        {/* Back — hidden on print */}
        <div className="no-print">
          <Link
            href="/payslip"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#0B5A43]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to payslips
          </Link>
        </div>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="print-card border border-gray-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#EAF5F0] text-[#0B5A43]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-950">
                  Payslip — {getMonthName(payroll.month)} {payroll.year}
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  {payroll.organization?.name ?? ""}
                </p>
                <StatusBadge status={payroll.status} className="mt-2" />
              </div>
            </div>

            {paidDateStr && (
              <div className="shrink-0 sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Paid on
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0B5A43]">
                  {paidDateStr}
                </p>
              </div>
            )}
          </div>

          {/* Employee info */}
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <InfoItem icon={<User className="h-4 w-4" />} label="Employee">
              <p className="font-semibold text-gray-950">{fullName}</p>
              <p className="text-xs text-gray-500">{emp.employeeId}</p>
            </InfoItem>
            <InfoItem
              icon={<Building2 className="h-4 w-4" />}
              label="Department"
            >
              <p className="font-semibold text-gray-950">
                {emp.department?.name ?? "-"}
              </p>
              <p className="text-xs text-gray-500">{emp.position}</p>
            </InfoItem>
            <InfoItem
              icon={<Calendar className="h-4 w-4" />}
              label="Attendance"
            >
              <p className="font-semibold text-gray-950">
                {payroll.workDays} working days
              </p>
              <p className="text-xs text-gray-500">
                {payroll.absentDays} absent · {payroll.lateDays} late
              </p>
            </InfoItem>
          </div>
        </div>

        {/* ── Earnings + Deductions ────────────────────────────────────────── */}
        <div className="print-grid grid gap-5 sm:grid-cols-2">
          {/* Earnings */}
          <div className="print-card border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-950">Earnings</h2>
            </div>
            <div className="divide-y divide-gray-100 px-5">
              {earnings.length === 0 ? (
                <p className="py-4 text-sm text-gray-400">
                  No earnings recorded.
                </p>
              ) : (
                earnings.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-medium text-gray-950">
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-[#EAF5F0] px-5 py-3">
              <span className="text-sm font-semibold text-[#0B5A43]">
                Gross Salary
              </span>
              <span className="text-sm font-bold text-[#0B5A43]">
                {formatCurrency(payroll.grossSalary.toNumber())}
              </span>
            </div>
          </div>

          {/* Deductions */}
          <div className="print-card border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-950">
                Deductions
              </h2>
            </div>
            <div className="divide-y divide-gray-100 px-5">
              {deductions.length === 0 ? (
                <p className="py-4 text-sm text-gray-400">No deductions.</p>
              ) : (
                deductions.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(row.value)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-red-50 px-5 py-3">
              <span className="text-sm font-semibold text-red-700">
                Total Deductions
              </span>
              <span className="text-sm font-bold text-red-700">
                -{formatCurrency(payroll.totalDeductions.toNumber())}
              </span>
            </div>
          </div>
        </div>

        {/* ── Net salary ───────────────────────────────────────────────────── */}
        <div className="print-net border border-[#0B5A43] bg-[#0B5A43] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-white/20">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <p className="text-base font-semibold text-white">Net Salary</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(payroll.netSalary.toNumber())}
            </p>
          </div>
        </div>

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        {payroll.notes && (
          <div className="print-card border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Notes
            </p>
            <p className="mt-2 text-sm text-gray-700">{payroll.notes}</p>
          </div>
        )}

        {/* ── Actions (hidden on print) ───────────────────────────────────── */}
        <div className="no-print flex justify-end gap-3">
          <Link href="/payslip">
            <Button variant="outline">Back to list</Button>
          </Link>
          <PrintButton />
        </div>

        {/* Print footer — only visible on print */}
        <div className="hidden print:block mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          <p>
            {payroll.organization?.name ?? ""} · Payslip{" "}
            {getMonthName(payroll.month)} {payroll.year} · {fullName} (
            {emp.employeeId})
          </p>
          <p className="mt-1">
            Generated on{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Client component for print button ───────────────────────────────────────
// Needs to be 'use client' for onClick, but page is server — use inline script trick

function PrintButton() {
  return (
    <>
      <button
        id="print-btn"
        className="inline-flex items-center gap-2 bg-[#0B5A43] px-4 py-2 text-sm font-medium text-white hover:bg-[#084735]"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
      {/* Inline script — works in server components */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const cls =
    status === "paid"
      ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
      : status === "approved"
        ? "border-gray-200 bg-gray-50 text-gray-700"
        : "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]";
  return (
    <span
      className={`inline-block border px-2.5 py-0.5 text-xs font-medium capitalize ${cls} ${className}`}
    >
      {status}
    </span>
  );
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-200 bg-gray-50 text-gray-500">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
