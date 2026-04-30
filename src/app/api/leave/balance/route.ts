// src/app/api/leave/balance/route.ts
// Balance API — sudah menggunakan LeavePolicyConfig

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const year = new Date().getFullYear()

    // Ambil semua kebijakan cuti yang aktif untuk organisasi ini
    const policies = await prisma.leavePolicyConfig.findMany({
      where: { organizationId: employee.organizationId, isEnabled: true },
    })

    if (policies.length === 0) {
      return NextResponse.json({ balance: [], message: 'No leave types configured yet' })
    }

    // Hitung sisa saldo per jenis cuti
    const balance = await Promise.all(
      policies.map(async (policy) => {
        const quota = policy.maxDaysOverride

        // Jumlah hari yang sudah dipakai tahun ini (approved + pending)
        const usedAgg = await prisma.leave.aggregate({
          where: {
            employeeId: employee.id,
            leaveType: policy.leaveTypeId,
            status: { in: ['approved', 'pending'] },
            startDate: { gte: new Date(`${year}-01-01`) },
            endDate:   { lte: new Date(`${year}-12-31`) },
          },
          _sum: { days: true },
        })

        const used = usedAgg._sum.days ?? 0
        const remaining = quota !== null ? Math.max(0, quota - used) : null

        return {
          leaveTypeId:  policy.leaveTypeId,
          customName:   policy.customName,
          quota,           // null = tidak terbatas
          used,
          remaining,       // null = tidak terbatas
          requiresApproval: policy.requiresApproval,
          requiresDocument: policy.requiresDocument,
          requiresDelegation: policy.requiresDelegation,
          countWeekend: policy.countWeekend,
        }
      })
    )

    return NextResponse.json({ balance, year })
  } catch (error: any) {
    console.error('GET /api/leave/balance:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}