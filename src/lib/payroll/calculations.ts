// src/lib/payroll/calculations.ts
// Kalkulasi payroll berdasarkan konfigurasi per organisasi

import { PayrollConfig } from '@prisma/client'

export interface SalaryComponents {
  baseSalary: number
  allowances: number
  overtimeHours?: number
  lateMinutes?: number         // total menit terlambat dalam sebulan
  earlyLeaveMinutes?: number   // total menit pulang cepat
  absentDays?: number
  bonus?: number
  customAllowances?: CustomComponent[]
  customDeductions?: CustomComponent[]
  workingDays?: number         // hari kerja aktual
}

export interface CustomComponent {
  name: string
  amount: number
  taxable?: boolean
}

export interface PayrollResult {
  // Pendapatan
  baseSalary: number
  allowances: number
  overtimePay: number
  bonus: number
  customAllowances: CustomComponent[]
  grossSalary: number

  // Potongan
  bpjsKesEmployee: number
  bpjsTkJHT: number
  bpjsTkJP: number
  pph21: number
  lateDeduction: number
  earlyLeaveDeduction: number
  absentDeduction: number
  customDeductions: CustomComponent[]
  totalDeductions: number

  // Kontribusi Perusahaan (tidak memotong gaji, untuk info)
  bpjsKesEmployer: number
  bpjsTkJHTEmployer: number
  bpjsTkJPEmployer: number
  bpjsTkJKK: number
  bpjsTkJKM: number
  totalEmployerContribution: number

  // Hasil akhir
  netSalary: number

  // Info kalkulasi
  overtimeHourlyRate: number
  dailySalary: number
  minuteSalary: number
  breakdown: {
    lateMinutes: number
    earlyLeaveMinutes: number
    absentDays: number
    overtimeHours: number
  }
}

// ─────────────────────────────────────────────────────────
// KALKULASI UTAMA
// ─────────────────────────────────────────────────────────
export function calculatePayroll(
  components: SalaryComponents,
  config: PayrollConfig
): PayrollResult {
  const {
    baseSalary,
    allowances = 0,
    overtimeHours = 0,
    lateMinutes = 0,
    earlyLeaveMinutes = 0,
    absentDays = 0,
    bonus = 0,
    customAllowances: inputCustomAllowances = [],
    customDeductions: inputCustomDeductions = [],
    workingDays,
  } = components

  const workingDaysMonth = config.workingDaysPerMonth || 22

  // ── Gaji per hari & per menit ───────────────────────
  const dailySalary = baseSalary / workingDaysMonth
  const hourSalary = baseSalary / (workingDaysMonth * 8)
  const minuteSalary = hourSalary / 60

  // ── Overtime ────────────────────────────────────────
  const overtimePay = calculateOvertime(baseSalary, overtimeHours, config)
  const overtimeHourlyRate = baseSalary / config.overtimeHourlyBasis

  // ── Custom allowances dari config ────────────────────
  let configCustomAllowances: CustomComponent[] = []
  try {
    configCustomAllowances = JSON.parse(config.customAllowances || '[]')
  } catch { configCustomAllowances = [] }

  const allCustomAllowances = [...inputCustomAllowances, ...configCustomAllowances]

  // ── Gross Salary ─────────────────────────────────────
  const customAllowancesTotal = allCustomAllowances.reduce((s, c) => s + c.amount, 0)
  const grossSalary = baseSalary + allowances + overtimePay + bonus + customAllowancesTotal

  // ── Potongan Keterlambatan ────────────────────────────
  const lateDeduction = calculateLateDeduction(
    lateMinutes, baseSalary, dailySalary, minuteSalary, config
  )

  // ── Potongan Pulang Cepat ─────────────────────────────
  const earlyLeaveDeduction = calculateEarlyLeaveDeduction(
    earlyLeaveMinutes, baseSalary, dailySalary, minuteSalary, config
  )

  // ── Potongan Absensi ──────────────────────────────────
  const absentDeduction = calculateAbsentDeduction(absentDays, dailySalary, config)

  // ── BPJS Kesehatan ────────────────────────────────────
  const { bpjsKesEmployee, bpjsKesEmployer } = calculateBPJSKes(baseSalary, config)

  // ── BPJS Ketenagakerjaan ──────────────────────────────
  const { bpjsTkJHT, bpjsTkJP, bpjsTkJHTEmployer, bpjsTkJPEmployer, bpjsTkJKK, bpjsTkJKM } =
    calculateBPJSTK(baseSalary, config)

  // ── PPh21 ──────────────────────────────────────────────
  const taxableIncome = grossSalary - bpjsKesEmployee - bpjsTkJHT - bpjsTkJP
  const pph21 = calculatePPh21(taxableIncome, config)

  // ── Custom Deductions ─────────────────────────────────
  let configCustomDeductions: CustomComponent[] = []
  try {
    configCustomDeductions = JSON.parse(config.customDeductions || '[]')
  } catch { configCustomDeductions = [] }

  const allCustomDeductions = [...inputCustomDeductions, ...configCustomDeductions]
  const customDeductionsTotal = allCustomDeductions.reduce((s, c) => s + c.amount, 0)

  // ── Total Potongan ────────────────────────────────────
  const totalDeductions =
    bpjsKesEmployee +
    bpjsTkJHT +
    bpjsTkJP +
    pph21 +
    lateDeduction +
    earlyLeaveDeduction +
    absentDeduction +
    customDeductionsTotal

  // ── Kontribusi Perusahaan ─────────────────────────────
  const totalEmployerContribution =
    bpjsKesEmployer + bpjsTkJHTEmployer + bpjsTkJPEmployer + bpjsTkJKK + bpjsTkJKM

  // ── Gaji Bersih ───────────────────────────────────────
  const netSalary = Math.max(0, grossSalary - totalDeductions)

  return {
    baseSalary,
    allowances,
    overtimePay,
    bonus,
    customAllowances: allCustomAllowances,
    grossSalary,

    bpjsKesEmployee,
    bpjsTkJHT,
    bpjsTkJP,
    pph21,
    lateDeduction,
    earlyLeaveDeduction,
    absentDeduction,
    customDeductions: allCustomDeductions,
    totalDeductions,

    bpjsKesEmployer,
    bpjsTkJHTEmployer,
    bpjsTkJPEmployer,
    bpjsTkJKK,
    bpjsTkJKM,
    totalEmployerContribution,

    netSalary,
    overtimeHourlyRate,
    dailySalary,
    minuteSalary,
    breakdown: {
      lateMinutes,
      earlyLeaveMinutes,
      absentDays,
      overtimeHours,
    },
  }
}

