import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { name, description, managerId, organizationId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await prisma.department.findFirst({
      where: {
        name,
        organizationId: currentEmployee.organizationId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        organizationId: currentEmployee.organizationId,
        name,
        description: description || null,
        managerId: managerId || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: department,
    })
  } catch (error: any) {
    console.error('Create department error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}