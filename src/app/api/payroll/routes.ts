import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
 
// Get all payrolls (HR view)
export async function GET(request: NextRequest) {
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
      select: {
        id: true,
        organizationId: true,
        role: true,
      },
    })
 
    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
 
    // Only HR, Admin, Owner can view all payrolls
    if (!['hr', 'admin', 'owner'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
 
    // Get query params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const status = searchParams.get('status')
 
    // Build where clause
    const where: any = {
      organizationId: currentEmployee.organizationId,
    }
 
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (status) where.status = status
 
    // Get payrolls
    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            position: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    })
 
    // Get summary stats
    const totalGross = payrolls.reduce(
      (sum, p) => sum + p.grossSalary.toNumber(),
      0
    )
    const totalNet = payrolls.reduce(
      (sum, p) => sum + p.netSalary.toNumber(),
      0
    )
    const totalDeductions = payrolls.reduce(
      (sum, p) => sum + p.totalDeductions.toNumber(),
      0
    )
 
    return NextResponse.json({
      success: true,
      data: {
        payrolls,
        summary: {
          count: payrolls.length,
          totalGross,
          totalNet,
          totalDeductions,
          byStatus: {
            draft: payrolls.filter((p) => p.status === 'draft').length,
            approved: payrolls.filter((p) => p.status === 'approved').length,
            paid: payrolls.filter((p) => p.status === 'paid').length,
          },
        },
      },
    })
  } catch (error: any) {
    console.error('Get payrolls error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}