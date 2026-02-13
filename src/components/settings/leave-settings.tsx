'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Loader2 } from 'lucide-react'

const leaveSchema = z.object({
  annualLeaveQuota: z.number().min(0).max(365),
  sickLeaveQuota: z.number().min(0).max(365),
})

type LeaveFormData = z.infer<typeof leaveSchema>

interface LeaveSettingsProps {
  settings: {
    id: string
    annualLeaveQuota: number
    sickLeaveQuota: number
  }
}

export function LeaveSettings({ settings }: LeaveSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      annualLeaveQuota: settings.annualLeaveQuota,
      sickLeaveQuota: settings.sickLeaveQuota,
    },
  })

  const onSubmit = async (data: LeaveFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }

      setSuccess(true)
      router.refresh()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Annual Leave Quota */}
        <div>
          <Label htmlFor="annualLeaveQuota">
            Annual Leave Quota (days/year)
          </Label>
          <Input
            id="annualLeaveQuota"
            type="number"
            {...register('annualLeaveQuota', { valueAsNumber: true })}
            className="mt-1"
          />
          {errors.annualLeaveQuota && (
            <p className="mt-1 text-sm text-red-600">
              {errors.annualLeaveQuota.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Number of paid annual leave days per employee per year
          </p>
        </div>

        {/* Sick Leave Quota */}
        <div>
          <Label htmlFor="sickLeaveQuota">
            Sick Leave Quota (days/year)
          </Label>
          <Input
            id="sickLeaveQuota"
            type="number"
            {...register('sickLeaveQuota', { valueAsNumber: true })}
            className="mt-1"
          />
          {errors.sickLeaveQuota && (
            <p className="mt-1 text-sm text-red-600">
              {errors.sickLeaveQuota.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Number of paid sick leave days per employee per year
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900 font-medium">ℹ️ Information</p>
        <p className="mt-1 text-sm text-blue-700">
          Leave quotas are applied per calendar year (January 1 - December 31).
          Unused leave may or may not carry over depending on your organization's policy.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end border-t pt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}