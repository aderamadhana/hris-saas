// src/app/api/employees/link-auth/route.ts
// API to link Supabase Auth user with Employee record

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authId, email } = body

    if (!authId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.findFirst({
      where: { email },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check if already linked
    if (employee.authId && employee.authId !== '') {
      return NextResponse.json(
        { error: 'Employee account already linked' },
        { status: 400 }
      )
    }

    // Update employee with authId
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: { authId },
    })

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
    })
  } catch (error: any) {
    console.error('Link auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}