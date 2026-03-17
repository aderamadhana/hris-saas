import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
 
// Get single payroll
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
 
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    const params = await context.params
    const payrollId = params.id
 
    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
    })
 
    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
 
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
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
    })
 
    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }
 
    // Check permissions
    const canView =
      payroll.employeeId === currentEmployee.id || // Own payslip
      ['hr', 'admin', 'owner'].includes(currentEmployee.role) // HR can view all
 
    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view this payroll' },
        { status: 403 }
      )
    }
 
    return NextResponse.json({ success: true, data: payroll })
  } catch (error: any) {
    console.error('Get payroll error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update payroll (HR only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
 
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
 
    const params = await context.params
    const payrollId = params.id
 
    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
    })
 
    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
 
    // Only HR/Admin/Owner can update
    if (!['hr', 'admin', 'owner'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
 
    const body = await request.json()
    const { status, paidDate, allowances, bonus, otherDeductions, notes } = body
 
    const updateData: any = {}
 
    if (status) updateData.status = status
    if (paidDate) updateData.paidDate = new Date(paidDate)
    if (allowances !== undefined) updateData.allowances = allowances
    if (bonus !== undefined) updateData.bonus = bonus
    if (otherDeductions !== undefined) updateData.otherDeductions = otherDeductions
    if (notes !== undefined) updateData.notes = notes
 
    // If allowances/bonus/deductions changed, recalculate totals
    if (allowances !== undefined || bonus !== undefined || otherDeductions !== undefined) {
      const payroll = await prisma.payroll.findUnique({
        where: { id: payrollId },
      })
 
      if (payroll) {
        const newGross =
          payroll.baseSalary.toNumber() +
          (allowances ?? payroll.allowances.toNumber()) +
          payroll.overtime.toNumber() +
          (bonus ?? payroll.bonus.toNumber())
 
        const newTotalDeductions =
          payroll.bpjsKesehatan.toNumber() +
          payroll.bpjsKetenagakerjaan.toNumber() +
          payroll.pph21.toNumber() +
          (otherDeductions ?? payroll.otherDeductions.toNumber())
 
        updateData.grossSalary = newGross
        updateData.totalDeductions = newTotalDeductions
        updateData.netSalary = newGross - newTotalDeductions
      }
    }
 
    if (status === 'approved' && !updateData.approvedBy) {
      updateData.approvedBy = currentEmployee.id
    }
 
    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: updateData,
    })
 
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Update payroll error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}