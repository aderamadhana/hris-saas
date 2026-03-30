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
import { ArrowLeft, User, Briefcase, Building2, Calendar } from "lucide-react";
import Link from "next/link";
import { getMonthName, formatCurrency } from "@/src/lib/payroll/calculations";
import { PayrollEditForm } from "@/src/components/payroll/payroll-edit-form";

export const dynamic = "force-dynamic";

export default async function PayrollDetailPage({
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
    select: {
      role: true,
      organizationId: true,
    },
  });

  if (!currentEmployee) {
    redirect("/login");
  }

  // Only HR, Admin, Owner can access
  if (!["hr", "admin", "owner"].includes(currentEmployee.role)) {
    redirect("/payroll");
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
          email: true,
          phoneNumber: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  if (!payroll) {
    notFound();
  }

  // Check organization match
  if (payroll.organizationId !== currentEmployee.organizationId) {
    redirect("/payroll");
  }

  // Convert Decimal to number for client component
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
        <Link href="/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll Details - {getMonthName(payrollData.month)}{" "}
            {payrollData.year}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {payroll.employee.firstName} {payroll.employee.lastName} •{" "}
            {formatDate(payrollData.periodStart)} -{" "}
            {formatDate(payrollData.periodEnd)}
          </p>
        </div>
        <Badge
          variant={
            payrollData.status === "paid"
              ? "success"
              : payrollData.status === "approved"
                ? "default"
                : "secondary"
          }
          className="text-base px-4 py-2"
        >
          {payrollData.status.toUpperCase()}
        </Badge>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
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
                <User className="h-4 w-4 text-purple-600" />
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

      {/* Current Salary Breakdown (Read-only) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Salary</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(payrollData.baseSalary)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Allowances</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(payrollData.allowances)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                Overtime ({payrollData.overtimeHours}h)
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(payrollData.overtime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bonus</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(payrollData.bonus)}
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">
                  Gross Salary
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(payrollData.grossSalary)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">BPJS Kesehatan (1%)</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(payrollData.bpjsKesehatan)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">BPJS Ketenagakerjaan (2%)</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(payrollData.bpjsKetenagakerjaan)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PPh21 (Income Tax)</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(payrollData.pph21)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other Deductions</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(payrollData.otherDeductions)}
              </span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">
                  Total Deductions
                </span>
                <span className="text-lg font-bold text-red-600">
                  -{formatCurrency(payrollData.totalDeductions)}
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
                Amount to be credited to employee account
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-green-600">
                {formatCurrency(payrollData.netSalary)}
              </p>
              {payrollData.paidDate && (
                <p className="text-sm text-green-700 mt-1">
                  Paid on {formatDate(payrollData.paidDate)}
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
                {payrollData.workDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent Days</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {payrollData.absentDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Late Days</p>
              <p className="mt-1 text-2xl font-bold text-yellow-600">
                {payrollData.lateDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overtime Hours</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {payrollData.overtimeHours}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form (if draft/approved) */}
      {payrollData.status !== "paid" && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <PayrollEditForm payroll={payrollData} />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {payrollData.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{payrollData.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="grid gap-2 text-sm">
            <p className="text-gray-600">
              <strong>Created:</strong> {formatDate(payrollData.createdAt)}
            </p>
            {payrollData.approvedBy && (
              <p className="text-gray-600">
                <strong>Approved by:</strong> {payrollData.approvedBy}
              </p>
            )}
            <p className="text-gray-600">
              <strong>Last updated:</strong> {formatDate(payrollData.updatedAt)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
