// src/app/(dashboard)/billing/page.tsx

import { redirect } from "next/navigation";

import { createClient } from "@/src/lib/supabase/server";
import prisma from "@/src/lib/prisma";
import { BillingClient } from "@/src/components/billing/billing-client";
import { PLANS } from "@/src/lib/billing/plans";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  searchParams?: Promise<{
    payment?: string;
  }>;
};

type BillingTransactionRecord = {
  id: string;
  orderId: string;
  planId: string;
  billingCycle: string;
  amount: unknown;
  status: string;
  paymentType?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: {
      authId: user.id,
    },
    select: {
      organizationId: true,
      role: true,
    },
  });

  if (!currentEmployee) {
    redirect("/dashboard");
  }

  if (currentEmployee.role !== "owner") {
    redirect("/dashboard");
  }

  const [organization, employeeCount] = await Promise.all([
    prisma.organization.findUnique({
      where: {
        id: currentEmployee.organizationId,
      },
      select: {
        planType: true,
        planStatus: true,
        employeeLimit: true,
        currentPeriodEnd: true,
        lastPaymentAt: true,
        lastPaymentAmount: true,
      },
    }),

    prisma.employee.count({
      where: {
        organizationId: currentEmployee.organizationId,
        status: "active",
      },
    }),
  ]);

  let transactions: BillingTransactionRecord[] = [];

  try {
    const billingTransaction = (prisma as any).billingTransaction;

    if (billingTransaction?.findMany) {
      transactions = await billingTransaction.findMany({
        where: {
          organizationId: currentEmployee.organizationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });
    }
  } catch {
    transactions = [];
  }

  const currentPlanId = organization?.planType || "free";
  const planConfig =
    PLANS.find((plan) => plan.id === currentPlanId) ?? PLANS[0];

  const employeeLimit =
    organization?.employeeLimit ?? planConfig.employeeLimit ?? 0;

  return (
    <BillingClient
      paymentResult={params?.payment}
      plan={{
        id: currentPlanId,
        name: planConfig.name,
        status: organization?.planStatus || "active",
        employeeLimit,
        currentPeriodEnd: organization?.currentPeriodEnd?.toISOString() ?? null,
        lastPaymentAt: organization?.lastPaymentAt?.toISOString() ?? null,
        lastPaymentAmount: toNumberOrNull(organization?.lastPaymentAmount),
      }}
      usage={{
        employees: employeeCount,
        employeeLimit,
        storageGB: 0.2,
        storageLimitGB: planConfig.storageGB,
      }}
      transactions={transactions.map((transaction) => ({
        id: transaction.id,
        orderId: transaction.orderId,
        planId: transaction.planId,
        billingCycle: transaction.billingCycle,
        amount: toNumber(transaction.amount),
        status: transaction.status,
        paymentType: transaction.paymentType ?? null,
        paidAt: transaction.paidAt?.toISOString() ?? null,
        createdAt: transaction.createdAt.toISOString(),
      }))}
    />
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

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  return toNumber(value);
}
