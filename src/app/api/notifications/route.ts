// app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

// GET /api/notifications?limit=50&unread=true
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const unread = searchParams.get('unread') === 'true'

    const where = {
      recipientId: employee.id,          // ← pakai recipientId, bukan employeeId
      ...(unread ? { isRead: false } : {}),
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id:           true,
          type:         true,
          title:        true,
          message:      true,
          isRead:       true,
          readAt:       true,
          createdAt:    true,
          resourceType: true,
          resourceId:   true,
        },
      }),
      prisma.notification.count({
        where: { recipientId: employee.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      success:       true,
      notifications,
      unreadCount,
    })
  } catch (error: any) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications — mark ALL as read
export async function PATCH() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const result = await prisma.notification.updateMany({
      where: { recipientId: employee.id, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error: any) {
    console.error('PATCH /api/notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}