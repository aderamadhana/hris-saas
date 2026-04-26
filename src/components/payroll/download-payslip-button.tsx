'use client'

// src/components/payroll/download-payslip-button.tsx
// Tombol download yang functional untuk halaman payslip

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  payrollId: string
  employeeName?: string
  month?: number
  year?: number
  variant?: 'button' | 'icon'
  size?: 'sm' | 'md'
}

export function DownloadPayslipButton({
  payrollId,
  employeeName,
  month,
  year,
  variant = 'button',
  size = 'md',
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Buka di tab baru — browser akan render HTML
      // User bisa klik "Cetak PDF" atau Ctrl+P untuk save sebagai PDF
      const url = `/api/payroll/${payrollId}/download`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      // Delay sedikit sebelum set loading false
      setTimeout(() => setLoading(false), 1000)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        title="Download Slip Gaji"
        className={`flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition-colors ${
          size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
        }`}
      >
        {loading ? (
          <Loader2 className={`animate-spin ${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
        ) : (
          <Download className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 transition-colors ${
        size === 'sm'
          ? 'px-3 py-1.5 text-xs'
          : 'px-4 py-2 text-sm'
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? 'Membuka...' : 'Download PDF'}
    </button>
  )
}