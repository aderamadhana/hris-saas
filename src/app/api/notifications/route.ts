// src/app/api/notifications/route.ts
// GET: Ambil notifikasi user yang login
// PATCH: Mark semua sebagai sudah dibaca

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { authId: user.id },
          { authId: null, email: user.email },
        ],
      },
      select: { id: true },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: any = { recipientId: employee.id }
    if (unreadOnly) where.isRead = false

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: { recipientId: employee.id, isRead: false },
      }),
    ])

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error: any) {
    console.error('GET notifications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark all as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { authId: user.id },
          { authId: null, email: user.email },
        ],
      },
      select: { id: true },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: employee.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}