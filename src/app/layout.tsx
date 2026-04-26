// src/app/layout.tsx — root layout dengan branding ARSADAYA

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ARSADAYA — Energi untuk SDM Anda',
    template: '%s | ARSADAYA',
  },
  description:
    'Platform HRIS terpadu: kelola karyawan, kehadiran, cuti, dan penggajian dalam satu sistem yang mudah digunakan.',
  keywords: ['HRIS', 'HR', 'SDM', 'payroll', 'absensi', 'cuti', 'manajemen karyawan', 'ARSADAYA'],
  authors: [{ name: 'ARSADAYA' }],
  creator: 'ARSADAYA',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'ARSADAYA',
    title: 'ARSADAYA — Energi untuk SDM Anda',
    description: 'Platform HRIS terpadu untuk mengelola SDM perusahaan Anda.',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/arsadaya-icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A5140',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  )
}