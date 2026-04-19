// src/app/api/leave/approve/route.ts
// POST - Approve atau reject sebuah leave request

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true, firstName: true, lastName: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const { role } = currentEmployee
    if (!['manager', 'hr', 'admin', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'Tidak punya akses untuk approve cuti' }, { status: 403 })
    }

    const body = await request.json()
    const { leaveId, approvalId, action, comments, rejectedReason } = body

    // Validasi
    if (!leaveId || !action) {
      return NextResponse.json({ error: 'leaveId dan action wajib diisi' }, { status: 400 })
    }
    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'action harus approved atau rejected' }, { status: 400 })
    }
    if (action === 'rejected' && !rejectedReason?.trim()) {
      return NextResponse.json({ error: 'Alasan penolakan wajib diisi' }, { status: 400 })
    }

    // Ambil leave
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        approvals: { orderBy: { sequence: 'asc' } },
        employee: { select: { id: true, organizationId: true } },
      },
    })

    if (!leave) {
      return NextResponse.json({ error: 'Leave tidak ditemukan' }, { status: 404 })
    }
    if (leave.employee.organizationId !== currentEmployee.organizationId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }
    if (leave.status !== 'pending') {
      return NextResponse.json(
        { error: `Leave sudah dalam status: ${leave.status}` },
        { status: 400 }
      )
    }

    // ── REJECTED ────────────────────────────────────────────────────────────
    if (action === 'rejected') {
      // Update atau buat approval record
      if (approvalId) {
        await prisma.leaveApproval.update({
          where: { id: approvalId },
          data: {
            action: 'rejected',
            status: 'completed',
            comments: rejectedReason,
            actionDate: new Date(),
          },
        })
      } else {
        await prisma.leaveApproval.create({
          data: {
            leaveId,
            approverId: currentEmployee.id,
            action: 'rejected',
            status: 'completed',
            comments: rejectedReason,
            level: leave.currentApprovalLevel,
            sequence: leave.currentApprovalLevel,
            actionDate: new Date(),
          },
        })
      }

      // Update leave status jadi rejected
      await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: 'rejected',
          rejectedReason,
          approvedBy: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
          approvedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Pengajuan cuti ditolak',
      })
    }

    // ── APPROVED ────────────────────────────────────────────────────────────
    if (approvalId) {
      await prisma.leaveApproval.update({
        where: { id: approvalId },
        data: {
          action: 'approved',
          status: 'completed',
          comments: comments ?? null,
          actionDate: new Date(),
        },
      })
    } else {
      await prisma.leaveApproval.create({
        data: {
          leaveId,
          approverId: currentEmployee.id,
          action: 'approved',
          status: 'completed',
          comments: comments ?? null,
          level: leave.currentApprovalLevel,
          sequence: leave.currentApprovalLevel,
          actionDate: new Date(),
        },
      })
    }

    const nextLevel = leave.currentApprovalLevel + 1

    if (nextLevel > leave.requiresApprovalLevels) {
      // Semua level sudah approve → final approved
      await prisma.leave.update({
        where: { id: leaveId },
        data: {
          status: 'approved',
          currentApprovalLevel: nextLevel,
          approvedBy: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
          approvedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Pengajuan cuti disetujui',
        finalApproved: true,
      })
    }

    // Masih ada level berikutnya (HR) → naikan currentApprovalLevel
    // Cari HR di organisasi yang sama
    const hrEmployee = await prisma.employee.findFirst({
      where: {
        organizationId: currentEmployee.organizationId,
        role: { in: ['hr', 'admin', 'owner'] },
        status: 'active',
        id: { not: currentEmployee.id },
      },
      select: { id: true },
    })

    await prisma.leave.update({
      where: { id: leaveId },
      data: { currentApprovalLevel: nextLevel },
    })

    // Buat approval record untuk HR level berikutnya (jika HR ditemukan)
    if (hrEmployee) {
      // Cek belum ada record untuk level ini
      const existing = await prisma.leaveApproval.findFirst({
        where: { leaveId, level: nextLevel },
      })
      if (!existing) {
        await prisma.leaveApproval.create({
          data: {
            leaveId,
            approverId: hrEmployee.id,
            action: 'pending',
            status: 'pending',
            level: nextLevel,
            sequence: nextLevel,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Disetujui, menunggu approval HR',
      finalApproved: false,
      nextLevel,
    })
  } catch (error: any) {
    console.error('Approve leave error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}