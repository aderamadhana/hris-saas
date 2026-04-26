// src/app/api/billing/webhook/midtrans/route.ts
// Handles payment notifications from Midtrans

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import {
  verifySignature,
  mapTransactionStatus,
  getNextBillingDate,
} from '@/src/lib/billing/midtrans'
import { getPlanById } from '@/src/lib/billing/plans'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      custom_field1: organizationId,
      custom_field2: planId,
      custom_field3: billingCycle,
    } = payload

    // 1. Verify signature
    const isValid = await verifySignature(order_id, status_code, gross_amount, signature_key)
    if (!isValid) {
      console.error('Invalid Midtrans signature for order:', order_id)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 2. Find transaction in DB
    const transaction = await prisma.billingTransaction.findUnique({
      where: { orderId: order_id },
    })

    if (!transaction) {
      // Try to look up by midtrans order id
      console.warn('Transaction not found for order:', order_id)
      // Still return 200 so Midtrans doesn't retry
      return NextResponse.json({ success: true })
    }

    // 3. Map status
    const internalStatus = mapTransactionStatus(transaction_status, fraud_status)

    // 4. Update transaction record
    await prisma.billingTransaction.update({
      where: { orderId: order_id },
      data: {
        status: internalStatus,
        paymentType: payment_type,
        midtransTransactionId: transaction_id,
        paidAt: internalStatus === 'active' ? new Date() : undefined,
        updatedAt: new Date(),
      },
    })

    // 5. If payment successful → activate subscription
    if (internalStatus === 'active') {
      const plan = getPlanById(planId || transaction.planId)
      if (!plan) {
        console.error('Plan not found:', planId)
        return NextResponse.json({ error: 'Plan not found' }, { status: 400 })
      }

      const cycle = (billingCycle || transaction.billingCycle) as 'monthly' | 'yearly'
      const nextBillingDate = getNextBillingDate(cycle)

      await prisma.organization.update({
        where: { id: organizationId || transaction.organizationId },
        data: {
          planType: plan.id,
          planStatus: 'active',
          employeeLimit: plan.employeeLimit,
          currentPeriodEnd: nextBillingDate,
          lastPaymentAt: new Date(),
          lastPaymentAmount: parseFloat(gross_amount),
        },
      })

      console.log(`✅ Subscription activated: org=${organizationId} plan=${plan.id} cycle=${cycle}`)
    }

    // 6. If payment failed/expired
    if (['failed', 'expired'].includes(internalStatus)) {
      await prisma.organization.update({
        where: { id: organizationId || transaction.organizationId },
        data: { planStatus: internalStatus },
      })
      console.log(`❌ Payment ${internalStatus} for order: ${order_id}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    // Return 200 to prevent Midtrans retries on our own errors
    return NextResponse.json({ success: false, error: error.message })
  }
}

// Midtrans sends POST only, no GET needed
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}