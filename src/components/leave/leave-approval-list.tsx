// src/components/leave/leave-approval-list.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  FileText,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { getLeaveType, formatLeaveDate } from '@/src/lib/leave-types'

interface ApprovalItem {
  approvalId: string | null
  leaveId: string
  level: number
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  isPaid: boolean
  startTime?: string | null
  endTime?: string | null
  totalHours?: number | null
  delegateNotes?: string | null
  attachmentUrl?: string | null
  requiresApprovalLevels: number
  currentApprovalLevel: number
  employee: {
    name: string
    email: string
    position: string
    department: string
  }
  delegate?: { name: string } | null
  previousApprovals?: {
    level: number
    action: string
    approverName: string
    approverRole: string
    comments?: string
    actionDate: string
  }[]
  source: 'approval_record' | 'hr_queue'
}

export function LeaveApprovalList() {
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // State untuk dialog approve/reject
  const [actionTarget, setActionTarget] = useState<ApprovalItem | null>(null)
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null)
  const [actionComments, setActionComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leave/approvals')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil data')
      setItems(data.approvals ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const openAction = (item: ApprovalItem, type: 'approved' | 'rejected') => {
    setActionTarget(item)
    setActionType(type)
    setActionComments('')
    setActionError('')
  }

  const closeAction = () => {
    setActionTarget(null)
    setActionType(null)
    setActionComments('')
    setActionError('')
  }

  const submitAction = async () => {
    if (!actionTarget || !actionType) return
    if (actionType === 'rejected' && !actionComments.trim()) {
      setActionError('Alasan penolakan wajib diisi')
      return
    }

    setIsSubmitting(true)
    setActionError('')
    try {
      const res = await fetch('/api/leave/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId: actionTarget.leaveId,
          approvalId: actionTarget.approvalId,
          action: actionType,
          comments: actionType === 'approved' ? actionComments : undefined,
          rejectedReason: actionType === 'rejected' ? actionComments : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses')

      closeAction()
      fetchApprovals()
    } catch (err: any) {
      setActionError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOOO = (item: ApprovalItem) => item.leaveType === 'out_of_office'

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Memuat data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchApprovals} className="ml-auto">
          Coba lagi
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <CheckCircle className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-base font-medium text-gray-900">Tidak ada pengajuan yang perlu disetujui</p>
        <p className="text-sm text-gray-500 mt-1">Semua pengajuan sudah diproses</p>
        <button onClick={fetchApprovals} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Header count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{items.length} pengajuan menunggu persetujuan</span>
        <button onClick={fetchApprovals} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {items.map((item) => {
          const typeConfig = getLeaveType(item.leaveType)
          const isExpanded = expandedId === item.leaveId

          return (
            <div key={item.leaveId} className="rounded-lg border bg-white overflow-hidden">
              {/* Card header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.leaveId)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name & type */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{item.employee.name}</span>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-100">
                        {typeConfig?.name ?? item.leaveType}
                      </span>
                      {item.requiresApprovalLevels > 1 && (
                        <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 border border-purple-100">
                          Level {item.level}/{item.requiresApprovalLevels}
                        </span>
                      )}
                      {!item.isPaid && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 border border-red-100">
                          Tidak berbayar
                        </span>
                      )}
                    </div>

                    {/* Position & dept */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-gray-400">
                      <span>{item.employee.position}</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {item.employee.department}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatLeaveDate(item.startDate)}
                        {item.startDate !== item.endDate && <> — {formatLeaveDate(item.endDate)}</>}
                      </span>
                      {isOOO(item) && item.startTime && item.endTime ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {item.startTime} — {item.endTime}
                          {item.totalHours && ` (${item.totalHours.toFixed(1)} jam)`}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-800">{item.days} hari</span>
                      )}
                    </div>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Quick action buttons */}
                <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openAction(item, 'approved')}
                  >
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => openAction(item, 'rejected')}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Tolak
                  </Button>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t bg-gray-50 px-4 py-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Alasan</p>
                    <p className="text-gray-700">{item.reason}</p>
                  </div>

                  {item.delegate && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Delegasi kepada</p>
                      <p className="flex items-center gap-1.5 text-gray-700">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {item.delegate.name}
                      </p>
                      {item.delegateNotes && (
                        <p className="mt-1 pl-5 text-xs text-gray-500">{item.delegateNotes}</p>
                      )}
                    </div>
                  )}

                  {item.attachmentUrl && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Dokumen</p>
                      <a
                        href={item.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> Lihat dokumen
                      </a>
                    </div>
                  )}

                  {/* Previous approvals (for HR queue) */}
                  {item.previousApprovals && item.previousApprovals.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Riwayat persetujuan</p>
                      <div className="space-y-1.5">
                        {item.previousApprovals.map((pa, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="font-medium text-gray-700">{pa.approverName}</span>
                            <span className="text-gray-400">({pa.approverRole})</span>
                            <span className="text-gray-400">— {formatLeaveDate(pa.actionDate)}</span>
                            {pa.comments && <span className="text-gray-500 italic">"{pa.comments}"</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action modal */}
      {actionTarget && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {actionType === 'approved' ? 'Setujui Pengajuan Cuti' : 'Tolak Pengajuan Cuti'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {actionTarget.employee.name} — {getLeaveType(actionTarget.leaveType)?.name ?? actionTarget.leaveType} ({actionTarget.days} hari)
            </p>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {actionType === 'approved' ? 'Catatan (Opsional)' : 'Alasan Penolakan'}
                {actionType === 'rejected' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Textarea
                rows={3}
                value={actionComments}
                onChange={(e) => {
                  setActionComments(e.target.value)
                  if (actionError) setActionError('')
                }}
                placeholder={
                  actionType === 'approved'
                    ? 'Tambahkan catatan jika perlu...'
                    : 'Jelaskan alasan penolakan...'
                }
                className={actionError ? 'border-red-500' : ''}
              />
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <Button variant="outline" onClick={closeAction} disabled={isSubmitting}>
                Batal
              </Button>
              <Button
                onClick={submitAction}
                disabled={isSubmitting}
                className={
                  actionType === 'approved'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }
              >
                {isSubmitting ? (
                  <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                ) : actionType === 'approved' ? (
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                ) : (
                  <XCircle className="mr-1.5 h-4 w-4" />
                )}
                {isSubmitting
                  ? 'Memproses...'
                  : actionType === 'approved'
                  ? 'Setujui'
                  : 'Tolak'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}