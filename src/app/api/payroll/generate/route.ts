// src/app/api/payroll/generate/route.ts
// Generate payroll menggunakan konfigurasi per organisasi

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { calculatePayroll, getDefaultPayrollConfig } from '@/src/lib/payroll/calculations'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentEmployee = await prisma.employee.findUnique({
      where: { authId: user.id },
      select: { organizationId: true, role: true, id: true },
    })
    if (!currentEmployee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!['admin', 'owner', 'hr'].includes(currentEmployee.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { month, year, employeeIds } = body

    if (!month || !year) {
      return NextResponse.json({ error: 'month dan year wajib diisi' }, { status: 400 })
    }

    // Ambil konfigurasi payroll organisasi
    const rawConfig = await prisma.payrollConfig.findUnique({
      where: { organizationId: currentEmployee.organizationId },
    })
    const config = rawConfig ?? (getDefaultPayrollConfig(currentEmployee.organizationId) as any)

    // Tentukan rentang periode
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd   = new Date(year, month, 0)   // hari terakhir bulan

    // Ambil karyawan yang akan di-generate
    const whereClause: any = {
      organizationId: currentEmployee.organizationId,
      status: 'active',
    }
    if (employeeIds && employeeIds.length > 0) {
      whereClause.id = { in: employeeIds }
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true, firstName: true, lastName: true,
        baseSalary: true, employeeId: true,
      },
    })

    if (employees.length === 0) {
      return NextResponse.json({ error: 'Tidak ada karyawan aktif' }, { status: 400 })
    }

    const results = []
    const errors  = []

    for (const emp of employees) {
      try {
        // Cek apakah sudah ada payroll untuk periode ini
        const existing = await prisma.payroll.findFirst({
          where: { employeeId: emp.id, month, year },
        })
        if (existing) {
          errors.push({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, reason: 'Sudah ada payroll periode ini' })
          continue
        }

        const baseSalary = Number(emp.baseSalary)

        // ── Hitung kehadiran & keterlambatan bulan ini ──────────────
        const attendances = await prisma.attendance.findMany({
          where: {
            employeeId: emp.id,
            date: { gte: periodStart, lte: periodEnd },
          },
          select: {
            status: true,
            checkIn: true,
            checkOut: true,
            date: true,
          },
        })

        const workDays    = attendances.filter(a => ['present', 'late'].includes(a.status)).length
        const absentDays  = attendances.filter(a => a.status === 'absent').length

        // Total menit terlambat (jika ada data checkIn dan jam masuk)
        // Asumsi jam masuk dari OrganizationSettings atau default 08:00
        const orgSettings = await prisma.organizationSettings.findUnique({
          where: { organizationId: currentEmployee.organizationId },
          select: { workStartTime: true, workEndTime: true },
        })
        const workStart = orgSettings?.workStartTime ?? '08:00'
        const [startH, startM] = workStart.split(':').map(Number)

        let lateMinutes = 0
        let earlyLeaveMinutes = 0
        const workEnd = orgSettings?.workEndTime ?? '17:00'
        const [endH, endM] = workEnd.split(':').map(Number)

        for (const att of attendances) {
          if (att.checkIn) {
            const ci = new Date(att.checkIn)
            const scheduled = new Date(att.date)
            scheduled.setHours(startH, startM, 0)
            if (ci > scheduled) {
              lateMinutes += Math.floor((ci.getTime() - scheduled.getTime()) / 60000)
            }
          }
          if (att.checkOut) {
            const co = new Date(att.checkOut)
            const scheduled = new Date(att.date)
            scheduled.setHours(endH, endM, 0)
            if (co < scheduled) {
              earlyLeaveMinutes += Math.floor((scheduled.getTime() - co.getTime()) / 60000)
            }
          }
        }

        // Total overtime dari attendance (status 'present' dengan checkout melebihi jam kerja)
        let overtimeHours = 0
        for (const att of attendances) {
          if (att.checkIn && att.checkOut) {
            const ci = new Date(att.checkIn)
            const co = new Date(att.checkOut)
            const scheduled = new Date(att.date)
            scheduled.setHours(endH, endM, 0)
            if (co > scheduled) {
              overtimeHours += (co.getTime() - scheduled.getTime()) / (1000 * 60 * 60)
            }
          }
        }

        // ── Jalankan kalkulasi ───────────────────────────────────────
        const result = calculatePayroll(
          {
            baseSalary,
            allowances: 0,
            overtimeHours: parseFloat(overtimeHours.toFixed(2)),
            lateMinutes,
            earlyLeaveMinutes,
            absentDays,
            bonus: 0,
            workingDays: workDays,
          },
          config
        )

        // ── Simpan ke database ───────────────────────────────────────
        const payroll = await prisma.payroll.create({
          data: {
            organizationId: currentEmployee.organizationId,
            employeeId:     emp.id,
            month,
            year,
            periodStart,
            periodEnd,

            baseSalary:     result.baseSalary,
            allowances:     result.allowances,
            overtime:       result.overtimePay,
            bonus:          result.bonus,

            bpjsKesehatan:      result.bpjsKesEmployee,
            bpjsKetenagakerjaan: result.bpjsTkJHT + result.bpjsTkJP,
            pph21:          result.pph21,
            otherDeductions: result.lateDeduction + result.earlyLeaveDeduction + result.absentDeduction,

            grossSalary:    result.grossSalary,
            totalDeductions: result.totalDeductions,
            netSalary:      result.netSalary,

            workDays,
            absentDays,
            lateDays:       lateMinutes > 0 ? 1 : 0, // flag saja, detail di breakdown
            overtimeHours:  parseFloat(overtimeHours.toFixed(2)),

            status:    'draft',
            createdBy: currentEmployee.id,

            // Simpan breakdown detail sebagai notes JSON
            notes: JSON.stringify({
              lateMinutes,
              earlyLeaveMinutes,
              lateDeduction:       result.lateDeduction,
              earlyLeaveDeduction: result.earlyLeaveDeduction,
              absentDeduction:     result.absentDeduction,
              bpjsKesEmployer:     result.bpjsKesEmployer,
              bpjsTkJHTEmployer:   result.bpjsTkJHTEmployer,
              bpjsTkJPEmployer:    result.bpjsTkJPEmployer,
              bpjsTkJKK:           result.bpjsTkJKK,
              bpjsTkJKM:           result.bpjsTkJKM,
              customAllowances:    result.customAllowances,
              customDeductions:    result.customDeductions,
            }),
          },
        })

        results.push({
          employeeId:   emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          payrollId:    payroll.id,
          netSalary:    result.netSalary,
          grossSalary:  result.grossSalary,
          lateMinutes,
          absentDays,
          overtimeHours,
        })
      } catch (empErr: any) {
        errors.push({
          employeeId: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          reason: empErr.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      generated: results.length,
      skipped:   errors.length,
      results,
      errors,
      period: `${month}/${year}`,
    })
  } catch (error: any) {
    console.error('POST /api/payroll/generate:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}