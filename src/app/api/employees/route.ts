// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { generateEmployeeId } from '@/src/lib/utils'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current employee
    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { 
        organizationId: true, 
        role: true,
        organization: {
          select: {
            slug: true,
          },
        },
      },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check permissions
    if (!['owner', 'admin', 'hr'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      position,
      departmentId,
      employmentType,
      baseSalary,
      status,
      organizationId,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !position || !baseSalary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists in organization
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        email,
        organizationId: currentEmployee.organizationId,
      },
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this email already exists' },
        { status: 400 }
      )
    }

    // Count existing employees to generate ID
    const employeeCount = await prisma.employee.count({
      where: { organizationId: currentEmployee.organizationId },
    })

    // Generate employee ID
    const employeeId = generateEmployeeId(
      currentEmployee.organization.slug,
      employeeCount
    )

    // Create employee
    const newEmployee = await prisma.employee.create({
      data: {
        organizationId: currentEmployee.organizationId,
        authId: '',  // Changed from '' to null
        employeeId,
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || null,
        position,
        departmentId: departmentId || null,
        employmentType: employmentType || 'full-time',
        baseSalary: parseFloat(baseSalary),
        currency: 'IDR',
        status: status || 'active',
        role: 'employee',
      },
    })

    return NextResponse.json({
      success: true,
      data: newEmployee,
    })
  } catch (error: any) {
    console.error('Create employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}