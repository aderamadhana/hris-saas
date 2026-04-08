// src/lib/leave-types.ts
// Indonesian Leave Types - Based on UU Ketenagakerjaan

export interface LeaveTypeConfig {
  id: string
  name: string
  nameEn: string
  description: string
  maxDays: number | null // null = unlimited
  requiresApproval: boolean
  requiresDocument: boolean
  isPaid: boolean
  category: 'annual' | 'special' | 'work' | 'unpaid' | 'health'
  icon: string
  color: string
}

export const INDONESIAN_LEAVE_TYPES: LeaveTypeConfig[] = [
  // CUTI TAHUNAN (Annual Leave)
  {
    id: 'annual',
    name: 'Cuti Tahunan',
    nameEn: 'Annual Leave',
    description:
      'Cuti tahunan yang menjadi hak pekerja setelah bekerja 12 bulan berturut-turut',
    maxDays: 12, // UU: minimal 12 hari per tahun
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'annual',
    icon: 'CalendarDays',
    color: 'blue',
  },

  // CUTI SAKIT (Sick Leave)
  {
    id: 'sick',
    name: 'Cuti Sakit',
    nameEn: 'Sick Leave',
    description: 'Cuti karena sakit dengan surat keterangan dokter',
    maxDays: null, // Unlimited - sesuai kondisi kesehatan
    requiresApproval: true,
    requiresDocument: true, // Surat dokter
    isPaid: true, // Dibayar sesuai masa sakit
    category: 'health',
    icon: 'HeartPulse',
    color: 'red',
  },

  // CUTI MELAHIRKAN (Maternity Leave)
  {
    id: 'maternity',
    name: 'Cuti Melahirkan',
    nameEn: 'Maternity Leave',
    description: 'Cuti melahirkan untuk pekerja perempuan',
    maxDays: 90, // 90 hari
    requiresApproval: true,
    requiresDocument: true, // Surat dokter / surat keterangan lahir
    isPaid: true,
    category: 'special',
    icon: 'Baby',
    color: 'rose',
  },

  // CUTI MENIKAH (Marriage Leave)
  {
    id: 'marriage',
    name: 'Cuti Menikah',
    nameEn: 'Marriage Leave',
    description: 'Cuti untuk menikah (pekerja yang menikah)',
    maxDays: 3, // UU: 3 hari
    requiresApproval: true,
    requiresDocument: true, // Surat nikah
    isPaid: true,
    category: 'special',
    icon: 'Heart',
    color: 'pink',
  },

  // CUTI MENIKAHKAN ANAK (Child Marriage Leave)
  {
    id: 'child_marriage',
    name: 'Cuti Menikahkan Anak',
    nameEn: 'Child Marriage Leave',
    description: 'Cuti untuk menikahkan anak',
    maxDays: 2, // UU: 2 hari
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'special',
    icon: 'Users',
    color: 'pink',
  },

  // CUTI KHITANAN ANAK (Child Circumcision Leave)
  {
    id: 'child_circumcision',
    name: 'Cuti Khitanan Anak',
    nameEn: 'Child Circumcision Leave',
    description: 'Cuti untuk mengkhitankan anak',
    maxDays: 2, // UU: 2 hari
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'special',
    icon: 'Shield',
    color: 'green',
  },

  // CUTI BAPTIS ANAK (Child Baptism Leave)
  {
    id: 'child_baptism',
    name: 'Cuti Baptis Anak',
    nameEn: 'Child Baptism Leave',
    description: 'Cuti untuk membaptis anak',
    maxDays: 2, // UU: 2 hari
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'special',
    icon: 'Church',
    color: 'blue',
  },

  // CUTI ISTRI MELAHIRKAN/KEGUGURAN (Paternity Leave)
  {
    id: 'paternity',
    name: 'Cuti Istri Melahirkan/Keguguran',
    nameEn: 'Paternity Leave',
    description: 'Cuti bagi suami yang istrinya melahirkan atau keguguran',
    maxDays: 2, // UU: 2 hari
    requiresApproval: true,
    requiresDocument: true, // Surat dari RS/dokter
    isPaid: true,
    category: 'special',
    icon: 'Baby',
    color: 'purple',
  },

  // CUTI KELUARGA MENINGGAL (Family Death Leave)
  {
    id: 'family_death',
    name: 'Cuti Keluarga Meninggal',
    nameEn: 'Bereavement Leave',
    description: 'Cuti karena anggota keluarga dalam satu rumah meninggal dunia',
    maxDays: 2, // UU: 2 hari
    requiresApproval: true,
    requiresDocument: true, // Surat keterangan kematian
    isPaid: true,
    category: 'special',
    icon: 'HeartCrack',
    color: 'gray',
  },

  // CUTI KELUARGA LAIN MENINGGAL (Extended Family Death Leave)
  {
    id: 'extended_family_death',
    name: 'Cuti Keluarga (Beda Rumah) Meninggal',
    nameEn: 'Extended Family Bereavement',
    description: 'Cuti karena anggota keluarga di luar satu rumah meninggal',
    maxDays: 1, // UU: 1 hari
    requiresApproval: true,
    requiresDocument: true,
    isPaid: true,
    category: 'special',
    icon: 'HeartCrack',
    color: 'gray',
  },

  // CUTI IBADAH HAJI (Hajj Leave)
  {
    id: 'hajj',
    name: 'Cuti Ibadah Haji',
    nameEn: 'Hajj Pilgrimage Leave',
    description: 'Cuti untuk menunaikan ibadah haji',
    maxDays: 40, // Biasanya 40 hari
    requiresApproval: true,
    requiresDocument: true, // Surat keberangkatan haji
    isPaid: false, // Unpaid
    category: 'special',
    icon: 'Landmark',
    color: 'green',
  },

  // CUTI PENGGANTI LIBUR (Compensatory Leave)
  {
    id: 'compensatory',
    name: 'Cuti Pengganti Libur',
    nameEn: 'Compensatory Leave',
    description: 'Cuti pengganti untuk hari libur yang digunakan bekerja',
    maxDays: null, // Sesuai akumulasi
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: 'RefreshCw',
    color: 'orange',
  },

  // DINAS LUAR KOTA (Business Trip - Local)
  {
    id: 'business_trip_local',
    name: 'Dinas Luar Kota',
    nameEn: 'Business Trip (Local)',
    description: 'Perjalanan dinas dalam provinsi',
    maxDays: null, // Sesuai kebutuhan
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: 'Car',
    color: 'blue',
  },

  // DINAS LUAR PROVINSI (Business Trip - Provincial)
  {
    id: 'business_trip_province',
    name: 'Dinas Luar Provinsi',
    nameEn: 'Business Trip (Provincial)',
    description: 'Perjalanan dinas ke luar provinsi',
    maxDays: null, // Sesuai kebutuhan
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: 'Plane',
    color: 'blue',
  },

  // OUT OF OFFICE (OOO)
  {
    id: 'out_of_office',
    name: 'Out of Office',
    nameEn: 'Out of Office',
    description: 'Tidak di kantor untuk keperluan tertentu (hitungan jam)',
    maxDays: null, // Fleksibel
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: 'Clock3',
    color: 'yellow',
  },

  // WORK FROM HOME (WFH)
  {
    id: 'wfh',
    name: 'Work From Home (WFH)',
    nameEn: 'Work From Home',
    description: 'Bekerja dari rumah',
    maxDays: null, // Sesuai kebijakan perusahaan
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: 'House',
    color: 'green',
  },

  // WORK FROM ANYWHERE (WFA)
  {
    id: 'wfa',
    name: 'Work From Anywhere (WFA)',
    nameEn: 'Work From Anywhere',
    description: 'Bekerja dari lokasi manapun',
    maxDays: null, // Sesuai kebijakan
    requiresApproval: true,
    requiresDocument: false,
    isPaid: true,
    category: 'work',
    icon: 'Globe',
    color: 'teal',
  },

  // CUTI TANPA UPAH (Unpaid Leave)
  {
    id: 'unpaid',
    name: 'Cuti Tanpa Upah',
    nameEn: 'Unpaid Leave',
    description: 'Cuti tanpa dibayar untuk keperluan pribadi',
    maxDays: null, // Sesuai persetujuan
    requiresApproval: true,
    requiresDocument: false,
    isPaid: false,
    category: 'unpaid',
    icon: 'CircleOff',
    color: 'gray',
  },
]

