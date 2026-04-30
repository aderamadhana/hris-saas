// src/lib/leave/get-org-leave-types.ts
// Dipakai di leave request form & balance API
// Menggabungkan definisi default dengan konfigurasi per organisasi

import prisma from '@/src/lib/prisma'

export interface ResolvedLeaveType {
  id: string
  label: string           // customName atau default label
  category: string
  maxDays: number | null  // null = tidak terbatas
  isPaid: boolean
  requiresDocument: boolean
  requiresApproval: boolean
  canCarryForward: boolean
  maxCarryForward: number | null
  countWeekend: boolean
  requiresDelegation: boolean
  isAutoFillDates: boolean  // special leave dengan durasi tetap
  notes: string | null
}

// Definisi dasar (duplikat dari leave-policy-page agar bisa dipakai server-side)
const BASE_LEAVE_TYPES: Record<string, {
  label: string
  category: string
  defaultDays: number | null
  isPaidDefault: boolean
  requiresDocDefault: boolean
  isAutoFill: boolean
}> = {
  annual:                 { label: 'Cuti Tahunan',                    category: 'CUTI TAHUNAN',           defaultDays: 12,   isPaidDefault: true,  requiresDocDefault: false, isAutoFill: false },
  sick:                   { label: 'Cuti Sakit',                      category: 'CUTI KESEHATAN',         defaultDays: null, isPaidDefault: true,  requiresDocDefault: true,  isAutoFill: false },
  maternity:              { label: 'Cuti Melahirkan',                 category: 'CUTI MELAHIRKAN',        defaultDays: 90,   isPaidDefault: true,  requiresDocDefault: true,  isAutoFill: true  },
  paternity:              { label: 'Cuti Ayah / Istri Melahirkan',    category: 'CUTI MELAHIRKAN',        defaultDays: 2,    isPaidDefault: true,  requiresDocDefault: true,  isAutoFill: true  },
  miscarriage:            { label: 'Cuti Keguguran',                  category: 'CUTI MELAHIRKAN',        defaultDays: 45,   isPaidDefault: true,  requiresDocDefault: true,  isAutoFill: true  },
  marriage:               { label: 'Cuti Menikah',                    category: 'CUTI KHUSUS',            defaultDays: 3,    isPaidDefault: true,  requiresDocDefault: false, isAutoFill: true  },
  child_marriage:         { label: 'Cuti Menikahkan Anak',            category: 'CUTI KHUSUS',            defaultDays: 2,    isPaidDefault: true,  requiresDocDefault: false, isAutoFill: true  },
  child_circumcision:     { label: 'Cuti Khitanan Anak',              category: 'CUTI KHUSUS',            defaultDays: 2,    isPaidDefault: true,  requiresDocDefault: false, isAutoFill: true  },
  child_baptism:          { label: 'Cuti Baptis Anak',                category: 'CUTI KHUSUS',            defaultDays: 2,    isPaidDefault: true,  requiresDocDefault: false, isAutoFill: true  },
  death_family_home:      { label: 'Cuti Keluarga Meninggal (Serumah)', category: 'CUTI KHUSUS',          defaultDays: 2,    isPaidDefault: true,  requiresDocDefault: false, isAutoFill: true  },
  death_family_away:      { label: 'Cuti Keluarga Meninggal (Beda Rumah)', category: 'CUTI KHUSUS',       defaultDays: 1,    isPaidDefault: true,  requiresDocDefault: false, isAutoFill: true  },
  hajj:                   { label: 'Cuti Ibadah Haji',                category: 'CUTI KHUSUS',            defaultDays: 40,   isPaidDefault: false, requiresDocDefault: true,  isAutoFill: true  },
  replace_holiday:        { label: 'Cuti Pengganti Hari Libur',       category: 'CUTI KHUSUS',            defaultDays: null, isPaidDefault: true,  requiresDocDefault: false, isAutoFill: false },
  business_trip_city:     { label: 'Dinas Luar Kota',                 category: 'PENGATURAN KERJA',       defaultDays: null, isPaidDefault: true,  requiresDocDefault: false, isAutoFill: false },
  business_trip_province: { label: 'Dinas Luar Provinsi',             category: 'PENGATURAN KERJA',       defaultDays: null, isPaidDefault: true,  requiresDocDefault: false, isAutoFill: false },
  out_of_office:          { label: 'Out of Office',                   category: 'PENGATURAN KERJA',       defaultDays: null, isPaidDefault: true,  requiresDocDefault: false, isAutoFill: false },
  wfh:                    { label: 'Work From Home',                  category: 'PENGATURAN KERJA',       defaultDays: null, isPaidDefault: true,  requiresDocDefault: false, isAutoFill: false },
  wfa:                    { label: 'Work From Anywhere',              category: 'PENGATURAN KERJA',       defaultDays: null, isPaidDefault: true,  requiresDocDefault: false, isAutoFill: false },
  unpaid:                 { label: 'Cuti Tanpa Upah',                 category: 'CUTI TIDAK BERBAYAR',    defaultDays: null, isPaidDefault: false, requiresDocDefault: false, isAutoFill: false },
}

