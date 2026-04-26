// src/lib/billing/plans.ts

export interface Plan {
  id: string
  name: string
  price: number          // per month in IDR
  priceYearly: number    // total per year (20% discount)
  employeeLimit: number
  storageGB: number
  features: string[]
  popular?: boolean
  color: string
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    employeeLimit: 5,
    storageGB: 1,
    features: [
      'Hingga 5 karyawan',
      'Absensi dasar',
      'Manajemen cuti',
      'Profil karyawan',
      'Email support',
    ],
    color: 'gray',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 299_000,
    priceYearly: 2_870_400, // 299k * 12 * 0.8
    employeeLimit: 25,
    storageGB: 10,
    features: [
      'Hingga 25 karyawan',
      'Absensi lengkap',
      'Manajemen cuti (18 jenis)',
      'Payroll & slip gaji',
      'Laporan absensi',
      'Priority email support',
    ],
    popular: true,
    color: 'blue',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 699_000,
    priceYearly: 6_710_400,
    employeeLimit: 100,
    storageGB: 50,
    features: [
      'Hingga 100 karyawan',
      'Semua fitur Starter',
      'Multi-level approval',
      'Laporan lanjutan',
      'Export Excel & PDF',
      'Manajemen departemen',
      'Rekap absensi bulanan',
      'Priority support',
    ],
    color: 'purple',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,   // custom
    priceYearly: 0,
    employeeLimit: 999_999,
    storageGB: 500,
    features: [
      'Karyawan tidak terbatas',
      'Semua fitur Professional',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
      'Pelatihan tim',
    ],
    color: 'orange',
  },
]

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id)
}

export function formatPrice(amount: number): string {
  if (amount === 0) return 'Gratis'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getYearlyDiscount(plan: Plan): number {
  if (plan.price === 0) return 0
  return Math.round(((plan.price * 12 - plan.priceYearly) / (plan.price * 12)) * 100)
}