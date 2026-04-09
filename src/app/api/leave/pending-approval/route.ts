// src/app/api/leave/pending-approvals/route.ts
// Get leaves pending approval for current user

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function GET() {
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
        role: true,
        organizationId: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if user has approval rights
    if (!['manager', 'hr', 'admin'].includes(employee.role)) {
      return NextResponse.json(
        { error: 'You do not have approval permissions' },
        { status: 403 }
      )
    }

    // Get pending approvals assigned to this user
    const pendingApprovals = await prisma.leaveApproval.findMany({
      where: {
        approverId: employee.id,
        status: 'pending',
      },
      include: {
        leave: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                position: true,
                department: true,
              },
            },
            delegate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Format response
    const formattedApprovals = pendingApprovals.map((approval) => ({
      approvalId: approval.id,
      level: approval.level,
      sequence: approval.sequence,
      
      // Leave details
      leave: {
        id: approval.leave.id,
        leaveType: approval.leave.leaveType,
        startDate: approval.leave.startDate,
        endDate: approval.leave.endDate,
        days: approval.leave.days,
        reason: approval.leave.reason,
        status: approval.leave.status,
        isPaid: approval.leave.isPaid,
        category: approval.leave.category,
        
        // Time (for OOO)
        startTime: approval.leave.startTime,
        endTime: approval.leave.endTime,
        totalHours: approval.leave.totalHours,
        
        // Delegation
        delegateTo: approval.leave.delegateTo,
        delegateNotes: approval.leave.delegateNotes,
        
        // Document
        attachmentUrl: approval.leave.attachmentUrl,
        documentType: approval.leave.documentType,
        
        // Employee info
        employee: {
          id: approval.leave.employee.id,
          name: `${approval.leave.employee.firstName} ${approval.leave.employee.lastName}`,
          email: approval.leave.employee.email,
          position: approval.leave.employee.position,
          department: approval.leave.employee.department,
        },
        
        // Delegate info
        delegate: approval.leave.delegate
          ? {
              id: approval.leave.delegate.id,
              name: `${approval.leave.delegate.firstName} ${approval.leave.delegate.lastName}`,
            }
          : null,
        
        createdAt: approval.leave.createdAt,
      },
    }))

    return NextResponse.json({
      success: true,
      approvals: formattedApprovals,
      total: formattedApprovals.length,
    })
  } catch (error: any) {
    console.error('Get pending approvals error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}