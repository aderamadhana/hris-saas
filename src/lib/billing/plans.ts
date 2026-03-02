export const PLAN_TYPES = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES]

export interface Plan {
  id: PlanType
  name: string
  price: number | null
  currency: string
  interval: 'month' | 'year'
  employeeLimit: number
  storageLimit: number
  features: string[]
  limitations?: string[]
  popular?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    employeeLimit: 5,
    storageLimit: 1,
    features: [
      'Up to 5 employees',
      'Basic attendance tracking',
      'Leave management',
      'Basic reports',
      'Email support',
    ],
    limitations: [
      'No payroll',
      'Limited storage (1GB)',
      'No API access',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    currency: 'USD',
    interval: 'month',
    employeeLimit: 20,
    storageLimit: 10,
    features: [
      'Up to 20 employees',
      'Full attendance tracking',
      'Leave management',
      'Basic payroll',
      'Advanced reports',
      'Email support',
      'Priority email support',
    ],
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    currency: 'USD',
    interval: 'month',
    employeeLimit: 50,
    storageLimit: 50,
    features: [
      'Up to 50 employees',
      'Advanced attendance',
      'Leave management',
      'Full payroll with tax calculation',
      'Advanced reports & analytics',
      'API access',
      'Priority support',
      'Custom integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    currency: 'USD',
    interval: 'month',
    employeeLimit: 999999,
    storageLimit: 999,
    features: [
      'Unlimited employees',
      'All Professional features',
      'Dedicated account manager',
      'Custom development',
      'SLA guarantee (99.9% uptime)',
      'SSO integration',
      'White-label option',
      '24/7 phone support',
    ],
  },
]

export const getPlanById = (planId: string): Plan | undefined => {
  return PLANS.find((plan) => plan.id === planId)
}

export const formatPrice = (price: number | null, currency: string = 'USD'): string => {
  if (price === null) return 'Custom'
  if (price === 0) return 'Free'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price)
}