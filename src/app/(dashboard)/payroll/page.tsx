import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  Filter,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { getMonthName, formatCurrency } from '@/src/lib/payroll/calculations'
 
export const dynamic = 'force-dynamic'
 
export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; status?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
 
  if (!user) {
    redirect('/login')
  }
 
  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      role: true,
      organizationId: true,
    },
  })
 
  if (!currentEmployee) {
    redirect('/login')
  }
 
  // Only HR, Admin, Owner can access payroll management
  if (!['hr', 'admin', 'owner'].includes(currentEmployee.role)) {
    redirect('/dashboard')
  }
 
  const params = await searchParams
  
  // Build filter
  const where: any = {
    organizationId: currentEmployee.organizationId,
  }
 
  if (params.month) where.month = parseInt(params.month)
  if (params.year) where.year = parseInt(params.year)
  if (params.status) where.status = params.status
 
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
 
  // Calculate summary stats
  const totalGross = payrolls.reduce(
    (sum, p) => sum + p.grossSalary.toNumber(),
    0
  )
  const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary.toNumber(), 0)
  const totalDeductions = payrolls.reduce(
    (sum, p) => sum + p.totalDeductions.toNumber(),
    0
  )
 
  const statusCounts = {
    draft: payrolls.filter((p) => p.status === 'draft').length,
    approved: payrolls.filter((p) => p.status === 'approved').length,
    paid: payrolls.filter((p) => p.status === 'paid').length,
  }
 
  // Get current month/year for default
  const currentDate = new Date()
  const currentMonth = params.month ? parseInt(params.month) : currentDate.getMonth() + 1
  const currentYear = params.year ? parseInt(params.year) : currentDate.getFullYear()
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage employee payroll and salary processing
          </p>
        </div>
 
        <div className="flex items-center gap-2">
          <Link href="/dashboard/payroll/generate">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Payroll
            </Button>
          </Link>
        </div>
      </div>
 
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {payrolls.length}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gross</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(totalGross)}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deductions</p>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {formatCurrency(totalDeductions)}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Net</p>
                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {formatCurrency(totalNet)}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
 
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Filter */}
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={currentMonth}
              onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set('month', e.target.value)
                window.location.href = url.toString()
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {getMonthName(m)}
                </option>
              ))}
            </select>
 
            {/* Year Filter */}
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={currentYear}
              onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set('year', e.target.value)
                window.location.href = url.toString()
              }}
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
 
            {/* Status Filter */}
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={params.status || 'all'}
              onChange={(e) => {
                const url = new URL(window.location.href)
                if (e.target.value === 'all') {
                  url.searchParams.delete('status')
                } else {
                  url.searchParams.set('status', e.target.value)
                }
                window.location.href = url.toString()
              }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft ({statusCounts.draft})</option>
              <option value="approved">Approved ({statusCounts.approved})</option>
              <option value="paid">Paid ({statusCounts.paid})</option>
            </select>
 
            {/* Clear Filters */}
            {(params.month || params.year || params.status) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = '/dashboard/payroll'
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
 
      {/* Payroll List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payroll Records
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm font-medium text-gray-900">
                No payroll records found
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Generate payroll for employees to get started
              </p>
              <Link href="/dashboard/payroll/generate">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Payroll
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {payrolls.map((payroll) => (
                <div
                  key={payroll.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-semibold text-blue-600">
                        {payroll.employee.firstName.charAt(0)}
                        {payroll.employee.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payroll.employee.firstName} {payroll.employee.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payroll.employee.employeeId} • {payroll.employee.position}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getMonthName(payroll.month)} {payroll.year}
                      </p>
                    </div>
                  </div>
 
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Net Salary</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(payroll.netSalary.toNumber())}
                      </p>
                    </div>
 
                    <Badge
                      variant={
                        payroll.status === 'paid'
                          ? 'success'
                          : payroll.status === 'approved'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {payroll.status}
                    </Badge>
 
                    <Link href={`/dashboard/payroll/${payroll.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}