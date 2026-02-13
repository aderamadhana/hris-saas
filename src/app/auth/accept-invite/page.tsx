// src/app/auth/accept-invite/page.tsx
// FIXED - Use correct user from invitation token

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        // Get token from URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (!accessToken) {
          setError('Invalid invitation link. Please request a new invitation.')
          return
        }

        // Save token for later use
        setInvitationToken(accessToken)
        
        // Get user info from token
        const { data: { user: tokenUser }, error } = await supabase.auth.getUser(accessToken)
        
        if (error || !tokenUser) {
          setError('Invalid or expired invitation link.')
          return
        }

        setUserInfo({
          email: tokenUser.email,
          firstName: tokenUser.user_metadata?.first_name,
          lastName: tokenUser.user_metadata?.last_name,
          organizationName: tokenUser.user_metadata?.organization_name,
          userId: tokenUser.id,
        })
      } catch (err) {
        console.error('Error checking invitation:', err)
        setError('Failed to load invitation. Please try again.')
      }
    }

    checkInvitation()
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!userInfo?.email) {
      setError('User information not loaded. Please refresh the page.')
      return
    }

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
      console.log('🔐 Setting password for:', userInfo.email)

      // Step 1: Sign out any existing session first
      await supabase.auth.signOut()

      // Step 2: Exchange token for session (if needed)
      if (invitationToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: invitationToken,
          refresh_token: invitationToken, // Use same token
        })

        if (sessionError) {
          console.error('Session error:', sessionError)
        }
      }

      // Step 3: Update password using the invitation session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('Update password error:', updateError)
        throw updateError
      }

      console.log('✅ Password updated successfully')

      // Step 4: Sign out from invitation session
      await supabase.auth.signOut()

      // Step 5: Sign in with new credentials
      console.log('🔑 Signing in with new password...')
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userInfo.email, // ✅ Use email from userInfo, not from getUser()
        password: password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw new Error(`Failed to sign in: ${signInError.message}`)
      }

      if (!signInData.user) {
        throw new Error('Failed to sign in after password set')
      }

      console.log('✅ Signed in successfully')

      // Step 6: Link auth to employee record
      console.log('🔗 Linking auth to employee...')
      
      const response = await fetch('/api/employees/link-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authId: signInData.user.id,
          email: signInData.user.email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Link auth error:', data)
        throw new Error(data.error || 'Failed to link account')
      }

      console.log('✅ Account linked successfully')

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error('❌ Accept invite error:', err)
      setError(err.message || 'Failed to activate account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking invitation
  if (!userInfo && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
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