// ─────────────────────────────────────────────────────────
// OVERTIME
// ─────────────────────────────────────────────────────────
function calculateOvertime(
  baseSalary: number,
  overtimeHours: number,
  config: PayrollConfig
): number {
  if (!config.overtimeEnabled || overtimeHours <= 0) return 0

  const hourlyBase = baseSalary / config.overtimeHourlyBasis

  // Jam ke-1: rate1, jam ke-2 dst: rate2
  const hour1 = Math.min(1, overtimeHours) * config.overtimeRate1 * hourlyBase
  const hour2Plus =
    Math.max(0, overtimeHours - 1) * config.overtimeRate2 * hourlyBase

  return hour1 + hour2Plus
}

// ─────────────────────────────────────────────────────────
// POTONGAN TERLAMBAT
// ─────────────────────────────────────────────────────────
function calculateLateDeduction(
  lateMinutes: number,
  baseSalary: number,
  dailySalary: number,
  minuteSalary: number,
  config: PayrollConfig
): number {
  if (!config.lateDeductEnabled || lateMinutes <= 0) return 0

  // Grace period
  const effectiveLateMinutes = Math.max(0, lateMinutes - config.lateGraceMinutes)
  if (effectiveLateMinutes <= 0) return 0

  switch (config.lateDeductMethod) {
    case 'per_minute':
      return effectiveLateMinutes * config.lateDeductAmount

    case 'per_hour':
      return Math.ceil(effectiveLateMinutes / 60) * config.lateDeductAmount

    case 'fixed':
      // Nominal tetap per kejadian keterlambatan (bukan per menit)
      return config.lateDeductAmount

    case 'salary_cut':
      // Potong sekian % dari gaji harian
      return dailySalary * (config.lateDeductPercent / 100)

    case 'minute_salary':
      // Potong berdasarkan upah per menit
      return effectiveLateMinutes * minuteSalary

    default:
      return 0
  }
}

