// src/app/api/departments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

// ── GET all departments ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const current = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true },
    })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const departments = await prisma.department.findMany({
      where: { organizationId: current.organizationId },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, departments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── POST — create department ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { name, description, managerId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    // Check duplicate
    const duplicate = await prisma.department.findFirst({
      where: { organizationId: current.organizationId, name: name.trim() },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 })
    }

    const dept = await prisma.department.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: current.organizationId,
        managerId: managerId && managerId !== 'no-manager' ? managerId : null,
      },
    })

    return NextResponse.json({ success: true, department: dept }, { status: 201 })
  } catch (error: any) {
    console.error('Create department error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}