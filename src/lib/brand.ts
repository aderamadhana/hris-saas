// src/lib/brand.ts
// Konfigurasi brand ARSADAYA - ubah di sini untuk update seluruh aplikasi

export const BRAND = {
  name: 'ARSADAYA',
  tagline: 'Energi untuk SDM Anda',
  shortName: 'AD',
  description: 'Platform Human Resource terpadu untuk mengelola dan memberdayakan SDM perusahaan Anda.',

  colors: {
    primary: '#0A5140',       // Hijau tua utama
    primaryHover: '#0D6E56',  // Hijau hover
    primaryLight: '#E8F5F0',  // Latar hijau muda
    accent: '#F5A623',        // Amber / energi
    accentHover: '#D4891A',   // Amber hover
    white: '#FFFFFF',
    text: '#1A1A1A',
    textMuted: '#6B7280',
  },

  meta: {
    title: 'ARSADAYA — Energi untuk SDM Anda',
    titleTemplate: '%s | ARSADAYA',
    description: 'Platform HRIS terpadu: kelola karyawan, kehadiran, cuti, dan penggajian dalam satu sistem.',
    keywords: 'HRIS, HR, SDM, payroll, absensi, cuti, manajemen karyawan',
    locale: 'id_ID',
  },
} as const

export type BrandColors = typeof BRAND.colors