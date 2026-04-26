// src/app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'
import { createClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

    const isHRAdmin = ['admin', 'hr', 'owner'].includes(employee.role)

    // Build filter
    const where: any = {
      organizationId: employee.organizationId,
      isPublished: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: { select: { firstName: true, lastName: true, position: true } },
        targetDepartment: { select: { name: true } },
        reads: {
          where: { employeeId: employee.id },
          select: { readAt: true },
        },
        _count: { select: { reads: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    })

    // Add isRead flag and filter by target role/dept
    const filtered = announcements
      .filter((a) => {
        // Check role targeting
        if (a.targetRoles && a.targetRoles !== 'all') {
          const roles = a.targetRoles.split(',')
          if (!roles.includes(employee.role)) return false
        }
        // Check department targeting
        if (a.targetDepartmentId && a.targetDepartmentId !== employee.departmentId) return false
        return true
      })
      .map((a) => ({
        ...a,
        isRead: a.reads.length > 0,
        readAt: a.reads[0]?.readAt || null,
      }))

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
    if (!['admin', 'hr', 'owner', 'manager'].includes(employee.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title, content, type, isPinned,
      targetRoles, targetDepartmentId, expiresAt,
      attachmentUrl, attachmentName, isPublished,
    } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        organizationId: employee.organizationId,
        authorId: employee.id,
        title,
        content,
        type: type || 'info',
        isPinned: isPinned ?? false,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? new Date() : null,
        targetRoles: targetRoles || 'all',
        targetDepartmentId: targetDepartmentId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachmentUrl,
        attachmentName,
      },
    })

    return NextResponse.json({ success: true, data: announcement })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}