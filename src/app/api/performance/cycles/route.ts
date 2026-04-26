// src/app/api/performance/cycles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import { createClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true, id: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const cycles = await prisma.reviewCycle.findMany({
      where: { organizationId: employee.organizationId },
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: cycles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
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

    const cycle = await prisma.reviewCycle.create({
      data: {
        organizationId: employee.organizationId,
        name,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        status: 'draft',
      },
    })

    return NextResponse.json({ success: true, data: cycle })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}