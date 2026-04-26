// src/app/api/calendar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import { createClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Indonesian national holidays 2025 (seeded on first load)
const NATIONAL_HOLIDAYS_2025 = [
  { title: 'Tahun Baru 2025', date: '2025-01-01' },
  { title: 'Isra Miraj Nabi Muhammad SAW', date: '2025-01-27' },
  { title: 'Hari Raya Nyepi', date: '2025-03-29' },
  { title: 'Wafat Isa Al-Masih', date: '2025-04-18' },
  { title: 'Hari Raya Idul Fitri', date: '2025-03-31' },
  { title: 'Hari Raya Idul Fitri', date: '2025-04-01' },
  { title: 'Hari Buruh Internasional', date: '2025-05-01' },
  { title: 'Kenaikan Isa Al-Masih', date: '2025-05-29' },
  { title: 'Hari Raya Waisak', date: '2025-05-12' },
  { title: 'Hari Lahir Pancasila', date: '2025-06-01' },
  { title: 'Hari Raya Idul Adha', date: '2025-06-07' },
  { title: 'Tahun Baru Islam 1447H', date: '2025-06-27' },
  { title: 'Hari Kemerdekaan RI', date: '2025-08-17' },
  { title: 'Maulid Nabi Muhammad SAW', date: '2025-09-05' },
  { title: 'Hari Raya Natal', date: '2025-12-25' },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true, departmentId: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null

    let dateFilter: any = {
      startDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
    }
    if (month) {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 1)
      dateFilter = { startDate: { gte: start, lt: end } }
    }

    const events = await prisma.companyEvent.findMany({
      where: {
        organizationId: employee.organizationId,
        ...dateFilter,
      },
      include: {
        creator: { select: { firstName: true, lastName: true } },
        targetDepartment: { select: { name: true } },
      },
      orderBy: { startDate: 'asc' },
    })

    // Filter by role/dept visibility
    const filtered = events.filter((e) => {
      if (e.targetRoles && e.targetRoles !== 'all') {
        const roles = e.targetRoles.split(',')
        if (!roles.includes(employee.role)) return false
      }
      if (e.targetDepartmentId && e.targetDepartmentId !== employee.departmentId) return false
      return true
    })

    return NextResponse.json({ success: true, data: filtered })
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
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const body = await request.json()

    // Seed national holidays
    if (body.seedNationalHolidays) {
      if (!['admin', 'hr', 'owner'].includes(employee.role)) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
      const year = body.year || 2025
      const holidays = NATIONAL_HOLIDAYS_2025.map((h) => ({
        organizationId: employee.organizationId,
        createdBy: employee.id,
        title: h.title,
        type: 'holiday',
        color: '#EF4444',
        startDate: new Date(h.date),
        endDate: new Date(h.date),
        isAllDay: true,
        isNational: true,
        targetRoles: 'all',
      }))
      await prisma.companyEvent.createMany({ data: holidays, skipDuplicates: true })
      return NextResponse.json({ success: true, message: `Seeded ${holidays.length} national holidays` })
    }

    if (!['admin', 'hr', 'owner', 'manager'].includes(employee.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const {
      title, description, type, color, startDate, endDate,
      isAllDay, startTime, endTime, location, meetingUrl,
      targetRoles, targetDepartmentId, isRecurring, recurringType,
    } = body

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Title, startDate, endDate required' }, { status: 400 })
    }

    const event = await prisma.companyEvent.create({
      data: {
        organizationId: employee.organizationId,
        createdBy: employee.id,
        title,
        description,
        type: type || 'event',
        color: color || '#3B82F6',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isAllDay: isAllDay ?? true,
        startTime,
        endTime,
        location,
        meetingUrl,
        targetRoles: targetRoles || 'all',
        targetDepartmentId: targetDepartmentId || null,
        isRecurring: isRecurring ?? false,
        recurringType,
      },
    })

    return NextResponse.json({ success: true, data: event })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee || !['admin', 'hr', 'owner'].includes(employee.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')
    if (!eventId) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })

    await prisma.companyEvent.delete({ where: { id: eventId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}