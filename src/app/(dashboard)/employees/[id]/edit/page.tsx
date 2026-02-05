// src/app/(dashboard)/employees/[id]/edit/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { EmployeeForm } from '@/src/components/employees/employee-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { notFound } from 'next/navigation'

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const resolvedParams = await params 
  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { organizationId: true },
  })

  if (!currentEmployee) {
    return null
  }

  // Get employee to edit
  const employee = await prisma.employee.findFirst({
    where: {
      id: resolvedParams.id,
      organizationId: currentEmployee.organizationId,
    },
    include: {
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!employee) {
    notFound()
  }

  // Get departments
  const departments = await prisma.department.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Transform employee data for form
  const initialData = {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phoneNumber: employee.phoneNumber || '',
    position: employee.position,
    departmentId: employee.departmentId || '',
    employmentType: employee.employmentType as any,
    baseSalary: employee.baseSalary.toString(),
    status: employee.status as any,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Employee</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update employee information for {employee.firstName}{' '}
            {employee.lastName}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            departments={departments}
            organizationId={currentEmployee.organizationId}
            initialData={initialData}
            isEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}