// src/components/departments/department-card.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Badge } from '@/src/components/ui/badge'
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar'
import { Building2, Users, MoreVertical, Edit, Trash2, UserCog } from 'lucide-react'
import { DeleteDepartmentDialog } from './delete-department-dialog'

interface DepartmentCardProps {
  department: {
    id: string
    name: string
    description: string
    managerName: string
    managerEmail: string
    employeeCount: number
    totalEmployees: number
  }
  canManage: boolean
}

export function DepartmentCard({ department, canManage }: DepartmentCardProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const hasManager = department.managerName !== 'No Manager'

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {department.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-1">
                {department.description || 'No description'}
              </p>
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/departments/${department.id}`)
                  }
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/departments/${department.id}/edit`)
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Manager Info */}
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {hasManager ? getInitials(department.managerName) : <UserCog className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {hasManager ? department.managerName : 'No Manager'}
              </p>
              {hasManager && (
                <p className="text-xs text-gray-600 truncate">
                  {department.managerEmail}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">
                {department.employeeCount} Active
              </span>
            </div>
            {department.totalEmployees > department.employeeCount && (
              <span className="text-xs text-gray-500">
                {department.totalEmployees} total
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteDepartmentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        department={{
          id: department.id,
          name: department.name,
          employeeCount: department.employeeCount,
        }}
      />
    </>
  )
}