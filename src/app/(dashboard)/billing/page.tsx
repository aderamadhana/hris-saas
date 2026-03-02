import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import {
  CreditCard,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PLANS, getPlanById, formatPrice } from "@/src/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          planType: true,
          planStatus: true,
          employeeLimit: true,
          storageLimit: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!currentEmployee) {
    return null;
  }

  // Only owner can access billing
  if (currentEmployee.role !== "owner") {
    redirect("/dashboard");
  }

  const org = currentEmployee.organization;

  // Get current usage
  const activeEmployeeCount = await prisma.employee.count({
    where: {
      organizationId: org.id,
      status: "active",
    },
  });

  // Get plan details
  const currentPlan = getPlanById(org.planType);
  console.log(currentPlan);

  // Calculate usage percentage
  const employeeUsagePercent = Math.round(
    (activeEmployeeCount / org.employeeLimit) * 100,
  );

  // Check if near limit
  const isNearLimit = employeeUsagePercent >= 80;

  // Format dates
  const formatDate = (date: Date | null) => {
    if (!date) return "No expiration";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your subscription and track usage
          </p>
        </div>

        <Link href="/billing/plans">
          <Button>
            <TrendingUp className="mr-2 h-4 w-4" />
            View Plans
          </Button>
        </Link>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </div>
            <Badge
              variant={
                org.planStatus === "active"
                  ? "success"
                  : org.planStatus === "suspended"
                    ? "destructive"
                    : "secondary"
              }
            >
              {org.planStatus.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Plan Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {currentPlan?.name || "Unknown Plan"}
                </h3>
                <p className="mt-1 text-3xl font-bold text-blue-600">
                  {formatPrice(currentPlan?.price || 0)}
                  {currentPlan?.price !== null && currentPlan.price > 0 && (
                    <span className="text-lg font-normal text-gray-600">
                      {" "}
                      / month
                    </span>
                  )}
                </p>
              </div>

              <Link href="/dashboard/billing/plans">
                <Button variant="outline">Change Plan</Button>
              </Link>
            </div>

            {/* Renewal Date */}
            {org.currentPeriodEnd && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  Renews on {formatDate(org.currentPeriodEnd)}
                </span>
              </div>
            )}

            {/* Features */}
            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">
                Plan includes:
              </p>
              <ul className="space-y-1">
                {currentPlan?.features.slice(0, 3).map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Employee Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Employee Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {activeEmployeeCount}
                </p>
                <p className="text-sm text-gray-600">
                  of {org.employeeLimit} employees
                </p>
              </div>
              <Badge variant={isNearLimit ? "warning" : "default"}>
                {employeeUsagePercent}% used
              </Badge>
            </div>

            <Progress value={employeeUsagePercent} />

            {isNearLimit && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Approaching Limit
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Consider upgrading your plan to add more employees
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Usage (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">0 GB</p>
                <p className="text-sm text-gray-600">
                  of {org.storageLimit} GB
                </p>
              </div>
              <Badge variant="default">0% used</Badge>
            </div>

            <Progress value={0} />

            <p className="text-xs text-gray-500">
              Storage tracking coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              For plan changes or billing questions, please contact our support
              team.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <a href="mailto:support@hris.com">Contact Support</a>
              </Button>
              <Link href="/dashboard/billing/plans">
                <Button variant="outline">View All Plans</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
