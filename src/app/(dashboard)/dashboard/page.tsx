// src/app/(dashboard)/dashboard/page.tsx
// UPDATED - Role-based dashboard views

import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { EmployeeDashboard } from '@/src/components/dashboard/employee-dashboard'
import { AdminDashboard } from '@/src/components/dashboard/admin-dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!currentEmployee) {
    return null
  }

  const isAdmin = ['owner', 'admin', 'hr', 'manager'].includes(currentEmployee.role)

  // Route to different dashboard based on role
  if (isAdmin) {
    return <AdminDashboard employee={currentEmployee} />
  } else {
    return <EmployeeDashboard employee={currentEmployee} />
  }
}