// Helper functions
export function getLeaveType(id: string): LeaveTypeConfig | undefined {
  return INDONESIAN_LEAVE_TYPES.find((type) => type.id === id)
}

export function getLeaveTypesByCategory(
  category: LeaveTypeConfig['category']
): LeaveTypeConfig[] {
  return INDONESIAN_LEAVE_TYPES.filter((type) => type.category === category)
}

export function getPaidLeaveTypes(): LeaveTypeConfig[] {
  return INDONESIAN_LEAVE_TYPES.filter((type) => type.isPaid)
}

export function getUnpaidLeaveTypes(): LeaveTypeConfig[] {
  return INDONESIAN_LEAVE_TYPES.filter((type) => !type.isPaid)
}

export function getSpecialLeaveTypes(): LeaveTypeConfig[] {
  return INDONESIAN_LEAVE_TYPES.filter((type) => type.category === 'special')
}

export function getMaxDaysForLeaveType(leaveTypeId: string): number | null {
  const leaveType = getLeaveType(leaveTypeId)
  return leaveType?.maxDays || null
}

export function isLeaveTypePaid(leaveTypeId: string): boolean {
  const leaveType = getLeaveType(leaveTypeId)
  return leaveType?.isPaid ?? false
}

export function requiresDocument(leaveTypeId: string): boolean {
  const leaveType = getLeaveType(leaveTypeId)
  return leaveType?.requiresDocument ?? false
}

// Leave balance tracking
export interface LeaveBalance {
  leaveTypeId: string
  quota: number | null // null = unlimited
  used: number
  remaining: number | null // null = unlimited
}

export function calculateLeaveBalance(
  leaveTypeId: string,
  usedDays: number
): LeaveBalance {
  const leaveType = getLeaveType(leaveTypeId)
  const quota = leaveType?.maxDays || null

  return {
    leaveTypeId,
    quota,
    used: usedDays,
    remaining: quota !== null ? Math.max(0, quota - usedDays) : null,
  }
}