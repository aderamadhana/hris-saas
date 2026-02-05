// src/app/(dashboard)/attendance/page.tsx
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { AttendanceTable } from '@/src/components/attendance/attendance-table'
import { CheckInButton } from '@/src/components/attendance/check-in-button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Calendar, Clock, UserCheck, UserX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { date?: string }
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
      firstName: true,
      role: true,
    },
  })

  if (!currentEmployee) {
    return null
  }

  // Get selected date or today
  const selectedDate = searchParams.date 
    ? new Date(searchParams.date) 
    : new Date()
  selectedDate.setHours(0, 0, 0, 0)

  // Get attendance for selected date
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
      date: selectedDate,
    },
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
      checkIn: 'asc',
    },
  })

  // Get all active employees for stats
  const allEmployees = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
      status: 'active',
    },
    select: { id: true },
  })

  const totalEmployees = allEmployees.length
  const presentCount = attendanceRecords.filter(a => a.status === 'present').length
  const lateCount = attendanceRecords.filter(a => a.status === 'late').length
  const absentCount = totalEmployees - attendanceRecords.length

  // Check if current user has checked in today
  const myAttendance = await prisma.attendance.findFirst({
    where: {
      employeeId: currentEmployee.id,
      date: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  })

  // Transform data for table
  const attendanceData = attendanceRecords.map((record) => ({
    id: record.id,
    employeeId: record.employee.employeeId,
    employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
    position: record.employee.position,
    department: record.employee.department?.name || '-',
    checkIn: record.checkIn?.toISOString() || null,
    checkOut: record.checkOut?.toISOString() || null,
    status: record.status,
    notes: record.notes || '',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track daily attendance and work hours
          </p>
        </div>

        <CheckInButton 
          currentAttendance={myAttendance ? {
            id: myAttendance.id,
            checkIn: myAttendance.checkIn?.toISOString() || null,
            checkOut: myAttendance.checkOut?.toISOString() || null,
          } : null}
          employeeId={currentEmployee.id}
          employeeName={currentEmployee.firstName}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="mt-2 text-3xl font-bold">{totalEmployees}</p>
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
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{presentCount}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">{lateCount}</p>
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
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{absentCount}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <AttendanceTable 
        data={attendanceData}
        selectedDate={selectedDate.toISOString().split('T')[0]}
        canEdit={['owner', 'admin', 'hr'].includes(currentEmployee.role)}
      />
    </div>
  )
}