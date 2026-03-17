export type PayrollStatus = 'draft' | 'approved' | 'paid'
 
export interface PayrollData {
  id: string
  employeeId: string
  month: number
  year: number
  
  // Components
  baseSalary: number
  allowances: number
  overtime: number
  bonus: number
  
  // Deductions
  bpjsKesehatan: number
  bpjsKetenagakerjaan: number
  pph21: number
  otherDeductions: number
  
  // Totals
  grossSalary: number
  totalDeductions: number
  netSalary: number
  
  // Attendance
  workDays: number
  absentDays: number
  lateDays: number
  overtimeHours: number
  
  // Status
  status: PayrollStatus
  paidDate?: Date | null
  
  // Employee info
  employee?: {
    firstName: string
    lastName: string
    employeeId: string
    position: string
  }
}
 
export interface GeneratePayrollInput {
  month: number
  year: number
  employeeIds?: string[] // If empty, generate for all active employees
}
 
export interface BulkPayrollResult {
  success: number
  failed: number
  errors: { employeeId: string; error: string }[]
}
 