// src/app/api/leave/request/route.ts
// FIXED - Proper Prisma client usage and error handling

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

    // Get employee with proper error handling
    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        organizationId: true,
        firstName: true,
        lastName: true,
        managerId: true,
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

    // Optional fields
    const startTime = formData.get('startTime') as string | null
    const endTime = formData.get('endTime') as string | null
    const totalHours = formData.get('totalHours')
      ? parseFloat(formData.get('totalHours') as string)
      : null
    const delegateTo = formData.get('delegateTo') as string | null
    const delegateNotes = formData.get('delegateNotes') as string | null

    // Validate required fields
    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
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

    // Check overlapping leave
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        employeeId: employee.id,
        status: {
          in: ['pending', 'approved'],
        },
        OR: [
          {
            AND: [{ startDate: { lte: start } }, { endDate: { gte: start } }],
          },
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }],
          },
          {
            AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }],
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

    // Handle file upload (placeholder for now)
    let attachmentUrl = null
    if (attachment && attachment.size > 0) {
      // TODO: Upload to storage
      console.log('File upload not implemented:', attachment.name)
    }

    // Determine leave category and paid status
    const leaveCategories: Record<string, { category: string; isPaid: boolean }> = {
      annual: { category: 'annual', isPaid: true },
      sick: { category: 'health', isPaid: true },
      maternity: { category: 'maternity', isPaid: true },
      marriage: { category: 'special', isPaid: true },
      child_marriage: { category: 'special', isPaid: true },
      child_circumcision: { category: 'special', isPaid: true },
      child_baptism: { category: 'special', isPaid: true },
      paternity: { category: 'special', isPaid: true },
      family_death: { category: 'special', isPaid: true },
      extended_family_death: { category: 'special', isPaid: true },
      hajj: { category: 'special', isPaid: false },
      compensatory: { category: 'work', isPaid: true },
      business_trip_local: { category: 'work', isPaid: true },
      business_trip_province: { category: 'work', isPaid: true },
      out_of_office: { category: 'work', isPaid: true },
      wfh: { category: 'work', isPaid: true },
      wfa: { category: 'work', isPaid: true },
      unpaid: { category: 'unpaid', isPaid: false },
    }

    const leaveInfo = leaveCategories[leaveType] || {
      category: 'annual',
      isPaid: true,
    }

    // Determine approval levels needed
    const requiresApprovalLevels = days > 5 ? 2 : 1

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
        isPaid: leaveInfo.isPaid,
        category: leaveInfo.category,
        currentApprovalLevel: 1,
        requiresApprovalLevels,
        // Optional fields
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(totalHours && { totalHours }),
        ...(delegateTo && { delegateTo }),
        ...(delegateNotes && { delegateNotes }),
        ...(attachmentUrl && { attachmentUrl }),
      },
    })

    // Create first approval record if manager exists
    if (employee.managerId) {
      await prisma.leaveApproval.create({
        data: {
          leaveId: leave.id,
          approverId: employee.managerId,
          level: 1,
          sequence: 1,
          status: 'pending',
          action: 'pending',
        },
      })
    }

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
    
    // Better error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate leave request' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid employee or organization' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit leave request' },
      { status: 500 }
    )
  }
}