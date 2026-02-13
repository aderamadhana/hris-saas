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

const workHoursSchema = z.object({
  workStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  workEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
})

type WorkHoursFormData = z.infer<typeof workHoursSchema>

interface WorkHoursSettingsProps {
  settings: {
    id: string
    workStartTime: string
    workEndTime: string
  }
}

export function WorkHoursSettings({ settings }: WorkHoursSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkHoursFormData>({
    resolver: zodResolver(workHoursSchema),
    defaultValues: {
      workStartTime: settings.workStartTime,
      workEndTime: settings.workEndTime,
    },
  })

  const onSubmit = async (data: WorkHoursFormData) => {
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
        {/* Work Start Time */}
        <div>
          <Label htmlFor="workStartTime">Work Start Time</Label>
          <Input
            id="workStartTime"
            type="time"
            {...register('workStartTime')}
            className="mt-1"
          />
          {errors.workStartTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.workStartTime.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Default check-in time (24-hour format)
          </p>
        </div>

        {/* Work End Time */}
        <div>
          <Label htmlFor="workEndTime">Work End Time</Label>
          <Input
            id="workEndTime"
            type="time"
            {...register('workEndTime')}
            className="mt-1"
          />
          {errors.workEndTime && (
            <p className="mt-1 text-sm text-red-600">
              {errors.workEndTime.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Default check-out time (24-hour format)
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900 font-medium">ℹ️ Information</p>
        <p className="mt-1 text-sm text-blue-700">
          Work hours are used to calculate attendance status. Employees checking in after start time
          will be marked as late.
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