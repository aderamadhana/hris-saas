import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { DepartmentForm } from '@/src/components/departments/department-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditDepartmentPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { organizationId: true },
  })

  if (!currentEmployee) return null

  const department = await prisma.department.findFirst({
    where: {
      id: params.id,
      organizationId: currentEmployee.organizationId,
    },
  })

  if (!department) notFound()

  const potentialManagers = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
      status: 'active',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
    },
    orderBy: {
      firstName: 'asc',
    },
  })

  const managers = potentialManagers.map((emp) => ({
    id: emp.id,
    name: `${emp.firstName} ${emp.lastName}`,
    position: emp.position,
  }))

  const initialData = {
    id: department.id,
    name: department.name,
    description: department.description || '',
    managerId: department.managerId || '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/departments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Department</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update department information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentForm
            organizationId={currentEmployee.organizationId}
            managers={managers}
            initialData={initialData}
            isEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}