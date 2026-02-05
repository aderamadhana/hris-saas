// src/components/attendance/check-in-button.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { LogIn, LogOut, Loader2, Clock } from 'lucide-react'

interface CheckInButtonProps {
  currentAttendance: {
    id: string
    checkIn: string | null
    checkOut: string | null
  } | null
  employeeId: string
  employeeName: string
}

export function CheckInButton({
  currentAttendance,
  employeeId,
  employeeName,
}: CheckInButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasCheckedIn = currentAttendance?.checkIn
  const hasCheckedOut = currentAttendance?.checkOut

  const handleCheckIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to check in')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          attendanceId: currentAttendance?.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to check out')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Show current status
  if (hasCheckedIn && !hasCheckedOut) {
    const checkInTime = new Date(currentAttendance!.checkIn!).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">
                  Checked In at {checkInTime}
                </p>
                <p className="text-xs text-green-700">
                  Welcome, {employeeName}!
                </p>
              </div>
            </div>

            <Button
              onClick={handleCheckOut}
              disabled={isLoading}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Check Out
                </>
              )}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Already checked out
  if (hasCheckedIn && hasCheckedOut) {
    const checkInTime = new Date(currentAttendance!.checkIn!).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const checkOutTime = new Date(currentAttendance!.checkOut!).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-900">
              Already Checked Out Today
            </p>
            <p className="mt-1 text-xs text-blue-700">
              {checkInTime} - {checkOutTime}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Not checked in yet
  return (
    <div>
      <Button
        onClick={handleCheckIn}
        disabled={isLoading}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking In...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Check In
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}