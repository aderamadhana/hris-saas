// src/app/api/leave/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notes } = body

    // Get current employee
    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        organizationId: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check permissions (only manager, admin, hr, owner can approve)
    if (!['owner', 'admin', 'hr', 'manager'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve leave' },
        { status: 403 }
      )
    }

    // Get leave request
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      )
    }

    // Verify same organization
    if (leaveRequest.organizationId !== currentEmployee.organizationId) {
      return NextResponse.json(
        { error: 'Cannot approve leave from different organization' },
        { status: 403 }
      )
    }

    // Check if already processed
    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Leave request is already ${leaveRequest.status}` },
        { status: 400 }
      )
    }

    // Update leave request to approved
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: 'approved',
        reviewedBy: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
        reviewedAt: new Date(),
        reviewNotes: notes || '',
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedLeave,
      message: `Leave request approved for ${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
    })
  } catch (error: any) {
    console.error('Approve leave error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}