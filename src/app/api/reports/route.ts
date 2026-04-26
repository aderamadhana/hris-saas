// src/app/api/reports/route.ts
// GET: Ambil data laporan berdasarkan type, bulan, tahun, filter

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ authId: user.id }, { authId: null, email: user.email }],
      },
      select: { id: true, role: true, organizationId: true },
    })

    if (!employee || !['hr', 'admin', 'owner'].includes(employee.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'attendance'
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const departmentId = searchParams.get('departmentId') || undefined
    const filterEmployeeId = searchParams.get('employeeId') || undefined

    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))

    // Base employee filter
    const employeeWhere: any = {
      organizationId: employee.organizationId,
      status: 'active',
    }
    if (departmentId) employeeWhere.departmentId = departmentId
    if (filterEmployeeId) employeeWhere.id = filterEmployeeId

    // ============================================================
    // ATTENDANCE REPORT
    // ============================================================
    if (type === 'attendance') {
      const employees = await prisma.employee.findMany({
        where: employeeWhere,
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } },
          attendance: {
            where: {
              date: { gte: startDate, lte: endDate },
            },
            select: {
              date: true,
              status: true,
              checkIn: true,
              checkOut: true,
            },
          },
        },
        orderBy: { firstName: 'asc' },
      })

      const workingDays = getWorkingDays(startDate, endDate)

      const data = employees.map((emp) => {
        const presentDays = emp.attendance.filter((a) =>
          a.status === 'present' || a.status === 'late'
        ).length
        const lateDays = emp.attendance.filter((a) => a.status === 'late').length
        const absentDays = Math.max(0, workingDays - presentDays)

        // Total jam kerja
        const totalMinutes = emp.attendance.reduce((sum, a) => {
          if (a.checkIn && a.checkOut) {
            const diff = new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()
            return sum + Math.round(diff / 60000)
          }
          return sum
        }, 0)
        const totalHours = Math.round(totalMinutes / 60)
        const attendanceRate = workingDays > 0
          ? Math.round((presentDays / workingDays) * 100)
          : 0

        return {
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department?.name || '-',
          presentDays,
          lateDays,
          absentDays,
          totalHours,
          attendanceRate,
          workingDays,
        }
      })

      return NextResponse.json({ success: true, data })
    }

    // ============================================================
    // LEAVE REPORT
    // ============================================================
    if (type === 'leave') {
      const where: any = {
        organizationId: employee.organizationId,
        startDate: { gte: startDate, lte: endDate },
      }
      if (filterEmployeeId) where.employeeId = filterEmployeeId
      if (departmentId) {
        where.employee = { departmentId }
      }

      const leaves = await prisma.leave.findMany({
        where,
        include: {
          employee: {
            select: {
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { startDate: 'asc' },
      })

      const data = leaves.map((l) => ({
        id: l.id,
        employeeId: l.employee.employeeId,
        employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
        department: l.employee.department?.name || '-',
        leaveType: l.leaveType,
        startDate: format(new Date(l.startDate), 'dd/MM/yyyy'),
        endDate: format(new Date(l.endDate), 'dd/MM/yyyy'),
        totalDays: l.days,
        status: l.status,
        reason: l.reason,
        approvedBy: l.approvedBy || '-',
      }))

      return NextResponse.json({ success: true, data })
    }

    // ============================================================
    // PAYROLL REPORT
    // ============================================================
    if (type === 'payroll') {
      const where: any = {
        organizationId: employee.organizationId,
        month,
        year,
      }
      if (filterEmployeeId) where.employeeId = filterEmployeeId
      if (departmentId) {
        where.employee = { departmentId }
      }

      const payrolls = await prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { employee: { firstName: 'asc' } },
      })

      const data = payrolls.map((p) => ({
        id: p.id,
        employeeId: p.employee.employeeId,
        employeeName: `${p.employee.firstName} ${p.employee.lastName}`,
        department: p.employee.department?.name || '-',
        baseSalary: Number(p.baseSalary),
        allowances: Number(p.allowances),
        overtime: Number(p.overtime),
        bonus: Number(p.bonus),
        grossSalary: Number(p.grossSalary),
        bpjsKesehatan: Number(p.bpjsKesehatan),
        bpjsKetenagakerjaan: Number(p.bpjsKetenagakerjaan),
        pph21: Number(p.pph21),
        totalDeductions: Number(p.totalDeductions),
        netSalary: Number(p.netSalary),
        status: p.status,
        workDays: p.workDays,
        absentDays: p.absentDays,
      }))

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  } catch (error: any) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper: Hitung hari kerja (Mon-Fri) dalam satu periode
function getWorkingDays(start: Date, end: Date): number {
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}