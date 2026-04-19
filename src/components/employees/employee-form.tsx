// src/components/employees/employee-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, Info, CheckCircle, AlertTriangle } from 'lucide-react'

interface Department {
  id: string
  name: string
}

interface EmployeeFormProps {
  departments: Department[]
  mode: 'create' | 'edit'
  employee?: any
  currentUserRole: string
}

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee', description: 'Self-service only' },
  { value: 'manager', label: 'Manager', description: 'Approve team leave' },
  { value: 'hr', label: 'HR Manager', description: 'Kelola karyawan & payroll' },
  { value: 'admin', label: 'Administrator', description: 'Full access kecuali billing' },
  { value: 'owner', label: 'Owner', description: 'Full access termasuk billing' },
]

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Kontrak' },
  { value: 'intern', label: 'Magang' },
]

export function EmployeeForm({ departments, mode, employee, currentUserRole }: EmployeeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [formData, setFormData] = useState({
    firstName: employee?.firstName ?? '',
    lastName: employee?.lastName ?? '',
    email: employee?.email ?? '',
    employeeId: employee?.employeeId ?? '',
    phoneNumber: employee?.phoneNumber ?? '',
    position: employee?.position ?? '',
    departmentId: employee?.departmentId ?? 'no-department',
    role: employee?.role ?? 'employee',
    baseSalary: employee?.baseSalary?.toString() ?? '',
    dateOfBirth: employee?.dateOfBirth
      ? new Date(employee.dateOfBirth).toISOString().split('T')[0]
      : '',
    address: employee?.address ?? '',
    joinDate: employee?.joinDate
      ? new Date(employee.joinDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    employmentType: employee?.employmentType ?? 'full-time',
    status: employee?.status ?? 'active',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Role yang bisa di-assign sesuai role user sekarang
  const assignableRoles = ROLE_OPTIONS.filter((r) => {
    if (currentUserRole === 'owner') return true
    if (currentUserRole === 'admin') return r.value !== 'owner'
    if (currentUserRole === 'hr') return ['employee', 'manager'].includes(r.value)
    return r.value === 'employee'
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'Nama depan wajib diisi'
    if (!formData.lastName.trim()) newErrors.lastName = 'Nama belakang wajib diisi'
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }
    if (!formData.employeeId.trim()) newErrors.employeeId = 'ID Karyawan wajib diisi'
    if (!formData.position.trim()) newErrors.position = 'Jabatan wajib diisi'
    if (!formData.baseSalary) {
      newErrors.baseSalary = 'Gaji pokok wajib diisi'
    } else if (isNaN(Number(formData.baseSalary)) || Number(formData.baseSalary) <= 0) {
      newErrors.baseSalary = 'Gaji pokok harus berupa angka positif'
    }
    if (!formData.joinDate) newErrors.joinDate = 'Tanggal bergabung wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSelect = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      const url = mode === 'create' ? '/api/employees' : `/api/employees/${employee.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          departmentId: formData.departmentId === 'no-department' ? null : formData.departmentId,
          baseSalary: Number(formData.baseSalary),
          dateOfBirth: formData.dateOfBirth || null,
          phoneNumber: formData.phoneNumber || null,
          address: formData.address || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Gagal ${mode === 'create' ? 'membuat' : 'mengupdate'} karyawan`)

      setSubmitSuccess(true)
      setTimeout(() => router.push('/dashboard/employees'), 1200)
      router.refresh()
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <p className="text-lg font-semibold text-gray-900">
          Karyawan berhasil {mode === 'create' ? 'ditambahkan' : 'diupdate'}
        </p>
        <p className="text-sm text-gray-500 mt-1">Mengarahkan ke daftar karyawan...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Global error */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* ── Informasi Dasar ─────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Informasi Dasar
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Nama Depan <span className="text-red-500">*</span></Label>
            <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} disabled={isLoading} className={errors.firstName ? 'border-red-500' : ''} />
            {errors.firstName && <p className="text-xs text-red-600">{errors.firstName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nama Belakang <span className="text-red-500">*</span></Label>
            <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} disabled={isLoading} className={errors.lastName ? 'border-red-500' : ''} />
            {errors.lastName && <p className="text-xs text-red-600">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading || mode === 'edit'}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            {mode === 'edit' && <p className="text-xs text-gray-400">Email tidak dapat diubah</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Nomor Telepon</Label>
            <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={isLoading} placeholder="+62 812 3456 7890" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={isLoading} placeholder="Jl. Contoh No. 1, Kota" />
          </div>
        </div>
      </section>

      {/* ── Detail Pekerjaan ─────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Detail Pekerjaan
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">
              ID Karyawan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              disabled={isLoading || mode === 'edit'}
              className={errors.employeeId ? 'border-red-500' : ''}
              placeholder="EMP001"
            />
            {errors.employeeId && <p className="text-xs text-red-600">{errors.employeeId}</p>}
            {mode === 'edit' && <p className="text-xs text-gray-400">ID tidak dapat diubah</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="position">
              Jabatan <span className="text-red-500">*</span>
            </Label>
            <Input id="position" name="position" value={formData.position} onChange={handleChange} disabled={isLoading} className={errors.position ? 'border-red-500' : ''} placeholder="Software Engineer" />
            {errors.position && <p className="text-xs text-red-600">{errors.position}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Departemen</Label>
            <Select value={formData.departmentId} onValueChange={(v) => handleSelect('departmentId', v)} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no-department">Tanpa Departemen</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Role <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.role} onValueChange={(v) => handleSelect('role', v)} disabled={isLoading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <span className="font-medium">{r.label}</span>
                    <span className="ml-2 text-xs text-gray-400">{r.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="flex items-start gap-1 text-xs text-gray-400">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              {currentUserRole === 'owner'
                ? 'Sebagai owner, kamu bisa assign semua role'
                : currentUserRole === 'admin'
                ? 'Sebagai admin, kamu bisa assign semua role kecuali owner'
                : 'Sebagai HR, kamu bisa assign employee atau manager'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="joinDate">
              Tanggal Bergabung <span className="text-red-500">*</span>
            </Label>
            <Input id="joinDate" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} disabled={isLoading} className={errors.joinDate ? 'border-red-500' : ''} />
            {errors.joinDate && <p className="text-xs text-red-600">{errors.joinDate}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tipe Pekerjaan</Label>
            <Select value={formData.employmentType} onValueChange={(v) => handleSelect('employmentType', v)} disabled={isLoading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="baseSalary">
            Gaji Pokok (IDR) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="baseSalary"
            name="baseSalary"
            type="number"
            value={formData.baseSalary}
            onChange={handleChange}
            disabled={isLoading}
            className={errors.baseSalary ? 'border-red-500' : ''}
            placeholder="10000000"
          />
          {errors.baseSalary && <p className="text-xs text-red-600">{errors.baseSalary}</p>}
          <p className="text-xs text-gray-400">
            Masukkan angka tanpa titik/koma (contoh: 10000000 = Rp 10.000.000)
          </p>
        </div>
      </section>

      {/* ── Status (edit mode saja) ─────────────────────────── */}
      {mode === 'edit' && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Status</h3>
          <div className="space-y-1.5">
            <Label>Status Karyawan</Label>
            <Select value={formData.status} onValueChange={(v) => handleSelect('status', v)} disabled={isLoading}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                <SelectItem value="terminated">Diberhentikan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      )}

      {/* ── Tombol ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading
            ? mode === 'create' ? 'Menyimpan...' : 'Mengupdate...'
            : mode === 'create' ? 'Tambah Karyawan' : 'Simpan Perubahan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/employees')}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}