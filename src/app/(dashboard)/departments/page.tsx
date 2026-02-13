// src/app/(dashboard)/departments/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { DepartmentCard } from '@/src/components/departments/departement-card'
import { Button } from '@/src/components/ui/button'
import { Plus, Building2, Users, UserCog } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DepartmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      organizationId: true,
      role: true,
    },
  })

  if (!currentEmployee) {
    return null
  }

  const canManage = ['owner', 'admin', 'hr'].includes(currentEmployee.role)

  const departments = await prisma.department.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
    },
    include: {
      manager: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      employees: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  const totalDepartments = departments.length
  const totalEmployees = await prisma.employee.count({
    where: {
      organizationId: currentEmployee.organizationId,
      status: 'active',
    },
  })
  const employeesWithDept = await prisma.employee.count({
    where: {
      organizationId: currentEmployee.organizationId,
      status: 'active',
      departmentId: { not: null },
    },
  })
  const employeesWithoutDept = totalEmployees - employeesWithDept

  const departmentData = departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    description: dept.description || '',
    managerName: dept.manager
      ? `${dept.manager.firstName} ${dept.manager.lastName}`
      : 'No Manager',
    managerEmail: dept.manager?.email || '',
    employeeCount: dept.employees.filter((e) => e.status === 'active').length,
    totalEmployees: dept.employees.length,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage organizational departments
          </p>
        </div>

        {canManage && (
          <Link href="/departments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="mt-2 text-3xl font-bold">{totalDepartments}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employees</p>
              <p className="mt-2 text-3xl font-bold">{totalEmployees}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Dept</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {employeesWithDept}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <UserCog className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Without Dept</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {employeesWithoutDept}
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {departmentData.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No departments yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Create your first department to get started
          </p>
          {canManage && (
            <Link href="/departments/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departmentData.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  )
}