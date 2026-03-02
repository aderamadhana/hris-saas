import prisma from '@/src/lib/prisma'

export class UsageLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UsageLimitError'
  }
}

// Check if organization can add more employees
export async function canAddEmployee(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      employeeLimit: true,
      planType: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const currentCount = await prisma.employee.count({
    where: {
      organizationId,
      status: 'active',
    },
  })

  if (currentCount >= org.employeeLimit) {
    throw new UsageLimitError(
      `Employee limit reached (${org.employeeLimit}). Please upgrade your plan to add more employees.`
    )
  }

  return true
}

// Get current usage for organization
export async function getCurrentUsage(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      employeeLimit: true,
      storageLimit: true,
      planType: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const activeEmployees = await prisma.employee.count({
    where: {
      organizationId,
      status: 'active',
    },
  })

  return {
    employees: {
      current: activeEmployees,
      limit: org.employeeLimit,
      percentage: Math.round((activeEmployees / org.employeeLimit) * 100),
    },
    storage: {
      current: 0, // TODO: Calculate actual storage
      limit: org.storageLimit,
      percentage: 0,
    },
    planType: org.planType,
  }
}

// Check if approaching limit (80%+)
export async function isApproachingLimit(organizationId: string): Promise<boolean> {
  const usage = await getCurrentUsage(organizationId)
  return usage.employees.percentage >= 80
}