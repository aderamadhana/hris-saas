// lib/leave-types.ts

export type LeaveCategory =
  | 'annual'
  | 'health'
  | 'maternity'
  | 'special'
  | 'work_arrangement'
  | 'unpaid'

export interface LeaveType {
  id: string
  name: string
  label: string
  description: string
  category: LeaveCategory
  maxDays: number | null
  isPaid: boolean
  requiresDocument: boolean
  autoCalculate: boolean
  includeWeekends: boolean
  requiresDelegation: boolean
  requiresTime: boolean
  iconName: string
  color: string
}

export const LEAVE_CATEGORIES: Record<LeaveCategory, string> = {
  annual: 'Annual Leave',
  health: 'Medical Leave',
  maternity: 'Maternity Leave',
  special: 'Special Leave',
  work_arrangement: 'Work Arrangement',
  unpaid: 'Unpaid Leave',
}

export const LEAVE_TYPES: LeaveType[] = [
  {
    id: 'annual',
    name: 'Annual Leave',
    label: 'Annual Leave',
    description: 'Paid yearly leave entitlement',
    category: 'annual',
    maxDays: 12,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Calendar',
    color: 'blue',
  },
  {
    id: 'sick',
    name: 'Sick Leave',
    label: 'Sick Leave',
    description: "Medical leave due to illness with doctor's note",
    category: 'health',
    maxDays: null,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: false,
    includeWeekends: true,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Heart',
    color: 'red',
  },
  {
    id: 'maternity',
    name: 'Maternity Leave',
    label: 'Maternity Leave',
    description: 'Paid leave for mothers',
    category: 'maternity',
    maxDays: 90,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: true,
    includeWeekends: true,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Baby',
    color: 'pink',
  },
  {
    id: 'marriage',
    name: 'Marriage Leave',
    label: 'Marriage Leave',
    description: 'Leave for own wedding ceremony',
    category: 'special',
    maxDays: 3,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: true,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Heart',
    color: 'rose',
  },
  {
    id: 'child_marriage',
    name: "Child's Wedding Leave",
    label: "Child's Wedding Leave",
    description: "Leave to attend your child's wedding",
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: true,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Users',
    color: 'purple',
  },
  {
    id: 'child_circumcision',
    name: "Child's Circumcision Leave",
    label: "Child's Circumcision Leave",
    description: "Leave for your child's circumcision ceremony",
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: true,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Star',
    color: 'yellow',
  },
  {
    id: 'child_baptism',
    name: "Child's Baptism Leave",
    label: "Child's Baptism Leave",
    description: "Leave for your child's baptism ceremony",
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: true,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Star',
    color: 'sky',
  },
  {
    id: 'paternity',
    name: 'Paternity Leave',
    label: 'Paternity Leave',
    description: 'Leave for father when wife gives birth or has miscarriage',
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: true,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Baby',
    color: 'teal',
  },
  {
    id: 'immediate_family_death',
    name: 'Immediate Family Bereavement',
    label: 'Immediate Family Bereavement',
    description: 'Leave for death of immediate family member',
    category: 'special',
    maxDays: 2,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: true,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'AlertCircle',
    color: 'gray',
  },
  {
    id: 'extended_family_death',
    name: 'Extended Family Bereavement',
    label: 'Extended Family Bereavement',
    description: 'Leave for death of extended family member',
    category: 'special',
    maxDays: 1,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: true,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'AlertCircle',
    color: 'slate',
  },
  {
    id: 'hajj',
    name: 'Hajj Leave',
    label: 'Hajj Leave',
    description: 'Leave for performing Hajj pilgrimage',
    category: 'special',
    maxDays: 40,
    isPaid: false,
    requiresDocument: true,
    autoCalculate: false,
    includeWeekends: true,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Star',
    color: 'amber',
  },
  {
    id: 'compensatory',
    name: 'Compensatory Day Off',
    label: 'Compensatory Day Off',
    description: 'Time off in lieu of working on rest day or public holiday',
    category: 'special',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'RefreshCw',
    color: 'green',
  },
  {
    id: 'business_trip_local',
    name: 'Local Business Trip',
    label: 'Local Business Trip',
    description: 'Official travel within the same province',
    category: 'work_arrangement',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Car',
    color: 'indigo',
  },
  {
    id: 'business_trip_province',
    name: 'Inter-Province Business Trip',
    label: 'Inter-Province Business Trip',
    description: 'Official travel outside the province',
    category: 'work_arrangement',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Plane',
    color: 'violet',
  },
  {
    id: 'out_of_office',
    name: 'Out of Office',
    label: 'Out of Office',
    description: 'Temporary out of office during working hours',
    category: 'work_arrangement',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: true,
    iconName: 'Clock',
    color: 'cyan',
  },
  {
    id: 'wfh',
    name: 'Work From Home',
    label: 'Work From Home',
    description: 'Working remotely from home',
    category: 'work_arrangement',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Home',
    color: 'emerald',
  },
  {
    id: 'wfa',
    name: 'Work From Anywhere',
    label: 'Work From Anywhere',
    description: 'Working remotely from another location',
    category: 'work_arrangement',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'MapPin',
    color: 'lime',
  },
  {
    id: 'unpaid',
    name: 'Unpaid Leave',
    label: 'Unpaid Leave',
    description: 'Leave without pay',
    category: 'unpaid',
    maxDays: null,
    isPaid: false,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'CircleOff',
    color: 'zinc',
  },
]

