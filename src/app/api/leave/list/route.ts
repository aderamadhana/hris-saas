// src/app/api/leave/list/route.ts
// Get all leave requests with employee and delegation info

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
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
        role: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const leaveType = searchParams.get('type')

    // Build query based on role
    const where: any = {
      organizationId: employee.organizationId,
    }

    // If not admin/hr, only show own leaves
    if (employee.role !== 'admin' && employee.role !== 'hr') {
      where.employeeId = employee.id
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status
    }

    // Filter by type
    if (leaveType && leaveType !== 'all') {
      where.leaveType = leaveType
    }

    // Fetch leaves with employee and delegate info
    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        delegate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format response
    const formattedLeaves = leaves.map((leave) => ({
      id: leave.id,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      days: leave.days,
      reason: leave.reason,
      status: leave.status,
      isPaid: leave.isPaid,
      category: leave.category,
      
      // Time fields (for OOO)
      startTime: leave.startTime,
      endTime: leave.endTime,
      totalHours: leave.totalHours,
      
      // Delegation
      delegateTo: leave.delegateTo,
      delegateNotes: leave.delegateNotes,
      
      // Document
      attachmentUrl: leave.attachmentUrl,
      documentType: leave.documentType,
      
      // Approval
      approvedBy: leave.approvedBy,
      approvedAt: leave.approvedAt,
      rejectedReason: leave.rejectedReason,
      
      // Employee info
      employee: {
        id: leave.employee.id,
        name: `${leave.employee.firstName} ${leave.employee.lastName}`,
        email: leave.employee.email,
      },
      
      // Delegate info
      delegate: leave.delegate
        ? {
            id: leave.delegate.id,
            name: `${leave.delegate.firstName} ${leave.delegate.lastName}`,
            email: leave.delegate.email,
          }
        : null,
      
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      leaves: formattedLeaves,
      total: formattedLeaves.length,
    })
  } catch (error: any) {
    console.error('Get leave list error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}