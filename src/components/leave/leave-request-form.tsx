// src/components/leave/leave-request-form.tsx
// COMPLETE ENHANCED - All Features Included

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
import { useToast } from '@/src/hooks/use-toast'
import { Loader2, FileText, Info, Calendar, Clock, User } from 'lucide-react'
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
} from '@/src/lib/leave-types'

interface Employee {
  id: string
  name: string
}

export function LeaveRequestForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])

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

  const [errors, setErrors] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    reason: '',
    attachment: '',
    delegateTo: '',
  })

  // Get selected leave type config
  const selectedLeaveType = formData.leaveType
    ? getLeaveType(formData.leaveType)
    : null

  // Auto-calculate end date for special leaves
  useEffect(() => {
    if (
      selectedLeaveType &&
      shouldAutoCalculate(selectedLeaveType.id) &&
      formData.startDate
    ) {
      const start = new Date(formData.startDate)
      const days = getAutoDays(selectedLeaveType.id)!
      const excludeWeekend = shouldExcludeWeekends(selectedLeaveType.id)

      const end = calculateEndDate(start, days, excludeWeekend)

      setFormData((prev) => ({
        ...prev,
        endDate: end.toISOString().split('T')[0],
      }))
    }
  }, [formData.startDate, selectedLeaveType])

  // Fetch employees for delegation
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees/list')
        if (response.ok) {
          const data = await response.json()
          setEmployees(
            data.employees?.map((e: any) => ({
              id: e.id,
              name: `${e.firstName} ${e.lastName}`,
            })) || []
          )
        }
      } catch (error) {
        console.error('Failed to fetch employees:', error)
      }
    }

    if (selectedLeaveType && requiresDelegation(selectedLeaveType.id)) {
      fetchEmployees()
    }
  }, [selectedLeaveType])

  // Calculate days
  const calculateDays = (): number => {
    if (!formData.startDate || !formData.endDate) return 0

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (selectedLeaveType && shouldExcludeWeekends(selectedLeaveType.id)) {
      return calculateWorkingDays(start, end)
    }

    // Include all days
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  // Calculate hours for OOO
  const calculateHours = (): number => {
    if (!formData.startTime || !formData.endTime) return 0

    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    return (endMinutes - startMinutes) / 60
  }

  const requestedDays = calculateDays()
  const totalHours = calculateHours()

  const validate = () => {
    const newErrors = {
      leaveType: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      reason: '',
      attachment: '',
      delegateTo: '',
    }
    let isValid = true

    // Leave type
    if (!formData.leaveType) {
      newErrors.leaveType = 'Pilih jenis cuti'
      isValid = false
    }

    // Start date
    if (!formData.startDate) {
      newErrors.startDate = 'Tanggal mulai wajib diisi'
      isValid = false
    }

    // End date
    if (!formData.endDate) {
      newErrors.endDate = 'Tanggal selesai wajib diisi'
      isValid = false
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai'
        isValid = false
      }

      // Check max days
      if (selectedLeaveType?.maxDays !== null && selectedLeaveType?.maxDays) {
        if (requestedDays > selectedLeaveType.maxDays) {
          newErrors.leaveType = `Maksimal ${selectedLeaveType.maxDays} hari untuk ${selectedLeaveType.name}`
          isValid = false
        }
      }
    }

    // Time validation for OOO
    if (selectedLeaveType && requiresTimeInput(selectedLeaveType.id)) {
      if (!formData.startTime) {
        newErrors.startTime = 'Jam mulai wajib diisi'
        isValid = false
      }
      if (!formData.endTime) {
        newErrors.endTime = 'Jam selesai wajib diisi'
        isValid = false
      }
      if (formData.startTime && formData.endTime) {
        if (formData.endTime <= formData.startTime) {
          newErrors.endTime = 'Jam selesai harus setelah jam mulai'
          isValid = false
        }
      }
    }

    // Reason
    if (!formData.reason.trim()) {
      newErrors.reason = 'Alasan wajib diisi'
      isValid = false
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Alasan minimal 10 karakter'
      isValid = false
    }

    // Document requirement
    if (selectedLeaveType?.requiresDocument && !formData.attachment) {
      newErrors.attachment = `Dokumen pendukung diperlukan untuk ${selectedLeaveType.name}`
      isValid = false
    }

    // Delegation requirement
    if (selectedLeaveType && requiresDelegation(selectedLeaveType.id)) {
      if (!formData.delegateTo) {
        newErrors.delegateTo = 'Delegasi wajib diisi'
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File terlalu besar',
          description: 'Maksimal ukuran file 5MB',
          variant: 'destructive',
        })
        return
      }
      setFormData((prev) => ({ ...prev, attachment: file }))
      setErrors((prev) => ({ ...prev, attachment: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast({
        title: 'Validasi Gagal',
        description: 'Mohon periksa semua field',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('leaveType', formData.leaveType)
      submitData.append('startDate', formData.startDate)
      submitData.append('endDate', formData.endDate)
      submitData.append('reason', formData.reason)

      // Add time if OOO
      if (selectedLeaveType && requiresTimeInput(selectedLeaveType.id)) {
        submitData.append('startTime', formData.startTime)
        submitData.append('endTime', formData.endTime)
        submitData.append('totalHours', totalHours.toString())
      }

      // Add delegation
      if (selectedLeaveType && requiresDelegation(selectedLeaveType.id)) {
        submitData.append('delegateTo', formData.delegateTo)
        if (formData.delegateNotes) {
          submitData.append('delegateNotes', formData.delegateNotes)
        }
      }

      // Add attachment
      if (formData.attachment) {
        submitData.append('attachment', formData.attachment)
      }

      const response = await fetch('/api/leave/request', {
        method: 'POST',
        body: submitData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengajukan cuti')
      }

      toast({
        title: 'Berhasil',
        description: 'Pengajuan cuti berhasil dikirim',
      })

      router.push('/leave')
      router.refresh()
    } catch (error: any) {
      console.error('Submit leave error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengajukan cuti',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Group leave types
  const annualLeaves = INDONESIAN_LEAVE_TYPES.filter((t) => t.category === 'annual')
  const healthLeaves = INDONESIAN_LEAVE_TYPES.filter((t) => t.category === 'health')
  const maternityLeaves = INDONESIAN_LEAVE_TYPES.filter((t) => t.category === 'maternity')
  const specialLeaves = INDONESIAN_LEAVE_TYPES.filter((t) => t.category === 'special')
  const workLeaves = INDONESIAN_LEAVE_TYPES.filter((t) => t.category === 'work')
  const unpaidLeaves = INDONESIAN_LEAVE_TYPES.filter((t) => t.category === 'unpaid')

  const isAutoCalculated = selectedLeaveType && shouldAutoCalculate(selectedLeaveType.id)
  const needsTime = selectedLeaveType && requiresTimeInput(selectedLeaveType.id)
  const needsDelegation = selectedLeaveType && requiresDelegation(selectedLeaveType.id)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="leaveType">
          Jenis Cuti <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.leaveType}
          onValueChange={(value) => handleSelectChange('leaveType', value)}
          disabled={isLoading}
        >
          <SelectTrigger className={errors.leaveType ? 'border-red-500' : ''}>
            <SelectValue placeholder="Pilih jenis cuti" />
          </SelectTrigger>
          <SelectContent>
            {/* Annual */}
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI TAHUNAN
              </SelectLabel>
              {annualLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <span>{leave.icon}</span>
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        {leave.maxDays ? `${leave.maxDays} hari/tahun` : 'Tidak terbatas'}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            {/* Health */}
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI KESEHATAN
              </SelectLabel>
              {healthLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <span>{leave.icon}</span>
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        Tidak terbatas • Perlu surat dokter
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            {/* Maternity */}
            {maternityLeaves.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-gray-500">
                  CUTI MELAHIRKAN
                </SelectLabel>
                {maternityLeaves.map((leave) => (
                  <SelectItem key={leave.id} value={leave.id}>
                    <div className="flex items-center gap-2">
                      <span>{leave.icon}</span>
                      <div>
                        <div className="font-medium">{leave.name}</div>
                        <div className="text-xs text-gray-500">
                          {leave.maxDays} hari • Auto-calculate
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

            {/* Special */}
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI KHUSUS
              </SelectLabel>
              {specialLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <span>{leave.icon}</span>
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        {leave.maxDays} hari
                        {leave.autoCalculateDays && ' • Auto'}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            {/* Work */}
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                PENGATURAN KERJA
              </SelectLabel>
              {workLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <span>{leave.icon}</span>
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        {leave.requiresTime ? 'Dengan jam' : 'Sesuai kebutuhan'}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            {/* Unpaid */}
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI TIDAK BERBAYAR
              </SelectLabel>
              {unpaidLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <span>{leave.icon}</span>
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-red-600">Tidak dibayar</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.leaveType && (
          <p className="text-sm text-red-600">{errors.leaveType}</p>
        )}
      </div>

      {/* Leave Type Info Card */}
      {selectedLeaveType && (
        <div
          className={`rounded-lg p-4 border ${
            selectedLeaveType.isPaid
              ? 'bg-blue-50 border-blue-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{selectedLeaveType.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLeaveType.description}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <div>
                  <span className="text-gray-600">Durasi: </span>
                  <span className="font-medium">
                    {selectedLeaveType.maxDays
                      ? `${selectedLeaveType.maxDays} hari`
                      : 'Tidak terbatas'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status: </span>
                  <span
                    className={`font-medium ${
                      selectedLeaveType.isPaid ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {selectedLeaveType.isPaid ? 'Berbayar' : 'Tidak berbayar'}
                  </span>
                </div>
                {selectedLeaveType.requiresDocument && (
                  <div>
                    <span className="text-red-600 font-medium">
                      ⚠️ Perlu dokumen pendukung
                    </span>
                  </div>
                )}
                {isAutoCalculated && (
                  <div>
                    <span className="text-blue-600 font-medium">
                      🤖 Tanggal otomatis
                    </span>
                  </div>
                )}
                {needsTime && (
                  <div>
                    <span className="text-purple-600 font-medium">
                      ⏰ Perlu jam
                    </span>
                  </div>
                )}
                {needsDelegation && (
                  <div>
                    <span className="text-orange-600 font-medium">
                      👤 Perlu delegasi
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range */}
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
          {errors.startDate && (
            <p className="text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">
            Tanggal Selesai <span className="text-red-500">*</span>
            {isAutoCalculated && (
              <span className="text-xs text-blue-600 ml-2">(Otomatis)</span>
            )}
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              disabled={isLoading || isAutoCalculated}
              className={`pl-10 ${errors.endDate ? 'border-red-500' : ''} ${
                isAutoCalculated ? 'bg-gray-100' : ''
              }`}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
          {errors.endDate && (
            <p className="text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Time Inputs (for Out of Office) */}
      {needsTime && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">
              Jam Mulai <span className="text-red-500">*</span>
            </Label>
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
            {errors.startTime && (
              <p className="text-sm text-red-600">{errors.startTime}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">
              Jam Selesai <span className="text-red-500">*</span>
            </Label>
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
            {errors.endTime && (
              <p className="text-sm text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>
      )}

      {/* Days/Hours Summary */}
      {(requestedDays > 0 || totalHours > 0) && (
        <div className="rounded-lg bg-gray-50 p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Durasi Pengajuan</p>
              <p className="text-2xl font-bold text-gray-900">
                {needsTime
                  ? `${totalHours.toFixed(1)} jam`
                  : `${requestedDays} hari${
                      selectedLeaveType?.excludeWeekends ? ' kerja' : ''
                    }`}
              </p>
            </div>
            {selectedLeaveType?.maxDays && !needsTime && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Maksimal Durasi</p>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedLeaveType.maxDays} hari
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delegation Section */}
      {needsDelegation && (
        <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Delegasi Tugas</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delegateTo">
              Delegasikan kepada <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.delegateTo}
              onValueChange={(value) => handleSelectChange('delegateTo', value)}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.delegateTo ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih karyawan" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.delegateTo && (
              <p className="text-sm text-red-600">{errors.delegateTo}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delegateNotes">
              Catatan untuk yang didelegasi (Opsional)
            </Label>
            <Textarea
              id="delegateNotes"
              name="delegateNotes"
              rows={2}
              value={formData.delegateNotes}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Contoh: Tolong handle meeting dengan client pada tanggal..."
            />
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">
          Alasan <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          value={formData.reason}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.reason ? 'border-red-500' : ''}
          placeholder="Jelaskan alasan pengajuan cuti..."
        />
        {errors.reason && (
          <p className="text-sm text-red-600">{errors.reason}</p>
        )}
        <p className="text-xs text-gray-500">
          {formData.reason.length} karakter (minimal 10)
        </p>
      </div>

      {/* Attachment */}
      <div className="space-y-2">
        <Label htmlFor="attachment">
          Dokumen Pendukung{' '}
          {selectedLeaveType?.requiresDocument ? (
            <span className="text-red-500">*</span>
          ) : (
            <span className="text-gray-500">(Opsional)</span>
          )}
        </Label>
        {selectedLeaveType?.requiresDocument && (
          <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
            ⚠️ {selectedLeaveType.name} memerlukan dokumen pendukung (surat dokter,
            undangan, surat kematian, dll)
          </p>
        )}
        <Input
          id="attachment"
          name="attachment"
          type="file"
          onChange={handleFileChange}
          disabled={isLoading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {formData.attachment && (
          <p className="text-sm text-green-600 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {formData.attachment.name} (
            {(formData.attachment.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {errors.attachment && (
          <p className="text-sm text-red-600">{errors.attachment}</p>
        )}
        <p className="text-xs text-gray-500">
          Format: PDF, JPG, PNG, DOC, DOCX (Maks 5MB)
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Mengirim...' : 'Ajukan Cuti'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/leave')}
          disabled={isLoading}
          size="lg"
        >
          Batal
        </Button>
      </div>
    </form>
  )
}