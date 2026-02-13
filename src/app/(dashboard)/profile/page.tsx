// src/app/(dashboard)/profile/page.tsx
// Employee profile view with tabs

import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  DollarSign,
  Edit,
  Shield,
  FileText,
  Users,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const employee = await prisma.employee.findUnique({
    where: { authId: user.id },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!employee) {
    return null
  }

  // Get attendance stats
  const currentMonth = new Date()
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

  const attendanceCount = await prisma.attendance.count({
    where: {
      employeeId: employee.id,
      date: { gte: startOfMonth },
      status: { in: ['present', 'late'] },
    },
  })

  // Get leave balance
  const currentYear = new Date().getFullYear()
  const yearStart = new Date(currentYear, 0, 1)

  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: employee.id,
      status: 'approved',
      startDate: { gte: yearStart },
    },
  })

  const annualLeaveTaken = approvedLeaves
    .filter((l) => l.leaveType === 'annual')
    .reduce((sum, l) => sum + l.totalDays, 0)

  const orgSettings = await prisma.organizationSettings.findUnique({
    where: { organizationId: employee.organizationId },
  })

  const annualLeaveBalance = (orgSettings?.annualLeaveQuota || 12) - annualLeaveTaken

  // Get initials
  const getInitials = () => {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase()
  }

  // Format salary
  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage your personal information
          </p>
        </div>

        <Link href="/profile/edit">
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              {/* <AvatarImage src={employee.photoUrl || undefined} /> */}
              <AvatarFallback className="bg-blue-600 text-white text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h2>
                <Badge
                  variant={
                    employee.status === 'active'
                      ? 'success'
                      : employee.status === 'inactive'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {employee.status}
                </Badge>
              </div>

              <p className="mt-1 text-lg text-gray-600">{employee.position}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{employee.email}</span>
                </div>
                {employee.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{employee.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{employee.department?.name || 'No Department'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(employee.joinDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employee ID</p>
                <p className="mt-2 text-xl font-bold">{employee.employeeId}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="mt-2 text-xl font-bold">{attendanceCount} days</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leave Balance</p>
                <p className="mt-2 text-xl font-bold">{annualLeaveBalance} days</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="mt-2 text-xl font-bold capitalize">{employee.role}</p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    First Name
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">{employee.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Last Name
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">{employee.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="mt-1 text-sm text-gray-900">{employee.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Phone Number
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {employee.phoneNumber || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Employee ID
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employeeId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Position
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">{employee.position}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Department
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {employee.department?.name || 'No Department'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Employment Type
                  </Label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {employee.employmentType.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Join Date
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(employee.joinDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Base Salary
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatSalary(employee.baseSalary.toNumber())}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        employee.status === 'active'
                          ? 'success'
                          : employee.status === 'inactive'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Organization
                  </Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {employee.organization.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Password</Label>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">••••••••••••</p>
                  <Link href="/profile/change-password">
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-600">
                  Account Email
                </Label>
                <p className="mt-1 text-sm text-gray-900">{employee.email}</p>
                <p className="mt-1 text-xs text-gray-500">
                  This email is used for login and notifications
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Label component
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={className}>{children}</p>
}