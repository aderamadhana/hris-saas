// src/app/auth/accept-invite/page.tsx
// Page for employees to accept invitation and set password

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    const checkInvitation = async () => {
      // Ambil token dari URL (bukan getUser)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      
      if (accessToken) {
        // Gunakan token untuk mendapatkan info pengguna yang diundang
        const { data: { user }, error } = await supabase.auth.getUser(accessToken)
        
        if (user && !error) {
          setUserInfo({
            email: user.email,
            firstName: user.user_metadata?.first_name,
            lastName: user.user_metadata?.last_name,
            organizationName: user.user_metadata?.organization_name,
          })
        }
      }
    }

    checkInvitation()
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)

  // Validation
  if (password.length < 8) {
    setError('Password must be at least 8 characters')
    return
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match')
    return
  }

  setIsLoading(true)
    try {
      // Ambil token dari URL terlebih dahulu
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')

      if (!accessToken) {
        throw new Error('Invalid invitation link')
      }

      // Update password untuk user yang diundang menggunakan token
      const { error: updateError } = await supabase.auth.updateUser(
        { password: password }
      )

      if (updateError) throw updateError

      // Dapatkan user dengan token dari URL
      const { data: { user }, error: getUserError } = await supabase.auth.getUser(accessToken)

      if (getUserError) throw getUserError

      if (user) {
        const response = await fetch('/api/employees/link-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authId: user.id,
            email: user.email,
            accessToken: accessToken, // Kirim token juga ke server untuk validasi
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to link account')
        }
      }

      setSuccess(true)

      // Redirect ke dashboard setelah 2 detik
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Activated!
            </h2>
            <p className="text-gray-600">
              Your account has been set up successfully.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Welcome to {userInfo?.organizationName || 'HRIS'}
          </CardTitle>
          <p className="text-center text-sm text-gray-600 mt-2">
            Set your password to activate your account
          </p>
        </CardHeader>
        <CardContent>
          {userInfo && (
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Name:</span>{' '}
                {userInfo.firstName} {userInfo.lastName}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Email:</span> {userInfo.email}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 8 characters)"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="mt-1"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating Account...
                </>
              ) : (
                'Activate Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}