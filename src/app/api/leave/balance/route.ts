// src/app/api/leave/balance/route.ts
// Get employee leave balance

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
        organizationId: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get organization leave quotas
    const organization = await prisma.organization.findUnique({
      where: { id: employee.organizationId },
      select: {
        annualLeaveQuota: true,
        sickLeaveQuota: true,
      },
    })

    // Calculate used leave for current year
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31)

    const usedLeave = await prisma.leave.groupBy({
      by: ['leaveType'],
      where: {
        employeeId: employee.id,
        startDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
        status: {
          in: ['approved', 'pending'], // Count both approved and pending
        },
      },
      _sum: {
        days: true,
      },
    })

    // Calculate remaining balance
    const annualQuota = organization?.annualLeaveQuota || 12
    const sickQuota = organization?.sickLeaveQuota || 12

    const usedAnnual =
      usedLeave.find((l) => l.leaveType === 'annual')?._sum.days || 0
    const usedSick =
      usedLeave.find((l) => l.leaveType === 'sick')?._sum.days || 0
    const usedEmergency =
      usedLeave.find((l) => l.leaveType === 'emergency')?._sum.days || 0

    const balance = {
      annual: Math.max(0, annualQuota - usedAnnual),
      sick: Math.max(0, sickQuota - usedSick),
      emergency: Math.max(0, 3 - usedEmergency), // Usually 3 days per year
    }

    return NextResponse.json({
      success: true,
      balance,
      quota: {
        annual: annualQuota,
        sick: sickQuota,
        emergency: 3,
      },
      used: {
        annual: usedAnnual,
        sick: usedSick,
        emergency: usedEmergency,
      },
    })
  } catch (error: any) {
    console.error('Get leave balance error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}