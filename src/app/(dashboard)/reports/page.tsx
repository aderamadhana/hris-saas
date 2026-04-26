// src/app/(dashboard)/reports/page.tsx
// Halaman Reports dengan 3 tab: Attendance, Leave, Payroll

import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { redirect } from 'next/navigation'
import { ReportsClient } from '@/src/components/reports/reports-client'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { authId: user.id },
        { authId: null, email: user.email },
      ],
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!employee) redirect('/login')

  // Hanya HR, Admin, Owner yang bisa akses Reports
  if (!['hr', 'admin', 'owner'].includes(employee.role)) {
    redirect('/dashboard')
  }

  // Ambil daftar karyawan untuk filter
  const employees = await prisma.employee.findMany({
    where: {
      organizationId: employee.organizationId,
      status: 'active',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
      department: {
        select: { name: true },
      },
    },
    orderBy: { firstName: 'asc' },
  })

  // Ambil daftar departemen untuk filter
  const departments = await prisma.department.findMany({
    where: { organizationId: employee.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <ReportsClient
      organizationId={employee.organizationId}
      userRole={employee.role}
      employees={employees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        employeeId: e.employeeId,
        department: e.department?.name || '-',
      }))}
      departments={departments}
    />
  )
}