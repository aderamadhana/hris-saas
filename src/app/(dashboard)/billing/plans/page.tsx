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
import { CheckCircle, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PLANS, formatPrice } from "@/src/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function BillingPlansPage() {
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
      organization: {
        select: {
          planType: true,
        },
      },
    },
  });

  if (!currentEmployee) {
    return null;
  }

  if (currentEmployee.role !== "owner") {
    redirect("/dashboard");
  }

  const currentPlanType = currentEmployee.organization.planType;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans & Pricing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Choose the plan that fits your organization
          </p>
        </div>

        <Link href="/dashboard/billing">
          <Button variant="outline">Back to Billing</Button>
        </Link>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanType;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                isPopular ? "border-blue-500 border-2" : ""
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price !== null && plan.price > 0 && (
                    <span className="text-gray-600">/{plan.interval}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Up to{" "}
                  {plan.employeeLimit === 999999
                    ? "unlimited"
                    : plan.employeeLimit}{" "}
                  employees
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limitations */}
                {plan.limitations && (
                  <ul className="space-y-2 pt-4 border-t">
                    {plan.limitations.map((limitation, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Action Button */}
                <div className="pt-4">
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price === null ? (
                    <Button className="w-full" variant="outline" asChild>
                      <a href="mailto:sales@hris.com">Contact Sales</a>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" asChild>
                      <a href="mailto:support@hris.com">Contact to Upgrade</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> To change your plan, please contact our
            support team at{" "}
            <a href="mailto:support@hris.com" className="underline font-medium">
              support@hris.com
            </a>
            . We'll help you upgrade or downgrade your subscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
