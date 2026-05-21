// app/api/leave/balance/route.ts
// Menggunakan OrganizationSettings (annualLeaveQuota, sickLeaveQuota)
// yang sudah pasti ada di schema — TIDAK pakai LeavePolicyConfig
// yang belum tentu ada.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    const year = new Date().getFullYear()
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`)
    const endOfYear   = new Date(`${year}-12-31T23:59:59.999Z`)

    // ── Ambil quota dari OrganizationSettings ─────────────────────────────
    // Model ini sudah pasti ada karena dibuat saat register.
    const settings = await prisma.organizationSettings.findUnique({
      where: { organizationId: employee.organizationId },
      select: { annualLeaveQuota: true, sickLeaveQuota: true },
    })

    const annualQuota = settings?.annualLeaveQuota ?? 12
    const sickQuota   = settings?.sickLeaveQuota   ?? 12

    // ── Hitung yang sudah terpakai tahun ini ─────────────────────────────
    const [annualUsed, sickUsed] = await Promise.all([
      prisma.leave.aggregate({
        where: {
          employeeId:    employee.id,
          leaveType:     'annual',
          status:        { in: ['approved', 'pending'] },
          startDate:     { gte: startOfYear },
          endDate:       { lte: endOfYear },
        },
        _sum: { days: true },
      }),
      prisma.leave.aggregate({
        where: {
          employeeId:    employee.id,
          leaveType:     'sick',
          status:        { in: ['approved', 'pending'] },
          startDate:     { gte: startOfYear },
          endDate:       { lte: endOfYear },
        },
        _sum: { days: true },
      }),
    ])

    const annualUsedDays = annualUsed._sum.days ?? 0
    const sickUsedDays   = sickUsed._sum.days   ?? 0

    return NextResponse.json({
      success: true,
      balance: {
        annual:          Math.max(0, annualQuota - annualUsedDays),
        annualQuota,
        annualUsed:      annualUsedDays,
        sick:            sickQuota,   // sick leave tidak terbatas, tampilkan quota
        sickQuota,
        sickUsed:        sickUsedDays,
      },
      year,
    })
  } catch (error: any) {
    console.error('GET /api/leave/balance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get leave balance' },
      { status: 500 }
    )
  }
}