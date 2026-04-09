// src/lib/leave-types.ts
// UPDATED - Indonesian Leave Types with Enhanced Features

export interface LeaveTypeConfig {
  id: string
  name: string
  nameEn: string
  description: string
  maxDays: number | null
  requiresApproval: boolean
  requiresDocument: boolean
  isPaid: boolean
  category: 'annual' | 'special' | 'work' | 'unpaid' | 'health' | 'maternity'
  icon: string
  color: string
  autoCalculateDays?: boolean // Auto-calculate end date
  autoDays?: number // Default days when auto-calculate
  requiresTime?: boolean // Need time input (for OOO)
  excludeWeekends?: boolean // Exclude Sat-Sun from calculation
  requiresDelegation?: boolean // Need delegation
}

export const INDONESIAN_LEAVE_TYPES: LeaveTypeConfig[] = [
  // CUTI TAHUNAN
  {
    id: 'annual',
    name: 'Cuti Tahunan',
    nameEn: 'Annual Leave',
    description: 'Cuti tahunan yang menjadi hak pekerja setelah bekerja 12 bulan berturut-turut',
    maxDays: 12,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'annual',
    icon: '🏖️',
    color: 'blue',
    excludeWeekends: true, // Exclude weekend
    requiresDelegation: true,
  },

  // CUTI SAKIT
  {
    id: 'sick',
    name: 'Cuti Sakit',
    nameEn: 'Sick Leave',
    description: 'Cuti karena sakit dengan surat keterangan dokter',
    maxDays: null,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'health',
    icon: '🏥',
    color: 'red',
    excludeWeekends: false, // Include weekend
    requiresDelegation: true,
  },

  // CUTI MELAHIRKAN (NEW!)
  {
    id: 'maternity',
    name: 'Cuti Melahirkan',
    nameEn: 'Maternity Leave',
    description: 'Cuti untuk ibu yang melahirkan',
    maxDays: 90, // UU: 3 bulan (90 hari)
    requiresApproval: true,
    requiresDocument: true, // Surat RS
    isPaid: true,
    category: 'maternity',
    icon: '🤱',
    color: 'pink',
    autoCalculateDays: true, // Auto-calculate 90 days
    autoDays: 90,
    excludeWeekends: false, // Include all days
    requiresDelegation: true,
  },

  // CUTI MENIKAH
  {
    id: 'marriage',
    name: 'Cuti Menikah',
    nameEn: 'Marriage Leave',
    description: 'Cuti untuk menikah',
    maxDays: 3,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'special',
    icon: '💒',
    color: 'pink',
    autoCalculateDays: true, // Auto 3 days
    autoDays: 3,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI MENIKAHKAN ANAK
  {
    id: 'child_marriage',
    name: 'Cuti Menikahkan Anak',
    nameEn: 'Child Marriage Leave',
    description: 'Cuti untuk menikahkan anak',
    maxDays: 2,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'special',
    icon: '👰',
    color: 'pink',
    autoCalculateDays: true,
    autoDays: 2,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI KHITANAN
  {
    id: 'child_circumcision',
    name: 'Cuti Khitanan Anak',
    nameEn: 'Child Circumcision Leave',
    description: 'Cuti untuk mengkhitankan anak',
    maxDays: 2,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'special',
    icon: '🕌',
    color: 'green',
    autoCalculateDays: true,
    autoDays: 2,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI BAPTIS
  {
    id: 'child_baptism',
    name: 'Cuti Baptis Anak',
    nameEn: 'Child Baptism Leave',
    description: 'Cuti untuk membaptis anak',
    maxDays: 2,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'special',
    icon: '⛪',
    color: 'blue',
    autoCalculateDays: true,
    autoDays: 2,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI ISTRI MELAHIRKAN (Paternity)
  {
    id: 'paternity',
    name: 'Cuti Istri Melahirkan',
    nameEn: 'Paternity Leave',
    description: 'Cuti bagi suami yang istrinya melahirkan atau keguguran',
    maxDays: 2,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'special',
    icon: '👶',
    color: 'purple',
    autoCalculateDays: true,
    autoDays: 2,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI KELUARGA MENINGGAL
  {
    id: 'family_death',
    name: 'Cuti Keluarga Meninggal (Serumah)',
    nameEn: 'Bereavement Leave',
    description: 'Cuti karena anggota keluarga dalam satu rumah meninggal',
    maxDays: 2,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'special',
    icon: '🕯️',
    color: 'gray',
    autoCalculateDays: true,
    autoDays: 2,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI KELUARGA LAIN MENINGGAL
  {
    id: 'extended_family_death',
    name: 'Cuti Keluarga Meninggal (Beda Rumah)',
    nameEn: 'Extended Family Bereavement',
    description: 'Cuti karena anggota keluarga di luar satu rumah meninggal',
    maxDays: 1,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'special',
    icon: '🕯️',
    color: 'gray',
    autoCalculateDays: true,
    autoDays: 1,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI HAJI
  {
    id: 'hajj',
    name: 'Cuti Ibadah Haji',
    nameEn: 'Hajj Leave',
    description: 'Cuti untuk menunaikan ibadah haji',
    maxDays: 40,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: false,
    category: 'special',
    icon: '🕋',
    color: 'green',
    excludeWeekends: false,
    requiresDelegation: true,
  },

  // CUTI PENGGANTI
  {
    id: 'compensatory',
    name: 'Cuti Pengganti Libur',
    nameEn: 'Compensatory Leave',
    description: 'Cuti pengganti untuk hari libur yang digunakan bekerja',
    maxDays: null,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: '🔄',
    color: 'orange',
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // DINAS LUAR KOTA
  {
    id: 'business_trip_local',
    name: 'Dinas Luar Kota',
    nameEn: 'Business Trip (Local)',
    description: 'Perjalanan dinas dalam provinsi',
    maxDays: null,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: '🚗',
    color: 'blue',
    excludeWeekends: false,
    requiresDelegation: true,
  },

  // DINAS LUAR PROVINSI
  {
    id: 'business_trip_province',
    name: 'Dinas Luar Provinsi',
    nameEn: 'Business Trip (Provincial)',
    description: 'Perjalanan dinas ke luar provinsi',
    maxDays: null,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: '✈️',
    color: 'blue',
    excludeWeekends: false,
    requiresDelegation: true,
  },

  // OUT OF OFFICE (with time)
  {
    id: 'out_of_office',
    name: 'Out of Office',
    nameEn: 'Out of Office',
    description: 'Tidak di kantor untuk keperluan tertentu (hitungan jam)',
    maxDays: 1, // Max 1 day
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: '📴',
    color: 'yellow',
    requiresTime: true, // NEEDS TIME INPUT!
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // WFH
  {
    id: 'wfh',
    name: 'Work From Home',
    nameEn: 'Work From Home',
    description: 'Bekerja dari rumah',
    maxDays: null,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: '🏠',
    color: 'green',
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // WFA
  {
    id: 'wfa',
    name: 'Work From Anywhere',
    nameEn: 'Work From Anywhere',
    description: 'Bekerja dari lokasi manapun',
    maxDays: null,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: '🌍',
    color: 'teal',
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // UNPAID LEAVE
  {
    id: 'unpaid',
    name: 'Cuti Tanpa Upah',
    nameEn: 'Unpaid Leave',
    description: 'Cuti tanpa dibayar untuk keperluan pribadi',
    maxDays: null,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: false,
    category: 'unpaid',
    icon: '🚫',
    color: 'gray',
    excludeWeekends: true,
    requiresDelegation: true,
  },
]

// Helper: Calculate working days (exclude weekends)
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    const day = current.getDay()
    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

// Helper: Calculate end date based on working days
export function calculateEndDate(
  startDate: Date,
  workingDays: number,
  excludeWeekends: boolean = true
): Date {
  const end = new Date(startDate)

  if (!excludeWeekends) {
    // Just add days
    end.setDate(end.getDate() + workingDays - 1)
    return end
  }

  // Add working days only
  let added = 0
  while (added < workingDays) {
    const day = end.getDay()
    if (day !== 0 && day !== 6) {
      added++
    }
    if (added < workingDays) {
      end.setDate(end.getDate() + 1)
    }
  }

  return end
}

// Helper: Get leave type
export function getLeaveType(id: string): LeaveTypeConfig | undefined {
  return INDONESIAN_LEAVE_TYPES.find((type) => type.id === id)
}

// Helper: Check if auto-calculate
export function shouldAutoCalculate(leaveTypeId: string): boolean {
  const type = getLeaveType(leaveTypeId)
  return type?.autoCalculateDays ?? false
}

// Helper: Get auto days
export function getAutoDays(leaveTypeId: string): number | null {
  const type = getLeaveType(leaveTypeId)
  return type?.autoDays ?? null
}

// Helper: Check if needs time
export function requiresTimeInput(leaveTypeId: string): boolean {
  const type = getLeaveType(leaveTypeId)
  return type?.requiresTime ?? false
}

// Helper: Check if excludes weekends
export function shouldExcludeWeekends(leaveTypeId: string): boolean {
  const type = getLeaveType(leaveTypeId)
  return type?.excludeWeekends ?? true
}

// Helper: Check if needs delegation
export function requiresDelegation(leaveTypeId: string): boolean {
  const type = getLeaveType(leaveTypeId)
  return type?.requiresDelegation ?? false
}