// ─────────────────────────────────────────────────────────
// POTONGAN PULANG CEPAT
// ─────────────────────────────────────────────────────────
function calculateEarlyLeaveDeduction(
  earlyLeaveMinutes: number,
  baseSalary: number,
  dailySalary: number,
  minuteSalary: number,
  config: PayrollConfig
): number {
  if (!config.earlyLeaveDeductEnabled || earlyLeaveMinutes <= 0) return 0

  switch (config.earlyLeaveDeductMethod) {
    case 'per_minute':
      return earlyLeaveMinutes * config.earlyLeaveDeductAmount

    case 'per_hour':
      return Math.ceil(earlyLeaveMinutes / 60) * config.earlyLeaveDeductAmount

    case 'salary_cut':
      return dailySalary * (config.earlyLeaveDeductPercent / 100)

    case 'minute_salary':
      return earlyLeaveMinutes * minuteSalary

    default:
      return 0
  }
}

// ─────────────────────────────────────────────────────────
// POTONGAN ABSENSI
// ─────────────────────────────────────────────────────────
function calculateAbsentDeduction(
  absentDays: number,
  dailySalary: number,
  config: PayrollConfig
): number {
  if (!config.absentDeductEnabled || absentDays <= 0) return 0

  switch (config.absentDeductMethod) {
    case 'daily_salary':
      return absentDays * dailySalary

    case 'fixed':
      return absentDays * config.absentDeductAmount

    default:
      return 0
  }
}

// ─────────────────────────────────────────────────────────
// BPJS KESEHATAN
// ─────────────────────────────────────────────────────────
function calculateBPJSKes(
  baseSalary: number,
  config: PayrollConfig
): { bpjsKesEmployee: number; bpjsKesEmployer: number } {
  if (!config.bpjsKesEnabled) {
    return { bpjsKesEmployee: 0, bpjsKesEmployer: 0 }
  }

  // Batas atas gaji untuk BPJS Kes (default Rp 12jt)
  const cappedSalary = config.bpjsKesMaxSalary
    ? Math.min(baseSalary, config.bpjsKesMaxSalary)
    : baseSalary

  return {
    bpjsKesEmployee: cappedSalary * (config.bpjsKesEmployee / 100),
    bpjsKesEmployer: cappedSalary * (config.bpjsKesEmployer / 100),
  }
}

// ─────────────────────────────────────────────────────────
// BPJS KETENAGAKERJAAN
// ─────────────────────────────────────────────────────────
function calculateBPJSTK(
  baseSalary: number,
  config: PayrollConfig
): {
  bpjsTkJHT: number
  bpjsTkJP: number
  bpjsTkJHTEmployer: number
  bpjsTkJPEmployer: number
  bpjsTkJKK: number
  bpjsTkJKM: number
} {
  if (!config.bpjsTkEnabled) {
    return {
      bpjsTkJHT: 0,
      bpjsTkJP: 0,
      bpjsTkJHTEmployer: 0,
      bpjsTkJPEmployer: 0,
      bpjsTkJKK: 0,
      bpjsTkJKM: 0,
    }
  }

  const cappedSalary = config.bpjsTkMaxSalary
    ? Math.min(baseSalary, config.bpjsTkMaxSalary)
    : baseSalary

  return {
    bpjsTkJHT: cappedSalary * (config.bpjsTkJHT / 100),
    bpjsTkJP: cappedSalary * (config.bpjsTkJP / 100),
    bpjsTkJHTEmployer: cappedSalary * (config.bpjsTkJHTEmployer / 100),
    bpjsTkJPEmployer: cappedSalary * (config.bpjsTkJPEmployer / 100),
    bpjsTkJKK: cappedSalary * (config.bpjsTkJKK / 100),
    bpjsTkJKM: cappedSalary * (config.bpjsTkJKM / 100),
  }
}

// ─────────────────────────────────────────────────────────
// PPh21 (Progressive)
// ─────────────────────────────────────────────────────────
function calculatePPh21(
  grossMonthly: number,
  config: PayrollConfig
): number {
  if (!config.pph21Enabled) return 0

  const annualGross = grossMonthly * 12
  const ptkp = config.pph21PTKP || 54_000_000
  const pkp = Math.max(0, annualGross - ptkp)

  // Tarif progresif UU HPP 2021
  let annualTax = 0
  if (pkp <= 60_000_000) {
    annualTax = pkp * 0.05
  } else if (pkp <= 250_000_000) {
    annualTax = 3_000_000 + (pkp - 60_000_000) * 0.15
  } else if (pkp <= 500_000_000) {
    annualTax = 31_500_000 + (pkp - 250_000_000) * 0.25
  } else if (pkp <= 5_000_000_000) {
    annualTax = 94_000_000 + (pkp - 500_000_000) * 0.30
  } else {
    annualTax = 1_444_000_000 + (pkp - 5_000_000_000) * 0.35
  }

  // Metode gross_up: perusahaan tanggung pajak → dikembalikan 0 ke karyawan
  if (config.pph21Method === 'gross_up') return 0

  return annualTax / 12
}

