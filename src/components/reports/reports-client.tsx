'use client'

// src/components/reports/reports-client.tsx
// Komponen utama Reports dengan tab, filter, tabel, dan tombol export

import { useState, useCallback } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  AlertCircle,
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  employeeId: string
  department: string
}

interface Department {
  id: string
  name: string
}

interface Props {
  organizationId: string
  userRole: string
  employees: Employee[]
  departments: Department[]
}

type ReportTab = 'attendance' | 'leave' | 'payroll'

// Bulan Indonesia
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 2, currentYear - 1, currentYear]

export function ReportsClient({ organizationId, userRole, employees, departments }: Props) {
  const [activeTab, setActiveTab] = useState<ReportTab>('attendance')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(currentYear)
  const [departmentId, setDepartmentId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [reportData, setReportData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const generateReport = useCallback(async () => {
    setLoading(true)
    setHasGenerated(true)
    try {
      const params = new URLSearchParams({
        type: activeTab,
        month: String(month),
        year: String(year),
        ...(departmentId && { departmentId }),
        ...(employeeId && { employeeId }),
      })
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data.data || [])
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, month, year, departmentId, employeeId])

  const exportReport = async (format: 'xlsx' | 'pdf') => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        type: activeTab,
        month: String(month),
        year: String(year),
        format,
        ...(departmentId && { departmentId }),
        ...(employeeId && { employeeId }),
      })
      const res = await fetch(`/api/reports/export?${params}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const monthName = MONTHS[month - 1]
        const tabLabel = activeTab === 'attendance' ? 'Absensi' : activeTab === 'leave' ? 'Cuti' : 'Payroll'
        a.download = `Laporan_${tabLabel}_${monthName}_${year}.${format}`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const tabs = [
    { id: 'attendance' as const, label: 'Laporan Absensi', icon: Clock },
    { id: 'leave' as const, label: 'Laporan Cuti', icon: CalendarDays },
    { id: 'payroll' as const, label: 'Laporan Payroll', icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Analitik</h1>
          <p className="mt-1 text-sm text-gray-500">Generate dan export laporan HR</p>
        </div>
        {hasGenerated && reportData.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportReport('xlsx')}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </button>
            <button
              onClick={() => exportReport('pdf')}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setHasGenerated(false)
                  setReportData([])
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filter Laporan</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Bulan */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Tahun</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Departemen */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Departemen</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Karyawan */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Karyawan</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Karyawan</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Periode: {MONTHS[month - 1]} {year}
          </p>
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            {loading ? 'Memproses...' : 'Generate Laporan'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm text-gray-500">Memproses laporan...</p>
        </div>
      ) : hasGenerated && reportData.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
          <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm font-medium text-gray-500">Tidak ada data untuk periode ini</p>
        </div>
      ) : hasGenerated && reportData.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* Summary Bar */}
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-semibold text-gray-900">{reportData.length}</span> data
            </p>
            <p className="text-xs text-gray-400">
              {MONTHS[month - 1]} {year}
            </p>
          </div>

          {/* Attendance Table */}
          {activeTab === 'attendance' && <AttendanceTable data={reportData} />}
          {activeTab === 'leave' && <LeaveTable data={reportData} />}
          {activeTab === 'payroll' && <PayrollTable data={reportData} />}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16">
          <TrendingUp className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">Pilih filter dan klik "Generate Laporan"</p>
          <p className="text-xs text-gray-400 mt-1">untuk melihat data laporan</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// TABEL ABSENSI
// ============================================================
function AttendanceTable({ data }: { data: any[] }) {
  const totalPresent = data.reduce((sum, r) => sum + (r.presentDays || 0), 0)
  const totalLate = data.reduce((sum, r) => sum + (r.lateDays || 0), 0)
  const totalAbsent = data.reduce((sum, r) => sum + (r.absentDays || 0), 0)

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
        <div className="bg-white px-6 py-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalPresent}</p>
          <p className="text-xs text-gray-500 mt-1">Total Hadir</p>
        </div>
        <div className="bg-white px-6 py-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{totalLate}</p>
          <p className="text-xs text-gray-500 mt-1">Total Terlambat</p>
        </div>
        <div className="bg-white px-6 py-4 text-center">
          <p className="text-2xl font-bold text-red-500">{totalAbsent}</p>
          <p className="text-xs text-gray-500 mt-1">Total Tidak Hadir</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {['No', 'ID', 'Nama', 'Departemen', 'Hadir', 'Terlambat', 'Absen', 'Total Jam', 'Kehadiran %'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, idx) => (
              <tr key={row.employeeId || idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.employeeId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-gray-500">{row.department || '-'}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-green-600">{row.presentDays}</span>
                  <span className="text-gray-400 text-xs"> hari</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${row.lateDays > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>{row.lateDays}</span>
                  <span className="text-gray-400 text-xs"> hari</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${row.absentDays > 0 ? 'text-red-500' : 'text-gray-400'}`}>{row.absentDays}</span>
                  <span className="text-gray-400 text-xs"> hari</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.totalHours || 0}j</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${(row.attendanceRate || 0) >= 80 ? 'bg-green-500' : (row.attendanceRate || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${row.attendanceRate || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{row.attendanceRate || 0}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// TABEL CUTI
// ============================================================
function LeaveTable({ data }: { data: any[] }) {
  const totalDays = data.reduce((sum, r) => sum + (r.totalDays || 0), 0)

  return (
    <div>
      <div className="border-b border-gray-100 px-6 py-3 bg-gray-50">
        <p className="text-sm text-gray-600">Total penggunaan cuti: <span className="font-bold text-gray-900">{totalDays} hari</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {['No', 'ID', 'Nama', 'Jenis Cuti', 'Tanggal Mulai', 'Tanggal Selesai', 'Hari', 'Status', 'Disetujui Oleh'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.employeeId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{row.employeeName}</td>
                <td className="px-4 py-3 text-gray-600">{row.leaveType}</td>
                <td className="px-4 py-3 text-gray-500">{row.startDate}</td>
                <td className="px-4 py-3 text-gray-500">{row.endDate}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{row.totalDays}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.status === 'approved' ? 'bg-green-100 text-green-700'
                    : row.status === 'rejected' ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {row.status === 'approved' ? 'Disetujui' : row.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{row.approvedBy || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// TABEL PAYROLL
// ============================================================
function PayrollTable({ data }: { data: any[] }) {
  const totalGross = data.reduce((sum, r) => sum + (r.grossSalary || 0), 0)
  const totalNet = data.reduce((sum, r) => sum + (r.netSalary || 0), 0)
  const totalTax = data.reduce((sum, r) => sum + (r.pph21 || 0), 0)

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
        <div className="bg-white px-6 py-4 text-center">
          <p className="text-lg font-bold text-gray-900">{fmt(totalGross)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Bruto</p>
        </div>
        <div className="bg-white px-6 py-4 text-center">
          <p className="text-lg font-bold text-red-500">{fmt(totalTax)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Pajak (PPh21)</p>
        </div>
        <div className="bg-white px-6 py-4 text-center">
          <p className="text-lg font-bold text-green-600">{fmt(totalNet)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Neto</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {['No', 'ID', 'Nama', 'Departemen', 'Gaji Pokok', 'Tunjangan', 'Bonus', 'Bruto', 'BPJS', 'PPh21', 'Neto', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{row.employeeId}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{row.employeeName}</td>
                <td className="px-4 py-3 text-gray-500">{row.department || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{fmt(row.baseSalary || 0)}</td>
                <td className="px-4 py-3 text-gray-700">{fmt(row.allowances || 0)}</td>
                <td className="px-4 py-3 text-gray-700">{fmt(row.bonus || 0)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{fmt(row.grossSalary || 0)}</td>
                <td className="px-4 py-3 text-red-500">{fmt((row.bpjsKesehatan || 0) + (row.bpjsKetenagakerjaan || 0))}</td>
                <td className="px-4 py-3 text-red-500">{fmt(row.pph21 || 0)}</td>
                <td className="px-4 py-3 font-bold text-green-600">{fmt(row.netSalary || 0)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.status === 'paid' ? 'bg-green-100 text-green-700'
                    : row.status === 'approved' ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {row.status === 'paid' ? 'Dibayar' : row.status === 'approved' ? 'Disetujui' : 'Draft'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}