// src/app/api/employees/[id]/invite/route.ts
// FIXED - Use admin client with service role

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use regular client for authentication
    const supabase = await createClient()
    const awaitParams = await params
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current employee (admin/hr)
    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { 
        organizationId: true, 
        role: true,
        organization: {
          select: { name: true },
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

    // Get employee to invite
    const employee = await prisma.employee.findFirst({
      where: {
        id: awaitParams.id,
        organizationId: currentEmployee.organizationId,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if employee already has auth account
    if (employee.authId && employee.authId.trim() !== '') {
      return NextResponse.json(
        { error: 'Employee already has an account' },
        { status: 400 }
      )
    }

    // ✅ Use admin client with service role for invite
    const adminClient = await createAdminClient()

    // Create invitation in Supabase Auth
    const { data: inviteData, error: inviteError } = 
      await adminClient.auth.admin.inviteUserByEmail(employee.email, {
        data: {
          first_name: employee.firstName,
          last_name: employee.lastName,
          employee_id: employee.id,
          organization_id: employee.organizationId,
          organization_name: currentEmployee.organization.name,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite`,
      })

    if (inviteError) {
      console.error('Invite error:', inviteError)
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${employee.email}`,
      data: inviteData,
    })
  } catch (error: any) {
    console.error('Invite employee error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}