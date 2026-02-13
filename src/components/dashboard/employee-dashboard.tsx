// src/components/employee-dashboard.tsx
// Employee view - Personal stats and actions only

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import prisma from '@/src/lib/prisma'
import {
  Clock,
  CalendarDays,
  DollarSign,
  Building2,
  ArrowRight,
  Calendar,
  User,
} from 'lucide-react'
import Link from 'next/link'

interface EmployeeDashboardProps {
  employee: any
}

export async function EmployeeDashboard({ employee }: EmployeeDashboardProps) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfYear = new Date(today.getFullYear(), 0, 1)

  // Get today's attendance
  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    },
  })

  // Get this month attendance count
  const monthAttendanceCount = await prisma.attendance.count({
    where: {
      employeeId: employee.id,
      date: { gte: startOfMonth },
      status: { in: ['present', 'late'] },
    },
  })

  // Get leave balance
  const orgSettings = await prisma.organizationSettings.findUnique({
    where: { organizationId: employee.organizationId },
  })

  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: employee.id,
      status: 'approved',
      startDate: { gte: startOfYear },
    },
  })

  const annualLeaveTaken = approvedLeaves
    .filter((l) => l.leaveType === 'annual')
    .reduce((sum, l) => sum + l.totalDays, 0)

  const sickLeaveTaken = approvedLeaves
    .filter((l) => l.leaveType === 'sick')
    .reduce((sum, l) => sum + l.totalDays, 0)

  const annualLeaveBalance = (orgSettings?.annualLeaveQuota || 12) - annualLeaveTaken
  const sickLeaveBalance = (orgSettings?.sickLeaveQuota || 12) - sickLeaveTaken

  // Get pending leaves
  const pendingLeaves = await prisma.leaveRequest.count({
    where: {
      employeeId: employee.id,
      status: 'pending',
    },
  })

  // Format salary
  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate work hours today
  const workHours = todayAttendance?.checkOut && todayAttendance?.checkIn
    ? Math.floor(
        (todayAttendance.checkOut.getTime() - todayAttendance.checkIn.getTime()) /
          (1000 * 60 * 60)
      )
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {employee.firstName}! 👋
        </h1>
        <p className="mt-1 text-gray-600">
          Here's your personal overview for today
        </p>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Department */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Department</p>
                <p className="mt-2 text-xl font-bold">
                  {employee.department?.name || 'Unassigned'}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Position</p>
                <p className="mt-2 text-xl font-bold">{employee.position}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Salary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Salary</p>
                <p className="mt-2 text-lg font-bold">
                  {formatSalary(employee.baseSalary)}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Type */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="mt-2 text-xl font-bold capitalize">
                  {employee.employmentType.replace('-', ' ')}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {todayAttendance ? (
                <>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        todayAttendance.status === 'present'
                          ? 'success'
                          : todayAttendance.status === 'late'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {todayAttendance.status.toUpperCase()}
                    </Badge>
                    {todayAttendance.checkOut && (
                      <span className="text-sm text-gray-600">
                        Worked: {workHours} hours
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Check-in:{' '}
                    {todayAttendance.checkIn?.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {todayAttendance.checkOut &&
                      ` | Check-out: ${todayAttendance.checkOut.toLocaleTimeString(
                        'id-ID',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}`}
                  </p>
                </>
              ) : (
                <p className="text-gray-600">You haven't checked in today</p>
              )}
            </div>
            <Link href="/attendance">
              <Button>
                {todayAttendance
                  ? todayAttendance.checkOut
                    ? 'View Attendance'
                    : 'Check Out'
                  : 'Check In'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              This month: {monthAttendanceCount} days present
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Annual Leave</p>
                <p className="text-2xl font-bold text-green-600">
                  {annualLeaveBalance} days
                </p>
                <p className="text-xs text-gray-500">
                  Used: {annualLeaveTaken} / {orgSettings?.annualLeaveQuota || 12}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sick Leave</p>
                <p className="text-2xl font-bold text-blue-600">
                  {sickLeaveBalance} days
                </p>
                <p className="text-xs text-gray-500">
                  Used: {sickLeaveTaken} / {orgSettings?.sickLeaveQuota || 12}
                </p>
              </div>
            </div>

            <Link href="/leave/new" className="block">
              <Button className="w-full">Request Leave</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingLeaves > 0 ? (
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm font-medium text-yellow-900">
                    {pendingLeaves} Pending Leave Request
                    {pendingLeaves > 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-xs text-yellow-700">
                    Waiting for manager approval
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">No pending requests</p>
                </div>
              )}

              <Link href="/leave" className="block">
                <Button variant="outline" className="w-full">
                  View All Requests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/profile">
              <Button variant="outline" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Attendance
              </Button>
            </Link>
            <Link href="/leave">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                Leave History
              </Button>
            </Link>
            <Link href="/payroll">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Payslips
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}