// src/components/employees/employee-form.tsx
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

// Validation schema
const employeeSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  position: z.string().min(2, 'Position is required'),
  departmentId: z.string().optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'intern']),
  baseSalary: z.string().min(1, 'Salary is required'),
  status: z.enum(['active', 'inactive']),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

interface Department {
  id: string
  name: string
}

interface EmployeeFormProps {
  departments: Department[]
  organizationId: string
  initialData?: Partial<EmployeeFormData> & { id?: string }
  isEdit?: boolean
}

export function EmployeeForm({
  departments,
  organizationId,
  initialData,
  isEdit = false,
}: EmployeeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phoneNumber: initialData?.phoneNumber || '',
      position: initialData?.position || '',
      departmentId: initialData?.departmentId || '',
      employmentType: initialData?.employmentType || 'full-time',
      baseSalary: initialData?.baseSalary || '',
      status: initialData?.status || 'active',
    },
  })

  const selectedDepartment = watch('departmentId')
  const selectedEmploymentType = watch('employmentType')
  const selectedStatus = watch('status')

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = isEdit
        ? `/api/employees/${initialData?.id}`
        : '/api/employees'

      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationId,
          baseSalary: parseFloat(data.baseSalary),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save employee')
      }

      // Success - redirect to employees list
      router.push('/employees')
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
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* First Name */}
          <div>
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="John"
              className="mt-1"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Doe"
              className="mt-1"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john.doe@company.com"
              className="mt-1"
              disabled={isEdit} // Email tidak bisa diubah saat edit
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber')}
              placeholder="+62 812 3456 7890"
              className="mt-1"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Employment Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Position */}
          <div>
            <Label htmlFor="position">
              Position <span className="text-red-500">*</span>
            </Label>
            <Input
              id="position"
              {...register('position')}
              placeholder="Software Engineer"
              className="mt-1"
            />
            {errors.position && (
              <p className="mt-1 text-sm text-red-600">
                {errors.position.message}
              </p>
            )}
          </div>

          {/* Department */}
          <div>
            <Label htmlFor="departmentId">Department</Label>
            {/* <Select
              value={selectedDepartment}
              onValueChange={(value) => setValue('departmentId', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Department</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            <Select
              value={selectedDepartment}
              onValueChange={(value) => setValue('departmentId', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Department</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Employment Type */}
          <div>
            <Label htmlFor="employmentType">
              Employment Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedEmploymentType}
              onValueChange={(value) =>
                setValue('employmentType', value as any)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full Time</SelectItem>
                <SelectItem value="part-time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Salary Information */}
      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold">Salary Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Base Salary */}
          <div>
            <Label htmlFor="baseSalary">
              Base Salary (IDR) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="baseSalary"
              type="number"
              {...register('baseSalary')}
              placeholder="5000000"
              className="mt-1"
            />
            {errors.baseSalary && (
              <p className="mt-1 text-sm text-red-600">
                {errors.baseSalary.message}
              </p>
            )}
          </div>
        </div>
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
            'Update Employee'
          ) : (
            'Create Employee'
          )}
        </Button>
      </div>
    </form>
  )
}