export function getLeaveType(id: string): LeaveType | undefined {
  return LEAVE_TYPES.find((type) => type.id === id)
}

export function getLeaveTypeName(id: string): string {
  return getLeaveType(id)?.name ?? id
}

export function getLeaveTypesByCategory(category: LeaveCategory): LeaveType[] {
  return LEAVE_TYPES.filter((type) => type.category === category)
}

export function getPaidLeaveTypes(): LeaveType[] {
  return LEAVE_TYPES.filter((type) => type.isPaid)
}

export function getUnpaidLeaveTypes(): LeaveType[] {
  return LEAVE_TYPES.filter((type) => !type.isPaid)
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
export function getLeavesByCategory(category: LeaveCategory): LeaveType[] {
  return LEAVE_TYPES.filter((t) => t.category === category)
}

export function getLeaveIcon(leaveTypeId: string): string {
  return getLeaveType(leaveTypeId)?.iconName ?? 'FileText'
}

/** Calculate working days between two dates (Mon–Fri only) */
export function calculateWorkingDays(start: Date, end: Date): number {
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

/** Calculate total calendar days between two dates (inclusive) */
export function calculateCalendarDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

/**
 * Auto-compute the end date for a leave type that has `autoCalculate: true`.
 * Returns the end date as a string (YYYY-MM-DD).
 */
export function autoCalculateEndDate(leaveTypeId: string, startDateStr: string): string {
  const leaveType = getLeaveType(leaveTypeId)
  if (!leaveType || !leaveType.autoCalculate || !leaveType.maxDays) return startDateStr

  const start = new Date(startDateStr)
  const end = new Date(start)

  if (leaveType.includeWeekends) {
    // Calendar days
    end.setDate(end.getDate() + leaveType.maxDays - 1)
  } else {
    // Working days only
    let added = 0
    const cursor = new Date(start)
    while (added < leaveType.maxDays - 1) {
      cursor.setDate(cursor.getDate() + 1)
      const day = cursor.getDay()
      if (day !== 0 && day !== 6) added++
    }
    end.setTime(cursor.getTime())
  }

  return end.toISOString().split('T')[0]
}

/** Calculate duration label for a leave request */
export function getDurationLabel(leaveTypeId: string, startDate: string, endDate: string, totalHours?: number): string {
  const leaveType = getLeaveType(leaveTypeId)
  if (!leaveType) return ''

  if (leaveType.requiresTime && totalHours) {
    return `${totalHours.toFixed(1)} hour${totalHours !== 1 ? 's' : ''}`
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (leaveType.includeWeekends) {
    const days = calculateCalendarDays(start, end)
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  const days = calculateWorkingDays(start, end)
  return `${days} working day${days !== 1 ? 's' : ''}`
}

export function formatLeaveDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
 
/**
 * Format range tanggal leave
 * Contoh output: "10 - 15 Januari 2025" atau "30 Januari - 3 Februari 2025"
 */
export function formatLeaveDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
 
  const startDay = start.getDate()
  const endDay = end.getDate()
  const startMonth = start.toLocaleString('id-ID', { month: 'long' })
  const endMonth = end.toLocaleString('id-ID', { month: 'long' })
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
 
  // Same month and year
  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay} - ${endDay} ${startMonth} ${startYear}`
  }
 
  // Different months, same year
  if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`
  }
 
  // Different years
  return `${formatLeaveDate(start)} - ${formatLeaveDate(end)}`
}
 
/**
 * Format durasi leave
 * Contoh output: "3 hari kerja" atau "6.5 jam"
 */
export function formatLeaveDuration(days: number, hours?: number | null): string {
  if (hours && hours > 0) {
    return `${hours} jam`
  }
  if (days === 1) return '1 hari'
  return `${days} hari`
}
 
/**
 * Format status leave ke Bahasa Indonesia
 */
export function formatLeaveStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    cancelled: 'Dibatalkan',
  }
  return statusMap[status] || status
}
 
/**
 * Get badge color based on status
 */
export function getLeaveStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-600'
}