'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/src/components/ui/label'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Loader2 } from 'lucide-react'

interface GeneralSettingsProps {
  organizationId: string
  organizationName: string
}

export function GeneralSettings({ organizationId, organizationName }: GeneralSettingsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            value={organizationName}
            disabled
            className="mt-1 bg-gray-50"
          />
          <p className="mt-1 text-xs text-gray-500">
            Contact support to change organization name
          </p>
        </div>

        <div>
          <Label htmlFor="orgId">Organization ID</Label>
          <Input
            id="orgId"
            value={organizationId}
            disabled
            className="mt-1 bg-gray-50"
          />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900 font-medium">ℹ️ Information</p>
        <p className="mt-1 text-sm text-blue-700">
          General organization settings are managed by administrators. Contact your system administrator for changes.
        </p>
      </div>
    </div>
  )
}