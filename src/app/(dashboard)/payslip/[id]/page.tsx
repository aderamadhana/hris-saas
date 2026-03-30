import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { redirect, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { getMonthName, formatCurrency } from "@/src/lib/payroll/calculations";

export const dynamic = "force-dynamic";

export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const payrollId = resolvedParams.id;

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
  });

  if (!currentEmployee) {
    redirect("/login");
  }

  // Get payroll
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeId: true,
          position: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  if (!payroll) {
    notFound();
  }

  // Check permissions - employees can only view their own payslip
  if (
    payroll.employeeId !== currentEmployee.id &&
    !["hr", "admin", "owner"].includes(currentEmployee.role)
  ) {
    redirect("/payslip");
  }

  // Convert Decimal to number
  const payslipData = {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payslip">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Payslip - {getMonthName(payslipData.month)} {payslipData.year}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Pay period: {formatDate(payslipData.periodStart)} -{" "}
            {formatDate(payslipData.periodEnd)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              payslipData.status === "paid"
                ? "success"
                : payslipData.status === "approved"
                  ? "default"
                  : "secondary"
            }
          >
            {payslipData.status}
          </Badge>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Employee Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Employee</p>
                <p className="font-medium text-gray-900">
                  {payroll.employee.firstName} {payroll.employee.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Employee ID</p>
                <p className="font-medium text-gray-900">
                  {payroll.employee.employeeId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Briefcase className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Position</p>
                <p className="font-medium text-gray-900">
                  {payroll.employee.position}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-2">
                <Building2 className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Department</p>
                <p className="font-medium text-gray-900">
                  {payroll.employee.department?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Salary</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(payslipData.baseSalary)}
              </span>
            </div>
            {payslipData.allowances > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Allowances</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payslipData.allowances)}
                </span>
              </div>
            )}
            {payslipData.overtime > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Overtime ({payslipData.overtimeHours} hours)
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payslipData.overtime)}
                </span>
              </div>
            )}
            {payslipData.bonus > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bonus</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payslipData.bonus)}
                </span>
              </div>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">
                  Gross Salary
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(payslipData.grossSalary)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deductions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payslipData.bpjsKesehatan > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">BPJS Kesehatan (1%)</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(payslipData.bpjsKesehatan)}
                </span>
              </div>
            )}
            {payslipData.bpjsKetenagakerjaan > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">BPJS Ketenagakerjaan (2%)</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(payslipData.bpjsKetenagakerjaan)}
                </span>
              </div>
            )}
            {payslipData.pph21 > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">PPh21 (Income Tax)</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(payslipData.pph21)}
                </span>
              </div>
            )}
            {payslipData.otherDeductions > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Other Deductions</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(payslipData.otherDeductions)}
                </span>
              </div>
            )}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">
                  Total Deductions
                </span>
                <span className="text-lg font-bold text-red-600">
                  -{formatCurrency(payslipData.totalDeductions)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Salary Card */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-green-900">
                NET SALARY (Take Home Pay)
              </p>
              <p className="text-sm text-green-700 mt-1">
                Amount to be credited to your account
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-green-600">
                {formatCurrency(payslipData.netSalary)}
              </p>
              {payslipData.paidDate && (
                <p className="text-sm text-green-700 mt-1">
                  Paid on {formatDate(payslipData.paidDate)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-gray-600">Work Days</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {payslipData.workDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent Days</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {payslipData.absentDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Late Days</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">
                {payslipData.lateDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overtime Hours</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {payslipData.overtimeHours}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {payslipData.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{payslipData.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <p className="text-sm text-gray-600">
            <strong>Important:</strong> This is a computer-generated payslip and
            does not require a signature. For any queries regarding your salary,
            please contact the HR department.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Generated on {formatDate(payslipData.createdAt)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
