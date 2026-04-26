// src/app/api/attendance/manual/route.ts
// Admin/HR can manually input or override attendance records

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Only admin and HR can manually input attendance
    if (!['admin', 'hr', 'owner'].includes(currentEmployee.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      employeeId,
      date,          // "2025-01-15"
      checkIn,       // "08:00" or null
      checkOut,      // "17:00" or null
      status,        // "present" | "absent" | "late" | "leave" | "holiday"
      notes,
    } = body

    if (!employeeId || !date || !status) {
      return NextResponse.json(
        { error: 'employeeId, date, and status are required' },
        { status: 400 }
      )
    }

    // Verify employee belongs to same organization
    const targetEmployee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId: currentEmployee.organizationId,
      },
      select: { id: true, firstName: true, lastName: true },
    })

    if (!targetEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    // Build datetime objects from time strings
    let checkInTime: Date | null = null
    let checkOutTime: Date | null = null

    if (checkIn) {
      const [h, m] = checkIn.split(':').map(Number)
      checkInTime = new Date(attendanceDate)
      checkInTime.setHours(h, m, 0, 0)
    }

    if (checkOut) {
      const [h, m] = checkOut.split(':').map(Number)
      checkOutTime = new Date(attendanceDate)
      checkOutTime.setHours(h, m, 0, 0)
    }

    // Upsert attendance (create or update)
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: attendanceDate,
        },
      },
      create: {
        employeeId,
        organizationId: currentEmployee.organizationId,
        date: attendanceDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
        notes: notes || `Manual input by admin`,
      },
      update: {
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status,
        notes: notes || `Updated by admin`,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance,
    })
  } catch (error: any) {
    console.error('Manual attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: fetch attendance for a specific employee on a date (for pre-fill)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })

    if (!currentEmployee || !['admin', 'hr', 'owner'].includes(currentEmployee.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date')

    if (!employeeId || !date) {
      return NextResponse.json({ error: 'employeeId and date required' }, { status: 400 })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: attendanceDate } },
    })

    return NextResponse.json({ success: true, data: attendance })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}