// ─────────────────────────────────────────────────────────
// HELPER: Default config jika belum ada di DB
// ─────────────────────────────────────────────────────────
export function getDefaultPayrollConfig(organizationId: string): Omit<PayrollConfig, 'createdAt' | 'updatedAt'> {
  return {
    id: '',
    organizationId,
    bpjsKesEnabled: false,
    bpjsKesEmployee: 1.0,
    bpjsKesEmployer: 4.0,
    bpjsKesMaxSalary: null,
    bpjsTkEnabled: false,
    bpjsTkJHT: 2.0,
    bpjsTkJHTEmployer: 3.7,
    bpjsTkJP: 1.0,
    bpjsTkJPEmployer: 2.0,
    bpjsTkJKK: 0.24,
    bpjsTkJKM: 0.3,
    bpjsTkMaxSalary: null,
    pph21Enabled: false,
    pph21Method: 'gross',
    pph21PTKP: 54_000_000,
    ptkpStatus: 'TK/0',
    lateDeductEnabled: false,
    lateGraceMinutes: 15,
    lateDeductMethod: 'per_minute',
    lateDeductAmount: 0,
    lateDeductPercent: 0,
    earlyLeaveDeductEnabled: false,
    earlyLeaveDeductMethod: 'per_minute',
    earlyLeaveDeductAmount: 0,
    earlyLeaveDeductPercent: 0,
    absentDeductEnabled: false,
    absentDeductMethod: 'daily_salary',
    absentDeductAmount: 0,
    overtimeEnabled: true,
    overtimeRate1: 1.5,
    overtimeRate2: 2.0,
    overtimeRateHoliday: 2.0,
    overtimeHourlyBasis: 173,
    customAllowances: '[]',
    customDeductions: '[]',
    payrollDate: 25,
    cutoffDate: 20,
    salaryType: 'monthly',
    workingDaysPerMonth: 22,
  }
}

// ─────────────────────────────────────────────────────────
// FORMAT CURRENCY
// ─────────────────────────────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Math.round(amount))
}

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(Math.round(amount))
}

export function getMonthName(month: number, lang: 'id' | 'en' = 'id'): string {
  const monthsId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const list = lang === 'id' ? monthsId : monthsEn
  return list[(month - 1)] ?? `Month ${month}`
}

export interface PayrollPeriod {
  month: number
  year: number
  periodStart: Date
  periodEnd: Date
  label: string
}

export function getCurrentPeriod(date: Date = new Date()): PayrollPeriod {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  return getPayrollPeriod(month, year)
}

export function getPayrollPeriod(month: number, year: number): PayrollPeriod {
  const safeMonth = Number.isFinite(month) && month >= 1 && month <= 12
    ? month
    : new Date().getMonth() + 1

  const safeYear = Number.isFinite(year) && year > 1900
    ? year
    : new Date().getFullYear()

  const periodStart = new Date(safeYear, safeMonth - 1, 1)
  periodStart.setHours(0, 0, 0, 0)

  const periodEnd = new Date(safeYear, safeMonth, 0)
  periodEnd.setHours(23, 59, 59, 999)

  return {
    month: safeMonth,
    year: safeYear,
    periodStart,
    periodEnd,
    label: `${getMonthName(safeMonth)} ${safeYear}`,
  }
}

export function getPreviousPeriod(date: Date = new Date()): PayrollPeriod {
  const previousMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)

  return getPayrollPeriod(
    previousMonthDate.getMonth() + 1,
    previousMonthDate.getFullYear(),
  )
}

export function getNextPeriod(date: Date = new Date()): PayrollPeriod {
  const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)

  return getPayrollPeriod(
    nextMonthDate.getMonth() + 1,
    nextMonthDate.getFullYear(),
  )
}