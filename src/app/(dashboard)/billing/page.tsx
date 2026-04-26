// src/app/(dashboard)/billing/page.tsx
// Server Component - fetch data directly, no API call needed

import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { redirect } from 'next/navigation'
import { BillingClient } from '@/src/components/billing/billing-client'
import { PLANS } from '@/src/lib/billing/plans'

export const dynamic = 'force-dynamic'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { organizationId: true, role: true },
  })

  if (!currentEmployee) redirect('/login')

  // Only owner can access billing
  if (currentEmployee.role !== 'owner') redirect('/dashboard')

  // Fetch org billing data
  const org = await prisma.organization.findUnique({
    where: { id: currentEmployee.organizationId },
    select: {
      planType: true,
      planStatus: true,
      employeeLimit: true,
      currentPeriodEnd: true,
      lastPaymentAt: true,
      lastPaymentAmount: true,
    },
  })

  // Count employees
  const employeeCount = await prisma.employee.count({
    where: {
      organizationId: currentEmployee.organizationId,
      status: 'active',
    },
  })

  // Transaction history — only if the table exists
  let transactions: any[] = []
  try {
    transactions = await (prisma as any).billingTransaction?.findMany({
      where: { organizationId: currentEmployee.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }) ?? []
  } catch {
    // Table not yet migrated — that's fine, just show empty
    transactions = []
  }

  const currentPlanId = org?.planType || 'free'
  const planConfig = PLANS.find(p => p.id === currentPlanId) ?? PLANS[0]

  const params = await searchParams
  const paymentResult = params.payment

  return (
    <BillingClient
      paymentResult={paymentResult}
      plan={{
        id: currentPlanId,
        name: planConfig.name,
        status: org?.planStatus || 'active',
        employeeLimit: org?.employeeLimit ?? planConfig.employeeLimit,
        currentPeriodEnd: org?.currentPeriodEnd?.toISOString() ?? null,
        lastPaymentAt: org?.lastPaymentAt?.toISOString() ?? null,
        lastPaymentAmount: org?.lastPaymentAmount ?? null,
      }}
      usage={{
        employees: employeeCount,
        employeeLimit: org?.employeeLimit ?? planConfig.employeeLimit,
        storageGB: 0.2,
        storageLimitGB: planConfig.storageGB,
      }}
      transactions={transactions.map((t: any) => ({
        id: t.id,
        orderId: t.orderId,
        planId: t.planId,
        billingCycle: t.billingCycle,
        amount: t.amount,
        status: t.status,
        paymentType: t.paymentType ?? null,
        paidAt: t.paidAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  )
}