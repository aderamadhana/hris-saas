// src/app/(dashboard)/departments/[id]/page.tsx
// Department detail page with employee list

import { createClient } from '@/src/lib/supabase/server'
import prisma from '@/src/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import {
  Building2,
  Users,
  UserCog,
  Edit,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Briefcase,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function DepartmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { authId: user.id },
    select: {
      organizationId: true,
      role: true,
    },
  })

  if (!currentEmployee) {
    return null
  }

  const canManage = ['owner', 'admin', 'hr'].includes(currentEmployee.role)

  // Get department with full details
  const department = await prisma.department.findFirst({
    where: {
      id: params.id,
      organizationId: currentEmployee.organizationId,
    },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          position: true,
          joinDate: true,
        },
      },
      employees: {
        include: {
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          firstName: 'asc',
        },
      },
    },
  })

  if (!department) {
    notFound()
  }

  // Calculate stats
  const totalEmployees = department.employees.length
  const activeEmployees = department.employees.filter(
    (e) => e.status === 'active'
  ).length
  const inactiveEmployees = totalEmployees - activeEmployees

  // Get initials for avatars
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
        <div className="flex items-center gap-4">
          <Link href="/departments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {department.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {department.description || 'No description'}
            </p>
          </div>
        </div>

        {canManage && (
          <Link href={`/departments/${department.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Department
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Employees
                </p>
                <p className="mt-2 text-3xl font-bold">{totalEmployees}</p>
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
                <p className="text-sm font-medium text-gray-600">
                  Active Employees
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {activeEmployees}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <UserCog className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Employees
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-600">
                  {inactiveEmployees}
                </p>
              </div>
              <div className="rounded-full bg-gray-100 p-3">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Department Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          {department.manager ? (
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {getInitials(
                    department.manager.firstName,
                    department.manager.lastName
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {department.manager.firstName} {department.manager.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  {department.manager.position}
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{department.manager.email}</span>
                  </div>
                  {department.manager.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{department.manager.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {formatDate(department.manager.joinDate)}
                    </span>
                  </div>
                </div>
              </div>

              {canManage && (
                <Link href={`/dashboard/employees/${department.manager.id}`}>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <UserCog className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-900">
                    No Manager Assigned
                  </p>
                  <p className="text-sm text-yellow-700">
                    This department doesn't have a manager yet
                  </p>
                </div>
              </div>
              {canManage && (
                <Link href={`/departments/${department.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Assign Manager
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Department Employees ({totalEmployees})
            </CardTitle>
            {canManage && (
              <Link href="/employees/new">
                <Button size="sm">Add Employee</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {department.employees.length > 0 ? (
            <div className="space-y-3">
              {department.employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {getInitials(employee.firstName, employee.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </h4>
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
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          <span>{employee.position}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{employee.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <Link href={`/dashboard/employees/${employee.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-gray-100 p-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No Employees Yet
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This department doesn't have any employees assigned
              </p>
              {canManage && (
                <Link href="/employees/new" className="mt-4">
                  <Button>Add First Employee</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}