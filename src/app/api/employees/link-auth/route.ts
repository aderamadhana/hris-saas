// src/app/api/employees/link-auth/route.ts
// FIXED VERSION - Handle null authId properly

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

    // ✅ FIX: Find employee with null OR empty authId
    const employee = await prisma.employee.findFirst({
      where: { 
        email,
        OR: [
          { authId: null },
          { authId: '' },
        ],
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or already linked' },
        { status: 404 }
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