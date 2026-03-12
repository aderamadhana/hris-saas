// src/lib/utils/convert-decimal.ts
// Helper to convert Prisma Decimal types to numbers

import { Decimal } from '@prisma/client/runtime/library'

/**
 * Convert all Decimal fields in an object to numbers
 * Use before passing Prisma data to Client Components
 */
export function convertDecimalToNumber<T extends Record<string, any>>(
  obj: T
): T {
  if (!obj) return obj

  const result = { ...obj }

  for (const key in result) {
    const value = result[key]

    // Check if value is a Decimal
    if (value instanceof Decimal) {
      result[key] = value.toNumber() as any
    }
    // Recursively handle nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertDecimalToNumber(value) as any
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' ? convertDecimalToNumber(item) : item
      ) as any
    }
  }

  return result
}

/**
 * Convert specific Decimal fields to numbers
 * More explicit and type-safe
 */
export function convertEmployeeForClient(employee: any) {
  return {
    ...employee,
    baseSalary: employee.baseSalary?.toNumber() ?? 0,
    // Add other Decimal fields if needed
  }
}

/**
 * Convert payroll data (for future use)
 */
export function convertPayrollForClient(payroll: any) {
  return {
    ...payroll,
    baseSalary: payroll.baseSalary?.toNumber() ?? 0,
    allowances: payroll.allowances?.toNumber() ?? 0,
    deductions: payroll.deductions?.toNumber() ?? 0,
    netSalary: payroll.netSalary?.toNumber() ?? 0,
    // Add other Decimal fields as needed
  }
}

// Example usage:
/*
// In Server Component:
import { convertDecimalToNumber, convertEmployeeForClient } from '@/lib/utils/convert-decimal'

// Option 1: Auto convert all Decimal fields
const employeeData = convertDecimalToNumber(employee)

// Option 2: Explicit conversion (recommended)
const employeeData = convertEmployeeForClient(employee)

// Pass to Client Component
<ProfileForm employee={employeeData} />
*/