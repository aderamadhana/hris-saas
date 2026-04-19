// src/lib/leave-types.ts

export interface LeaveType {
  id: string
  name: string
  description: string
  category: 'annual' | 'health' | 'maternity' | 'special' | 'work' | 'unpaid'
  maxDays: number | null       // null = unlimited
  isPaid: boolean
  requiresDocument: boolean
  autoCalculateDays: number | null  // null = user picks dates
  excludeWeekends: boolean
  requiresTime: boolean        // true = needs startTime/endTime (Out of Office)
  requiresDelegation: boolean
}

export const INDONESIAN_LEAVE_TYPES: LeaveType[] = [
  // ── CUTI TAHUNAN ──────────────────────────────────────────
  {
    id: 'annual',
    name: 'Cuti Tahunan',
    description: 'Cuti tahunan sesuai UU Ketenagakerjaan minimal 12 hari kerja per tahun.',
    category: 'annual',
    maxDays: 12,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: true,
  },

  // ── CUTI KESEHATAN ────────────────────────────────────────
  {
    id: 'sick',
    name: 'Cuti Sakit',
    description: 'Cuti karena sakit. Tidak ada batasan maksimal hari, wajib melampirkan surat dokter.',
    category: 'health',
    maxDays: null,
    isPaid: true,
    requiresDocument: true,
    autoCalculateDays: null,
    excludeWeekends: false,
    requiresTime: false,
    requiresDelegation: false,
  },

  // ── CUTI MELAHIRKAN ───────────────────────────────────────
  {
    id: 'maternity',
    name: 'Cuti Melahirkan',
    description: 'Cuti untuk ibu yang akan melahirkan. Diberikan 90 hari kalender.',
    category: 'maternity',
    maxDays: 90,
    isPaid: true,
    requiresDocument: true,
    autoCalculateDays: 90,
    excludeWeekends: false,
    requiresTime: false,
    requiresDelegation: true,
  },

  // ── CUTI KHUSUS ───────────────────────────────────────────
  {
    id: 'marriage',
    name: 'Cuti Menikah',
    description: 'Cuti untuk karyawan yang menikah.',
    category: 'special',
    maxDays: 3,
    isPaid: true,
    requiresDocument: true,
    autoCalculateDays: 3,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'child_marriage',
    name: 'Cuti Menikahkan Anak',
    description: 'Cuti untuk karyawan yang menikahkan anaknya.',
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: true,
    autoCalculateDays: 2,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'child_circumcision',
    name: 'Cuti Khitanan Anak',
    description: 'Cuti untuk karyawan yang mengkhitankan anaknya.',
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: 2,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'child_baptism',
    name: 'Cuti Baptis Anak',
    description: 'Cuti untuk karyawan yang membaptis anaknya.',
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: 2,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'paternity',
    name: 'Cuti Istri Melahirkan / Keguguran',
    description: 'Cuti untuk suami yang istrinya melahirkan atau mengalami keguguran.',
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: true,
    autoCalculateDays: 2,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'family_death',
    name: 'Cuti Keluarga Meninggal (Serumah)',
    description: 'Cuti untuk anggota keluarga inti yang meninggal dan tinggal satu rumah.',
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: true,
    autoCalculateDays: 2,
    excludeWeekends: false,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'extended_family_death',
    name: 'Cuti Anggota Keluarga Meninggal (Beda Rumah)',
    description: 'Cuti untuk anggota keluarga yang meninggal namun tidak tinggal satu rumah.',
    category: 'special',
    maxDays: 1,
    isPaid: true,
    requiresDocument: true,
    autoCalculateDays: 1,
    excludeWeekends: false,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'hajj',
    name: 'Cuti Ibadah Haji',
    description: 'Cuti untuk melaksanakan ibadah haji. Diberikan sekali selama bekerja.',
    category: 'special',
    maxDays: 40,
    isPaid: false,
    requiresDocument: true,
    autoCalculateDays: null,
    excludeWeekends: false,
    requiresTime: false,
    requiresDelegation: true,
  },
  {
    id: 'compensatory',
    name: 'Cuti Pengganti Libur',
    description: 'Cuti pengganti karena bekerja pada hari libur nasional.',
    category: 'special',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },

  // ── PENGATURAN KERJA ──────────────────────────────────────
  {
    id: 'business_trip_local',
    name: 'Dinas Luar Kota',
    description: 'Perjalanan dinas keluar kota dalam provinsi yang sama.',
    category: 'work',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: true,
  },
  {
    id: 'business_trip_province',
    name: 'Dinas Luar Provinsi',
    description: 'Perjalanan dinas keluar provinsi atau ke luar negeri.',
    category: 'work',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: true,
  },
  {
    id: 'out_of_office',
    name: 'Out of Office',
    description: 'Keluar kantor untuk keperluan tertentu dalam jam kerja.',
    category: 'work',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: true,  // Perlu jam mulai & selesai
    requiresDelegation: false,
  },
  {
    id: 'wfh',
    name: 'Work From Home',
    description: 'Bekerja dari rumah.',
    category: 'work',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },
  {
    id: 'wfa',
    name: 'Work From Anywhere',
    description: 'Bekerja dari lokasi mana saja selain kantor dan rumah.',
    category: 'work',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },

  // ── CUTI TIDAK BERBAYAR ───────────────────────────────────
  {
    id: 'unpaid',
    name: 'Cuti Tanpa Upah (Unpaid Leave)',
    description: 'Cuti tanpa mendapatkan gaji. Berdasarkan kesepakatan antara karyawan dan perusahaan.',
    category: 'unpaid',
    maxDays: null,
    isPaid: false,
    requiresDocument: false,
    autoCalculateDays: null,
    excludeWeekends: true,
    requiresTime: false,
    requiresDelegation: false,
  },
]

// ── Helper functions ──────────────────────────────────────────

export function getLeaveType(id: string): LeaveType | undefined {
  return INDONESIAN_LEAVE_TYPES.find((t) => t.id === id)
}

export function shouldAutoCalculate(id: string): boolean {
  const t = getLeaveType(id)
  return t?.autoCalculateDays !== null && t?.autoCalculateDays !== undefined
}

export function getAutoDays(id: string): number | null {
  return getLeaveType(id)?.autoCalculateDays ?? null
}

export function requiresTimeInput(id: string): boolean {
  return getLeaveType(id)?.requiresTime ?? false
}

export function shouldExcludeWeekends(id: string): boolean {
  return getLeaveType(id)?.excludeWeekends ?? true
}

export function requiresDelegation(id: string): boolean {
  return getLeaveType(id)?.requiresDelegation ?? false
}

/**
 * Hitung hari kerja antara dua tanggal (exclude Sabtu & Minggu)
 */
export function calculateWorkingDays(start: Date, end: Date): number {
  let count = 0
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

/**
 * Hitung tanggal akhir berdasarkan jumlah hari dari tanggal mulai.
 * excludeWeekends = true → skip Sabtu & Minggu
 */
export function calculateEndDate(
  start: Date,
  days: number,
  excludeWeekends: boolean
): Date {
  const result = new Date(start)
  result.setHours(0, 0, 0, 0)

  if (!excludeWeekends) {
    result.setDate(result.getDate() + days - 1)
    return result
  }

  let remaining = days - 1
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) remaining--
  }
  return result
}

/**
 * Format tanggal ke bahasa Indonesia
 */
export function formatLeaveDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Label status dalam bahasa Indonesia
 */
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
  }
  return map[status] ?? status
}

/**
 * Warna badge per status
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}