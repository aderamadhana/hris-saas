// src/components/dashboard/admin-dashboard.tsx
// Admin/HR/Manager view - Organization-wide stats and management

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import prisma from '@/src/lib/prisma'
import {
  Users,
  Clock,
  CalendarDays,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'

interface AdminDashboardProps {
  employee: any
}

export async function AdminDashboard({ employee }: AdminDashboardProps) {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Employee Stats
  const totalEmployees = await prisma.employee.count({
    where: { organizationId: employee.organizationId },
  })

  const activeEmployees = await prisma.employee.count({
    where: {
      organizationId: employee.organizationId,
      status: 'active',
    },
  })

  const newEmployeesThisMonth = await prisma.employee.count({
    where: {
      organizationId: employee.organizationId,
      joinDate: { gte: startOfMonth },
    },
  })

  // Attendance Stats (Today)
  const todayStart = new Date(today.setHours(0, 0, 0, 0))
  const todayEnd = new Date(today.setHours(23, 59, 59, 999))

  const todayAttendance = await prisma.attendance.findMany({
    where: {
      organizationId: employee.organizationId,
      date: { gte: todayStart, lte: todayEnd },
    },
  })

  const presentToday = todayAttendance.filter((a) => a.status === 'present').length
  const lateToday = todayAttendance.filter((a) => a.status === 'late').length
  const absentToday = activeEmployees - todayAttendance.length

  // Leave Requests
  const pendingLeaves = await prisma.leaveRequest.count({
    where: {
      organizationId: employee.organizationId,
      status: 'pending',
    },
  })

  const approvedLeavesThisMonth = await prisma.leaveRequest.count({
    where: {
      organizationId: employee.organizationId,
      status: 'approved',
      startDate: { gte: startOfMonth },
    },
  })

  const rejectedLeavesThisMonth = await prisma.leaveRequest.count({
    where: {
      organizationId: employee.organizationId,
      status: 'rejected',
      reviewedAt: { gte: startOfMonth },
    },
  })

  // Department Stats
  const totalDepartments = await prisma.department.count({
    where: { organizationId: employee.organizationId },
  })

  const departmentsWithoutManager = await prisma.department.count({
    where: {
      organizationId: employee.organizationId,
      managerId: null,
    },
  })

  // Recent Activities (Latest 5 employees)
  const recentEmployees = await prisma.employee.findMany({
    where: { organizationId: employee.organizationId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      joinDate: true,
      status: true,
    },
  })

  // Recent Leave Requests
  const recentLeaves = await prisma.leaveRequest.findMany({
    where: {
      organizationId: employee.organizationId,
      status: 'pending',
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
  })

  // Attendance rate this month
  const workingDays = Math.floor(
    (today.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)
  )
  const expectedAttendance = activeEmployees * workingDays
  const actualAttendance = await prisma.attendance.count({
    where: {
      organizationId: employee.organizationId,
      date: { gte: startOfMonth },
      status: { in: ['present', 'late'] },
    },
  })
  const attendanceRate = expectedAttendance > 0
    ? Math.round((actualAttendance / expectedAttendance) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-gray-600">
            {employee.organization.name} - {employee.role.toUpperCase()}
          </p>
        </div>
        {['owner', 'admin', 'hr'].includes(employee.role) && (
          <Link href="/dashboard/employees/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        )}
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="mt-2 text-3xl font-bold">{totalEmployees}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {activeEmployees} active
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {newEmployeesThisMonth > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+{newEmployeesThisMonth} this month</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Present Today */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {presentToday}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {lateToday} late • {absentToday} absent
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Leaves */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Leaves
                </p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {pendingLeaves}
                </p>
                <p className="mt-1 text-xs text-gray-500">Awaiting approval</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="mt-2 text-3xl font-bold">{totalDepartments}</p>
                {departmentsWithoutManager > 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    {departmentsWithoutManager} without manager
                  </p>
                )}
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance & Leave Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Attendance Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {attendanceRate}%
              </div>
              <p className="mt-2 text-sm text-gray-600">This month</p>
            </div>
          </CardContent>
        </Card>

        {/* Leave Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-semibold text-green-600">
                  {approvedLeavesThisMonth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="font-semibold text-red-600">
                  {rejectedLeavesThisMonth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">
                  {pendingLeaves}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <span className="font-semibold">{presentToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-600">Late</span>
                </div>
                <span className="font-semibold">{lateToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
                <span className="font-semibold">{absentToday}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Employees */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Employees</CardTitle>
              <Link href="/dashboard/employees">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEmployees.length > 0 ? (
                recentEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{emp.position}</p>
                    </div>
                    <Badge
                      variant={
                        emp.status === 'active'
                          ? 'success'
                          : emp.status === 'inactive'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {emp.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent employees</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Leave Requests</CardTitle>
              <Link href="/dashboard/leave">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeaves.length > 0 ? (
                recentLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {leave.leaveType} • {leave.totalDays} days
                      </p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No pending leave requests
                </p>
              )}
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
            {['owner', 'admin', 'hr'].includes(employee.role) && (
              <>
                <Link href="/dashboard/employees/new">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </Link>
                <Link href="/departments/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    Add Department
                  </Button>
                </Link>
              </>
            )}
            <Link href="/dashboard/attendance">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                View Attendance
              </Button>
            </Link>
            <Link href="/dashboard/leave">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                Manage Leaves
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}