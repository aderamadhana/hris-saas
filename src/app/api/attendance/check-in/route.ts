// src/app/api/attendance/check-in/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Get employee to verify organization
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { 
        organizationId: true,
        authId: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Verify user is checking in for themselves
    if (employee.authId !== user.id) {
      return NextResponse.json(
        { error: 'You can only check in for yourself' },
        { status: 403 }
      )
    }

    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already checked in today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      )
    }

    // Get organization settings for work start time
    const orgSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId: employee.organizationId },
    })

    const now = new Date()
    const workStartTime = orgSettings?.workStartTime || '09:00'
    const [startHour, startMinute] = workStartTime.split(':').map(Number)
    
    const workStartDate = new Date()
    workStartDate.setHours(startHour, startMinute, 0, 0)

    // Determine status (present or late)
    const isLate = now > workStartDate
    const status = isLate ? 'late' : 'present'

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        organizationId: employee.organizationId,
        employeeId,
        date: today,
        checkIn: now,
        status,
      },
    })

    return NextResponse.json({
      success: true,
      data: attendance,
      message: isLate 
        ? `Checked in late at ${now.toLocaleTimeString('id-ID')}` 
        : `Checked in successfully at ${now.toLocaleTimeString('id-ID')}`,
    })
  } catch (error: any) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}