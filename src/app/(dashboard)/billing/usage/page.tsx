import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillingUsagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { role: true, organizationId: true },
  });

  if (!currentEmployee || currentEmployee.role !== "owner") {
    redirect("/dashboard");
  }

  // Get current employee count
  const employeeCount = await prisma.employee.count({
    where: {
      organizationId: currentEmployee.organizationId,
      status: "active",
    },
  });

  // Get organization plan info
  const organization = await prisma.organization.findUnique({
    where: { id: currentEmployee.organizationId },
    select: {
      name: true,
      planType: true,
      employeeLimit: true,
    },
  });

  // Get usage logs (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const usageLogs = await prisma.usageLog
    .findMany({
      where: {
        organizationId: currentEmployee.organizationId,
        recordedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { recordedAt: "desc" },
      take: 30,
    })
    .catch(() => []); // graceful fallback if UsageLog table doesn't exist yet

  const employeeLimit = organization?.employeeLimit ?? 5;
  const usagePercent = Math.round((employeeCount / employeeLimit) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Usage History</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track your organization's resource usage over time
        </p>
      </div>

      {/* Current Usage Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Employees
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeCount}
              <span className="text-sm font-normal text-gray-500">
                {" "}
                / {employeeLimit}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Usage Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usagePercent}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full transition-all ${
                  usagePercent >= 90
                    ? "bg-red-500"
                    : usagePercent >= 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Current Plan
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {organization?.planType ?? "Free"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {employeeLimit} employee limit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Log (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {usageLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <TrendingUp className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm">No usage history yet.</p>
              <p className="text-xs mt-1">
                Usage data will appear here as your organization grows.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Employees</th>
                    <th className="pb-3 font-medium">Storage Used</th>
                    <th className="pb-3 font-medium">Usage %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usageLogs.map((log: any) => {
                    const pct = Math.round(
                      (log.employeeCount / employeeLimit) * 100,
                    );
                    return (
                      <tr key={log.id} className="py-2">
                        <td className="py-3 text-gray-700">
                          {new Date(log.recordedAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="py-3 text-gray-700">
                          {log.employeeCount} / {employeeLimit}
                        </td>
                        <td className="py-3 text-gray-500">
                          {log.storageUsed
                            ? `${log.storageUsed.toFixed(2)} GB`
                            : "-"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              pct >= 90
                                ? "bg-red-100 text-red-700"
                                : pct >= 70
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
