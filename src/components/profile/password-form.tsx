'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

export function PasswordForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Update password via Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (updateError) throw updateError

      setSuccess(true)
      reset()

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
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
          <p className="text-sm text-green-800">
            Password changed successfully! Redirecting...
          </p>
        </div>
      )}

      {/* Current Password */}
      <div>
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative mt-1">
          <Input
            id="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            {...register('currentPassword')}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() =>
              setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPasswords.current ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      {/* New Password */}
      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative mt-1">
          <Input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            {...register('newPassword')}
            placeholder="At least 8 characters"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() =>
              setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPasswords.new ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative mt-1">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="Re-enter new password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() =>
              setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPasswords.confirm ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
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
        <Button type="submit" disabled={isLoading || success}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Changing Password...
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </div>
    </form>
  )
}