/**
 * Ambil jenis cuti yang AKTIF untuk organisasi,
 * sudah digabung dengan override dari LeavePolicyConfig.
 */
export async function getOrgLeaveTypes(organizationId: string): Promise<ResolvedLeaveType[]> {
  const configs = await prisma.leavePolicyConfig.findMany({
    where: { organizationId, isEnabled: true },
  })

  return configs.map(cfg => {
    const base = BASE_LEAVE_TYPES[cfg.leaveTypeId]
    if (!base) return null

    return {
      id: cfg.leaveTypeId,
      label: cfg.customName || base.label,
      category: base.category,
      maxDays: cfg.maxDaysOverride ?? base.defaultDays,
      isPaid: cfg.isPaidOverride !== null ? cfg.isPaidOverride : base.isPaidDefault,
      requiresDocument: cfg.requiresDocument,
      requiresApproval: cfg.requiresApproval,
      canCarryForward: cfg.canCarryForward,
      maxCarryForward: cfg.maxCarryForward ?? null,
      countWeekend: cfg.countWeekend,
      requiresDelegation: cfg.requiresDelegation,
      isAutoFillDates: base.isAutoFill && base.defaultDays !== null,
      notes: cfg.notes ?? null,
    } satisfies ResolvedLeaveType
  }).filter(Boolean) as ResolvedLeaveType[]
}

/**
 * Hitung jumlah hari cuti yang diajukan,
 * dengan atau tanpa weekend sesuai kebijakan.
 */
export function calculateLeaveDays(
  startDate: Date,
  endDate: Date,
  countWeekend: boolean
): number {
  if (countWeekend) {
    const diff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    return Math.max(1, diff)
  }

  let count = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return Math.max(1, count)
}

/**
 * Hitung tanggal akhir otomatis untuk special leave
 * berdasarkan jumlah hari kerja.
 */
export function calcEndDate(
  startDate: Date,
  days: number,
  countWeekend: boolean
): Date {
  if (countWeekend) {
    const end = new Date(startDate)
    end.setDate(end.getDate() + days - 1)
    return end
  }

  let remaining = days
  const current = new Date(startDate)
  while (remaining > 1) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) remaining--
  }
  return current
}

/**
 * Cek apakah saldo cuti karyawan cukup.
 * Menghitung saldo dari tabel Leave yang sudah approved/pending tahun berjalan.
 */
export async function checkLeaveBalance(
  employeeId: string,
  leaveTypeId: string,
  requestedDays: number,
  organizationId: string
): Promise<{ sufficient: boolean; used: number; quota: number | null; remaining: number | null }> {
  // Ambil kebijakan
  const policy = await prisma.leavePolicyConfig.findUnique({
    where: { organizationId_leaveTypeId: { organizationId, leaveTypeId } },
  })

  const base = BASE_LEAVE_TYPES[leaveTypeId]
  const quota: number | null = policy?.maxDaysOverride ?? base?.defaultDays ?? null

  // Jika tidak terbatas (null), selalu sufficient
  if (quota === null) {
    return { sufficient: true, used: 0, quota: null, remaining: null }
  }

  const year = new Date().getFullYear()

  const usedAgg = await prisma.leave.aggregate({
    where: {
      employeeId,
      leaveType: leaveTypeId,
      status: { in: ['approved', 'pending'] },
      startDate: { gte: new Date(`${year}-01-01`) },
      endDate: { lte: new Date(`${year}-12-31`) },
    },
    _sum: { days: true },
  })

  const used = usedAgg._sum.days ?? 0
  const remaining = quota - used

  return {
    sufficient: remaining >= requestedDays,
    used,
    quota,
    remaining,
  }
}