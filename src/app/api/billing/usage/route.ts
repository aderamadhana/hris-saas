// src/app/api/billing/route.ts
// Returns billing data: current plan, usage, and transaction history

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (currentEmployee.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    // Count active employees
    const employeeCount = await prisma.employee.count({
      where: {
        organizationId: currentEmployee.organizationId,
        status: 'active',
      },
    })

    // Fetch last 10 transactions
    const transactions = await prisma.billingTransaction.findMany({
      where: { organizationId: currentEmployee.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderId: true,
        planId: true,
        billingCycle: true,
        amount: true,
        status: true,
        paymentType: true,
        paidAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          id: org.planType || 'free',
          name: org.planType || 'free',
          status: org.planStatus || 'active',
          employeeLimit: org.employeeLimit || 5,
          currentPeriodEnd: org.currentPeriodEnd,
          lastPaymentAt: org.lastPaymentAt,
          lastPaymentAmount: org.lastPaymentAmount,
        },
        usage: {
          employees: employeeCount,
          storageGB: 0.2, // placeholder — integrate Supabase storage API if needed
        },
        transactions,
      },
    })
  } catch (error: any) {
    console.error('Billing GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}