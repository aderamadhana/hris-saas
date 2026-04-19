// src/components/employees/employee-table.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { Search, MoreHorizontal, Eye, Edit, Trash2, Mail, CheckCircle, Clock } from 'lucide-react'
import { DeleteEmployeeDialog } from './delete-employee-dialog'

interface EmployeeData {
  id: string
  employeeId: string
  name: string
  email: string
  position: string
  department: string
  role: string
  status: string
  joinDate: string
  hasAuth: boolean
  manager: string | null
}

interface EmployeeTableProps {
  data: EmployeeData[]
  currentUserRole: string
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active:     { label: 'Aktif',         className: 'bg-green-100 text-green-800 border-green-200' },
  inactive:   { label: 'Tidak Aktif',   className: 'bg-gray-100 text-gray-700 border-gray-200' },
  terminated: { label: 'Diberhentikan', className: 'bg-red-100 text-red-800 border-red-200' },
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  owner:    { label: 'Owner',    className: 'bg-red-100 text-red-800 border-red-200' },
  admin:    { label: 'Admin',    className: 'bg-orange-100 text-orange-800 border-orange-200' },
  hr:       { label: 'HR',       className: 'bg-purple-100 text-purple-800 border-purple-200' },
  manager:  { label: 'Manager',  className: 'bg-blue-100 text-blue-800 border-blue-200' },
  employee: { label: 'Employee', className: 'bg-gray-100 text-gray-700 border-gray-200' },
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_BADGE[role] ?? { label: role, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export function EmployeeTable({ data, currentUserRole }: EmployeeTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null)
  const [inviteLoading, setInviteLoading] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  const canEdit   = ['hr', 'admin', 'owner'].includes(currentUserRole)
  const canDelete = ['admin', 'owner'].includes(currentUserRole)
  const canInvite = ['hr', 'admin', 'owner'].includes(currentUserRole)

  const filtered = data.filter((emp) => {
    const q = searchQuery.toLowerCase()
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeId.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q)
    )
  })

  const handleSendInvite = async (emp: EmployeeData) => {
    if (!confirm(`Kirim undangan ke ${emp.email}?`)) return
    setInviteLoading(emp.id)
    setInviteMessage(null)
    try {
      const res = await fetch(`/api/employees/${emp.id}/invite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim undangan')
      setInviteMessage({ id: emp.id, msg: `Undangan dikirim ke ${emp.email}`, ok: true })
      router.refresh()
    } catch (err: any) {
      setInviteMessage({ id: emp.id, msg: err.message, ok: false })
    } finally {
      setInviteLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Cari nama, email, jabatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Invite feedback */}
      {inviteMessage && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          inviteMessage.ok
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {inviteMessage.ok
            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
            : <span className="font-medium">Error:</span>}
          {inviteMessage.msg}
          <button
            onClick={() => setInviteMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold uppercase tracking-wide">ID</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Nama</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Email</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Jabatan</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Departemen</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Role</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Akun</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-gray-400">
                  {searchQuery ? 'Tidak ada karyawan yang cocok' : 'Belum ada karyawan'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm text-gray-500">{emp.employeeId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{emp.name}</p>
                      {emp.manager && (
                        <p className="text-xs text-gray-400 mt-0.5">Manager: {emp.manager}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{emp.email}</TableCell>
                  <TableCell className="text-sm">{emp.position}</TableCell>
                  <TableCell className="text-sm text-gray-600">{emp.department}</TableCell>
                  <TableCell><RoleBadge role={emp.role} /></TableCell>
                  <TableCell><StatusBadge status={emp.status} /></TableCell>
                  <TableCell>
                    {emp.hasAuth ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" /> Belum
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs text-gray-500">Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Detail
                        </DropdownMenuItem>

                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/employees/${emp.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}

                        {canInvite && !emp.hasAuth && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSendInvite(emp)}
                              disabled={inviteLoading === emp.id}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              {inviteLoading === emp.id ? 'Mengirim...' : 'Kirim Undangan'}
                            </DropdownMenuItem>
                          </>
                        )}

                        {canDelete && emp.role !== 'owner' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(emp)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400">
        Menampilkan {filtered.length} dari {data.length} karyawan
      </p>

      {/* Delete dialog */}
      {selectedEmployee && (
        <DeleteEmployeeDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          employee={selectedEmployee}
        />
      )}
    </div>
  )
}