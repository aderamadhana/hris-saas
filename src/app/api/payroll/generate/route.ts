import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { calculatePayroll, getPeriodDates } from '@/src/lib/payroll/calculations'
 
// Generate payroll for employees
export async function POST(request: NextRequest) {
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
 
    // Only HR, Admin, Owner can generate payroll
    if (!['hr', 'admin', 'owner'].includes(currentEmployee.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
 
    const body = await request.json()
    const { month, year, employeeIds } = body
 
    // Validate month/year
    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month or year' },
        { status: 400 }
      )
    }
 
    // Get period dates
    const { periodStart, periodEnd } = getPeriodDates(month, year)
 
    // Get employees to process
    let employees
    if (employeeIds && employeeIds.length > 0) {
      employees = await prisma.employee.findMany({
        where: {
          id: { in: employeeIds },
          organizationId: currentEmployee.organizationId,
          status: 'active',
        },
      })
    } else {
      // Generate for all active employees
      employees = await prisma.employee.findMany({
        where: {
          organizationId: currentEmployee.organizationId,
          status: 'active',
        },
      })
    }
 
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { employeeId: string; error: string }[],
    }
 
    // Generate payroll for each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await prisma.payroll.findUnique({
          where: {
            employeeId_month_year: {
              employeeId: employee.id,
              month,
              year,
            },
          },
        })
 
        if (existingPayroll) {
          results.errors.push({
            employeeId: employee.employeeId,
            error: 'Payroll already exists for this period',
          })
          results.failed++
          continue
        }
 
        // Get attendance data for the period
        const attendances = await prisma.attendance.findMany({
          where: {
            employeeId: employee.id,
            date: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        })
 
        const workDays = attendances.filter((a) =>
          ['present', 'late'].includes(a.status)
        ).length
        const absentDays = attendances.filter((a) => a.status === 'absent').length
        const lateDays = attendances.filter((a) => a.status === 'late').length
        const overtimeHours = attendances.reduce(
          (sum, a) => sum + (a.overtimeHours || 0),
          0
        )
 
        // Calculate payroll (simplified - no allowances/bonuses for now)
        const calculation = calculatePayroll(
          employee.baseSalary.toNumber(),
          0, // allowances
          overtimeHours,
          0, // bonus
          0, // other deductions
          false // isMarried (we don't have this field yet)
        )
 
        // Create payroll record
        await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            organizationId: currentEmployee.organizationId,
            month,
            year,
            periodStart,
            periodEnd,
            
            baseSalary: employee.baseSalary,
            allowances: 0,
            overtime: calculation.components.overtime,
            bonus: 0,
            
            bpjsKesehatan: calculation.deductions.bpjsKesehatan,
            bpjsKetenagakerjaan: calculation.deductions.bpjsKetenagakerjaan,
            pph21: calculation.deductions.pph21,
            otherDeductions: 0,
            
            grossSalary: calculation.grossSalary,
            totalDeductions: calculation.totalDeductions,
            netSalary: calculation.netSalary,
            
            workDays,
            absentDays,
            lateDays,
            overtimeHours,
            
            status: 'draft',
            createdBy: currentEmployee.id,
          },
        })
 
        results.success++
      } catch (error: any) {
        console.error(`Error generating payroll for ${employee.employeeId}:`, error)
        results.errors.push({
          employeeId: employee.employeeId,
          error: error.message || 'Unknown error',
        })
        results.failed++
      }
    }
 
    return NextResponse.json({
      success: true,
      message: `Generated payroll for ${results.success} employees`,
      results,
    })
  } catch (error: any) {
    console.error('Generate payroll error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}