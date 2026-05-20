// prisma/seed.ts
// Seeder lengkap sesuai schema terbaru
// Jalankan: npx ts-node prisma/seed.ts
// atau: npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function subDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

// Nominal dibuat lebih realistis untuk demo, tidak terlalu tinggi.
const SALARY = {
  owner: 15000000,
  manager: 10000000,
  hr: 8000000,
  admin: 7000000,
  employee: 6000000,
  employee2: 5500000,
} as const

const DEFAULT_ALLOWANCES = 700000

// ─── Reset Database ───────────────────────────────────────────────────────────

async function resetDatabase() {
  console.log('🗑️  Resetting database...')

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "public"."AnnouncementRead",
      "public"."Announcement",
      "public"."GoalTracking",
      "public"."PerformanceReview",
      "public"."ReviewCycle",
      "public"."EmployeeDocument",
      "public"."CompanyEvent",
      "public"."Notification",
      "public"."LeaveApproval",
      "public"."Leave",
      "public"."LeaveRequest",
      "public"."Attendance",
      "public"."Payroll",
      "public"."SalaryComponent",
      "public"."LeavePolicyConfig",
      "public"."PayrollConfig",
      "public"."UsageLog",
      "public"."BillingTransaction",
      "public"."OrganizationSettings",
      "public"."Department",
      "public"."Employee",
      "public"."Organization"
    RESTART IDENTITY CASCADE;
  `)

  console.log('✅ Database reset complete')
}

// ─── Supabase Auth ────────────────────────────────────────────────────────────

async function upsertAuthUser(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  // Cek apakah user sudah ada
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === email)

  if (found) {
    // Update password user yang sudah ada
    await supabaseAdmin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
    })
    console.log(`  ♻️  Auth user updated: ${email}`)
    return found.id
  }

  // Buat user baru
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (error) throw new Error(`Failed to create auth user ${email}: ${error.message}`)

  console.log(`  ✅ Auth user created: ${email}`)
  return data.user.id
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Starting seed...\n')

  await resetDatabase()

  // ── 1. Auth Users (email & password SAMA seperti sebelumnya) ─────────────
  console.log('\n👤 Creating auth users...')

  const [
    ownerAuthId,
    managerAuthId,
    hrAuthId,
    adminAuthId,
    employeeAuthId,
    employee2AuthId,
  ] = await Promise.all([
    upsertAuthUser('owner@demo.com',     'Password123!', 'Olivia Owner'),
    upsertAuthUser('manager@demo.com',   'Password123!', 'Maya Manager'),
    upsertAuthUser('hr@demo.com',        'Password123!', 'Hana HR'),
    upsertAuthUser('admin@demo.com',     'Password123!', 'Adam Admin'),
    upsertAuthUser('employee@demo.com',  'Password123!', 'Eka Employee'),
    upsertAuthUser('employee2@demo.com', 'Password123!', 'Edi Employee'),
  ])

  // ── 2. Organization ───────────────────────────────────────────────────────
  console.log('\n🏢 Creating organization...')

  const org = await prisma.organization.create({
    data: {
      name:                    'Demo Company',
      slug:                    'demo-company',
      subscriptionTier:        'professional',
      subscriptionStatus:      'active',
      maxEmployees:            200,
      planType:                'professional',
      planStatus:              'active',
      employeeLimit:           200,
      storageLimit:            50,
      payrollDayOfMonth:       25,
      leaveApprovalLevels:     2,
      autoApproveBelow:        0,
      requireHrApprovalAbove:  3,
      bpjsKesehatanRate:       '1.00',
      bpjsKetenagakerjaanRate: '2.00',
      lastPaymentAt:           new Date('2025-01-01'),
      lastPaymentAmount:       990000,
    },
  })

  // ── 3. Organization Settings ──────────────────────────────────────────────
  await prisma.organizationSettings.create({
    data: {
      organizationId:    org.id,
      workingDaysPerWeek: 5,
      workStartTime:     '08:00',
      workEndTime:       '17:00',
      timezone:          'Asia/Jakarta',
      annualLeaveQuota:  12,
      sickLeaveQuota:    12,
    },
  })

  // ── 4. PayrollConfig ──────────────────────────────────────────────────────
  await prisma.payrollConfig.create({
    data: {
      organizationId:      org.id,
      bpjsKesEnabled:      true,
      bpjsKesEmployee:     1.0,
      bpjsKesEmployer:     4.0,
      bpjsTkEnabled:       true,
      bpjsTkJHT:           2.0,
      bpjsTkJHTEmployer:   3.7,
      bpjsTkJP:            1.0,
      bpjsTkJPEmployer:    2.0,
      bpjsTkJKK:           0.24,
      bpjsTkJKM:           0.3,
      pph21Enabled:        true,
      pph21Method:         'gross',
      pph21PTKP:           54000000,
      ptkpStatus:          'TK/0',
      lateDeductEnabled:   false,
      lateGraceMinutes:    15,
      absentDeductEnabled: false,
      overtimeEnabled:     true,
      overtimeRate1:       1.5,
      overtimeRate2:       2.0,
      payrollDate:         25,
      cutoffDate:          20,
      workingDaysPerMonth: 22,
    },
  })

  // ── 5. Departments ────────────────────────────────────────────────────────
  console.log('\n🏗️  Creating departments...')

  const [engineering, hr] = await Promise.all([
    prisma.department.create({
      data: { organizationId: org.id, name: 'Engineering', description: 'Software Development Team' },
    }),
    prisma.department.create({
      data: { organizationId: org.id, name: 'Human Resources', description: 'HR & People Operations' },
    }),
  ])

  await prisma.department.createMany({
    data: [
      { organizationId: org.id, name: 'Finance', description: 'Finance & Accounting' },
      { organizationId: org.id, name: 'Marketing', description: 'Marketing & Communications' },
    ],
  })

  // ── 6. Employees ──────────────────────────────────────────────────────────
  console.log('\n👥 Creating employees...')

  const owner = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId:         ownerAuthId,
      email:          'owner@demo.com',
      firstName:      'Olivia',
      lastName:       'Owner',
      employeeId:     'EMP-001',
      position:       'Company Owner',
      employmentType: 'full-time',
      joinDate:       new Date('2023-01-01'),
      status:         'active',
      baseSalary:     SALARY.owner.toString(),
      currency:       'IDR',
      role:           'owner',
      departmentId:   engineering.id,
      phoneNumber:    '081234567890',
    },
  })

  const manager = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId:         managerAuthId,
      email:          'manager@demo.com',
      firstName:      'Maya',
      lastName:       'Manager',
      employeeId:     'EMP-002',
      position:       'Engineering Manager',
      employmentType: 'full-time',
      joinDate:       new Date('2023-03-01'),
      status:         'active',
      baseSalary:     SALARY.manager.toString(),
      currency:       'IDR',
      role:           'manager',
      managerId:      owner.id,
      departmentId:   engineering.id,
      phoneNumber:    '081234567891',
    },
  })

  const hrEmployee = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId:         hrAuthId,
      email:          'hr@demo.com',
      firstName:      'Hana',
      lastName:       'HR',
      employeeId:     'EMP-003',
      position:       'HR Manager',
      employmentType: 'full-time',
      joinDate:       new Date('2023-03-01'),
      status:         'active',
      baseSalary:     SALARY.hr.toString(),
      currency:       'IDR',
      role:           'hr',
      managerId:      owner.id,
      departmentId:   hr.id,
      phoneNumber:    '081234567892',
    },
  })

  const adminEmployee = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId:         adminAuthId,
      email:          'admin@demo.com',
      firstName:      'Adam',
      lastName:       'Admin',
      employeeId:     'EMP-004',
      position:       'System Administrator',
      employmentType: 'full-time',
      joinDate:       new Date('2023-06-01'),
      status:         'active',
      baseSalary:     SALARY.admin.toString(),
      currency:       'IDR',
      role:           'admin',
      managerId:      owner.id,
      departmentId:   engineering.id,
      phoneNumber:    '081234567893',
    },
  })

  const employee = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId:         employeeAuthId,
      email:          'employee@demo.com',
      firstName:      'Eka',
      lastName:       'Employee',
      employeeId:     'EMP-005',
      position:       'Software Engineer',
      employmentType: 'full-time',
      joinDate:       new Date('2024-01-15'),
      status:         'active',
      baseSalary:     SALARY.employee.toString(),
      currency:       'IDR',
      role:           'employee',
      managerId:      manager.id,
      departmentId:   engineering.id,
      phoneNumber:    '081234567894',
    },
  })

  const employee2 = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId:         employee2AuthId,
      email:          'employee2@demo.com',
      firstName:      'Edi',
      lastName:       'Employee',
      employeeId:     'EMP-006',
      position:       'Frontend Developer',
      employmentType: 'full-time',
      joinDate:       new Date('2024-03-01'),
      status:         'active',
      baseSalary:     SALARY.employee2.toString(),
      currency:       'IDR',
      role:           'employee',
      managerId:      manager.id,
      departmentId:   engineering.id,
      phoneNumber:    '081234567895',
    },
  })

  // Update department managers
  await Promise.all([
    prisma.department.update({ where: { id: engineering.id }, data: { managerId: manager.id } }),
    prisma.department.update({ where: { id: hr.id },          data: { managerId: hrEmployee.id } }),
  ])

  // ── 7. Salary Components ──────────────────────────────────────────────────
  await Promise.all([
    prisma.salaryComponent.create({
      data: { organizationId: org.id, name: 'Transport Allowance', type: 'allowance', amount: '300000', isDefault: true, isActive: true },
    }),
    prisma.salaryComponent.create({
      data: { organizationId: org.id, name: 'Meal Allowance', type: 'allowance', amount: '400000', isDefault: true, isActive: true },
    }),
    prisma.salaryComponent.create({
      data: { organizationId: org.id, name: 'Health Allowance', type: 'allowance', amount: '200000', isDefault: false, isActive: true },
    }),
  ])

  // ── 8. Leave Policy Config ────────────────────────────────────────────────
  console.log('\n📋 Creating leave policies...')

  const leavePolicies = [
    { leaveTypeId: 'annual',                isEnabled: true,  maxDaysOverride: 12,  isPaidOverride: true,  requiresApproval: true,  requiresDocument: false, requiresDelegation: true  },
    { leaveTypeId: 'sick',                  isEnabled: true,  maxDaysOverride: null, isPaidOverride: true,  requiresApproval: true,  requiresDocument: true,  requiresDelegation: false },
    { leaveTypeId: 'maternity',             isEnabled: true,  maxDaysOverride: 90,  isPaidOverride: true,  requiresApproval: true,  requiresDocument: true,  requiresDelegation: true  },
    { leaveTypeId: 'marriage',              isEnabled: true,  maxDaysOverride: 3,   isPaidOverride: true,  requiresApproval: true,  requiresDocument: true,  requiresDelegation: false },
    { leaveTypeId: 'paternity',             isEnabled: true,  maxDaysOverride: 2,   isPaidOverride: true,  requiresApproval: true,  requiresDocument: true,  requiresDelegation: false },
    { leaveTypeId: 'family_death',          isEnabled: true,  maxDaysOverride: 2,   isPaidOverride: true,  requiresApproval: true,  requiresDocument: false, requiresDelegation: false },
    { leaveTypeId: 'extended_family_death', isEnabled: true,  maxDaysOverride: 1,   isPaidOverride: true,  requiresApproval: true,  requiresDocument: false, requiresDelegation: false },
    { leaveTypeId: 'hajj',                  isEnabled: true,  maxDaysOverride: 40,  isPaidOverride: false, requiresApproval: true,  requiresDocument: true,  requiresDelegation: true  },
    { leaveTypeId: 'wfh',                   isEnabled: true,  maxDaysOverride: null, isPaidOverride: true,  requiresApproval: true,  requiresDocument: false, requiresDelegation: false },
    { leaveTypeId: 'wfa',                   isEnabled: true,  maxDaysOverride: null, isPaidOverride: true,  requiresApproval: true,  requiresDocument: false, requiresDelegation: false },
    { leaveTypeId: 'out_of_office',         isEnabled: true,  maxDaysOverride: null, isPaidOverride: true,  requiresApproval: true,  requiresDocument: false, requiresDelegation: false },
    { leaveTypeId: 'business_trip_local',   isEnabled: true,  maxDaysOverride: null, isPaidOverride: true,  requiresApproval: true,  requiresDocument: false, requiresDelegation: true  },
    { leaveTypeId: 'unpaid',                isEnabled: true,  maxDaysOverride: null, isPaidOverride: false, requiresApproval: true,  requiresDocument: false, requiresDelegation: false },
  ]

  await prisma.leavePolicyConfig.createMany({
    data: leavePolicies.map((p) => ({ ...p, organizationId: org.id })),
    skipDuplicates: true,
  })

  // ── 9. Attendance (30 hari terakhir) ──────────────────────────────────────
  console.log('\n🕐 Creating attendance records...')

  const today       = new Date()
  const allEmployees = [owner, manager, hrEmployee, adminEmployee, employee, employee2]

  const attendanceData: {
    organizationId: string
    employeeId:     string
    date:           Date
    checkIn:        Date
    checkOut:       Date
    status:         string
    notes:          string | null
  }[] = []

  for (let i = 29; i >= 0; i--) {
    const date    = subDays(today, i)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekend

    for (const emp of allEmployees) {
      const rand = Math.random()
      let status = 'present'
      let checkInHour  = 8
      let checkInMin   = Math.floor(Math.random() * 10) // 08:00-08:10
      let checkOutHour = 17

      if (rand < 0.05) {
        status = 'absent'
        continue // tidak buat record untuk absent
      } else if (rand < 0.15) {
        status = 'late'
        checkInHour = 8
        checkInMin  = 15 + Math.floor(Math.random() * 45) // 08:15-09:00
      }

      const checkIn  = new Date(date)
      checkIn.setHours(checkInHour, checkInMin, 0, 0)

      const checkOut = new Date(date)
      checkOut.setHours(checkOutHour, Math.floor(Math.random() * 30), 0, 0)

      attendanceData.push({
        organizationId: org.id,
        employeeId:     emp.id,
        date:           new Date(date.toISOString().split('T')[0]),
        checkIn,
        checkOut,
        status,
        notes: null,
      })
    }
  }

  // createMany dengan skipDuplicates untuk unique [employeeId, date]
  await prisma.attendance.createMany({
    data: attendanceData,
    skipDuplicates: true,
  })

  console.log(`  ✅ ${attendanceData.length} attendance records created`)

  // ── 10. Leave Requests ────────────────────────────────────────────────────
  console.log('\n🏖️  Creating leave requests...')

  const leave1 = await prisma.leave.create({
    data: {
      employeeId:     employee.id,
      organizationId: org.id,
      leaveType:      'annual',
      category:       'annual',
      startDate:      addDays(today, 7),
      endDate:        addDays(today, 11),
      days:           5,
      reason:         'Family vacation to Bali',
      status:         'pending',
      isPaid:         true,
      currentApprovalLevel:   1,
      requiresApprovalLevels: 2,
      delegateTo:     employee2.id,
      delegateNotes:  'Please handle the sprint review meeting',
    },
  })

  await prisma.leaveApproval.create({
    data: {
      leaveId:    leave1.id,
      approverId: manager.id,
      level:      1,
      sequence:   1,
      status:     'pending',
      action:     'pending',
    },
  })

  // Leave yang sudah approved
  const leave2 = await prisma.leave.create({
    data: {
      employeeId:     employee2.id,
      organizationId: org.id,
      leaveType:      'sick',
      category:       'health',
      startDate:      subDays(today, 5),
      endDate:        subDays(today, 3),
      days:           3,
      reason:         'Demam dan flu',
      status:         'approved',
      isPaid:         true,
      approvedBy:     manager.id,
      approvedAt:     subDays(today, 6),
      currentApprovalLevel:   1,
      requiresApprovalLevels: 1,
    },
  })

  await prisma.leaveApproval.create({
    data: {
      leaveId:    leave2.id,
      approverId: manager.id,
      level:      1,
      sequence:   1,
      status:     'completed',
      action:     'approved',
      comments:   'Get well soon',
      actionDate: subDays(today, 6),
    },
  })

  // Leave WFH pending
  const leave3 = await prisma.leave.create({
    data: {
      employeeId:     employee.id,
      organizationId: org.id,
      leaveType:      'wfh',
      category:       'work',
      startDate:      addDays(today, 2),
      endDate:        addDays(today, 2),
      days:           1,
      reason:         'Menunggu paket pengiriman penting',
      status:         'pending',
      isPaid:         true,
      currentApprovalLevel:   1,
      requiresApprovalLevels: 1,
    },
  })

  await prisma.leaveApproval.create({
    data: {
      leaveId:    leave3.id,
      approverId: manager.id,
      level:      1,
      sequence:   1,
      status:     'pending',
      action:     'pending',
    },
  })

  // ── 11. Payroll (bulan lalu) ───────────────────────────────────────────────
  console.log('\n💰 Creating payroll records...')

  const lastMonth   = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const payrollMonth = lastMonth.getMonth() + 1
  const payrollYear  = lastMonth.getFullYear()
  const periodStart  = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
  const periodEnd    = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)

  const payrollEmployees = [
    { emp: owner,         base: SALARY.owner },
    { emp: manager,       base: SALARY.manager },
    { emp: hrEmployee,    base: SALARY.hr },
    { emp: adminEmployee, base: SALARY.admin },
    { emp: employee,      base: SALARY.employee },
    { emp: employee2,     base: SALARY.employee2 },
  ]

  for (const { emp, base } of payrollEmployees) {
    const allowances  = DEFAULT_ALLOWANCES
    const gross       = base + allowances
    const bpjsKes     = Math.round(base * 0.01)
    const bpjsTk      = Math.round(base * 0.02)
    const pph21       = gross > 54000000 / 12 ? Math.round((gross - 54000000 / 12) * 0.05) : 0
    const totalDed    = bpjsKes + bpjsTk + pph21
    const net         = gross - totalDed

    await prisma.payroll.create({
      data: {
        organizationId:     org.id,
        employeeId:         emp.id,
        month:              payrollMonth,
        year:               payrollYear,
        periodStart,
        periodEnd,
        baseSalary:         base.toString(),
        allowances:         allowances.toString(),
        overtime:           '0',
        bonus:              '0',
        bpjsKesehatan:      bpjsKes.toString(),
        bpjsKetenagakerjaan: bpjsTk.toString(),
        pph21:              pph21.toString(),
        otherDeductions:    '0',
        totalDeductions:    totalDed.toString(),
        grossSalary:        gross.toString(),
        netSalary:          net.toString(),
        workDays:           22,
        absentDays:         0,
        lateDays:           0,
        status:             'paid',
        paidDate:           new Date(payrollYear, payrollMonth - 1, 25),
        createdBy:          hrEmployee.id,
        approvedBy:         owner.id,
      },
    })
  }

  // ── 12. Notifications ─────────────────────────────────────────────────────
  console.log('\n🔔 Creating notifications...')

  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        recipientId:    manager.id,
        senderId:       employee.id,
        type:           'leave_submitted',
        title:          'Leave Request from Eka Employee',
        message:        'Eka Employee has submitted a 5-day annual leave request starting next week.',
        resourceType:   'leave',
        resourceId:     leave1.id,
        isRead:         false,
      },
      {
        organizationId: org.id,
        recipientId:    manager.id,
        senderId:       employee.id,
        type:           'leave_submitted',
        title:          'WFH Request from Eka Employee',
        message:        'Eka Employee has submitted a WFH request for tomorrow.',
        resourceType:   'leave',
        resourceId:     leave3.id,
        isRead:         false,
      },
      {
        organizationId: org.id,
        recipientId:    employee2.id,
        senderId:       manager.id,
        type:           'leave_approved',
        title:          'Leave Request Approved',
        message:        'Your sick leave request (3 days) has been approved by Maya Manager.',
        resourceType:   'leave',
        resourceId:     leave2.id,
        isRead:         false,
      },
      {
        organizationId: org.id,
        recipientId:    employee.id,
        type:           'payroll_paid',
        title:          'Payslip Available',
        message:        `Your payslip for ${lastMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })} is ready to view.`,
        resourceType:   'payslip',
        isRead:         true,
        readAt:         subDays(today, 1),
      },
      {
        organizationId: org.id,
        recipientId:    employee2.id,
        type:           'payroll_paid',
        title:          'Payslip Available',
        message:        `Your payslip for ${lastMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })} is ready to view.`,
        resourceType:   'payslip',
        isRead:         false,
      },
      {
        organizationId: org.id,
        recipientId:    hrEmployee.id,
        type:           'system',
        title:          'Welcome to HRIS System',
        message:        'Your account has been set up. You can now manage employee data, leave requests, and payroll.',
        isRead:         true,
        readAt:         subDays(today, 10),
      },
    ],
  })

  // ── 13. Announcements ─────────────────────────────────────────────────────
  console.log('\n📢 Creating announcements...')

  const announcement1 = await prisma.announcement.create({
    data: {
      organizationId: org.id,
      authorId:       hrEmployee.id,
      title:          'Company Outing Q1 2026',
      content:        'We are excited to announce our company outing scheduled for next month. All employees are encouraged to join. More details will be shared via email.',
      type:           'event',
      isPinned:       true,
      isPublished:    true,
      publishedAt:    subDays(today, 3),
      targetRoles:    'all',
      expiresAt:      addDays(today, 30),
    },
  })

  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      authorId:       owner.id,
      title:          'New Work From Home Policy',
      content:        'Effective next month, employees may work from home up to 2 days per week with manager approval. Please submit WFH requests through the HRIS system.',
      type:           'info',
      isPinned:       false,
      isPublished:    true,
      publishedAt:    subDays(today, 7),
      targetRoles:    'all',
    },
  })

  await prisma.announcement.create({
    data: {
      organizationId: org.id,
      authorId:       hrEmployee.id,
      title:          'Annual Performance Review Season',
      content:        'Annual performance reviews will begin next month. Managers please prepare review forms for your team members.',
      type:           'info',
      isPinned:       false,
      isPublished:    true,
      publishedAt:    subDays(today, 1),
      targetRoles:    'manager,hr,admin,owner',
    },
  })

  // Announcement reads
  await prisma.announcementRead.createMany({
    data: [
      { announcementId: announcement1.id, employeeId: employee.id,  readAt: subDays(today, 2) },
      { announcementId: announcement1.id, employeeId: employee2.id, readAt: subDays(today, 1) },
      { announcementId: announcement1.id, employeeId: manager.id,   readAt: subDays(today, 3) },
    ],
    skipDuplicates: true,
  })

  // ── 14. Company Events (Calendar) ────────────────────────────────────────
  console.log('\n📅 Creating company events...')

  await prisma.companyEvent.createMany({
    data: [
      {
        organizationId: org.id,
        createdBy:      hrEmployee.id,
        title:          'Hari Kemerdekaan Indonesia',
        type:           'holiday',
        color:          '#EF4444',
        startDate:      new Date(today.getFullYear(), 7, 17), // 17 Aug
        endDate:        new Date(today.getFullYear(), 7, 17),
        isAllDay:       true,
        isNational:     true,
        targetRoles:    'all',
      },
      {
        organizationId: org.id,
        createdBy:      hrEmployee.id,
        title:          'Hari Raya Idul Fitri',
        type:           'holiday',
        color:          '#EF4444',
        startDate:      new Date(today.getFullYear(), 2, 31), // estimasi
        endDate:        new Date(today.getFullYear(), 3, 1),
        isAllDay:       true,
        isNational:     true,
        targetRoles:    'all',
      },
      {
        organizationId: org.id,
        createdBy:      manager.id,
        title:          'Sprint Planning',
        description:    'Q2 sprint planning meeting for engineering team',
        type:           'meeting',
        color:          '#3B82F6',
        startDate:      addDays(today, 3),
        endDate:        addDays(today, 3),
        isAllDay:       false,
        startTime:      '09:00',
        endTime:        '11:00',
        targetRoles:    'all',
        targetDepartmentId: engineering.id,
      },
      {
        organizationId: org.id,
        createdBy:      hrEmployee.id,
        title:          'Company Outing',
        description:    'Annual company team building and outing event',
        type:           'event',
        color:          '#10B981',
        startDate:      addDays(today, 21),
        endDate:        addDays(today, 22),
        isAllDay:       true,
        targetRoles:    'all',
      },
      {
        organizationId: org.id,
        createdBy:      hrEmployee.id,
        title:          'Payroll Cut-off',
        description:    'Monthly payroll data submission deadline',
        type:           'reminder',
        color:          '#F59E0B',
        startDate:      new Date(today.getFullYear(), today.getMonth(), 20),
        endDate:        new Date(today.getFullYear(), today.getMonth(), 20),
        isAllDay:       true,
        isRecurring:    true,
        recurringType:  'monthly',
        targetRoles:    'hr,admin,owner',
      },
    ],
  })

  // ── 15. Performance — Review Cycle ────────────────────────────────────────
  console.log('\n📊 Creating performance review cycle...')

  const reviewCycle = await prisma.reviewCycle.create({
    data: {
      organizationId: org.id,
      name:           `Annual Review ${today.getFullYear()}`,
      type:           'annual',
      startDate:      new Date(today.getFullYear(), 0, 1),
      endDate:        new Date(today.getFullYear(), 11, 31),
      status:         'active',
      description:    'Annual performance review for all employees',
    },
  })

  // Review untuk employee (self assessment sudah disubmit)
  const review1 = await prisma.performanceReview.create({
    data: {
      organizationId: org.id,
      cycleId:        reviewCycle.id,
      revieweeId:     employee.id,
      reviewerId:     manager.id,
      status:         'pending_manager',
      selfRating:     4.0,
      selfComments:   'Saya telah menyelesaikan semua sprint tasks tepat waktu dan berkontribusi pada peningkatan code quality melalui code review.',
      submittedAt:    subDays(today, 5),
    },
  })

  // Review untuk employee2 (belum self assessment)
  await prisma.performanceReview.create({
    data: {
      organizationId: org.id,
      cycleId:        reviewCycle.id,
      revieweeId:     employee2.id,
      reviewerId:     manager.id,
      status:         'pending_employee',
    },
  })

  // GoalTracking untuk review1
  await prisma.goalTracking.createMany({
    data: [
      {
        reviewId:    review1.id,
        employeeId:  employee.id,
        title:       'Complete TypeScript migration',
        description: 'Migrate legacy JavaScript codebase to TypeScript',
        progress:    75,
        status:      'in_progress',
        targetDate:  new Date(today.getFullYear(), 8, 30),
      },
      {
        reviewId:    review1.id,
        employeeId:  employee.id,
        title:       'Improve code coverage',
        description: 'Increase unit test coverage from 60% to 80%',
        progress:    65,
        status:      'in_progress',
        targetDate:  new Date(today.getFullYear(), 11, 31),
      },
    ],
  })

  // ── 16. Employee Documents ────────────────────────────────────────────────
  console.log('\n📄 Creating employee documents...')

  await prisma.employeeDocument.createMany({
    data: [
      {
        organizationId: org.id,
        employeeId:     employee.id,
        uploadedBy:     hrEmployee.id,
        category:       'contract',
        name:           'Employment Contract - Eka Employee',
        description:    'Permanent employment contract signed Jan 2024',
        fileUrl:        'https://example.com/docs/contract-eka.pdf',
        fileType:       'pdf',
        fileSize:       245760,
        isPrivate:      false,
        isVerified:     true,
      },
      {
        organizationId: org.id,
        employeeId:     employee.id,
        uploadedBy:     employee.id,
        category:       'id_card',
        name:           'KTP - Eka Employee',
        description:    'National ID Card',
        fileUrl:        'https://example.com/docs/ktp-eka.jpg',
        fileType:       'jpg',
        fileSize:       102400,
        isPrivate:      true,
        isVerified:     true,
      },
      {
        organizationId: org.id,
        employeeId:     employee2.id,
        uploadedBy:     hrEmployee.id,
        category:       'contract',
        name:           'Employment Contract - Edi Employee',
        description:    'Permanent employment contract signed Mar 2024',
        fileUrl:        'https://example.com/docs/contract-edi.pdf',
        fileType:       'pdf',
        fileSize:       245760,
        isPrivate:      false,
        isVerified:     false,
        expiresAt:      addDays(today, 365),
      },
      {
        organizationId: org.id,
        employeeId:     employee.id,
        uploadedBy:     hrEmployee.id,
        category:       'bpjs',
        name:           'BPJS Kesehatan - Eka Employee',
        fileUrl:        'https://example.com/docs/bpjs-eka.pdf',
        fileType:       'pdf',
        fileSize:       51200,
        isPrivate:      false,
        isVerified:     true,
      },
    ],
  })

  // ── 17. Usage Log ─────────────────────────────────────────────────────────
  await prisma.usageLog.create({
    data: {
      organizationId: org.id,
      employeeCount:  6,
      storageUsed:    0.5,
    },
  })

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n')
  console.log('─────────────────────────────────────────')
  console.log('  Test accounts (password: Password123!)')
  console.log('─────────────────────────────────────────')
  console.log('  owner@demo.com     → Owner')
  console.log('  manager@demo.com   → Manager')
  console.log('  hr@demo.com        → HR')
  console.log('  admin@demo.com     → Admin')
  console.log('  employee@demo.com  → Employee')
  console.log('  employee2@demo.com → Employee')
  console.log('─────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })