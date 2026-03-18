import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { GeneratePayrollForm } from '@/components/payroll/generate-payroll-form'
import { getCurrentPeriod } from '@/src/lib/payroll/calculations'
 
export const dynamic = 'force-dynamic'
 
export default async function GeneratePayrollPage() {
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
 
  // Only HR, Admin, Owner can generate payroll
  if (!['hr', 'admin', 'owner'].includes(currentEmployee.role)) {
    redirect('/dashboard/payroll')
  }
 
  // Get active employees for selection
  const employees = await prisma.employee.findMany({
    where: {
      organizationId: currentEmployee.organizationId,
      status: 'active',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeId: true,
      position: true,
      baseSalary: true,
    },
    orderBy: {
      firstName: 'asc',
    },
  })
 
  // Get current period
  const currentPeriod = getCurrentPeriod()
 
  // Check if payroll already exists for current period
  const existingPayroll = await prisma.payroll.findFirst({
    where: {
      organizationId: currentEmployee.organizationId,
      month: currentPeriod.month,
      year: currentPeriod.year,
    },
  })
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Payroll</h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate payroll for selected employees for a specific period
          </p>
        </div>
      </div>
 
      {/* Warning if payroll exists */}
      {existingPayroll && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> Payroll for the current period already exists. 
              You can generate for a different period or specific employees.
            </p>
          </CardContent>
        </Card>
      )}
 
      {/* Generate Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Generation Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneratePayrollForm
            employees={employees.map((e) => ({
              ...e,
              baseSalary: e.baseSalary.toNumber(),
            }))}
            defaultMonth={currentPeriod.month}
            defaultYear={currentPeriod.year}
          />
        </CardContent>
      </Card>
 
      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            How Payroll Generation Works
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Payroll is calculated based on attendance data for the period</li>
            <li>Overtime hours are automatically included in calculations</li>
            <li>BPJS (1% health, 2% employment) and PPh21 are deducted</li>
            <li>You can edit allowances, bonuses, and deductions after generation</li>
            <li>Payroll must be approved before marking as paid</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}