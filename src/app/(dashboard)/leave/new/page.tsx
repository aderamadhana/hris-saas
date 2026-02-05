// src/app/(dashboard)/leave/new/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
// import { LeaveRequestForm } from '@/src/components/leave/leave-request-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export default async function NewLeaveRequestPage() {
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
      id: true,
      firstName: true,
      lastName: true,
      organization: {
        select: {
          settings: {
            select: {
              annualLeaveQuota: true,
              sickLeaveQuota: true,
            },
          },
        },
      },
    },
  })

  if (!currentEmployee) {
    return null
  }

  // Get leave balance
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1)
  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: currentEmployee.id,
      status: 'approved',
      startDate: { gte: currentYearStart },
    },
    select: {
      leaveType: true,
      totalDays: true,
    },
  })

  const annualUsed = approvedLeaves
    .filter((l) => l.leaveType === 'annual')
    .reduce((sum, l) => sum + l.totalDays, 0)

  const sickUsed = approvedLeaves
    .filter((l) => l.leaveType === 'sick')
    .reduce((sum, l) => sum + l.totalDays, 0)

  const annualQuota =
    currentEmployee.organization.settings?.annualLeaveQuota || 12
  const sickQuota = currentEmployee.organization.settings?.sickLeaveQuota || 12

  const leaveBalance = {
    annual: annualQuota - annualUsed,
    sick: sickQuota - sickUsed,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leave">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Request Leave
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Submit a new leave request
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Request Form</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <LeaveRequestForm
            employeeId={currentEmployee.id}
            employeeName={`${currentEmployee.firstName} ${currentEmployee.lastName}`}
            leaveBalance={leaveBalance}
          /> */}
        </CardContent>
      </Card>
    </div>
  )
}