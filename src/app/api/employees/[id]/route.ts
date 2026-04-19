// src/app/api/employees/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

// ── Helper: resolve params (Next.js 14) ──────────────────────────────────────
async function getId(context: { params: Promise<{ id: string }> | { id: string } }) {
  const p = await context.params
  return p.id
}

// ── GET single employee ───────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const current = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })
    if (!current) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (!emp || emp.organizationId !== current.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      employee: {
        ...emp,
        baseSalary: emp.baseSalary.toString(), // serialize Decimal
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── PUT — update employee ─────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context)
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
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Cegah HR mengubah role menjadi admin/owner
    const body = await request.json()
    let newRole = body.role ?? target.role
    if (current.role === 'hr' && ['admin', 'owner'].includes(newRole)) {
      newRole = target.role // rollback
    }
    // Cegah mengubah owner oleh non-owner
    if (target.role === 'owner' && current.role !== 'owner') {
      newRole = 'owner'
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phoneNumber: body.phoneNumber ?? null,
        position: body.position,
        departmentId: body.departmentId ?? null,
        employmentType: body.employmentType,
        baseSalary: parseFloat(body.baseSalary),
        status: body.status,
        role: newRole,
        address: body.address ?? null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        joinDate: body.joinDate ? new Date(body.joinDate) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: { ...updated, baseSalary: updated.baseSalary.toString() },
    })
  } catch (error: any) {
    console.error('Update employee error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Data sudah digunakan' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── DELETE employee ───────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getId(context)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const current = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!['owner', 'admin'].includes(current.role)) {
      return NextResponse.json({ error: 'Hanya admin/owner yang bisa menghapus karyawan' }, { status: 403 })
    }

    const target = await prisma.employee.findUnique({
      where: { id },
      select: { organizationId: true, authId: true, role: true },
    })
    if (!target || target.organizationId !== current.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Tidak boleh hapus owner
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Tidak dapat menghapus owner' }, { status: 400 })
    }

    await prisma.employee.delete({ where: { id } })

    // Hapus dari Supabase Auth jika ada
    if (target.authId) {
      await supabase.auth.admin.deleteUser(target.authId).catch((err) => {
        console.error('Failed to delete auth user:', err)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete employee error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}