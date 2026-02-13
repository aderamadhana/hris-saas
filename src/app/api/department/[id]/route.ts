// src/app/api/departments/[id]/route.ts
// FIXED - Next.js 14 async params handling

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ FIX: params is a Promise in Next.js 14
) {
  try {
    // ✅ FIX: Await params first
    const params = await context.params
    const departmentId = params.id

    console.log('📝 Update department:', departmentId)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!['owner', 'admin', 'hr'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        organizationId: currentEmployee.organizationId,
      },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, managerId } = body

    console.log('Update data:', { name, description, managerId })

    // Check duplicate name (except current)
    if (name !== department.name) {
      const existing = await prisma.department.findFirst({
        where: {
          name,
          organizationId: currentEmployee.organizationId,
          NOT: { id: departmentId },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Department with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.department.update({
      where: { id: departmentId },  // ✅ Now has correct value
      data: {
        name,
        description: description || null,
        managerId: managerId || null,
      },
    })

    console.log('✅ Department updated successfully')

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error: any) {
    console.error('❌ Update department error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }  // ✅ FIX: params is a Promise
) {
  try {
    // ✅ FIX: Await params first
    const params = await context.params
    const departmentId = params.id

    console.log('🗑️ Delete department:', departmentId)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!['owner', 'admin', 'hr'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        organizationId: currentEmployee.organizationId,
      },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Unassign employees first
    await prisma.employee.updateMany({
      where: { departmentId: departmentId },
      data: { departmentId: null },
    })

    // Delete department
    await prisma.department.delete({
      where: { id: departmentId },  // ✅ Now has correct value
    })

    console.log('✅ Department deleted successfully')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Delete department error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}