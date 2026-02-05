// src/app/(dashboard)/leave/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { LeaveTable } from '@/src/components/leave/leave-table'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LeavePage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
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
    select: {
      id: true,
      organizationId: true,
      role: true,
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

  const isManager = ['owner', 'admin', 'hr', 'manager'].includes(
    currentEmployee.role
  )

  // Get leave requests
  const whereClause = isManager
    ? { organizationId: currentEmployee.organizationId }
    : { employeeId: currentEmployee.id }

  // Add status filter if provided
  if (searchParams.status) {
    Object.assign(whereClause, { status: searchParams.status })
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          position: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get stats
  const allRequests = await prisma.leaveRequest.findMany({
    where: isManager
      ? { organizationId: currentEmployee.organizationId }
      : { employeeId: currentEmployee.id },
    select: { status: true },
  })

  const stats = {
    total: allRequests.length,
    pending: allRequests.filter((r) => r.status === 'pending').length,
    approved: allRequests.filter((r) => r.status === 'approved').length,
    rejected: allRequests.filter((r) => r.status === 'rejected').length,
  }

  // Calculate leave balance for current user
  const currentYearStart = new Date(new Date().getFullYear(), 0, 1)
  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: currentEmployee.id,
      status: 'approved',
      startDate: {
        gte: currentYearStart,
      },
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

  const annualQuota = currentEmployee.organization.settings?.annualLeaveQuota || 12
  const sickQuota = currentEmployee.organization.settings?.sickLeaveQuota || 12

  const leaveBalance = {
    annual: {
      total: annualQuota,
      used: annualUsed,
      remaining: annualQuota - annualUsed,
    },
    sick: {
      total: sickQuota,
      used: sickUsed,
      remaining: sickQuota - sickUsed,
    },
  }

  // Transform data
  const leaveData = leaveRequests.map((leave) => ({
    id: leave.id,
    employeeId: leave.employee.employeeId,
    employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
    position: leave.employee.position,
    department: leave.employee.department?.name || '-',
    leaveType: leave.leaveType,
    startDate: leave.startDate.toISOString().split('T')[0],
    endDate: leave.endDate.toISOString().split('T')[0],
    totalDays: leave.totalDays,
    reason: leave.reason,
    status: leave.status,
    createdAt: leave.createdAt.toISOString(),
    reviewedAt: leave.reviewedAt?.toISOString() || null,
    reviewNotes: leave.reviewNotes || '',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isManager
              ? 'Manage employee leave requests'
              : 'View and submit leave requests'}
          </p>
        </div>

        {!isManager && (
          <Link href="/dashboard/leave/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Leave
            </Button>
          </Link>
        )}
      </div>

      {/* Leave Balance (only for employees) */}
      {!isManager && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Annual Leave
                  </p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {leaveBalance.annual.remaining}
                  </p>
                  <p className="text-xs text-gray-500">
                    {leaveBalance.annual.used} used of {leaveBalance.annual.total} days
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sick Leave</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {leaveBalance.sick.remaining}
                  </p>
                  <p className="text-xs text-gray-500">
                    {leaveBalance.sick.used} used of {leaveBalance.sick.total} days
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="mt-2 text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-full bg-gray-100 p-3">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Table */}
      <LeaveTable data={leaveData} canApprove={isManager} />
    </div>
  )
}