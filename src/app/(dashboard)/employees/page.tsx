// src/app/(dashboard)/employees/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { EmployeeTable } from '@/src/components/employees/employee-table'
import { Button } from '@/src/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get current employee
  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { organizationId: true },
  })

  if (!currentEmployee) {
    return null
  }

  // Get all employees in organization
  const employees = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
    },
    include: {
      department: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Transform data for table
  const employeeData = employees.map((emp) => ({
    id: emp.id,
    employeeId: emp.employeeId,
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    position: emp.position,
    department: emp.department?.name || '-',
    status: emp.status,
    joinDate: emp.joinDate.toISOString().split('T')[0],
    hasAuth: emp.authId !== null && emp.authId !== '',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your organization's employees
          </p>
        </div>

        <Link href="/employees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Table */}
      <EmployeeTable data={employeeData} />
    </div>
  )
}