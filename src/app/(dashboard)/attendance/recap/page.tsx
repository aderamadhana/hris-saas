// src/app/(dashboard)/attendance/recap/page.tsx
// Monthly attendance recap with department filter

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MonthlyRecapClient } from '@/components/attendance/monthly-recap-client'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    month?: string
    year?: string
    departmentId?: string
    employeeId?: string
  }>
}

export default async function AttendanceRecapPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { id: true, organizationId: true, role: true, firstName: true, lastName: true },
  })
  if (!currentEmployee) redirect('/login')

  // Only admin/HR/manager can see recap
  const allowed = ['admin', 'hr', 'owner', 'manager']
  if (!allowed.includes(currentEmployee.role)) redirect('/dashboard/attendance')

  const params = await searchParams
  const now = new Date()
  const month = parseInt(params.month || String(now.getMonth() + 1))
  const year = parseInt(params.year || String(now.getFullYear()))
  const departmentId = params.departmentId
  const employeeId = params.employeeId

  // Fetch departments for filter
  const departments = await prisma.department.findMany({
    where: { organizationId: currentEmployee.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Fetch all active employees (for individual filter)
  const employees = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
      status: 'active',
      ...(currentEmployee.role === 'manager' ? { managerId: currentEmployee.id } : {}),
    },
    select: { id: true, firstName: true, lastName: true, employeeId: true, departmentId: true },
    orderBy: { firstName: 'asc' },
  })

  // Build query params for the API
  const apiParams = new URLSearchParams({
    month: String(month),
    year: String(year),
    ...(departmentId ? { departmentId } : {}),
    ...(employeeId ? { employeeId } : {}),
  })

  // Fetch recap data server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let recapData = null
  try {
    const cookie = await (await createClient()).auth.getSession()
    // We'll let the client component fetch this with auth
    // Pass initial server-rendered data
  } catch (_) {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rekap Absensi Bulanan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Laporan kehadiran karyawan per bulan
        </p>
      </div>

      <MonthlyRecapClient
        initialMonth={month}
        initialYear={year}
        initialDepartmentId={departmentId}
        initialEmployeeId={employeeId}
        departments={departments}
        employees={employees}
        currentUserRole={currentEmployee.role}
        currentUserId={currentEmployee.id}
      />
    </div>
  )
}