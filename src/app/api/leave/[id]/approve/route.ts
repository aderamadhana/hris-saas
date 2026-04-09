// src/app/api/leave/approve/route.ts
// Approve or reject leave request

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

    // Get approver employee
    const approver = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!approver) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if user has approval rights
    if (!['manager', 'hr', 'admin'].includes(approver.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to approve leaves' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { leaveId, action, comments } = body

    if (!leaveId || !action) {
      return NextResponse.json(
        { error: 'Leave ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approved or rejected' },
        { status: 400 }
      )
    }

    // Get leave with current approvals
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            managerId: true,
          },
        },
        approvals: {
          orderBy: { sequence: 'asc' },
        },
      },
    })

    if (!leave) {
      return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
    }

    if (leave.status !== 'pending') {
      return NextResponse.json(
        { error: 'Leave has already been processed' },
        { status: 400 }
      )
    }

    // Find current pending approval
    const currentApproval = leave.approvals.find(
      (a) => a.status === 'pending' && a.level === leave.currentApprovalLevel
    )

    if (!currentApproval) {
      return NextResponse.json(
        { error: 'No pending approval found' },
        { status: 404 }
      )
    }

    // Verify approver is the assigned approver
    if (currentApproval.approverId !== approver.id) {
      // Allow HR and Admin to approve any level
      if (!['hr', 'admin'].includes(approver.role)) {
        return NextResponse.json(
          { error: 'You are not authorized to approve this leave' },
          { status: 403 }
        )
      }
    }

    // Update approval record
    await prisma.leaveApproval.update({
      where: { id: currentApproval.id },
      data: {
        action,
        status: 'completed',
        comments: comments || null,
        actionDate: new Date(),
      },
    })

    if (action === 'rejected') {
      // Reject leave - no further approvals needed
      await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: 'rejected',
          rejectedReason: comments || 'Rejected by approver',
        },
      })

      // Mark all other pending approvals as skipped
      await prisma.leaveApproval.updateMany({
        where: {
          leaveId,
          status: 'pending',
        },
        data: {
          status: 'skipped',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Leave request rejected',
        leave: {
          id: leave.id,
          status: 'rejected',
        },
      })
    }

    // Action is 'approved'
    // Check if more approvals are needed
    if (leave.currentApprovalLevel < leave.requiresApprovalLevels) {
      // Move to next approval level
      const nextLevel = leave.currentApprovalLevel + 1
      
      // Determine next approver based on level
      let nextApproverId: string | null = null
      
      if (nextLevel === 2) {
        // HR approval - find HR employee
        const hrEmployee = await prisma.employee.findFirst({
          where: {
            organizationId: leave.organizationId,
            role: 'hr',
          },
          select: { id: true },
        })
        nextApproverId = hrEmployee?.id || null
      }
      
      if (!nextApproverId) {
        // If no next approver found, finalize approval
        await prisma.leave.update({
          where: { id: leaveId },
          data: {
            status: 'approved',
            approvedBy: approver.id,
            approvedAt: new Date(),
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Leave request approved (final)',
          leave: {
            id: leave.id,
            status: 'approved',
          },
        })
      }

      // Create next approval record
      await prisma.leaveApproval.create({
        data: {
          leaveId,
          approverId: nextApproverId,
          level: nextLevel,
          sequence: nextLevel,
          status: 'pending',
          action: 'pending',
        },
      })

      // Update leave to next level
      await prisma.leave.update({
        where: { id: leaveId },
        data: {
          currentApprovalLevel: nextLevel,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Approved. Waiting for next level approval.',
        leave: {
          id: leave.id,
          status: 'pending',
          currentApprovalLevel: nextLevel,
        },
      })
    } else {
      // Final approval - no more levels needed
      await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: 'approved',
          approvedBy: approver.id,
          approvedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Leave request approved',
        leave: {
          id: leave.id,
          status: 'approved',
        },
      })
    }
  } catch (error: any) {
    console.error('Approve leave error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}