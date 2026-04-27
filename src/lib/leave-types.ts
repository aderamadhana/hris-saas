// src/lib/leave-types.ts
// Indonesian Labor Law (UU Ketenagakerjaan) Leave Types - English Version

export interface LeaveType {
  id: string
  label: string
  description: string
  category: LeaveCategory
  maxDays: number | null // null = unlimited
  isPaid: boolean
  requiresDocument: boolean
  autoCalculate: boolean // auto-fill end date
  includeWeekends: boolean // false = working days only
  requiresDelegation: boolean
  requiresTime: boolean // for OOO - needs start/end time
  iconName: string
  color: string
}

export type LeaveCategory =
  | 'annual'
  | 'health'
  | 'maternity'
  | 'special'
  | 'work_arrangement'
  | 'unpaid'

export const LEAVE_CATEGORIES: Record<LeaveCategory, string> = {
  annual: 'Annual Leave',
  health: 'Medical Leave',
  maternity: 'Maternity Leave',
  special: 'Special Leave',
  work_arrangement: 'Work Arrangement',
  unpaid: 'Unpaid Leave',
}

export const LEAVE_TYPES: LeaveType[] = [
  // ─── ANNUAL LEAVE ───────────────────────────────────────────────
  {
    id: 'annual',
    label: 'Annual Leave',
    description: 'Paid yearly leave entitlement (minimum 12 days per year)',
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

  // ─── MEDICAL LEAVE ──────────────────────────────────────────────
  {
    id: 'sick',
    label: 'Sick Leave',
    description: 'Medical leave due to illness — unlimited duration with doctor\'s note',
    category: 'health',
    maxDays: null, // unlimited
    isPaid: true,
    requiresDocument: true,
    autoCalculate: false,
    includeWeekends: true,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Heart',
    color: 'red',
  },

  // ─── MATERNITY LEAVE ────────────────────────────────────────────
  {
    id: 'maternity',
    label: 'Maternity Leave',
    description: 'Paid leave for mothers — automatically set to 90 calendar days',
    category: 'maternity',
    maxDays: 90,
    isPaid: true,
    requiresDocument: true,
    autoCalculate: true,
    includeWeekends: true, // 90 consecutive days
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'Baby',
    color: 'pink',
  },

  // ─── SPECIAL LEAVE ──────────────────────────────────────────────
  {
    id: 'marriage',
    label: 'Marriage Leave',
    description: 'Leave for own wedding ceremony — 3 working days',
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
    label: "Child's Wedding Leave",
    description: "Leave to attend your child's wedding — 2 working days",
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
    label: "Child's Circumcision Leave",
    description: "Leave for your child's circumcision ceremony — 2 working days",
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
    label: "Child's Baptism Leave",
    description: "Leave for your child's baptism ceremony — 2 working days",
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
    label: "Paternity Leave (Wife Giving Birth)",
    description: "Leave for father when wife gives birth or has a miscarriage — 2 working days",
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
    label: 'Immediate Family Bereavement',
    description: 'Leave for death of a household family member (same address) — 2 working days',
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
    label: 'Extended Family Bereavement',
    description: 'Leave for death of a family member not living in the same household — 1 working day',
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
    label: 'Hajj (Pilgrimage) Leave',
    description: 'Leave for performing the Hajj pilgrimage — up to 40 days (once per employment)',
    category: 'special',
    maxDays: 40,
    isPaid: false, // unpaid — per UU
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
    label: 'Compensatory Day Off',
    description: 'Time off in lieu of working on a public holiday or rest day',
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

  // ─── WORK ARRANGEMENT ───────────────────────────────────────────
  {
    id: 'business_trip_local',
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
    id: 'business_trip_out_of_province',
    label: 'Out-of-Province Business Trip',
    description: 'Official travel to another province or region',
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
    label: 'Out of Office (OOO)',
    description: 'Away from the office during working hours — requires start & end time',
    category: 'work_arrangement',
    maxDays: 1,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: true, // ← show time picker
    iconName: 'PhoneOff',
    color: 'orange',
  },
  {
    id: 'wfh',
    label: 'Work From Home (WFH)',
    description: 'Remote work from home',
    category: 'work_arrangement',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Home',
    color: 'cyan',
  },
  {
    id: 'wfa',
    label: 'Work From Anywhere (WFA)',
    description: 'Remote work from any location (not home office)',
    category: 'work_arrangement',
    maxDays: null,
    isPaid: true,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: false,
    requiresTime: false,
    iconName: 'Globe',
    color: 'emerald',
  },

  // ─── UNPAID LEAVE ───────────────────────────────────────────────
  {
    id: 'unpaid',
    label: 'Unpaid Leave',
    description: 'Leave without pay — subject to manager approval',
    category: 'unpaid',
    maxDays: null,
    isPaid: false,
    requiresDocument: false,
    autoCalculate: false,
    includeWeekends: false,
    requiresDelegation: true,
    requiresTime: false,
    iconName: 'XCircle',
    color: 'red',
  },
]

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

export function getLeaveType(id: string): LeaveType | undefined {
  return LEAVE_TYPES.find((t) => t.id === id)
}

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