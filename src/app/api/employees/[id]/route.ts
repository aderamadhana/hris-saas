// src/app/api/employees/[id]/route.ts
// Update the existing route to add PUT method

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

// Existing DELETE method stays the same...
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params 
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

    if (!['owner', 'admin', 'hr'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const employeeToDelete = await prisma.employee.findUnique({
      where: { id: resolvedParams.id },
      select: { organizationId: true, authId: true },
    })

    if (!employeeToDelete) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (employeeToDelete.organizationId !== currentEmployee.organizationId) {
      return NextResponse.json(
        { error: 'Cannot delete employee from different organization' },
        { status: 403 }
      )
    }

    await prisma.employee.delete({
      where: { id: resolvedParams.id },
    })

    if (employeeToDelete.authId) {
      const { error: authError } = await supabase.auth.admin.deleteUser(
        employeeToDelete.authId
      )
      if (authError) {
        console.error('Failed to delete user from auth:', authError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// NEW: PUT method for updating employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params 
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current employee
    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true },
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

    // Get employee to update
    const employeeToUpdate = await prisma.employee.findUnique({
      where: { id: resolvedParams.id },
      select: { organizationId: true },
    })

    if (!employeeToUpdate) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Verify same organization
    if (employeeToUpdate.organizationId !== currentEmployee.organizationId) {
      return NextResponse.json(
        { error: 'Cannot update employee from different organization' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      phoneNumber,
      position,
      departmentId,
      employmentType,
      baseSalary,
      status,
    } = body

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id: resolvedParams.id },
      data: {
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        position,
        departmentId: departmentId || null,
        employmentType,
        baseSalary: parseFloat(baseSalary),
        status,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
    })
  } catch (error: any) {
    console.error('Update employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}