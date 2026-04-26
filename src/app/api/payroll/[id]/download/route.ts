// src/app/api/payroll/[id]/download/route.ts
// GET: Download payslip sebagai PDF (HTML yang bisa di-print)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentEmployee = await prisma.employee.findFirst({
      where: {
        OR: [{ authId: user.id }, { authId: null, email: user.email }],
      },
      select: { id: true, role: true, organizationId: true },
    })

    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Ambil payroll dengan semua relasi
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    // Security: Employee hanya bisa download payslip sendiri
    // HR/Admin/Owner bisa download semua
    const isOwn = payroll.employeeId === currentEmployee.id
    const isManager = ['hr', 'admin', 'owner'].includes(currentEmployee.role)

    if (!isOwn && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Periksa organizationId sama
    if (payroll.organizationId !== currentEmployee.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const monthName = format(new Date(payroll.year, payroll.month - 1), 'MMMM yyyy', { locale: idLocale })
    const emp = payroll.employee
    const org = emp.organization

    const fmt = (n: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(n)

    const totalBPJS = Number(payroll.bpjsKesehatan) + Number(payroll.bpjsKetenagakerjaan)

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Slip Gaji - ${emp.firstName} ${emp.lastName} - ${monthName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    background: #f1f5f9;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 32px 16px;
  }
  .slip {
    background: white;
    width: 680px;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    overflow: hidden;
  }

  /* Header */
  .slip-header {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    padding: 28px 32px;
    position: relative;
    overflow: hidden;
  }
  .slip-header::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 160px; height: 160px;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
  }
  .slip-header::after {
    content: '';
    position: absolute;
    bottom: -60px; left: 20px;
    width: 200px; height: 200px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .company-name {
    font-size: 20px;
    font-weight: 800;
    color: white;
    letter-spacing: -0.02em;
  }
  .slip-badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .slip-period {
    margin-top: 16px;
    color: rgba(255,255,255,0.75);
    font-size: 13px;
  }
  .slip-title {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-top: 2px;
    letter-spacing: -0.03em;
  }

  /* Employee Info */
  .employee-section {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 32px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .avatar {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .employee-details { flex: 1; }
  .employee-name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }
  .employee-meta {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }
  .status-badge {
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .status-paid { background: #dcfce7; color: #15803d; }
  .status-approved { background: #dbeafe; color: #1d4ed8; }
  .status-draft { background: #f3f4f6; color: #6b7280; }

  /* Body */
  .slip-body { padding: 24px 32px; }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }
  .info-item {
    background: #f8fafc;
    border-radius: 10px;
    padding: 12px 16px;
  }
  .info-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
  }
  .info-value {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    margin-top: 4px;
  }

  /* Section */
  .section { margin-bottom: 20px; }
  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
  }

  /* Line items */
  .line-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid #f8fafc;
  }
  .line-item:last-child { border-bottom: none; }
  .line-label { font-size: 13px; color: #475569; }
  .line-value { font-size: 13px; font-weight: 600; color: #1e293b; }
  .line-value.positive { color: #16a34a; }
  .line-value.negative { color: #dc2626; }

  /* Subtotal */
  .subtotal {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: 8px;
    margin-top: 8px;
  }
  .subtotal.earnings { background: #f0fdf4; }
  .subtotal.deductions { background: #fef2f2; }
  .subtotal-label { font-size: 12px; font-weight: 600; color: #475569; }
  .subtotal-value { font-size: 14px; font-weight: 700; }
  .subtotal.earnings .subtotal-value { color: #16a34a; }
  .subtotal.deductions .subtotal-value { color: #dc2626; }

  /* Net Salary */
  .net-salary {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
  }
  .net-label { color: rgba(255,255,255,0.75); font-size: 12px; font-weight: 500; }
  .net-title { color: white; font-size: 15px; font-weight: 700; margin-top: 2px; }
  .net-amount { color: white; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }

  /* Attendance */
  .attendance-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 8px;
  }
  .att-item {
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
  }
  .att-num {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1;
  }
  .att-label { font-size: 10px; color: #94a3b8; margin-top: 4px; }

  /* Footer */
  .slip-footer {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-note { font-size: 11px; color: #94a3b8; }
  .print-btn {
    background: #1d4ed8;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  
  @media print {
    body { background: white; padding: 0; }
    .slip { box-shadow: none; border-radius: 0; width: 100%; }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
<div class="slip">
  <!-- Header -->
  <div class="slip-header">
    <div class="header-top">
      <span class="company-name">${org.name}</span>
      <span class="slip-badge">Slip Gaji</span>
    </div>
    <div class="slip-period">${monthName}</div>
    <div class="slip-title">Bukti Pembayaran Gaji</div>
  </div>

  <!-- Employee Info -->
  <div class="employee-section">
    <div class="avatar">${emp.firstName[0]}${emp.lastName[0]}</div>
    <div class="employee-details">
      <div class="employee-name">${emp.firstName} ${emp.lastName}</div>
      <div class="employee-meta">${emp.position} &nbsp;·&nbsp; ${emp.department?.name || '-'} &nbsp;·&nbsp; ID: ${emp.employeeId}</div>
    </div>
    <span class="status-badge ${payroll.status === 'paid' ? 'status-paid' : payroll.status === 'approved' ? 'status-approved' : 'status-draft'}">
      ${payroll.status === 'paid' ? 'Dibayar' : payroll.status === 'approved' ? 'Disetujui' : 'Draft'}
    </span>
  </div>

  <!-- Body -->
  <div class="slip-body">

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Periode</div>
        <div class="info-value">${monthName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tanggal Bayar</div>
        <div class="info-value">${payroll.paidDate ? format(new Date(payroll.paidDate), 'dd MMMM yyyy', { locale: idLocale }) : '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Tipe Karyawan</div>
        <div class="info-value">${emp.employmentType === 'full-time' ? 'Full Time' : emp.employmentType === 'part-time' ? 'Part Time' : 'Kontrak'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Bergabung Sejak</div>
        <div class="info-value">${format(new Date(emp.joinDate), 'dd MMM yyyy', { locale: idLocale })}</div>
      </div>
    </div>

    <!-- Earnings -->
    <div class="section">
      <div class="section-title">Pendapatan</div>
      <div class="line-item">
        <span class="line-label">Gaji Pokok</span>
        <span class="line-value positive">${fmt(Number(payroll.baseSalary))}</span>
      </div>
      ${Number(payroll.allowances) > 0 ? `
      <div class="line-item">
        <span class="line-label">Tunjangan</span>
        <span class="line-value positive">${fmt(Number(payroll.allowances))}</span>
      </div>` : ''}
      ${Number(payroll.overtime) > 0 ? `
      <div class="line-item">
        <span class="line-label">Lembur</span>
        <span class="line-value positive">${fmt(Number(payroll.overtime))}</span>
      </div>` : ''}
      ${Number(payroll.bonus) > 0 ? `
      <div class="line-item">
        <span class="line-label">Bonus</span>
        <span class="line-value positive">${fmt(Number(payroll.bonus))}</span>
      </div>` : ''}
      <div class="subtotal earnings">
        <span class="subtotal-label">Total Pendapatan Bruto</span>
        <span class="subtotal-value">${fmt(Number(payroll.grossSalary))}</span>
      </div>
    </div>

    <!-- Deductions -->
    <div class="section">
      <div class="section-title">Potongan</div>
      ${Number(payroll.bpjsKesehatan) > 0 ? `
      <div class="line-item">
        <span class="line-label">BPJS Kesehatan (1%)</span>
        <span class="line-value negative">- ${fmt(Number(payroll.bpjsKesehatan))}</span>
      </div>` : ''}
      ${Number(payroll.bpjsKetenagakerjaan) > 0 ? `
      <div class="line-item">
        <span class="line-label">BPJS Ketenagakerjaan (2%)</span>
        <span class="line-value negative">- ${fmt(Number(payroll.bpjsKetenagakerjaan))}</span>
      </div>` : ''}
      ${Number(payroll.pph21) > 0 ? `
      <div class="line-item">
        <span class="line-label">PPh 21 (Pajak Penghasilan)</span>
        <span class="line-value negative">- ${fmt(Number(payroll.pph21))}</span>
      </div>` : ''}
      ${Number(payroll.otherDeductions) > 0 ? `
      <div class="line-item">
        <span class="line-label">Potongan Lain</span>
        <span class="line-value negative">- ${fmt(Number(payroll.otherDeductions))}</span>
      </div>` : ''}
      <div class="subtotal deductions">
        <span class="subtotal-label">Total Potongan</span>
        <span class="subtotal-value">- ${fmt(Number(payroll.totalDeductions))}</span>
      </div>
    </div>

    <!-- Attendance -->
    <div class="section">
      <div class="section-title">Kehadiran Bulan Ini</div>
      <div class="attendance-grid">
        <div class="att-item">
          <div class="att-num" style="color: #16a34a">${payroll.workDays}</div>
          <div class="att-label">Hari Kerja</div>
        </div>
        <div class="att-item">
          <div class="att-num" style="color: #dc2626">${payroll.absentDays}</div>
          <div class="att-label">Tidak Hadir</div>
        </div>
        <div class="att-item">
          <div class="att-num" style="color: #f59e0b">${payroll.lateDays}</div>
          <div class="att-label">Terlambat</div>
        </div>
        <div class="att-item">
          <div class="att-num">${payroll.overtimeHours}</div>
          <div class="att-label">Jam Lembur</div>
        </div>
      </div>
    </div>

    <!-- Net Salary -->
    <div class="net-salary">
      <div>
        <div class="net-label">Gaji Bersih Diterima</div>
        <div class="net-title">${monthName}</div>
      </div>
      <div class="net-amount">${fmt(Number(payroll.netSalary))}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="slip-footer">
    <div class="footer-note">
      Dokumen ini digenerate otomatis oleh sistem HRIS<br>
      Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ Cetak PDF</button>
  </div>
</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="slip_gaji_${emp.firstName}_${emp.lastName}_${monthName.replace(' ', '_')}.html"`,
      },
    })
  } catch (error: any) {
    console.error('Download payslip error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}