// src/src/components/leave/leave-table.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Label } from '@/src/components/ui/label'
import { MoreHorizontal, CheckCircle, XCircle, Eye } from 'lucide-react'
import { ApproveRejectDialog } from './approve-reject-dialog'

interface LeaveData {
  id: string
  employeeId: string
  employeeName: string
  position: string
  department: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: string
  createdAt: string
  reviewedAt: string | null
  reviewNotes: string
}

interface LeaveTableProps {
  data: LeaveData[]
  canApprove: boolean
}

export function LeaveTable({ data, canApprove }: LeaveTableProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLeave, setSelectedLeave] = useState<LeaveData | null>(null)
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | null>(null)

  // Filter data
  const filteredData =
    statusFilter === 'all'
      ? data
      : data.filter((leave) => leave.status === statusFilter)

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    if (value === 'all') {
      router.push('/dashboard/leave')
    } else {
      router.push(`/dashboard/leave?status=${value}`)
    }
  }

  const handleApprove = (leave: LeaveData) => {
    setSelectedLeave(leave)
    setDialogType('approve')
  }

  const handleReject = (leave: LeaveData) => {
    setSelectedLeave(leave)
    setDialogType('reject')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getLeaveTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: any }> = {
      annual: { label: 'Annual', variant: 'default' },
      sick: { label: 'Sick', variant: 'secondary' },
      unpaid: { label: 'Unpaid', variant: 'outline' },
      emergency: { label: 'Emergency', variant: 'destructive' },
      maternity: { label: 'Maternity', variant: 'default' },
      paternity: { label: 'Paternity', variant: 'default' },
    }

    const config = typeMap[type] || { label: type, variant: 'default' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-end gap-4">
        <div className="w-full max-w-xs">
          <Label htmlFor="status-filter">Filter by Status</Label>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger id="status-filter" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{leave.employeeName}</p>
                      <p className="text-sm text-gray-500">{leave.employeeId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {leave.position}
                  </TableCell>
                  <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                  <TableCell>
                    {new Date(leave.startDate).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    {new Date(leave.endDate).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {leave.totalDays} {leave.totalDays > 1 ? 'days' : 'day'}
                  </TableCell>
                  <TableCell>{getStatusBadge(leave.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/leave/${leave.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>

                        {canApprove && leave.status === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleApprove(leave)}
                              className="text-green-600 focus:text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReject(leave)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredData.length} of {data.length} requests
      </div>

      {/* Approve/Reject Dialog */}
      {selectedLeave && dialogType && (
        <ApproveRejectDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedLeave(null)
              setDialogType(null)
            }
          }}
          leave={selectedLeave}
          type={dialogType}
        />
      )}
    </div>
  )
}