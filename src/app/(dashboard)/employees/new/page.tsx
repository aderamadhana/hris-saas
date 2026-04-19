// src/app/(dashboard)/employees/new/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EmployeeForm } from '@/src/components/employees/employee-form'

export const dynamic = 'force-dynamic'

export default async function NewEmployeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: { role: true, organizationId: true },
  })

  if (!currentEmployee) redirect('/login')

  if (!['hr', 'admin', 'owner'].includes(currentEmployee.role)) {
    redirect('/dashboard/employees')
  }

  const departments = await prisma.department.findMany({
    where: { organizationId: currentEmployee.organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Karyawan</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Isi informasi di bawah untuk menambah karyawan baru
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            departments={departments}
            mode="create"
            currentUserRole={currentEmployee.role}
          />
        </CardContent>
      </Card>
    </div>
  )
}