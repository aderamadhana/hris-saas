// src/components/leave/leave-page-client.tsx
'use client'

import { useState } from 'react'
import { LeaveList } from '@/src/components/leave/leave-list'
import { LeaveApprovalList } from '@/src/components/leave/leave-approval-list'

interface Props {
  canApprove: boolean
}

export function LeavePageClient({ canApprove }: Props) {
  const [activeTab, setActiveTab] = useState<'mine' | 'approvals'>('mine')

  return (
    <div className="space-y-4">
      {/* Tabs — hanya tampil jika user bisa approve */}
      {canApprove && (
        <div className="flex gap-1 rounded-lg border bg-gray-50 p-1 w-fit">
          <button
            onClick={() => setActiveTab('mine')}
            className={`rounded px-5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'mine'
                ? 'bg-white text-gray-900 shadow-sm border'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pengajuan Saya
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`rounded px-5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'approvals'
                ? 'bg-white text-gray-900 shadow-sm border'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Perlu Disetujui
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === 'mine' ? <LeaveList /> : <LeaveApprovalList />}
    </div>
  )
}