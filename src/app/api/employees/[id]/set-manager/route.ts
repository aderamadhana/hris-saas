// src/app/api/employees/[id]/set-manager/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const current = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!['owner', 'admin', 'hr'].includes(current.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const target = await prisma.employee.findUnique({
      where: { id },
      select: { organizationId: true, role: true },
    })
    if (!target || target.organizationId !== current.organizationId) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const { managerId } = await request.json()

    // Validate manager exists in same org (if provided)
    if (managerId && managerId !== 'none') {
      const manager = await prisma.employee.findUnique({
        where: { id: managerId },
        select: { organizationId: true, role: true },
      })
      if (!manager || manager.organizationId !== current.organizationId) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
      }
      // Prevent self-assignment
      if (managerId === id) {
        return NextResponse.json({ error: 'Employee cannot be their own manager' }, { status: 400 })
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { managerId: managerId && managerId !== 'none' ? managerId : null },
      select: { id: true, firstName: true, lastName: true, managerId: true },
    })

    return NextResponse.json({ success: true, employee: updated })
  } catch (error: any) {
    console.error('Set manager error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}