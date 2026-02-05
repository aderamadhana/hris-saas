// src/app/api/leave/route.ts
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
    const { employeeId, leaveType, startDate, endDate, totalDays, reason } = body

    // Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !totalDays || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify user is requesting for themselves
    if (employee.authId !== user.id) {
      return NextResponse.json(
        { error: 'You can only request leave for yourself' },
        { status: 403 }
      )
    }

    // Check for overlapping leave requests
    const start = new Date(startDate)
    const end = new Date(endDate)

    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    })

    if (overlappingLeave) {
      return NextResponse.json(
        { error: 'You already have a leave request for this period' },
        { status: 400 }
      )
    }

    // Get organization settings for leave quota
    const orgSettings = await prisma.organizationSettings.findUnique({
      where: { organizationId: employee.organizationId },
    })

    // Check leave balance (only for annual and sick leave)
    if (leaveType === 'annual' || leaveType === 'sick') {
      const currentYearStart = new Date(new Date().getFullYear(), 0, 1)
      
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId,
          leaveType,
          status: 'approved',
          startDate: { gte: currentYearStart },
        },
        select: { totalDays: true },
      })

      const usedDays = approvedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0)
      const quota = leaveType === 'annual' 
        ? (orgSettings?.annualLeaveQuota || 12)
        : (orgSettings?.sickLeaveQuota || 12)

      if (usedDays + totalDays > quota) {
        return NextResponse.json(
          { 
            error: `Insufficient ${leaveType} leave balance. You have ${quota - usedDays} days remaining.` 
          },
          { status: 400 }
        )
      }
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        organizationId: employee.organizationId,
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      data: leaveRequest,
    })
  } catch (error: any) {
    console.error('Create leave request error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}