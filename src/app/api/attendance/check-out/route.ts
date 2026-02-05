// src/app/api/attendance/check-out/route.ts
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
    const { attendanceId } = body

    if (!attendanceId) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      )
    }

    // Get attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        employee: {
          select: {
            authId: true,
          },
        },
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Verify user is checking out for themselves
    if (attendance.employee.authId !== user.id) {
      return NextResponse.json(
        { error: 'You can only check out for yourself' },
        { status: 403 }
      )
    }

    // Check if already checked out
    if (attendance.checkOut) {
      return NextResponse.json(
        { error: 'Already checked out' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update attendance record with check-out time
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOut: now,
      },
    })

    // Calculate work duration
    const checkInTime = new Date(attendance.checkIn!)
    const duration = now.getTime() - checkInTime.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))

    return NextResponse.json({
      success: true,
      data: updatedAttendance,
      message: `Checked out successfully at ${now.toLocaleTimeString('id-ID')}`,
      workDuration: `${hours}h ${minutes}m`,
    })
  } catch (error: any) {
    console.error('Check-out error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}