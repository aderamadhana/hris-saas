import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
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
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
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
  });

  if (!currentEmployee) {
    redirect("/login");
  }

  // Get payslips for this employee
  const payslips = await prisma.payroll.findMany({
    where: {
      employeeId: currentEmployee.id,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 12, // Last 12 months
  });

  // Get latest payslip
  const latestPayslip = payslips[0];

  // Calculate YTD (Year to Date) totals
  const currentYear = new Date().getFullYear();
  const ytdPayslips = payslips.filter((p) => p.year === currentYear);
  const ytdGross = ytdPayslips.reduce(
    (sum, p) => sum + p.grossSalary.toNumber(),
    0,
  );
  const ytdNet = ytdPayslips.reduce(
    (sum, p) => sum + p.netSalary.toNumber(),
    0,
  );
  const ytdTax = ytdPayslips.reduce((sum, p) => sum + p.pph21.toNumber(), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and download your salary slips
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Pay</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {latestPayslip
                    ? formatCurrency(latestPayslip.netSalary.toNumber())
                    : "N/A"}
                </p>
                {latestPayslip && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getMonthName(latestPayslip.month)} {latestPayslip.year}
                  </p>
                )}
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Gross</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(ytdGross)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Year {currentYear}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Net</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(ytdNet)}
                </p>
                <p className="text-xs text-gray-500 mt-1">After tax</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Tax</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(ytdTax)}
                </p>
                <p className="text-xs text-gray-500 mt-1">PPh21 paid</p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payslip History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm font-medium text-gray-900">
                No payslips yet
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Your payslips will appear here once generated by HR
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payslips.map((payslip) => (
                <div
                  key={payslip.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getMonthName(payslip.month)} {payslip.year}
                      </p>
                      <p className="text-sm text-gray-600">
                        Net: {formatCurrency(payslip.netSalary.toNumber())}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        payslip.status === "paid"
                          ? "success"
                          : payslip.status === "approved"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {payslip.status}
                    </Badge>

                    <Link href={`/dashboard/payslip/${payslip.id}`}>
                      <Button size="sm" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>

                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
