// src/app/api/departments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

async function getCurrentEmployee(userId: string) {
  return prisma.employee.findUnique({
    where: { authId: userId },
    select: { organizationId: true, role: true },
  })
}

// ── GET single department ─────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const current = await getCurrentEmployee(user.id)
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        employees: {
          select: { id: true, firstName: true, lastName: true, position: true, status: true },
        },
      },
    })

    if (!dept || dept.organizationId !== current.organizationId) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, department: dept })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PUT — update department ───────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const current = await getCurrentEmployee(user.id)
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!['owner', 'admin', 'hr'].includes(current.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const dept = await prisma.department.findUnique({
      where: { id },
      select: { organizationId: true },
    })

    if (!dept || dept.organizationId !== current.organizationId) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, managerId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    }

    // Check duplicate name (exclude self)
    const duplicate = await prisma.department.findFirst({
      where: {
        organizationId: current.organizationId,
        name: name.trim(),
        id: { not: id },
      },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 })
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        managerId: managerId && managerId !== 'no-manager' ? managerId : null,
      },
      include: {
        manager: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({ success: true, department: updated })
  } catch (error: any) {
    console.error('Update department error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── DELETE department ─────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const current = await getCurrentEmployee(user.id)
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!['owner', 'admin'].includes(current.role)) {
      return NextResponse.json(
        { error: 'Only admin or owner can delete departments' },
        { status: 403 }
      )
    }

    const dept = await prisma.department.findUnique({
      where: { id },
      select: { organizationId: true, _count: { select: { employees: true } } },
    })

    if (!dept || dept.organizationId !== current.organizationId) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Unassign employees from this department before deleting
    if (dept._count.employees > 0) {
      await prisma.employee.updateMany({
        where: { departmentId: id },
        data: { departmentId: null },
      })
    }

    await prisma.department.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete department error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}