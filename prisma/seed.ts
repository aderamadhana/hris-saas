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

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "public"."LeaveApproval",
      "public"."LeaveRequest",
      "public"."Attendance",
      "public"."Payroll",
      "public"."SalaryComponent",
      "public"."UsageLog",
      "public"."Leave",
      "public"."OrganizationSettings",
      "public"."Department",
      "public"."Employee",
      "public"."Organization"
    RESTART IDENTITY CASCADE;
  `)
}

async function createAuthUser(email: string, password: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  })

  if (error) throw error
  return data.user.id
}

async function main() {
  await resetDatabase()

  const org = await prisma.organization.create({
    data: {
      name: 'Demo Company',
      slug: 'demo-company',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      maxEmployees: 200,
      planType: 'professional',
      planStatus: 'active',
      employeeLimit: 200,
      storageLimit: 10,
      payrollDayOfMonth: 25,
      leaveApprovalLevels: 2,
      autoApproveBelow: 0,
      requireHrApprovalAbove: 3,
      bpjsKesehatanRate: '1.00',
      bpjsKetenagakerjaanRate: '2.00',
    },
  })

  const engineeringDept = await prisma.department.create({
    data: {
      organizationId: org.id,
      name: 'Engineering',
      description: 'Software Development Team',
    },
  })

  const ownerAuthId = await createAuthUser('owner@demo.com', 'Password123!', 'owner')
  const managerAuthId = await createAuthUser('manager@demo.com', 'Password123!', 'manager')
  const hrAuthId = await createAuthUser('hr@demo.com', 'Password123!', 'hr')
  const adminAuthId = await createAuthUser('admin@demo.com', 'Password123!', 'admin')
  const employeeAuthId = await createAuthUser('employee@demo.com', 'Password123!', 'employee')

  const owner = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId: ownerAuthId,
      email: 'owner@demo.com',
      firstName: 'Olivia',
      lastName: 'Owner',
      employeeId: 'EMP-001',
      position: 'Company Owner',
      employmentType: 'full-time',
      joinDate: new Date('2024-01-01'),
      status: 'active',
      baseSalary: '50000000',
      currency: 'IDR',
      role: 'owner',
      departmentId: engineeringDept.id,
    },
  })

  const manager = await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId: managerAuthId,
      email: 'manager@demo.com',
      firstName: 'Maya',
      lastName: 'Manager',
      employeeId: 'EMP-002',
      position: 'Engineering Manager',
      employmentType: 'full-time',
      joinDate: new Date('2024-01-01'),
      status: 'active',
      baseSalary: '25000000',
      currency: 'IDR',
      role: 'manager',
      managerId: owner.id,
      departmentId: engineeringDept.id,
    },
  })

  await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId: hrAuthId,
      email: 'hr@demo.com',
      firstName: 'Hana',
      lastName: 'HR',
      employeeId: 'EMP-003',
      position: 'HR Manager',
      employmentType: 'full-time',
      joinDate: new Date('2024-01-01'),
      status: 'active',
      baseSalary: '20000000',
      currency: 'IDR',
      role: 'hr',
      managerId: owner.id,
      departmentId: engineeringDept.id,
    },
  })

  await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId: adminAuthId,
      email: 'admin@demo.com',
      firstName: 'Adam',
      lastName: 'Admin',
      employeeId: 'EMP-004',
      position: 'System Administrator',
      employmentType: 'full-time',
      joinDate: new Date('2024-01-01'),
      status: 'active',
      baseSalary: '18000000',
      currency: 'IDR',
      role: 'admin',
      managerId: owner.id,
      departmentId: engineeringDept.id,
    },
  })

  await prisma.employee.create({
    data: {
      organizationId: org.id,
      authId: employeeAuthId,
      email: 'employee@demo.com',
      firstName: 'Eka',
      lastName: 'Employee',
      employeeId: 'EMP-005',
      position: 'Software Engineer',
      employmentType: 'full-time',
      joinDate: new Date('2024-01-01'),
      status: 'active',
      baseSalary: '12000000',
      currency: 'IDR',
      role: 'employee',
      managerId: manager.id,
      departmentId: engineeringDept.id,
    },
  })

  console.log('Seed selesai')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })