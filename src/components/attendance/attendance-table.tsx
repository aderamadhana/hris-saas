// src/src/components/attendance/attendance-table.tsx
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
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Calendar } from 'lucide-react'

interface AttendanceData {
  id: string
  employeeId: string
  employeeName: string
  position: string
  department: string
  checkIn: string | null
  checkOut: string | null
  status: string
  notes: string
}

interface AttendanceTableProps {
  data: AttendanceData[]
  selectedDate: string
  canEdit: boolean
}

export function AttendanceTable({ data, selectedDate, canEdit }: AttendanceTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter data
  const filteredData = data.filter((record) => {
    const query = searchQuery.toLowerCase()
    return (
      record.employeeName.toLowerCase().includes(query) ||
      record.employeeId.toLowerCase().includes(query) ||
      record.position.toLowerCase().includes(query) ||
      record.department.toLowerCase().includes(query)
    )
  })

  const handleDateChange = (date: string) => {
    router.push(`/dashboard/attendance?date=${date}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="success">Present</Badge>
      case 'late':
        return <Badge variant="warning">Late</Badge>
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>
      case 'leave':
        return <Badge variant="secondary">On Leave</Badge>
      case 'half-day':
        return <Badge className="bg-purple-500">Half Day</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-'
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const calculateWorkHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return '-'
    
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by name, ID, position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Date Filter */}
        <div className="w-full sm:w-auto">
          <Label htmlFor="date">Date</Label>
          <div className="relative mt-1">
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Work Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No attendance records found for this date.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.employeeId}
                  </TableCell>
                  <TableCell>{record.employeeName}</TableCell>
                  <TableCell className="text-gray-600">
                    {record.position}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {record.department}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatTime(record.checkIn)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatTime(record.checkOut)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {calculateWorkHours(record.checkIn, record.checkOut)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.status)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredData.length} of {data.length} records
        </div>
        <div>
          {new Date(selectedDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
    </div>
  )
}