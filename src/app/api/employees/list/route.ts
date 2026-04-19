// src/app/api/employees/list/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { id: true, organizationId: true, role: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Semua employee di organisasi yang sama, kecuali diri sendiri
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: currentEmployee.organizationId,
        status: 'active',
        id: { not: currentEmployee.id }, // exclude diri sendiri dari list delegasi
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        department: {
          select: { name: true },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      employees,
      total: employees.length,
    })
  } catch (error: any) {
    console.error('Employees list error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}