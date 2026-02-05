// src/src/components/leave/approve-reject-dialog.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Label } from '@/src/components/ui/label'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface LeaveData {
  id: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
}

interface ApproveRejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leave: LeaveData
  type: 'approve' | 'reject'
}

export function ApproveRejectDialog({
  open,
  onOpenChange,
  leave,
  type,
}: ApproveRejectDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isApprove = type === 'approve'

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/leave/${leave.id}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${type} leave request`)
      }

      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                isApprove ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {isApprove ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <DialogTitle>
                {isApprove ? 'Approve' : 'Reject'} Leave Request
              </DialogTitle>
              <DialogDescription>
                For {leave.employeeName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Leave Details */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Leave Type:</span>
              <span className="font-medium capitalize">{leave.leaveType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">
                {new Date(leave.startDate).toLocaleDateString('id-ID')} -{' '}
                {new Date(leave.endDate).toLocaleDateString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Days:</span>
              <span className="font-medium">{leave.totalDays} days</span>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-600">Reason:</p>
              <p className="text-sm mt-1">{leave.reason}</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">
              Notes {isApprove ? '(Optional)' : '(Required)'}
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isApprove
                  ? 'Add approval notes...'
                  : 'Please provide a reason for rejection...'
              }
              className="mt-1 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              required={!isApprove}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'default' : 'destructive'}
            onClick={handleSubmit}
            disabled={isLoading || (!isApprove && !notes.trim())}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isApprove ? (
              'Approve Request'
            ) : (
              'Reject Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}