'use client'

// src/app/(auth)/login/page.tsx — Login page dengan branding ARSADAYA

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/button'
import { Input }  from '@/src/components/ui/input'
import { Label }  from '@/src/components/ui/label'
import { LogoIcon } from '@/src/components/ui/logo'

// ── Schema validasi ──────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})
type LoginFormData = z.infer<typeof loginSchema>

// ── Komponen utama ───────────────────────────────────────
export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [showPwd,   setShowPwd]   = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // ── Submit email/password ────────────────────────────
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email, password: data.password,
      })
      if (authError) throw authError
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials'))
        setError('Email atau password salah.')
      else if (err.message?.includes('Email not confirmed'))
        setError('Silakan verifikasi email Anda terlebih dahulu.')
      else
        setError(err.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Login dengan Google ──────────────────────────────
  const handleGoogle = async () => {
    setIsLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setIsLoading(false)
  }

  // ── Render ───────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F4] px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* ── Logo & judul ── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoIcon size={52} />
          <div>
            <h1
              className="text-2xl font-bold tracking-widest"
              style={{ color: '#0A5140', fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              ARSADAYA
            </h1>
            <p className="text-[11px] tracking-[.12em] uppercase text-gray-400 mt-0.5">
              Energi untuk SDM Anda
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali</p>
        </div>

        {/* ── Card form ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">

          {/* Pesan error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-xs font-medium text-gray-600 mb-1 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                {...register('email')}
                className="bg-gray-50/60"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="password" className="text-xs font-medium text-gray-600">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs text-[#0A5140] hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="pr-10 bg-gray-50/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Tombol masuk */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full text-sm font-medium"
              style={{ background: '#0A5140' }}
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses…</>
                : 'Masuk'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">atau</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google login */}
          <button
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {/* Google G icon */}
            <svg className="h-4 w-4" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
            </svg>
            Masuk dengan Google
          </button>
        </div>

        {/* Link daftar */}
        <p className="text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-[#0A5140] hover:underline">
            Daftar sekarang
          </Link>
        </p>

        {/* Footer links */}
        <p className="text-center text-xs text-gray-400">
          Dengan masuk, Anda menyetujui{' '}
          <Link href="/terms"   className="underline hover:text-gray-600">Syarat Layanan</Link>
          {' '}dan{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Kebijakan Privasi</Link>
          {' '}ARSADAYA.
        </p>
      </div>
    </div>
  )
}