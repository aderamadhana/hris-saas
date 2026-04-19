// src/app/api/leave/balance/route.ts

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

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Coba ambil quota dari Organization, fallback ke default jika field belum ada
    let annualQuota = 12
    let sickQuota = 12
    try {
      const org = await prisma.organization.findUnique({
        where: { id: employee.organizationId },
      })
      // Gunakan field jika ada, pakai type assertion supaya tidak error TypeScript
      const orgAny = org as any
      if (orgAny?.annualLeaveQuota) annualQuota = orgAny.annualLeaveQuota
      if (orgAny?.sickLeaveQuota) sickQuota = orgAny.sickLeaveQuota
    } catch {
      // field belum ada di DB, pakai default
    }

    // Hitung leave yang sudah dipakai tahun ini
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)

    const usedLeave = await prisma.leave.groupBy({
      by: ['leaveType'],
      where: {
        employeeId: employee.id,
        startDate: { gte: startOfYear, lte: endOfYear },
        status: { in: ['approved', 'pending'] },
      },
      _sum: { days: true },
    })

    const usedAnnual = usedLeave.find((l) => l.leaveType === 'annual')?._sum.days ?? 0
    const usedSick   = usedLeave.find((l) => l.leaveType === 'sick')?._sum.days ?? 0

    return NextResponse.json({
      success: true,
      balance: {
        annual: Math.max(0, annualQuota - usedAnnual),
        sick: sickQuota, // sick tidak terbatas, tampilkan quota saja
      },
      quota: { annual: annualQuota, sick: sickQuota },
      used:  { annual: usedAnnual, sick: usedSick },
    })
  } catch (error: any) {
    console.error('Leave balance error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}