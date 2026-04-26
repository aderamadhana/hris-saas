'use client'

// src/app/(dashboard)/billing/page.tsx
// Billing overview + upgrade with Midtrans payment

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CreditCard, CheckCircle, AlertTriangle, Zap,
  Users, HardDrive, RefreshCw, ArrowRight, Phone,
  Clock, TrendingUp, Calendar,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { PLANS, formatPrice, getYearlyDiscount } from '@/src/lib/billing/plans'
import { cn } from '@/src/lib/utils'

interface BillingData {
  plan: {
    id: string; name: string; status: string
    employeeLimit: number; currentPeriodEnd: string | null
    lastPaymentAt: string | null; lastPaymentAmount: number | null
  }
  usage: { employees: number; storageGB: number }
  transactions: Array<{
    id: string; orderId: string; planId: string
    billingCycle: string; amount: number; status: string
    paymentType: string | null; paidAt: string | null; createdAt: string
  }>
}

type Cycle = 'monthly' | 'yearly'

export default function BillingPage() {
  const searchParams = useSearchParams()
  const paymentResult = searchParams.get('payment')

  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  useEffect(() => {
    fetchBilling()
  }, [])

  const fetchBilling = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/billing')
      const data = await res.json()
      if (data.success) setBillingData(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (processingPlan) return
    setProcessingPlan(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      })
      const data = await res.json()

      if (data.downgraded) {
        fetchBilling()
        return
      }

      if (data.contactSales) {
        window.location.href = 'mailto:sales@hris.id?subject=Enterprise Plan Inquiry'
        return
      }

      if (!data.snapToken) throw new Error(data.error || 'Failed to create payment')

      // Load Midtrans Snap
      const script = document.createElement('script')
      script.src = process.env.NODE_ENV === 'production'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js'
      script.dataset.clientKey = data.clientKey
      document.head.appendChild(script)

      script.onload = () => {
        ;(window as any).snap.pay(data.snapToken, {
          onSuccess: () => { fetchBilling(); window.history.replaceState({}, '', '/dashboard/billing?payment=success') },
          onPending: () => { window.history.replaceState({}, '', '/dashboard/billing?payment=pending') },
          onError: () => { window.history.replaceState({}, '', '/dashboard/billing?payment=error') },
          onClose: () => setProcessingPlan(null),
        })
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessingPlan(null)
    }
  }

  const currentPlan = billingData ? PLANS.find(p => p.id === billingData.plan.id) : PLANS[0]
  const usagePercent = billingData
    ? Math.min(100, Math.round((billingData.usage.employees / billingData.plan.employeeLimit) * 100))
    : 0

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="space-y-6">
      {/* Payment result banner */}
      {paymentResult === 'success' && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pembayaran berhasil!</p>
            <p className="text-sm">Langganan Anda telah diaktifkan.</p>
          </div>
        </div>
      )}
      {paymentResult === 'pending' && (
        <div className="flex items-center gap-3 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
          <Clock className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pembayaran sedang diproses</p>
            <p className="text-sm">Langganan akan diaktifkan setelah pembayaran dikonfirmasi.</p>
          </div>
        </div>
      )}
      {paymentResult === 'error' && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
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
        <p className="mt-1 text-sm text-gray-500">Kelola paket dan pembayaran organisasi Anda</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />Memuat...
        </div>
      ) : (
        <>
          {/* Current plan card */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Plan status */}
            <div className="rounded-xl border bg-white p-5 sm:col-span-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paket Saat Ini</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{currentPlan?.name}</span>
                <Badge className={STATUS_COLORS[billingData?.plan.status || 'active']}>
                  {billingData?.plan.status === 'active' ? 'Aktif' :
                   billingData?.plan.status === 'pending' ? 'Pending' :
                   billingData?.plan.status === 'failed' ? 'Gagal' : 'Kadaluarsa'}
                </Badge>
              </div>
              {billingData?.plan.currentPeriodEnd && (
                <p className="mt-1 text-sm text-gray-500">
                  Perpanjang:{' '}
                  {new Date(billingData.plan.currentPeriodEnd).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
              {billingData?.plan.lastPaymentAt && (
                <p className="mt-1 text-xs text-gray-400">
                  Pembayaran terakhir: {formatPrice(billingData.plan.lastPaymentAmount || 0)}
                </p>
              )}
            </div>

            {/* Employee usage */}
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Karyawan</p>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {billingData?.usage.employees}
                <span className="text-sm font-normal text-gray-400">
                  /{billingData?.plan.employeeLimit === 999999 ? '∞' : billingData?.plan.employeeLimit}
                </span>
              </p>
              <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all',
                    usagePercent >= 90 ? 'bg-red-500' :
                    usagePercent >= 70 ? 'bg-yellow-400' : 'bg-green-500'
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent >= 80 && (
                <p className="mt-1 text-xs text-orange-600">
                  <AlertTriangle className="inline h-3 w-3 mr-0.5" />
                  Mendekati batas
                </p>
              )}
            </div>

            {/* Storage */}
            <div className="rounded-xl border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Penyimpanan</p>
                <HardDrive className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">
                {billingData?.usage.storageGB.toFixed(1)} GB
                <span className="text-sm font-normal text-gray-400">
                  /{currentPlan?.storageGB} GB
                </span>
              </p>
              <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.min(100, ((billingData?.usage.storageGB || 0) / (currentPlan?.storageGB || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pilih Paket</h2>
                <p className="text-sm text-gray-500">Hemat 20% dengan pembayaran tahunan</p>
              </div>
              {/* Cycle toggle */}
              <div className="flex items-center rounded-full border p-1 bg-gray-50">
                <button
                  onClick={() => setCycle('monthly')}
                  className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    cycle === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  )}
                >
                  Bulanan
                </button>
                <button
                  onClick={() => setCycle('yearly')}
                  className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                    cycle === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                  )}
                >
                  Tahunan
                  <span className="ml-1 text-xs text-green-600 font-semibold">-20%</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map(plan => {
                const isCurrent = plan.id === billingData?.plan.id
                const price = cycle === 'yearly' && plan.priceYearly > 0
                  ? Math.round(plan.priceYearly / 12)
                  : plan.price

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'relative rounded-xl border-2 p-5 transition-all',
                      isCurrent ? 'border-blue-500 bg-blue-50' :
                      plan.popular ? 'border-blue-200 shadow-md' : 'border-gray-200 bg-white',
                    )}
                  >
                    {plan.popular && !isCurrent && (
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

                    <h3 className="font-bold text-gray-900">{plan.name}</h3>

                    <div className="mt-3 mb-4">
                      {plan.id === 'enterprise' ? (
                        <p className="text-xl font-bold text-gray-900">Custom</p>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-gray-900">
                            {price === 0 ? 'Gratis' : formatPrice(price)}
                          </p>
                          {price > 0 && (
                            <p className="text-xs text-gray-400">/bulan</p>
                          )}
                          {cycle === 'yearly' && plan.priceYearly > 0 && (
                            <p className="text-xs text-green-600 font-medium mt-0.5">
                              Hemat {formatPrice(plan.price * 12 - plan.priceYearly)}/tahun
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <ul className="space-y-1.5 mb-5 text-sm text-gray-600">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        <CheckCircle className="h-4 w-4 mr-1.5 text-green-600" />
                        Aktif
                      </Button>
                    ) : plan.id === 'enterprise' ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.location.href = 'mailto:sales@hris.id'}
                      >
                        <Phone className="h-4 w-4 mr-1.5" />
                        Hubungi Sales
                      </Button>
                    ) : (
                      <Button
                        className={cn('w-full', plan.popular && !isCurrent ? 'bg-blue-600 hover:bg-blue-700' : '')}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={!!processingPlan}
                      >
                        {processingPlan === plan.id ? (
                          <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Memproses...</>
                        ) : (
                          <>{plan.id === 'free' ? 'Downgrade' : 'Upgrade'} <ArrowRight className="h-4 w-4 ml-1" /></>
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Transaction history */}
          {billingData && billingData.transactions.length > 0 && (
            <div className="rounded-xl border bg-white">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-900">Riwayat Pembayaran</h2>
              </div>
              <div className="divide-y">
                {billingData.transactions.map(tx => {
                  const plan = PLANS.find(p => p.id === tx.planId)
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {plan?.name || tx.planId} — {tx.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {tx.paidAt
                            ? new Date(tx.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                            : new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {tx.paymentType && ` · ${tx.paymentType}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{formatPrice(tx.amount)}</span>
                        <Badge className={
                          tx.status === 'active' ? 'bg-green-100 text-green-700' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {tx.status === 'active' ? 'Lunas' :
                           tx.status === 'pending' ? 'Pending' : 'Gagal'}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}