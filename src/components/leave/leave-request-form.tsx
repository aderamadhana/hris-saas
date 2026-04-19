// src/components/leave/leave-request-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import {
  Loader2,
  FileText,
  Info,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import {
  INDONESIAN_LEAVE_TYPES,
  getLeaveType,
  calculateWorkingDays,
  calculateEndDate,
  shouldAutoCalculate,
  getAutoDays,
  requiresTimeInput,
  shouldExcludeWeekends,
  requiresDelegation,
  getStatusLabel,
} from '@/src/lib/leave-types'

interface Employee {
  id: string
  name: string
}

interface LeaveBalance {
  annual: number
  sick: number
}

export function LeaveRequestForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    attachment: null as File | null,
    delegateTo: '',
    delegateNotes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedLeaveType = formData.leaveType ? getLeaveType(formData.leaveType) : null
  const isAutoCalculated = selectedLeaveType ? shouldAutoCalculate(selectedLeaveType.id) : false
  const needsTime = selectedLeaveType ? requiresTimeInput(selectedLeaveType.id) : false
  const needsDelegation = selectedLeaveType ? requiresDelegation(selectedLeaveType.id) : false

  // Fetch leave balance
  useEffect(() => {
    fetch('/api/leave/balance')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBalance({
            annual: data.balance.annual,
            sick: data.balance.sick,
          })
        }
      })
      .catch(() => {})
  }, [])

  // Auto-calculate end date for special leaves
  useEffect(() => {
    if (isAutoCalculated && formData.startDate && selectedLeaveType) {
      const autoDays = getAutoDays(selectedLeaveType.id)!
      const start = new Date(formData.startDate)
      const end = calculateEndDate(start, autoDays, shouldExcludeWeekends(selectedLeaveType.id))
      setFormData((prev) => ({ ...prev, endDate: end.toISOString().split('T')[0] }))
    }
  }, [formData.startDate, formData.leaveType])

  // Fetch employees for delegation
  useEffect(() => {
    if (!needsDelegation) return
    fetch('/api/employees/list')
      .then((r) => r.json())
      .then((data) => {
        const list = (data.employees ?? data.data ?? []).map((e: any) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
        }))
        setEmployees(list)
      })
      .catch(() => {})
  }, [needsDelegation])

  // Calculate days
  const calculateDays = (): number => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    if (selectedLeaveType && shouldExcludeWeekends(selectedLeaveType.id)) {
      return calculateWorkingDays(start, end)
    }
    const diff = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  // Calculate hours for OOO
  const calculateHours = (): number => {
    if (!formData.startTime || !formData.endTime) return 0
    const [sh, sm] = formData.startTime.split(':').map(Number)
    const [eh, em] = formData.endTime.split(':').map(Number)
    return (eh * 60 + em - (sh * 60 + sm)) / 60
  }

  const requestedDays = calculateDays()
  const totalHours = calculateHours()

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.leaveType) newErrors.leaveType = 'Pilih jenis cuti'
    if (!formData.startDate) newErrors.startDate = 'Tanggal mulai wajib diisi'
    if (!formData.endDate) newErrors.endDate = 'Tanggal selesai wajib diisi'

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai'
      }
      if (selectedLeaveType?.maxDays && requestedDays > selectedLeaveType.maxDays) {
        newErrors.leaveType = `Maksimal ${selectedLeaveType.maxDays} hari untuk ${selectedLeaveType.name}`
      }
    }

    if (needsTime) {
      if (!formData.startTime) newErrors.startTime = 'Jam mulai wajib diisi'
      if (!formData.endTime) newErrors.endTime = 'Jam selesai wajib diisi'
      if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
        newErrors.endTime = 'Jam selesai harus setelah jam mulai'
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Alasan wajib diisi'
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Alasan minimal 10 karakter'
    }

    if (selectedLeaveType?.requiresDocument && !formData.attachment) {
      newErrors.attachment = `Dokumen pendukung wajib untuk ${selectedLeaveType.name}`
    }

    if (needsDelegation && !formData.delegateTo) {
      newErrors.delegateTo = 'Delegasi wajib diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value, endDate: name === 'leaveType' ? '' : prev.endDate }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, attachment: 'Maksimal ukuran file 5MB' }))
      return
    }
    setFormData((prev) => ({ ...prev, attachment: file }))
    setErrors((prev) => ({ ...prev, attachment: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      const submitData = new FormData()
      submitData.append('leaveType', formData.leaveType)
      submitData.append('startDate', formData.startDate)
      submitData.append('endDate', formData.endDate)
      submitData.append('reason', formData.reason)

      if (needsTime) {
        submitData.append('startTime', formData.startTime)
        submitData.append('endTime', formData.endTime)
        submitData.append('totalHours', totalHours.toString())
      }
      if (needsDelegation && formData.delegateTo) {
        submitData.append('delegateTo', formData.delegateTo)
        if (formData.delegateNotes) submitData.append('delegateNotes', formData.delegateNotes)
      }
      if (formData.attachment) submitData.append('attachment', formData.attachment)

      const res = await fetch('/api/leave/request', { method: 'POST', body: submitData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal mengajukan cuti')

      setSubmitSuccess(true)
      setTimeout(() => router.push('/leave'), 1500)
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal mengajukan cuti')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Pengajuan Berhasil Dikirim</h3>
        <p className="text-sm text-gray-500 mt-1">Mengarahkan ke daftar cuti...</p>
      </div>
    )
  }

  // Group leave types by category
  const byCategory = (cat: string) => INDONESIAN_LEAVE_TYPES.filter((t) => t.category === cat)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global error */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Leave balance */}
      {balance && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Sisa Cuti Tahunan</p>
            <p className="text-xl font-bold text-gray-900">{balance.annual} hari</p>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Cuti Sakit</p>
            <p className="text-xl font-bold text-gray-900">Tidak terbatas</p>
          </div>
        </div>
      )}

      {/* Leave type */}
      <div className="space-y-2">
        <Label>Jenis Cuti <span className="text-red-500">*</span></Label>
        <Select
          value={formData.leaveType}
          onValueChange={(v) => handleSelectChange('leaveType', v)}
          disabled={isLoading}
        >
          <SelectTrigger className={errors.leaveType ? 'border-red-500' : ''}>
            <SelectValue placeholder="Pilih jenis cuti" />
          </SelectTrigger>
          <SelectContent>
            {[
              { label: 'CUTI TAHUNAN', cat: 'annual' },
              { label: 'CUTI KESEHATAN', cat: 'health' },
              { label: 'CUTI MELAHIRKAN', cat: 'maternity' },
              { label: 'CUTI KHUSUS', cat: 'special' },
              { label: 'PENGATURAN KERJA', cat: 'work' },
              { label: 'CUTI TIDAK BERBAYAR', cat: 'unpaid' },
            ].map(({ label, cat }) => {
              const items = byCategory(cat)
              if (!items.length) return null
              return (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label}
                  </SelectLabel>
                  {items.map((leave) => (
                    <SelectItem key={leave.id} value={leave.id}>
                      <span className="font-medium">{leave.name}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {leave.maxDays ? `${leave.maxDays} hari` : 'Tidak terbatas'}
                        {!leave.isPaid ? ' · Tidak berbayar' : ''}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            })}
          </SelectContent>
        </Select>
        {errors.leaveType && <p className="text-sm text-red-600">{errors.leaveType}</p>}
      </div>

      {/* Info card */}
      {selectedLeaveType && (
        <div className={`rounded-lg border p-4 ${selectedLeaveType.isPaid ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{selectedLeaveType.name}</p>
              <p className="text-sm text-gray-600 mt-1">{selectedLeaveType.description}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <span className="rounded bg-white px-2 py-1 border">
                  {selectedLeaveType.maxDays ? `Maks ${selectedLeaveType.maxDays} hari` : 'Tidak terbatas'}
                </span>
                <span className={`rounded px-2 py-1 border ${selectedLeaveType.isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {selectedLeaveType.isPaid ? 'Berbayar' : 'Tidak berbayar'}
                </span>
                {selectedLeaveType.requiresDocument && (
                  <span className="rounded bg-yellow-50 px-2 py-1 border border-yellow-200 text-yellow-700">
                    Perlu dokumen
                  </span>
                )}
                {isAutoCalculated && (
                  <span className="rounded bg-purple-50 px-2 py-1 border border-purple-200 text-purple-700">
                    Tanggal otomatis
                  </span>
                )}
                {needsTime && (
                  <span className="rounded bg-indigo-50 px-2 py-1 border border-indigo-200 text-indigo-700">
                    Perlu jam
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Tanggal Mulai <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              disabled={isLoading}
              className={`pl-10 ${errors.startDate ? 'border-red-500' : ''}`}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">
            Tanggal Selesai <span className="text-red-500">*</span>
            {isAutoCalculated && <span className="ml-2 text-xs text-blue-600">(Otomatis)</span>}
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              disabled={isLoading || !!isAutoCalculated}
              className={`pl-10 ${errors.endDate ? 'border-red-500' : ''} ${isAutoCalculated ? 'bg-gray-100' : ''}`}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
          {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      {/* Time (Out of Office) */}
      {needsTime && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">Jam Mulai <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                disabled={isLoading}
                className={`pl-10 ${errors.startTime ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.startTime && <p className="text-sm text-red-600">{errors.startTime}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Jam Selesai <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                disabled={isLoading}
                className={`pl-10 ${errors.endTime ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.endTime && <p className="text-sm text-red-600">{errors.endTime}</p>}
          </div>
        </div>
      )}

      {/* Duration summary */}
      {(requestedDays > 0 || totalHours > 0) && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Durasi Pengajuan</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {needsTime
              ? `${totalHours.toFixed(1)} jam`
              : `${requestedDays} hari${selectedLeaveType?.excludeWeekends ? ' kerja' : ''}`}
          </p>
        </div>
      )}

      {/* Delegation */}
      {needsDelegation && (
        <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Delegasi Tugas</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delegateTo">Delegasikan kepada <span className="text-red-500">*</span></Label>
            <Select
              value={formData.delegateTo}
              onValueChange={(v) => handleSelectChange('delegateTo', v)}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.delegateTo ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih karyawan" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.delegateTo && <p className="text-sm text-red-600">{errors.delegateTo}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="delegateNotes">Catatan untuk yang didelegasi (Opsional)</Label>
            <Textarea
              id="delegateNotes"
              name="delegateNotes"
              rows={2}
              value={formData.delegateNotes}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Contoh: Tolong handle meeting dengan client..."
            />
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">Alasan <span className="text-red-500">*</span></Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          value={formData.reason}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.reason ? 'border-red-500' : ''}
          placeholder="Jelaskan alasan pengajuan cuti (minimal 10 karakter)..."
        />
        {errors.reason && <p className="text-sm text-red-600">{errors.reason}</p>}
        <p className="text-xs text-gray-400">{formData.reason.length} karakter</p>
      </div>

      {/* Attachment */}
      <div className="space-y-2">
        <Label htmlFor="attachment">
          Dokumen Pendukung{' '}
          {selectedLeaveType?.requiresDocument
            ? <span className="text-red-500">*</span>
            : <span className="text-gray-400">(Opsional)</span>}
        </Label>
        {selectedLeaveType?.requiresDocument && (
          <div className="flex items-start gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{selectedLeaveType.name} memerlukan dokumen pendukung (surat dokter, surat kematian, undangan, dll.)</span>
          </div>
        )}
        <Input
          id="attachment"
          name="attachment"
          type="file"
          onChange={handleFileChange}
          disabled={isLoading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200"
        />
        {formData.attachment && (
          <p className="flex items-center gap-1.5 text-sm text-green-700">
            <FileText className="h-4 w-4" />
            {formData.attachment.name} ({(formData.attachment.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {errors.attachment && <p className="text-sm text-red-600">{errors.attachment}</p>}
        <p className="text-xs text-gray-400">Format: PDF, JPG, PNG, DOC, DOCX (Maks 5MB)</p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 border-t pt-4">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Mengirim...' : 'Ajukan Cuti'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push('/leave')}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}