import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

// Track and record current usage
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
      select: {
        organizationId: true,
        role: true,
      },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Only owner can record usage manually
    if (currentEmployee.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Count active employees
    const employeeCount = await prisma.employee.count({
      where: {
        organizationId: currentEmployee.organizationId,
        status: 'active',
      },
    })

    // Record usage
    await prisma.usageLog.create({
      data: {
        organizationId: currentEmployee.organizationId,
        employeeCount,
        storageUsed: 0, // TODO: Calculate actual storage
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        employeeCount,
        storageUsed: 0,
      },
    })
  } catch (error: any) {
    console.error('Record usage error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get usage history
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
      select: {
        organizationId: true,
        role: true,
      },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (currentEmployee.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get last 30 days of usage
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const usageLogs = await prisma.usageLog.findMany({
      where: {
        organizationId: currentEmployee.organizationId,
        recordedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { recordedAt: 'desc' },
      take: 30,
    })

    return NextResponse.json({
      success: true,
      data: usageLogs,
    })
  } catch (error: any) {
    console.error('Get usage error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}