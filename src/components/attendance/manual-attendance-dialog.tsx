'use client'

// src/components/attendance/manual-attendance-dialog.tsx
// Dialog for admin/HR to manually input or edit attendance

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ClipboardEdit } from 'lucide-react'
import { format } from 'date-fns'

interface ManualAttendanceDialogProps {
  employeeId: string
  employeeName: string
  date?: string          // default: today
  existingRecord?: {
    checkIn?: string
    checkOut?: string
    status: string
    notes?: string
  } | null
  onSuccess?: () => void
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'Hadir', color: 'text-green-700' },
  { value: 'late', label: 'Terlambat', color: 'text-yellow-700' },
  { value: 'absent', label: 'Tidak Hadir', color: 'text-red-700' },
  { value: 'leave', label: 'Cuti', color: 'text-blue-700' },
  { value: 'holiday', label: 'Libur', color: 'text-gray-700' },
  { value: 'wfh', label: 'WFH', color: 'text-purple-700' },
]

export function ManualAttendanceDialog({
  employeeId,
  employeeName,
  date,
  existingRecord,
  onSuccess,
}: ManualAttendanceDialogProps) {
  const today = date || format(new Date(), 'yyyy-MM-dd')

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    date: today,
    checkIn: existingRecord?.checkIn || '',
    checkOut: existingRecord?.checkOut || '',
    status: existingRecord?.status || 'present',
    notes: existingRecord?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          date: formData.date,
          checkIn: formData.checkIn || null,
          checkOut: formData.checkOut || null,
          status: formData.status,
          notes: formData.notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan absensi')

      setOpen(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const showTimeInputs = ['present', 'late', 'wfh'].includes(formData.status)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <ClipboardEdit className="h-3.5 w-3.5" />
          {existingRecord ? 'Edit' : 'Input Manual'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Input Absensi Manual</DialogTitle>
          <DialogDescription>
            {employeeName} — {format(new Date(formData.date), 'dd MMMM yyyy')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="att-date">Tanggal</Label>
            <Input
              id="att-date"
              type="date"
              value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              max={format(new Date(), 'yyyy-MM-dd')}
              required
              className="mt-1"
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status Kehadiran</Label>
            <Select
              value={formData.status}
              onValueChange={val => setFormData(p => ({ ...p, status: val }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className={opt.color}>{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time inputs — only for attendance statuses */}
          {showTimeInputs && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="att-in">Jam Masuk</Label>
                <Input
                  id="att-in"
                  type="time"
                  value={formData.checkIn}
                  onChange={e => setFormData(p => ({ ...p, checkIn: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="att-out">Jam Keluar</Label>
                <Input
                  id="att-out"
                  type="time"
                  value={formData.checkOut}
                  onChange={e => setFormData(p => ({ ...p, checkOut: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Work hours preview */}
          {showTimeInputs && formData.checkIn && formData.checkOut && (
            <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Total jam kerja:{' '}
              <strong>
                {(() => {
                  const [ih, im] = formData.checkIn.split(':').map(Number)
                  const [oh, om] = formData.checkOut.split(':').map(Number)
                  const mins = (oh * 60 + om) - (ih * 60 + im)
                  if (mins <= 0) return '-'
                  return `${Math.floor(mins / 60)}j ${mins % 60}m`
                })()}
              </strong>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="att-notes">Catatan (opsional)</Label>
            <Input
              id="att-notes"
              placeholder="Alasan perubahan..."
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}