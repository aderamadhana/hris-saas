'use client'

// src/components/billing/billing-client.tsx
// Pure UI component — all data comes from the Server Component as props

import { useState } from 'react'
import {
  CheckCircle, AlertTriangle, Clock, Users, HardDrive,
  ArrowRight, RefreshCw, Phone, ChevronRight,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { PLANS, formatPrice } from '@/src/lib/billing/plans'
import { cn } from '@/src/lib/utils'

interface PlanData {
  id: string
  name: string
  status: string
  employeeLimit: number
  currentPeriodEnd: string | null
  lastPaymentAt: string | null
  lastPaymentAmount: number | null
}

interface UsageData {
  employees: number
  employeeLimit: number
  storageGB: number
  storageLimitGB: number
}

interface Transaction {
  id: string
  orderId: string
  planId: string
  billingCycle: string
  amount: number
  status: string
  paymentType: string | null
  paidAt: string | null
  createdAt: string
}

interface Props {
  paymentResult?: string
  plan: PlanData
  usage: UsageData
  transactions: Transaction[]
}

type Cycle = 'monthly' | 'yearly'

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  pending: 'Menunggu',
  failed: 'Gagal',
  expired: 'Kadaluarsa',
}

export function BillingClient({ paymentResult, plan, usage, transactions }: Props) {
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  const usagePct = Math.min(
    100,
    Math.round((usage.employees / (usage.employeeLimit || 1)) * 100),
  )
  const storagePct = Math.min(
    100,
    Math.round((usage.storageGB / (usage.storageLimitGB || 1)) * 100),
  )

  const handleUpgrade = async (planId: string) => {
    if (processingPlan) return

    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@hris.id?subject=Enterprise Plan'
      return
    }

    setProcessingPlan(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      })

      // Guard: make sure we got JSON back
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error('Server error — pastikan API route sudah di-copy ke project.')
      }

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal membuat pembayaran')
      if (data.downgraded) {
        window.location.reload()
        return
      }
      if (!data.snapToken) throw new Error('Snap token tidak ditemukan')

      // Load Midtrans Snap script
      const existing = document.getElementById('midtrans-snap')
      if (existing) existing.remove()

      const script = document.createElement('script')
      script.id = 'midtrans-snap'
      script.src =
        process.env.NODE_ENV === 'production'
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'
      script.setAttribute('data-client-key', data.clientKey || '')
      document.head.appendChild(script)

      script.onload = () => {
        ;(window as any).snap.pay(data.snapToken, {
          onSuccess: () => {
            window.location.href = '/dashboard/billing?payment=success'
          },
          onPending: () => {
            window.location.href = '/dashboard/billing?payment=pending'
          },
          onError: () => {
            window.location.href = '/dashboard/billing?payment=error'
          },
          onClose: () => setProcessingPlan(null),
        })
      }
      script.onerror = () => {
        throw new Error('Gagal memuat Midtrans Snap')
      }
    } catch (err: any) {
      alert(err.message)
      setProcessingPlan(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment result banners */}
      {paymentResult === 'success' && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pembayaran berhasil!</p>
            <p className="text-sm">Langganan Anda telah diaktifkan.</p>
          </div>
        </div>
      )}
      {paymentResult === 'pending' && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <Clock className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pembayaran sedang diproses</p>
            <p className="text-sm">Langganan akan aktif setelah pembayaran dikonfirmasi.</p>
          </div>
        </div>
      )}
      {paymentResult === 'error' && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pembayaran gagal</p>
            <p className="text-sm">Silakan coba lagi atau hubungi support.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Langganan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola paket dan pembayaran organisasi Anda
        </p>
      </div>

      {/* Current plan + usage cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Plan */}
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Paket Saat Ini
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{plan.name}</span>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-xs font-medium',
                STATUS_BADGE[plan.status] ?? STATUS_BADGE.active,
              )}
            >
              {STATUS_LABEL[plan.status] ?? 'Aktif'}
            </span>
          </div>
          {plan.currentPeriodEnd && (
            <p className="mt-1 text-sm text-gray-500">
              Perpanjang:{' '}
              {new Date(plan.currentPeriodEnd).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {plan.lastPaymentAmount && (
            <p className="mt-0.5 text-xs text-gray-400">
              Pembayaran terakhir: {formatPrice(plan.lastPaymentAmount)}
            </p>
          )}
        </div>

        {/* Employee usage */}
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Karyawan
            </p>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {usage.employees}
            <span className="text-sm font-normal text-gray-400">
              /{usage.employeeLimit >= 999999 ? '∞' : usage.employeeLimit}
            </span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePct >= 90
                  ? 'bg-red-500'
                  : usagePct >= 70
                  ? 'bg-yellow-400'
                  : 'bg-green-500',
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {usagePct >= 80 && (
            <p className="mt-1 text-xs text-orange-600">
              <AlertTriangle className="mr-0.5 inline h-3 w-3" />
              Mendekati batas
            </p>
          )}
        </div>

        {/* Storage */}
        <div className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Penyimpanan
            </p>
            <HardDrive className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {usage.storageGB.toFixed(1)} GB
            <span className="text-sm font-normal text-gray-400">
              /{usage.storageLimitGB} GB
            </span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${storagePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="rounded-xl border bg-white p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pilih Paket</h2>
            <p className="text-sm text-gray-500">Hemat 20% dengan pembayaran tahunan</p>
          </div>
          {/* Cycle toggle */}
          <div className="flex items-center rounded-full border bg-gray-50 p-1">
            {(['monthly', 'yearly'] as Cycle[]).map(c => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  cycle === c
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {c === 'monthly' ? 'Bulanan' : 'Tahunan'}
                {c === 'yearly' && (
                  <span className="ml-1 text-xs font-semibold text-green-600">-20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map(p => {
            const isCurrent = p.id === plan.id
            const monthlyPrice =
              cycle === 'yearly' && p.priceYearly > 0
                ? Math.round(p.priceYearly / 12)
                : p.price

            return (
              <div
                key={p.id}
                className={cn(
                  'relative rounded-xl border-2 p-5 transition-all',
                  isCurrent
                    ? 'border-blue-500 bg-blue-50'
                    : p.popular
                    ? 'border-blue-200 shadow-md bg-white'
                    : 'border-gray-200 bg-white',
                )}
              >
                {p.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                      Popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">
                      Paket Anda
                    </span>
                  </div>
                )}

                <h3 className="font-bold text-gray-900">{p.name}</h3>

                <div className="mb-4 mt-3">
                  {p.id === 'enterprise' ? (
                    <p className="text-xl font-bold text-gray-900">Custom</p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        {monthlyPrice === 0 ? 'Gratis' : formatPrice(monthlyPrice)}
                      </p>
                      {monthlyPrice > 0 && (
                        <p className="text-xs text-gray-400">/bulan</p>
                      )}
                      {cycle === 'yearly' && p.priceYearly > 0 && (
                        <p className="mt-0.5 text-xs font-medium text-green-600">
                          Hemat {formatPrice(p.price * 12 - p.priceYearly)}/thn
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="mb-5 space-y-1.5 text-sm text-gray-600">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    <CheckCircle className="mr-1.5 h-4 w-4 text-green-600" />
                    Aktif
                  </Button>
                ) : p.id === 'enterprise' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      (window.location.href =
                        'mailto:sales@hris.id?subject=Enterprise Plan Inquiry')
                    }
                  >
                    <Phone className="mr-1.5 h-4 w-4" />
                    Hubungi Sales
                  </Button>
                ) : (
                  <Button
                    className={cn('w-full', p.popular && !isCurrent ? 'bg-blue-600 hover:bg-blue-700' : '')}
                    variant={p.popular ? 'default' : 'outline'}
                    onClick={() => handleUpgrade(p.id)}
                    disabled={!!processingPlan}
                  >
                    {processingPlan === p.id ? (
                      <>
                        <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        {p.id === 'free' ? 'Downgrade' : 'Upgrade'}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="rounded-xl border bg-white">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-gray-900">Riwayat Pembayaran</h2>
          </div>
          <div className="divide-y">
            {transactions.map(tx => {
              const txPlan = PLANS.find(p => p.id === tx.planId)
              const date = tx.paidAt ?? tx.createdAt
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {txPlan?.name ?? tx.planId} —{' '}
                      {tx.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {tx.paymentType ? ` · ${tx.paymentType}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {formatPrice(tx.amount)}
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-xs font-medium',
                        STATUS_BADGE[tx.status] ?? STATUS_BADGE.pending,
                      )}
                    >
                      {tx.status === 'active'
                        ? 'Lunas'
                        : tx.status === 'pending'
                        ? 'Pending'
                        : 'Gagal'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}