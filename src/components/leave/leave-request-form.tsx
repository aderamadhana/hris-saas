// src/components/leave/leave-request-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Card, CardContent } from '@/src/components/ui/card'
import { Loader2, Calendar, AlertCircle } from 'lucide-react'

// Validation schema
const leaveRequestSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'unpaid', 'emergency', 'maternity', 'paternity']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
}).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end >= start
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
)

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>

interface LeaveRequestFormProps {
  employeeId: string
  employeeName: string
  leaveBalance: {
    annual: number
    sick: number
  }
}

export function LeaveRequestForm({
  employeeId,
  employeeName,
  leaveBalance,
}: LeaveRequestFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: 'annual',
    },
  })

  const selectedLeaveType = watch('leaveType')
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  // Calculate working days
  const calculateWorkingDays = (start: string, end: string): number => {
    if (!start || !end) return 0

    const startDate = new Date(start)
    const endDate = new Date(end)

    if (endDate < startDate) return 0

    let count = 0
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }

  const workingDays = calculateWorkingDays(startDate, endDate)

  // Check if exceeds balance
  const exceedsBalance = () => {
    if (selectedLeaveType === 'annual') {
      return workingDays > leaveBalance.annual
    }
    if (selectedLeaveType === 'sick') {
      return workingDays > leaveBalance.sick
    }
    return false
  }

  const onSubmit = async (data: LeaveRequestFormData) => {
    setIsLoading(true)
    setError(null)

    // Check balance before submit
    if (exceedsBalance()) {
      setError(
        `Insufficient leave balance. You only have ${
          selectedLeaveType === 'annual'
            ? leaveBalance.annual
            : leaveBalance.sick
        } days remaining.`
      )
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          employeeId,
          totalDays: workingDays,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit leave request')
      }

      // Success - redirect to leave list
      router.push('/dashboard/leave')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Leave Balance Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-900">Annual Leave</p>
              <p className="text-2xl font-bold text-blue-600">
                {leaveBalance.annual} days
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Sick Leave</p>
              <p className="text-2xl font-bold text-blue-600">
                {leaveBalance.sick} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Type */}
      <div>
        <Label htmlFor="leaveType">
          Leave Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedLeaveType}
          onValueChange={(value) => setValue('leaveType', value as any)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">Annual Leave</SelectItem>
            <SelectItem value="sick">Sick Leave</SelectItem>
            <SelectItem value="emergency">Emergency Leave</SelectItem>
            <SelectItem value="unpaid">Unpaid Leave</SelectItem>
            <SelectItem value="maternity">Maternity Leave</SelectItem>
            <SelectItem value="paternity">Paternity Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Start Date */}
        <div>
          <Label htmlFor="startDate">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="startDate"
              type="date"
              {...register('startDate')}
              min={new Date().toISOString().split('T')[0]}
              className="pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.startDate.message}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <Label htmlFor="endDate">
            End Date <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="endDate"
              type="date"
              {...register('endDate')}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Working Days Calculation */}
      {workingDays > 0 && (
        <Card
          className={`${
            exceedsBalance()
              ? 'bg-red-50 border-red-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    exceedsBalance() ? 'text-red-900' : 'text-green-900'
                  }`}
                >
                  Total Working Days
                </p>
                <p
                  className={`text-2xl font-bold ${
                    exceedsBalance() ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {workingDays} days
                </p>
              </div>
              {exceedsBalance() && (
                <div className="rounded-full bg-red-100 p-2">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
            </div>
            {exceedsBalance() && (
              <p className="mt-2 text-sm text-red-700">
                ⚠️ Exceeds your available balance!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reason */}
      <div>
        <Label htmlFor="reason">
          Reason <span className="text-red-500">*</span>
        </Label>
        <textarea
          id="reason"
          {...register('reason')}
          placeholder="Please provide a detailed reason for your leave request..."
          className="mt-1 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={4}
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || exceedsBalance()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </form>
  )
}