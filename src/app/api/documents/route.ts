// src/app/api/documents/route.ts
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
      select: { id: true, organizationId: true, role: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const targetEmployeeId = searchParams.get('employeeId')
    const category = searchParams.get('category')

    const isHRAdmin = ['admin', 'hr', 'owner'].includes(employee.role)

    let where: any = { organizationId: employee.organizationId }

    // Non-HR can only see own documents (non-private)
    if (!isHRAdmin) {
      where.employeeId = employee.id
      where.isPrivate = false
    } else if (targetEmployeeId) {
      where.employeeId = targetEmployeeId
    }

    if (category) where.category = category

    const documents = await prisma.employeeDocument.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, employeeId: true } },
        uploader: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: documents })
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
    const {
      employeeId, category, name, description,
      fileUrl, fileType, fileSize, isPrivate, expiresAt,
    } = body

    if (!employeeId || !category || !name || !fileUrl || !fileType || !fileSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Employees can only upload their own docs; HR/Admin can upload for anyone
    const isHRAdmin = ['admin', 'hr', 'owner'].includes(employee.role)
    if (!isHRAdmin && employeeId !== employee.id) {
      return NextResponse.json({ error: 'Can only upload documents for yourself' }, { status: 403 })
    }

    const doc = await prisma.employeeDocument.create({
      data: {
        organizationId: employee.organizationId,
        employeeId,
        uploadedBy: employee.id,
        category,
        name,
        description,
        fileUrl,
        fileType,
        fileSize: Number(fileSize),
        isPrivate: isPrivate ?? false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ success: true, data: doc })
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
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'Document ID required' }, { status: 400 })

    const doc = await prisma.employeeDocument.findUnique({ where: { id: docId } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const isHRAdmin = ['admin', 'hr', 'owner'].includes(employee.role)
    if (!isHRAdmin && doc.uploadedBy !== employee.id) {
      return NextResponse.json({ error: 'Cannot delete this document' }, { status: 403 })
    }

    await prisma.employeeDocument.delete({ where: { id: docId } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}