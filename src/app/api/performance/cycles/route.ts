// app/api/performance/cycles/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/performance/cycles
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const cycles = await prisma.reviewCycle.findMany({
      where: { organizationId: employee.organizationId },
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, cycles })
  } catch (error: any) {
    console.error('GET /api/performance/cycles error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/performance/cycles — HR/Admin buat review cycle baru
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    if (!['admin', 'hr', 'owner'].includes(employee.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, startDate, endDate, description } = body

    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end   = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }
    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const cycle = await prisma.reviewCycle.create({
      data: {
        organizationId: employee.organizationId,
        name:           name.trim(),
        type,
        startDate:      start,
        endDate:        end,
        description:    description?.trim() || null,
        status:         'active',
      },
    })

    return NextResponse.json({ success: true, data: cycle })
  } catch (error: any) {
    console.error('POST /api/performance/cycles error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A cycle with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}