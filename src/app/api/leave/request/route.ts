// src/app/api/leave/request/route.ts
// Submit leave request

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

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        organizationId: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const leaveType = formData.get('leaveType') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const reason = formData.get('reason') as string
    const attachment = formData.get('attachment') as File | null

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Calculate days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Validate dates
    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check if dates overlap with existing leave
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        employeeId: employee.id,
        status: {
          in: ['pending', 'approved'],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    })

    if (overlappingLeave) {
      return NextResponse.json(
        { error: 'You already have leave request for these dates' },
        { status: 400 }
      )
    }

    // Handle file upload if exists
    let attachmentUrl = null
    if (attachment && attachment.size > 0) {
      // For now, we'll skip file upload
      // In production, upload to Supabase Storage or S3
      // attachmentUrl = await uploadFile(attachment)
      console.log('File upload not implemented yet:', attachment.name)
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        employeeId: employee.id,
        organizationId: employee.organizationId,
        leaveType,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: 'pending',
        // attachmentUrl, // Add this when file upload is implemented
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      leave: {
        id: leave.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
        status: leave.status,
      },
    })
  } catch (error: any) {
    console.error('Submit leave request error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}