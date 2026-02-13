import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
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
      select: { organizationId: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const settings = await prisma.organizationSettings.findUnique({
      where: { organizationId: currentEmployee.organizationId },
    })

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Only owner and admin can update settings
    if (!['owner', 'admin'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { workStartTime, workEndTime, annualLeaveQuota, sickLeaveQuota } = body

    // Get current settings
    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId: currentEmployee.organizationId },
    })

    // Create if not exists
    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: {
          organizationId: currentEmployee.organizationId,
          workStartTime: workStartTime || '09:00',
          workEndTime: workEndTime || '17:00',
          annualLeaveQuota: annualLeaveQuota || 12,
          sickLeaveQuota: sickLeaveQuota || 12,
        },
      })
    } else {
      // Update existing settings
      settings = await prisma.organizationSettings.update({
        where: { id: settings.id },
        data: {
          ...(workStartTime && { workStartTime }),
          ...(workEndTime && { workEndTime }),
          ...(annualLeaveQuota !== undefined && { annualLeaveQuota }),
          ...(sickLeaveQuota !== undefined && { sickLeaveQuota }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}