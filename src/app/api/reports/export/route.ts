// src/app/api/reports/export/route.ts
// GET: Export laporan ke Excel atau PDF

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

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
    const exportFormat = searchParams.get('format') || 'xlsx'
    const departmentId = searchParams.get('departmentId') || undefined
    const filterEmployeeId = searchParams.get('employeeId') || undefined

    const startDate = startOfMonth(new Date(year, month - 1))
    const endDate = endOfMonth(new Date(year, month - 1))
    const monthName = format(startDate, 'MMMM yyyy', { locale: idLocale })

    // Ambil data sesuai type
    const { rows, headers, title } = await getReportData({
      type,
      organizationId: employee.organizationId,
      startDate,
      endDate,
      month,
      year,
      departmentId,
      filterEmployeeId,
      monthName,
    })

    // ============================================================
    // EXPORT EXCEL (xlsx)
    // ============================================================
    if (exportFormat === 'xlsx') {
      const xlsx = await import('xlsx')

      const wb = xlsx.utils.book_new()

      // Sheet 1: Data
      const wsData = [
        [title],
        [`Periode: ${monthName}`],
        [`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
        [],
        headers,
        ...rows,
      ]

      const ws = xlsx.utils.aoa_to_sheet(wsData)

      // Styling header row (row 5, index 4)
      const headerRowIndex = 4
      headers.forEach((_, colIdx) => {
        const cellRef = xlsx.utils.encode_cell({ r: headerRowIndex, c: colIdx })
        if (!ws[cellRef]) return
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: '2563EB' } },
          alignment: { horizontal: 'center' },
        }
      })

      // Column widths
      ws['!cols'] = headers.map(() => ({ wch: 20 }))

      // Merge title cells
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }]

      xlsx.utils.book_append_sheet(wb, ws, 'Laporan')

      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="laporan_${type}_${month}_${year}.xlsx"`,
        },
      })
    }

    // ============================================================
    // EXPORT PDF (HTML → PDF via browser print)
    // Mengembalikan HTML yang bisa di-print sebagai PDF
    // ============================================================
    if (exportFormat === 'pdf') {
      const html = generatePDFHTML({ title, monthName, headers, rows })

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="laporan_${type}_${month}_${year}.html"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================================
// GET REPORT DATA
// ============================================================
async function getReportData({
  type, organizationId, startDate, endDate, month, year,
  departmentId, filterEmployeeId, monthName,
}: any) {
  const employeeWhere: any = { organizationId, status: 'active' }
  if (departmentId) employeeWhere.departmentId = departmentId
  if (filterEmployeeId) employeeWhere.id = filterEmployeeId

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n)

  if (type === 'attendance') {
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        department: { select: { name: true } },
        attendance: {
          where: { date: { gte: startDate, lte: endDate } },
        },
      },
      orderBy: { firstName: 'asc' },
    })

    const workingDays = getWorkingDays(startDate, endDate)
    const headers = ['No', 'ID Karyawan', 'Nama', 'Departemen', 'Hari Kerja', 'Hadir', 'Terlambat', 'Absen', 'Total Jam', 'Kehadiran %']

    const rows = employees.map((emp, i) => {
      const present = emp.attendance.filter((a) => ['present', 'late'].includes(a.status)).length
      const late = emp.attendance.filter((a) => a.status === 'late').length
      const absent = Math.max(0, workingDays - present)
      const totalMin = emp.attendance.reduce((s, a) => {
        if (a.checkIn && a.checkOut) return s + Math.round((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000)
        return s
      }, 0)
      const rate = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0
      return [i + 1, emp.employeeId, `${emp.firstName} ${emp.lastName}`, emp.department?.name || '-', workingDays, present, late, absent, `${Math.round(totalMin / 60)} jam`, `${rate}%`]
    })

    return { rows, headers, title: `Laporan Absensi - ${monthName}` }
  }

  if (type === 'leave') {
    const where: any = { organizationId, startDate: { gte: startDate, lte: endDate } }
    if (filterEmployeeId) where.employeeId = filterEmployeeId
    if (departmentId) where.employee = { departmentId }

    const leaves = await prisma.leave.findMany({
      where,
      include: { employee: { include: { department: { select: { name: true } } } } },
      orderBy: { startDate: 'asc' },
    })

    const headers = ['No', 'ID Karyawan', 'Nama', 'Departemen', 'Jenis Cuti', 'Tanggal Mulai', 'Tanggal Selesai', 'Hari', 'Status', 'Alasan']
    const rows = leaves.map((l, i) => [
      i + 1,
      l.employee.employeeId,
      `${l.employee.firstName} ${l.employee.lastName}`,
      l.employee.department?.name || '-',
      l.leaveType,
      format(new Date(l.startDate), 'dd/MM/yyyy'),
      format(new Date(l.endDate), 'dd/MM/yyyy'),
      `${l.days} hari`,
      l.status === 'approved' ? 'Disetujui' : l.status === 'rejected' ? 'Ditolak' : 'Menunggu',
      l.reason,
    ])

    return { rows, headers, title: `Laporan Cuti - ${monthName}` }
  }

  if (type === 'payroll') {
    const where: any = { organizationId, month, year }
    if (filterEmployeeId) where.employeeId = filterEmployeeId
    if (departmentId) where.employee = { departmentId }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: { employee: { include: { department: { select: { name: true } } } } },
      orderBy: { employee: { firstName: 'asc' } },
    })

    const headers = ['No', 'ID', 'Nama', 'Dept', 'Gaji Pokok', 'Tunjangan', 'Bonus', 'Bruto', 'BPJS', 'PPh21', 'Neto', 'Status']
    const rows = payrolls.map((p, i) => [
      i + 1,
      p.employee.employeeId,
      `${p.employee.firstName} ${p.employee.lastName}`,
      p.employee.department?.name || '-',
      fmt(Number(p.baseSalary)),
      fmt(Number(p.allowances)),
      fmt(Number(p.bonus)),
      fmt(Number(p.grossSalary)),
      fmt(Number(p.bpjsKesehatan) + Number(p.bpjsKetenagakerjaan)),
      fmt(Number(p.pph21)),
      fmt(Number(p.netSalary)),
      p.status === 'paid' ? 'Dibayar' : p.status === 'approved' ? 'Disetujui' : 'Draft',
    ])

    return { rows, headers, title: `Laporan Payroll - ${monthName}` }
  }

  return { rows: [], headers: [], title: '' }
}

// Helper: Hari kerja
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

// Generate HTML for PDF print
function generatePDFHTML({ title, monthName, headers, rows }: {
  title: string
  monthName: string
  headers: string[]
  rows: any[][]
}) {
  const tableRows = rows.map((row) =>
    `<tr>${row.map((cell) => `<td>${cell ?? '-'}</td>`).join('')}</tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; font-size: 11px; color: #111; padding: 24px; }
  .header { margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; }
  .header h1 { font-size: 18px; font-weight: 700; color: #1e3a8a; }
  .header p { font-size: 11px; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  thead th { background: #2563eb; color: white; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #374151; }
  .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; }
  @media print {
    body { padding: 12px; }
    button { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>${title}</h1>
  <p>Periode: ${monthName} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('id-ID')}</p>
</div>
<table>
  <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<div class="footer">
  <p>Total data: ${rows.length} baris &nbsp;|&nbsp; Dokumen ini digenerate otomatis oleh sistem HRIS</p>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`
}