// src/app/api/billing/checkout/route.ts
// Creates a Midtrans Snap token for subscription checkout

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { createSnapToken } from '@/src/lib/billing/midtrans'
import { getPlanById } from '@/src/lib/billing/plans'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        organizationId: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Only owner can initiate payment
    if (currentEmployee.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only organization owner can manage billing' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { planId, billingCycle = 'monthly' } = body

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (plan.id === 'free') {
      // Downgrade to free — no payment needed, just update directly
      await prisma.organization.update({
        where: { id: currentEmployee.organizationId },
        data: {
          planType: 'free',
          planStatus: 'active',
          employeeLimit: plan.employeeLimit,
          currentPeriodEnd: null,
        },
      })
      return NextResponse.json({ success: true, downgraded: true })
    }

    if (plan.id === 'enterprise') {
      return NextResponse.json({
        error: 'Please contact sales for Enterprise pricing',
        contactSales: true,
      }, { status: 400 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: currentEmployee.organizationId },
      select: { id: true, name: true },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Create unique order ID
    const orderId = `HRIS-${organization.id.slice(0, 8).toUpperCase()}-${nanoid(8).toUpperCase()}`

    // Calculate amount
    const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.price

    // Create Snap token via Midtrans
    const { token, redirectUrl } = await createSnapToken({
      orderId,
      grossAmount: amount,
      planId: plan.id,
      organizationId: organization.id,
      organizationName: organization.name,
      customerEmail: currentEmployee.email,
      customerName: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
      billingCycle,
    })

    // Save pending transaction to DB
    await prisma.billingTransaction.create({
      data: {
        orderId,
        organizationId: organization.id,
        planId: plan.id,
        billingCycle,
        amount,
        currency: 'IDR',
        status: 'pending',
        midtransOrderId: orderId,
      },
    })

    return NextResponse.json({
      success: true,
      snapToken: token,
      redirectUrl,
      orderId,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}