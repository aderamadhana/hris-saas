
import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeaveRequestForm } from '@/src/components/leave/leave-request-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewLeavePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/leave"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ajukan Cuti</h1>
        <p className="mt-1 text-sm text-gray-500">
          Isi formulir di bawah untuk mengajukan cuti atau izin
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <LeaveRequestForm />
      </div>
    </div>
  )
}