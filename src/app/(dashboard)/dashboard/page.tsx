import { createClient } from '@/src/lib/supabase/server'
import { StatsCard } from '@/src/components/dashboard/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import {
  Users,
  UserCheck,
  ClipboardList,
  DollarSign,
  Plus,
  Calendar,
  TrendingUp,
} from 'lucide-react'

import prisma from '@/src/lib/prisma'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  try {
    // Get employee to get organizationId
    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true },
    })

    if (!employee) {
      return null
    }

    const organizationId = employee.organizationId

    // Fetch dashboard stats
    const [
      totalEmployees,
      activeEmployees,
      todayAttendance,
      pendingLeaveRequests,
    ] = await Promise.all([
      // Total employees
      prisma.employee.count({
        where: {
          organizationId,
          status: { in: ['active', 'inactive'] },
        },
      }),

      // Active employees
      prisma.employee.count({
        where: {
          organizationId,
          status: 'active',
        },
      }),

      // Today's attendance
      prisma.attendance.count({
        where: {
          organizationId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today (midnight)
            lte: new Date(new Date().setHours(23, 59, 59, 999)), // End of today (one millisecond before midnight)
          },
          status: 'present',
        },
      }),

      // Pending leave requests
      prisma.leaveRequest.count({
        where: {
          organizationId,
          status: 'pending',
        },
      }),
    ])

    // Calculate attendance percentage
    const attendancePercentage =
      activeEmployees > 0
        ? Math.round((todayAttendance / activeEmployees) * 100)
        : 0

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Quick Actions
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Employees"
            value={totalEmployees}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend={{ value: 5, isPositive: true }}
          />

          <StatsCard
            title="Present Today"
            value={`${attendancePercentage}%`}
            icon={UserCheck}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />

          <StatsCard
            title="Pending Leave"
            value={pendingLeaveRequests}
            icon={ClipboardList}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
          />

          <StatsCard
            title="Active Employees"
            value={activeEmployees}
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Activity Cards */}
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New employee added</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Attendance marked</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <ClipboardList className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Leave request approved</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {/* Quick action buttons */}
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Add New Employee
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Mark Attendance
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Review Leave Requests
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Process Payroll
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Event Cards */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <span className="text-xs font-semibold">FEB</span>
                  <span className="text-lg font-bold">15</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Team Meeting</p>
                  <p className="text-sm text-gray-600">
                    Monthly review and planning session
                  </p>
                  <p className="mt-1 text-xs text-gray-500">10:00 AM - 11:30 AM</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <span className="text-xs font-semibold">FEB</span>
                  <span className="text-lg font-bold">20</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Payroll Processing</p>
                  <p className="text-sm text-gray-600">
                    Monthly salary disbursement
                  </p>
                  <p className="mt-1 text-xs text-gray-500">All day</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
  // Fallback: Tampilkan dashboard kosong atau pesan error
    return (
        <div className="space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
            There was an error loading the data. Please refresh or contact support.
            </p>
        </div>
        </div>
    )
  }
}
