// src/lib/leave-types.ts
// FIXED - Icons instead of emoticons

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
  color: string
  autoCalculateDays?: boolean
  autoDays?: number
  requiresTime?: boolean
  excludeWeekends?: boolean
  requiresDelegation?: boolean
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
    color: 'blue',
    excludeWeekends: true,
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
    color: 'red',
    excludeWeekends: false,
    requiresDelegation: true,
  },

  // CUTI MELAHIRKAN
  {
    id: 'maternity',
    name: 'Cuti Melahirkan',
    nameEn: 'Maternity Leave',
    description: 'Cuti untuk ibu yang melahirkan',
    maxDays: 90,
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'maternity',
    color: 'pink',
    autoCalculateDays: true,
    autoDays: 90,
    excludeWeekends: false,
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
    color: 'pink',
    autoCalculateDays: true,
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
    color: 'blue',
    autoCalculateDays: true,
    autoDays: 2,
    excludeWeekends: true,
    requiresDelegation: false,
  },

  // CUTI ISTRI MELAHIRKAN
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
    color: 'blue',
    excludeWeekends: false,
    requiresDelegation: true,
  },

  // OUT OF OFFICE
  {
    id: 'out_of_office',
    name: 'Out of Office',
    nameEn: 'Out of Office',
    description: 'Tidak di kantor untuk keperluan tertentu (hitungan jam)',
    maxDays: 1,
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    color: 'yellow',
    requiresTime: true,
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
    color: 'gray',
    excludeWeekends: true,
    requiresDelegation: true,
  },
]

// Helper: Get icon component based on leave type
export function getLeaveIcon(leaveTypeId: string) {
  const iconMap: Record<string, string> = {
    annual: 'Calendar',
    sick: 'Heart',
    maternity: 'Baby',
    marriage: 'Heart',
    child_marriage: 'Users',
    child_circumcision: 'Star',
    child_baptism: 'Star',
    paternity: 'Baby',
    family_death: 'AlertCircle',
    extended_family_death: 'AlertCircle',
    hajj: 'Star',
    compensatory: 'RefreshCw',
    business_trip_local: 'Car',
    business_trip_province: 'Plane',
    out_of_office: 'PhoneOff',
    wfh: 'Home',
    wfa: 'Globe',
    unpaid: 'XCircle',
  }
  return iconMap[leaveTypeId] || 'FileText'
}

// Helper: Calculate working days
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

// Helper: Calculate end date
export function calculateEndDate(
  startDate: Date,
  workingDays: number,
  excludeWeekends: boolean = true
): Date {
  const end = new Date(startDate)

  if (!excludeWeekends) {
    end.setDate(end.getDate() + workingDays - 1)
    return end
  }

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

// Helper: Get categories
export function getLeaveTypesByCategory(
  category: LeaveTypeConfig['category']
): LeaveTypeConfig[] {
  return INDONESIAN_LEAVE_TYPES.filter((type) => type.category === category)
}