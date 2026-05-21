// lib/utils/convert-decimal.ts
// Helper to convert Prisma Decimal-like values to numbers

type DecimalLike = {
  toNumber: () => number
}

function isDecimalLike(value: unknown): value is DecimalLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as DecimalLike).toNumber === 'function'
  )
}

export function convertDecimalToNumber<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  if (isDecimalLike(obj)) {
    return obj.toNumber() as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDecimalToNumber(item)) as T
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertDecimalToNumber(value)
    }

    return result as T
  }

  return obj
}

export function convertEmployeeForClient(employee: any) {
  return {
    ...employee,
    baseSalary: isDecimalLike(employee?.baseSalary)
      ? employee.baseSalary.toNumber()
      : employee?.baseSalary ?? 0,
  }
}

export function convertPayrollForClient(payroll: any) {
  return {
    ...payroll,
    baseSalary: isDecimalLike(payroll?.baseSalary)
      ? payroll.baseSalary.toNumber()
      : payroll?.baseSalary ?? 0,
    allowances: isDecimalLike(payroll?.allowances)
      ? payroll.allowances.toNumber()
      : payroll?.allowances ?? 0,
    deductions: isDecimalLike(payroll?.deductions)
      ? payroll.deductions.toNumber()
      : payroll?.deductions ?? 0,
    netSalary: isDecimalLike(payroll?.netSalary)
      ? payroll.netSalary.toNumber()
      : payroll?.netSalary ?? 0,
  }
}