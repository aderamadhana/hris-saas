// src/app/(dashboard)/employees/new/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { EmployeeForm } from '@/src/components/employees/employee-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export default async function NewEmployeePage() {
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

  // Get departments for select
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill in the information below to add a new employee
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
          />
        </CardContent>
      </Card>
    </div>
  )
}