// src/app/api/leave/approvals/route.ts
// GET - Ambil semua leave yang perlu di-approve oleh user yang sedang login

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function GET() {
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

    const { role, id: employeeId, organizationId } = currentEmployee

    // Hanya manager, hr, admin, owner yang bisa approve
    if (!['manager', 'hr', 'admin', 'owner'].includes(role)) {
      return NextResponse.json({ approvals: [], total: 0 })
    }

    // Cari LeaveApproval yang:
    // - approverId = employee ini
    // - status = pending
    const pendingApprovals = await prisma.leaveApproval.findMany({
      where: {
        approverId: employeeId,
        status: 'pending',
        action: 'pending',
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
                department: { select: { name: true } },
              },
            },
            delegate: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Kalau HR/Admin/Owner, juga tampilkan leave yang belum punya approver di level mereka
    // (kasus ketika leave > 5 hari dan manager sudah approve, tapi HR approval belum dibuat)
    let hrApprovals: any[] = []
    if (['hr', 'admin', 'owner'].includes(role)) {
      hrApprovals = await prisma.leave.findMany({
        where: {
          organizationId,
          status: 'pending',
          currentApprovalLevel: 2,
          requiresApprovalLevels: { gte: 2 },
          // Belum ada approval dari employee ini di level 2
          approvals: {
            none: {
              approverId: employeeId,
              level: 2,
            },
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              department: { select: { name: true } },
            },
          },
          delegate: {
            select: { id: true, firstName: true, lastName: true },
          },
          approvals: {
            include: {
              approver: {
                select: { firstName: true, lastName: true, role: true },
              },
            },
            orderBy: { sequence: 'asc' },
          },
        },
      })
    }

    // Format pending approvals dari LeaveApproval records
    const formattedPending = pendingApprovals.map((a) => ({
      approvalId: a.id,
      leaveId: a.leave.id,
      level: a.level,
      sequence: a.sequence,
      leaveType: a.leave.leaveType,
      startDate: a.leave.startDate,
      endDate: a.leave.endDate,
      days: a.leave.days,
      reason: a.leave.reason,
      status: a.leave.status,
      isPaid: a.leave.isPaid,
      startTime: a.leave.startTime,
      endTime: a.leave.endTime,
      totalHours: a.leave.totalHours,
      delegateNotes: a.leave.delegateNotes,
      attachmentUrl: a.leave.attachmentUrl,
      requiresApprovalLevels: a.leave.requiresApprovalLevels,
      currentApprovalLevel: a.leave.currentApprovalLevel,
      employee: {
        id: a.leave.employee.id,
        name: `${a.leave.employee.firstName} ${a.leave.employee.lastName}`,
        email: a.leave.employee.email,
        position: a.leave.employee.position,
        department: a.leave.employee.department?.name ?? '-',
      },
      delegate: a.leave.delegate
        ? { name: `${a.leave.delegate.firstName} ${a.leave.delegate.lastName}` }
        : null,
      source: 'approval_record' as const,
    }))

    // Format HR approvals dari Leave langsung
    const formattedHR = hrApprovals.map((leave) => ({
      approvalId: null,
      leaveId: leave.id,
      level: 2,
      sequence: 2,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      days: leave.days,
      reason: leave.reason,
      status: leave.status,
      isPaid: leave.isPaid,
      startTime: leave.startTime,
      endTime: leave.endTime,
      totalHours: leave.totalHours,
      delegateNotes: leave.delegateNotes,
      attachmentUrl: leave.attachmentUrl,
      requiresApprovalLevels: leave.requiresApprovalLevels,
      currentApprovalLevel: leave.currentApprovalLevel,
      employee: {
        id: leave.employee.id,
        name: `${leave.employee.firstName} ${leave.employee.lastName}`,
        email: leave.employee.email,
        position: leave.employee.position,
        department: leave.employee.department?.name ?? '-',
      },
      delegate: leave.delegate
        ? { name: `${leave.delegate.firstName} ${leave.delegate.lastName}` }
        : null,
      previousApprovals: leave.approvals.map((a: any) => ({
        level: a.level,
        action: a.action,
        approverName: `${a.approver.firstName} ${a.approver.lastName}`,
        approverRole: a.approver.role,
        comments: a.comments,
        actionDate: a.actionDate,
      })),
      source: 'hr_queue' as const,
    }))

    const allApprovals = [...formattedPending, ...formattedHR]

    return NextResponse.json({
      success: true,
      approvals: allApprovals,
      total: allApprovals.length,
    })
  } catch (error: any) {
    console.error('Get approvals error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}