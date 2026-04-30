// src/app/api/settings/leave-policy/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

// GET — ambil semua kebijakan cuti organisasi
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const policies = await prisma.leavePolicyConfig.findMany({
      where: { organizationId: employee.organizationId },
    })

    return NextResponse.json({ policies })
  } catch (error: any) {
    console.error('GET /api/settings/leave-policy:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT — simpan / update semua kebijakan cuti (bulk upsert)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    if (!['admin', 'owner', 'hr'].includes(employee.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { policies } = await request.json()
    if (!Array.isArray(policies)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Bulk upsert
    await prisma.$transaction(
      policies.map((p: any) =>
        prisma.leavePolicyConfig.upsert({
          where: {
            organizationId_leaveTypeId: {
              organizationId: employee.organizationId,
              leaveTypeId: p.leaveTypeId,
            },
          },
          create: {
            organizationId: employee.organizationId,
            leaveTypeId: p.leaveTypeId,
            isEnabled: p.isEnabled ?? false,
            customName: p.customName || null,
            maxDaysOverride: p.maxDaysOverride ?? null,
            isPaidOverride: p.isPaidOverride ?? null,
            requiresApproval: p.requiresApproval ?? true,
            requiresDocument: p.requiresDocument ?? false,
            canCarryForward: p.canCarryForward ?? false,
            maxCarryForward: p.maxCarryForward ?? null,
            countWeekend: p.countWeekend ?? false,
            requiresDelegation: p.requiresDelegation ?? false,
            notes: p.notes || null,
          },
          update: {
            isEnabled: p.isEnabled ?? false,
            customName: p.customName || null,
            maxDaysOverride: p.maxDaysOverride ?? null,
            isPaidOverride: p.isPaidOverride ?? null,
            requiresApproval: p.requiresApproval ?? true,
            requiresDocument: p.requiresDocument ?? false,
            canCarryForward: p.canCarryForward ?? false,
            maxCarryForward: p.maxCarryForward ?? null,
            countWeekend: p.countWeekend ?? false,
            requiresDelegation: p.requiresDelegation ?? false,
            notes: p.notes || null,
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT /api/settings/leave-policy:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}