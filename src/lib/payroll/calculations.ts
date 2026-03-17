import { Decimal } from '@prisma/client/runtime/library'
 
export interface SalaryComponents {
  baseSalary: number
  allowances: number
  overtime: number
  bonus: number
}
 
export interface Deductions {
  bpjsKesehatan: number
  bpjsKetenagakerjaan: number
  pph21: number
  otherDeductions: number
}
 
export interface PayrollCalculation {
  grossSalary: number
  totalDeductions: number
  netSalary: number
  components: SalaryComponents
  deductions: Deductions
}
 
// BPJS Kesehatan calculation (1% of base salary)
export function calculateBpjsKesehatan(baseSalary: number): number {
  const rate = 0.01 // 1%
  return Math.round(baseSalary * rate)
}
 
// BPJS Ketenagakerjaan calculation (2% of base salary)
export function calculateBpjsKetenagakerjaan(baseSalary: number): number {
  const rate = 0.02 // 2%
  return Math.round(baseSalary * rate)
}
 
// Simplified PPh21 calculation
// Note: Real PPh21 is complex with brackets, PTKP, etc.
// This is simplified for demo purposes
export function calculatePph21(grossSalary: number, isMarried: boolean = false): number {
  // Annual gross
  const annualGross = grossSalary * 12
  
  // PTKP (Tax-free income) 2024
  const ptkp = isMarried ? 63000000 : 54000000 // Simplified
  
  // Taxable income
  const taxableIncome = Math.max(0, annualGross - ptkp)
  
  // Progressive tax rates (simplified)
  let tax = 0
  
  if (taxableIncome <= 60000000) {
    tax = taxableIncome * 0.05 // 5%
  } else if (taxableIncome <= 250000000) {
    tax = 60000000 * 0.05 + (taxableIncome - 60000000) * 0.15 // 15%
  } else if (taxableIncome <= 500000000) {
    tax = 60000000 * 0.05 + 190000000 * 0.15 + (taxableIncome - 250000000) * 0.25 // 25%
  } else {
    tax = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + (taxableIncome - 500000000) * 0.30 // 30%
  }
  
  // Monthly tax
  return Math.round(tax / 12)
}
 
// Calculate overtime pay
export function calculateOvertimePay(
  baseSalary: number,
  overtimeHours: number
): number {
  // Hourly rate = base salary / 173 hours (standard work hours/month)
  const hourlyRate = baseSalary / 173
  
  // Overtime multiplier (1.5x for first 2 hours, 2x after)
  let overtimePay = 0
  
  if (overtimeHours <= 2) {
    overtimePay = overtimeHours * hourlyRate * 1.5
  } else {
    overtimePay = 2 * hourlyRate * 1.5 + (overtimeHours - 2) * hourlyRate * 2
  }
  
  return Math.round(overtimePay)
}
 
// Main payroll calculation
export function calculatePayroll(
  baseSalary: number,
  allowances: number = 0,
  overtimeHours: number = 0,
  bonus: number = 0,
  otherDeductions: number = 0,
  isMarried: boolean = false
): PayrollCalculation {
  // Calculate overtime pay
  const overtime = calculateOvertimePay(baseSalary, overtimeHours)
  
  // Gross salary
  const grossSalary = baseSalary + allowances + overtime + bonus
  
  // Calculate deductions
  const bpjsKesehatan = calculateBpjsKesehatan(baseSalary)
  const bpjsKetenagakerjaan = calculateBpjsKetenagakerjaan(baseSalary)
  const pph21 = calculatePph21(grossSalary, isMarried)
  
  const totalDeductions = bpjsKesehatan + bpjsKetenagakerjaan + pph21 + otherDeductions
  
  // Net salary
  const netSalary = grossSalary - totalDeductions
  
  return {
    grossSalary,
    totalDeductions,
    netSalary,
    components: {
      baseSalary,
      allowances,
      overtime,
      bonus,
    },
    deductions: {
      bpjsKesehatan,
      bpjsKetenagakerjaan,
      pph21,
      otherDeductions,
    },
  }
}
 
// Format currency (Indonesian Rupiah)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
 
// Format month name
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || 'Unknown'
}
 
// Get current month/year
export function getCurrentPeriod(): { month: number; year: number } {
  const now = new Date()
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear(),
  }
}
 
// Get period start/end dates
export function getPeriodDates(month: number, year: number): {
  periodStart: Date
  periodEnd: Date
} {
  const periodStart = new Date(year, month - 1, 1) // First day of month
  const periodEnd = new Date(year, month, 0) // Last day of month
  
  return { periodStart, periodEnd }
}
 