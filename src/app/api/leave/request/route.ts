// app/api/leave/request/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        organizationId: true,
        managerId: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const formData = await request.formData()

    const leaveTypeId = formData.get('leaveTypeId')
    const startDate = formData.get('startDate')
    const endDate = formData.get('endDate')
    const reason = formData.get('reason')
    const startTime = formData.get('startTime')
    const endTime = formData.get('endTime')
    const totalHoursRaw = formData.get('totalHours')
    const delegateId = formData.get('delegateId')
    const delegateNotes = formData.get('delegateNotes')
    const attachment = formData.get('attachment')

    if (typeof leaveTypeId !== 'string' || !leaveTypeId) {
      return NextResponse.json({ error: 'Leave type is required' }, { status: 400 })
    }

    if (typeof startDate !== 'string' || !startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 })
    }

    if (typeof endDate !== 'string' || !endDate) {
      return NextResponse.json({ error: 'End date is required' }, { status: 400 })
    }

    if (typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'End date must be after or equal to start date' },
        { status: 400 }
      )
    }

    const days = countWorkingDays(start, end)

    const overlap = await prisma.leave.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ['pending', 'approved'] },
        OR: [
          { AND: [{ startDate: { lte: start } }, { endDate: { gte: start } }] },
          { AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }] },
          { AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }] },
        ],
      },
    })

    if (overlap) {
      return NextResponse.json(
        { error: 'You already have a leave request overlapping these dates' },
        { status: 400 }
      )
    }

    const leaveInfo = getLeaveInfo(leaveTypeId)
    const requiresApprovalLevels = days > 5 ? 2 : 1

    const totalHours =
      typeof totalHoursRaw === 'string' && totalHoursRaw.trim()
        ? Number.parseFloat(totalHoursRaw)
        : null

    let attachmentUrl: string | null = null

    if (attachment instanceof File && attachment.size > 0) {
      console.log('Attachment received:', attachment.name, attachment.size)
      // TODO: upload ke Supabase Storage, lalu set attachmentUrl
    }

    const data: any = {
      employeeId: employee.id,
      organizationId: employee.organizationId,
      leaveType: leaveTypeId,
      startDate: start,
      endDate: end,
      days: days > 0 ? days : 1,
      reason: reason.trim(),
      status: 'pending',
      isPaid: leaveInfo.isPaid,
      category: leaveInfo.category,
      currentApprovalLevel: 1,
      requiresApprovalLevels,
    }

    if (typeof startTime === 'string' && startTime.trim()) {
      data.startTime = startTime
    }

    if (typeof endTime === 'string' && endTime.trim()) {
      data.endTime = endTime
    }

    if (typeof totalHours === 'number' && !Number.isNaN(totalHours)) {
      data.totalHours = totalHours
    }

    if (typeof delegateId === 'string' && delegateId.trim()) {
      data.delegateTo = delegateId
    }

    if (typeof delegateNotes === 'string' && delegateNotes.trim()) {
      data.delegateNotes = delegateNotes
    }

    if (attachmentUrl) {
      data.attachmentUrl = attachmentUrl
    }

    const leave = await prisma.leave.create({
      data,
    })

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

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate leave request' }, { status: 400 })
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference — check employee or delegate ID' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit leave request' },
      { status: 500 }
    )
  }
}

function countWorkingDays(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)

  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }

  return count
}

function getLeaveInfo(leaveTypeId: string): { category: string; isPaid: boolean } {
  const map: Record<string, { category: string; isPaid: boolean }> = {
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

  return map[leaveTypeId] ?? { category: 'annual', isPaid: true }
}