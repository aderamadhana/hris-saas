// src/components/departments/department-form.tsx
// FIXED VERSION - Proper select value handling

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
import { Loader2 } from 'lucide-react'

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  managerId: z.string().optional(),
})

type DepartmentFormData = z.infer<typeof departmentSchema>

interface Manager {
  id: string
  name: string
  position: string
}

interface DepartmentFormProps {
  organizationId: string
  managers: Manager[]
  initialData?: Partial<DepartmentFormData> & { id?: string }
  isEdit?: boolean
}

export function DepartmentForm({
  organizationId,
  managers,
  initialData,
  isEdit = false,
}: DepartmentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      managerId: initialData?.managerId || 'no-manager', // ✅ Use 'no-manager' instead of ''
    },
  })

  const selectedManagerId = watch('managerId')

  const onSubmit = async (data: DepartmentFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = isEdit
        ? `/api/department/${initialData?.id}`
        : '/api/department'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationId,
          // ✅ Convert 'no-manager' to null before sending to API
          managerId: data.managerId === 'no-manager' ? null : data.managerId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save department')
      }

      router.push('/departments')
      router.refresh()
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

      {/* Department Name */}
      <div>
        <Label htmlFor="name">
          Department Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Engineering"
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register('description')}
          placeholder="Brief description of this department..."
          className="mt-1 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Manager Selection */}
      <div>
        <Label htmlFor="managerId">Department Manager</Label>
        <Select
          value={selectedManagerId}
          onValueChange={(value) => setValue('managerId', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a manager (optional)" />
          </SelectTrigger>
          <SelectContent>
            {/* ✅ FIX: Use 'no-manager' instead of empty string */}
            <SelectItem value="no-manager">No Manager</SelectItem>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.name} - {manager.position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-gray-500">
          Only active employees can be assigned as managers
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : isEdit ? (
            'Update Department'
          ) : (
            'Create Department'
          )}
        </Button>
      </div>
    </form>
  )
}