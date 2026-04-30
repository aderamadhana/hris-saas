"use client";

// src/components/billing/billing-client.tsx

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  HardDrive,
  Info,
  Loader2,
  Phone,
  ReceiptText,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { PLANS, formatPrice } from "@/src/lib/billing/plans";

interface PlanData {
  id: string;
  name: string;
  status: string;
  employeeLimit: number;
  currentPeriodEnd: string | null;
  lastPaymentAt: string | null;
  lastPaymentAmount: number | null;
}

interface UsageData {
  employees: number;
  employeeLimit: number;
  storageGB: number;
  storageLimitGB: number;
}

interface Transaction {
  id: string;
  orderId: string;
  planId: string;
  billingCycle: string;
  amount: number;
  status: string;
  paymentType: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface BillingClientProps {
  paymentResult?: string;
  plan: PlanData;
  usage: UsageData;
  transactions: Transaction[];
}

type BillingCycle = "monthly" | "yearly";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  failed: "Failed",
  expired: "Expired",
  paid: "Paid",
};

export function BillingClient({
  paymentResult,
  plan,
  usage,
  transactions,
}: BillingClientProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const employeeUsagePercent = getUsagePercent(
    usage.employees,
    usage.employeeLimit,
  );

  const storageUsagePercent = getUsagePercent(
    usage.storageGB,
    usage.storageLimitGB,
  );

  const sortedPlans = useMemo(() => {
    return [...PLANS].sort((a, b) => {
      if (a.id === "free") return -1;
      if (b.id === "free") return 1;
      if (a.id === "enterprise") return 1;
      if (b.id === "enterprise") return -1;

      return a.price - b.price;
    });
  }, []);

  async function handleCheckout(planId: string) {
    if (processingPlanId) return;

    if (planId === "enterprise") {
      window.location.href =
        "mailto:sales@hris.id?subject=Enterprise Plan Inquiry";
      return;
    }

    setProcessingPlanId(planId);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The server did not return JSON. Make sure the billing checkout API is available.",
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create payment.");
      }

      if (data?.downgraded) {
        window.location.reload();
        return;
      }

      if (!data?.snapToken) {
        throw new Error("Snap token was not found.");
      }

      await loadMidtransSnap(data.clientKey);

      const snap = (window as any).snap;

      if (!snap?.pay) {
        throw new Error("Failed to load Midtrans Snap.");
      }

      snap.pay(data.snapToken, {
        onSuccess: () => {
          window.location.href = "/billing?payment=success";
        },
        onPending: () => {
          window.location.href = "/billing?payment=pending";
        },
        onError: () => {
          window.location.href = "/billing?payment=error";
        },
        onClose: () => {
          setProcessingPlanId(null);
        },
      });
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Failed to create payment.",
      );
      setProcessingPlanId(null);
    }
  }

  return (
    <div className="mx-auto w-full space-y-5 pb-8">
      <PaymentResultBanner paymentResult={paymentResult} />

      {error && (
        <section className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </section>
      )}

      <header className="border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
              Billing & Subscription
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your organization plan, usage, and payment history.
            </p>
          </div>

          <PlanStatusBadge status={plan.status} />
        </div>
      </header>

      <section className="grid border border-gray-200 bg-white md:grid-cols-3">
        <SummaryItem
          label="Current plan"
          value={plan.name}
          description={
            plan.currentPeriodEnd
              ? `Ends on ${formatDate(plan.currentPeriodEnd)}`
              : "No end date"
          }
          icon={<CreditCard className="h-5 w-5" />}
          tone="green"
        />

        <SummaryItem
          label="Employees"
          value={`${usage.employees}/${formatLimit(usage.employeeLimit)}`}
          description={`${employeeUsagePercent}% of plan limit`}
          icon={<Users className="h-5 w-5" />}
          tone={employeeUsagePercent >= 90 ? "orange" : "default"}
        />

        <SummaryItem
          label="Storage"
          value={`${usage.storageGB.toFixed(1)} GB/${formatLimit(
            usage.storageLimitGB,
          )} GB`}
          description={`${storageUsagePercent}% used`}
          icon={<HardDrive className="h-5 w-5" />}
        />
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">Plan usage</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your organization usage based on the current plan limits.
          </p>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <UsageMeter
            label="Active employees"
            value={usage.employees}
            limit={usage.employeeLimit}
            percent={employeeUsagePercent}
          />

          <UsageMeter
            label="Storage"
            value={usage.storageGB}
            limit={usage.storageLimitGB}
            percent={storageUsagePercent}
            suffix="GB"
          />
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950">
              Choose a plan
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Annual billing gives better value than monthly billing.
            </p>
          </div>

          <div className="flex w-fit border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={
                billingCycle === "monthly"
                  ? "bg-[#0B5A43] px-4 py-2 text-sm font-semibold text-white"
                  : "px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
              }
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={
                billingCycle === "yearly"
                  ? "bg-[#0B5A43] px-4 py-2 text-sm font-semibold text-white"
                  : "px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-[#EAF5F0] hover:text-[#0B5A43]"
              }
            >
              Yearly
              <span className="ml-1 text-xs opacity-75">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {sortedPlans.map((item) => {
            const isCurrent = item.id === plan.id;
            const isProcessing = processingPlanId === item.id;

            return (
              <PlanCard
                key={item.id}
                plan={item}
                currentPlanId={plan.id}
                billingCycle={billingCycle}
                isCurrent={isCurrent}
                isProcessing={isProcessing}
                disabled={Boolean(processingPlanId)}
                onSelect={() => handleCheckout(item.id)}
              />
            );
          })}
        </div>
      </section>

      <section className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-950">
            Payment history
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing the latest 10 transactions.
          </p>
        </div>

        {transactions.length === 0 ? (
          <EmptyTransactions />
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PaymentResultBanner({ paymentResult }: { paymentResult?: string }) {
  if (!paymentResult) return null;

  if (paymentResult === "success") {
    return (
      <section className="flex gap-3 border border-[#0B5A43]/20 bg-[#EAF5F0] p-4 text-sm text-[#0B5A43]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Payment successful</p>
          <p className="mt-0.5 text-gray-600">
            Your organization subscription has been updated.
          </p>
        </div>
      </section>
    );
  }

  if (paymentResult === "pending") {
    return (
      <section className="flex gap-3 border border-[#F7A81B]/40 bg-[#FFF4D9] p-4 text-sm text-[#7A5A00]">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Payment is being processed</p>
          <p className="mt-0.5">
            Your plan will be activated after the payment is confirmed.
          </p>
        </div>
      </section>
    );
  }

  if (paymentResult === "error") {
    return (
      <section className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Payment failed</p>
          <p className="mt-0.5">
            Try again or contact support if the issue continues.
          </p>
        </div>
      </section>
    );
  }

  return null;
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

function UsageMeter({
  label,
  value,
  limit,
  percent,
  suffix = "",
}: {
  label: string;
  value: number;
  limit: number;
  percent: number;
  suffix?: string;
}) {
  const isUnlimited = limit >= 999999;
  const toneClass =
    percent >= 90
      ? "bg-red-600"
      : percent >= 75
        ? "bg-[#F7A81B]"
        : "bg-[#0B5A43]";

  return (
    <div className="border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-gray-950">{label}</p>
        <p className="text-sm font-medium text-gray-600">
          {formatNumber(value)}
          {suffix ? ` ${suffix}` : ""} /{" "}
          {isUnlimited
            ? "∞"
            : `${formatNumber(limit)}${suffix ? ` ${suffix}` : ""}`}
        </p>
      </div>

      <div className="mt-3 h-2 bg-gray-200">
        <div
          className={`h-2 ${toneClass}`}
          style={{
            width: `${isUnlimited ? 5 : percent}%`,
          }}
        />
      </div>

      {percent >= 80 && !isUnlimited && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#7A5A00]">
          <AlertTriangle className="h-3.5 w-3.5" />
          Usage is close to the plan limit.
        </p>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  currentPlanId,
  billingCycle,
  isCurrent,
  isProcessing,
  disabled,
  onSelect,
}: {
  plan: (typeof PLANS)[number];
  currentPlanId: string;
  billingCycle: BillingCycle;
  isCurrent: boolean;
  isProcessing: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const isEnterprise = plan.id === "enterprise";
  const monthlyPrice =
    billingCycle === "yearly" && plan.priceYearly > 0
      ? Math.round(plan.priceYearly / 12)
      : plan.price;

  const yearlySavings =
    billingCycle === "yearly" && plan.priceYearly > 0
      ? plan.price * 12 - plan.priceYearly
      : 0;

  const buttonLabel = getPlanButtonLabel({
    targetPlanId: plan.id,
    currentPlanId,
  });

  return (
    <article
      className={
        isCurrent
          ? "relative border border-[#0B5A43] bg-[#EAF5F0] p-5"
          : plan.popular
            ? "relative border border-[#F7A81B] bg-white p-5"
            : "relative border border-gray-200 bg-white p-5"
      }
    >
      <div className="flex min-h-[30px] items-center gap-2">
        {isCurrent && (
          <span className="border border-[#0B5A43]/20 bg-white px-2.5 py-1 text-xs font-semibold text-[#0B5A43]">
            Current plan
          </span>
        )}

        {plan.popular && !isCurrent && (
          <span className="border border-[#F7A81B]/40 bg-[#FFF4D9] px-2.5 py-1 text-xs font-semibold text-[#7A5A00]">
            Popular
          </span>
        )}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-gray-950">{plan.name}</h3>

      <div className="mt-3">
        {isEnterprise ? (
          <p className="text-2xl font-semibold tracking-tight text-gray-950">
            Custom
          </p>
        ) : (
          <>
            <p className="text-2xl font-semibold tracking-tight text-gray-950">
              {monthlyPrice === 0 ? "Free" : formatPrice(monthlyPrice)}
            </p>

            {monthlyPrice > 0 && (
              <p className="mt-1 text-xs text-gray-500">per month</p>
            )}

            {yearlySavings > 0 && (
              <p className="mt-1 text-xs font-semibold text-[#0B5A43]">
                Save {formatPrice(yearlySavings)} per year
              </p>
            )}
          </>
        )}
      </div>

      <div className="my-5 border-t border-gray-200" />

      <ul className="space-y-2 text-sm text-gray-600">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0B5A43]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        disabled={isCurrent || disabled}
        onClick={onSelect}
        variant={isCurrent ? "outline" : "default"}
        className={
          isCurrent
            ? "mt-5 w-full border-[#0B5A43]/30 text-[#0B5A43]"
            : plan.popular
              ? "mt-5 w-full bg-[#0B5A43] text-white hover:bg-[#084735]"
              : "mt-5 w-full border border-[#0B5A43]/30 bg-white text-[#0B5A43] hover:border-[#0B5A43] hover:bg-[#EAF5F0]"
        }
      >
        {isCurrent ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Active
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : isEnterprise ? (
          <>
            <Phone className="mr-2 h-4 w-4" />
            Contact sales
          </>
        ) : (
          <>
            {buttonLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </article>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const transactionPlan = PLANS.find((plan) => plan.id === transaction.planId);

  const date = transaction.paidAt ?? transaction.createdAt;

  return (
    <div className="grid gap-4 p-4 hover:bg-gray-50 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]">
          <ReceiptText className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-950">
            {transactionPlan?.name ?? transaction.planId}
          </p>

          <p className="mt-0.5 text-xs text-gray-500">
            {transaction.billingCycle === "yearly" ? "Yearly" : "Monthly"} ·{" "}
            {formatDate(date)}
            {transaction.paymentType ? ` · ${transaction.paymentType}` : ""}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            Order ID: {transaction.orderId}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm font-semibold text-gray-950">
          {formatPrice(transaction.amount)}
        </p>

        <TransactionStatusBadge status={transaction.status} />
      </div>
    </div>
  );
}

function EmptyTransactions() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-gray-400">
        <ReceiptText className="h-6 w-6" />
      </div>

      <p className="mt-4 font-semibold text-gray-800">No payment history yet</p>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Billing transactions will appear here after a payment is created.
      </p>
    </div>
  );
}

function PlanStatusBadge({ status }: { status: string }) {
  const className =
    status === "active"
      ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
      : status === "failed"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "pending"
          ? "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]"
          : "border-gray-200 bg-gray-50 text-gray-600";

  const Icon =
    status === "active"
      ? ShieldCheck
      : status === "failed"
        ? XCircle
        : status === "pending"
          ? Clock
          : Info;

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABEL[status] ?? formatText(status)}
    </span>
  );
}

function TransactionStatusBadge({ status }: { status: string }) {
  const normalized = status === "settlement" ? "paid" : status;

  const className =
    normalized === "paid" || normalized === "active"
      ? "border-[#0B5A43]/20 bg-[#EAF5F0] text-[#0B5A43]"
      : normalized === "failed" || normalized === "expire"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-[#F7A81B]/40 bg-[#FFF4D9] text-[#7A5A00]";

  const label =
    normalized === "paid" || normalized === "active"
      ? "Paid"
      : normalized === "pending"
        ? "Pending"
        : normalized === "failed" || normalized === "expire"
          ? "Failed"
          : formatText(normalized);

  return (
    <span className={`border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function getPlanButtonLabel({
  targetPlanId,
  currentPlanId,
}: {
  targetPlanId: string;
  currentPlanId: string;
}) {
  if (targetPlanId === "free") return "Downgrade";

  const currentIndex = PLANS.findIndex((plan) => plan.id === currentPlanId);
  const targetIndex = PLANS.findIndex((plan) => plan.id === targetPlanId);

  if (currentIndex >= 0 && targetIndex >= 0 && targetIndex < currentIndex) {
    return "Downgrade";
  }

  return "Upgrade";
}

function getUsagePercent(value: number, limit: number) {
  if (!limit || limit >= 999999) return 0;

  return Math.min(100, Math.round((value / limit) * 100));
}

function formatLimit(value: number) {
  if (value >= 999999) return "∞";
  return formatNumber(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatText(value?: string | null) {
  if (!value) return "-";

  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function loadMidtransSnap(clientKey?: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("midtrans-snap");

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap";
    script.src =
      process.env.NODE_ENV === "production"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

    script.setAttribute("data-client-key", clientKey || "");

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Midtrans Snap."));

    document.head.appendChild(script);
  });
}
