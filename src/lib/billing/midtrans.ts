// src/lib/billing/midtrans.ts
// Midtrans payment gateway integration for HRIS SaaS subscriptions

import { PLANS, getPlanById } from './plans'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const BASE_URL = IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2'

const SNAP_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MidtransSnapParams {
  orderId: string
  grossAmount: number
  planId: string
  organizationId: string
  organizationName: string
  customerEmail: string
  customerName: string
  billingCycle: 'monthly' | 'yearly'
}

export interface MidtransTransaction {
  token: string
  redirectUrl: string
}

export interface MidtransWebhookPayload {
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  payment_type: string
  order_id: string
  merchant_id: string
  gross_amount: string
  fraud_status?: string
  currency: string
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function authHeader() {
  const encoded = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')
  return `Basic ${encoded}`
}

// ─── Create Snap Token (popup checkout) ──────────────────────────────────────

export async function createSnapToken(params: MidtransSnapParams): Promise<MidtransTransaction> {
  const plan = getPlanById(params.planId)
  if (!plan) throw new Error('Invalid plan')

  const price = params.billingCycle === 'yearly'
    ? Math.round(plan.price * 12 * 0.8) // 20% discount yearly
    : plan.price

  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: price,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: [
      {
        id: plan.id,
        price: price,
        quantity: 1,
        name: `${plan.name} Plan (${params.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})`,
        category: 'Software Subscription',
      },
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?payment=success`,
      error: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?payment=error`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?payment=pending`,
    },
    custom_field1: params.organizationId,
    custom_field2: params.planId,
    custom_field3: params.billingCycle,
  }

  const res = await fetch(`${SNAP_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Midtrans error: ${err}`)
  }

  const data = await res.json()
  return { token: data.token, redirectUrl: data.redirect_url }
}

// ─── Get transaction status ───────────────────────────────────────────────────

export async function getTransactionStatus(orderId: string) {
  const res = await fetch(`${BASE_URL}/${orderId}/status`, {
    headers: { Authorization: authHeader() },
  })
  if (!res.ok) throw new Error('Failed to fetch transaction status')
  return res.json()
}

// ─── Verify webhook signature ─────────────────────────────────────────────────

export async function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): Promise<boolean> {
  const crypto = await import('crypto')
  const hash = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex')
  return hash === signatureKey
}

// ─── Map Midtrans status → internal status ────────────────────────────────────

export function mapTransactionStatus(
  transactionStatus: string,
  fraudStatus?: string
): 'active' | 'pending' | 'failed' | 'expired' {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'challenge' ? 'pending' : 'active'
  }
  if (transactionStatus === 'settlement') return 'active'
  if (['pending', 'authorize'].includes(transactionStatus)) return 'pending'
  if (['cancel', 'deny', 'failure'].includes(transactionStatus)) return 'failed'
  if (transactionStatus === 'expire') return 'expired'
  return 'pending'
}

// ─── Calculate next billing date ──────────────────────────────────────────────

export function getNextBillingDate(cycle: 'monthly' | 'yearly'): Date {
  const now = new Date()
  if (cycle === 'yearly') {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export { MIDTRANS_CLIENT_KEY }