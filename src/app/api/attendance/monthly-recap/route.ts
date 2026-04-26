// src/app/api/attendance/monthly-recap/route.ts
// Returns monthly attendance recap per employee, with department filter

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const departmentId = searchParams.get('departmentId') || undefined
    const employeeId = searchParams.get('employeeId') || undefined

    // Date range
    const targetDate = new Date(year, month - 1, 1)
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    // Calculate working days in month (exclude weekends)
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const workingDays = allDays.filter(d => !isWeekend(d)).length

    // Determine which employees to fetch
    const isAdminOrHR = ['admin', 'hr', 'owner'].includes(currentEmployee.role)
    const isManager = currentEmployee.role === 'manager'

    let employeeWhere: any = {
      organizationId: currentEmployee.organizationId,
      status: 'active',
    }

    if (!isAdminOrHR) {
      if (isManager) {
        employeeWhere.managerId = currentEmployee.id
      } else {
        // Employee sees only their own
        employeeWhere.id = currentEmployee.id
      }
    }

    if (departmentId) employeeWhere.departmentId = departmentId
    if (employeeId && isAdminOrHR) employeeWhere.id = employeeId

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        position: true,
        department: { select: { id: true, name: true } },
        attendance: {
          where: {
            date: { gte: monthStart, lte: monthEnd },
          },
          select: {
            date: true,
            checkIn: true,
            checkOut: true,
            status: true,
            notes: true,
          },
        },
      },
      orderBy: [{ department: { name: 'asc' } }, { firstName: 'asc' }],
    })

    // Build recap per employee
    const recap = employees.map(emp => {
      const attendanceMap = new Map(
        emp.attendance.map(a => [format(new Date(a.date), 'yyyy-MM-dd'), a])
      )

      let present = 0, late = 0, absent = 0, leave = 0, holiday = 0
      let totalWorkMinutes = 0

      const dailyRecords = allDays.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const isWeekendDay = isWeekend(day)
        const record = attendanceMap.get(dayStr)

        let dayStatus = 'weekend'
        let checkIn = null
        let checkOut = null
        let workHours = null

        if (!isWeekendDay) {
          if (record) {
            dayStatus = record.status
            checkIn = record.checkIn
              ? format(new Date(record.checkIn), 'HH:mm')
              : null
            checkOut = record.checkOut
              ? format(new Date(record.checkOut), 'HH:mm')
              : null

            if (record.checkIn && record.checkOut) {
              const minutes =
                (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / 60000
              totalWorkMinutes += minutes
              workHours = Math.round(minutes / 6) / 10 // 1 decimal
            }
          } else {
            dayStatus = day > new Date() ? 'future' : 'absent'
          }

          if (dayStatus === 'present') present++
          else if (dayStatus === 'late') { present++; late++ }
          else if (dayStatus === 'absent') absent++
          else if (dayStatus === 'leave') leave++
          else if (dayStatus === 'holiday') holiday++
        }

        return {
          date: dayStr,
          dayOfWeek: format(day, 'EEE'),
          isWeekend: isWeekendDay,
          status: dayStatus,
          checkIn,
          checkOut,
          workHours,
        }
      })

      const attendanceRate =
        workingDays > 0 ? Math.round((present / workingDays) * 100) : 0
      const avgWorkHours =
        present > 0 ? Math.round((totalWorkMinutes / present / 60) * 10) / 10 : 0

      return {
        employee: {
          id: emp.id,
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          department: emp.department?.name || '-',
          departmentId: emp.department?.id,
        },
        summary: {
          workingDays,
          present,
          late,
          absent,
          leave,
          holiday,
          attendanceRate,
          avgWorkHours,
          totalWorkHours: Math.round((totalWorkMinutes / 60) * 10) / 10,
        },
        dailyRecords,
      }
    })

    // Group by department
    const byDepartment: Record<string, typeof recap> = {}
    recap.forEach(r => {
      const dept = r.employee.department
      if (!byDepartment[dept]) byDepartment[dept] = []
      byDepartment[dept].push(r)
    })

    return NextResponse.json({
      success: true,
      period: { month, year, workingDays },
      totalEmployees: recap.length,
      data: recap,
      byDepartment,
    })
  } catch (error: any) {
    console.error('Monthly recap error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}