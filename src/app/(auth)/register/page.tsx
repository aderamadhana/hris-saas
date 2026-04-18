'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react'

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Nama depan minimal 2 karakter'),
    lastName: z.string().min(2, 'Nama belakang minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
    organizationName: z.string().min(3, 'Nama perusahaan minimal 3 karakter'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function RegisterPage() {
  const supabase = createClient()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Buat auth user di Supabase
      // Simpan data organization di metadata — akan dipakai di /auth/callback
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          // Setelah user klik link konfirmasi → diarahkan ke /auth/callback
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            organization_name: data.organizationName,
            organization_slug: generateSlug(data.organizationName),
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat akun')

      // Cek apakah email sudah pernah didaftarkan
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('Email sudah terdaftar. Silakan login.')
      }

      // Tampilkan halaman "cek email"
      setRegisteredEmail(data.email)

    } catch (err: any) {
      console.error('Register error:', err)
      if (err.message?.includes('sudah terdaftar') || err.message?.includes('already registered')) {
        setError('Email sudah terdaftar. Silakan login.')
      } else {
        setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Tampilan setelah register — minta user cek email
  if (registeredEmail) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cek Email Kamu!</h2>
        <p className="text-gray-600 mb-1">Kami sudah kirim link konfirmasi ke:</p>
        <p className="font-semibold text-gray-900 mb-4">{registeredEmail}</p>
        <p className="text-sm text-gray-500 mb-6">
          Klik link di email tersebut untuk mengaktifkan akun dan langsung masuk ke dashboard.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          Tidak menerima email? Cek folder <strong>Spam</strong> atau{' '}
          <button
            onClick={() => setRegisteredEmail(null)}
            className="underline font-medium"
          >
            coba daftar ulang
          </button>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Sudah konfirmasi?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Masuk di sini
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Buat Akun</h1>
        <p className="text-gray-600 mt-2">Mulai kelola tim kamu hari ini</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Informasi Pribadi
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Nama Depan</Label>
              <Input id="firstName" placeholder="John" {...register('firstName')} className="mt-1" />
              {errors.firstName && (
                <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Nama Belakang</Label>
              <Input id="lastName" placeholder="Doe" {...register('lastName')} className="mt-1" />
              {errors.lastName && (
                <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@perusahaan.com"
              {...register('email')}
              className="mt-1"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Organization */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Informasi Perusahaan
          </h3>
          <div>
            <Label htmlFor="organizationName">Nama Perusahaan</Label>
            <Input
              id="organizationName"
              placeholder="PT. Contoh Indonesia"
              {...register('organizationName')}
              className="mt-1"
            />
            {errors.organizationName && (
              <p className="text-sm text-red-600 mt-1">{errors.organizationName.message}</p>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Keamanan
          </h3>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 karakter"
                {...register('password')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ulangi password"
                {...register('confirmPassword')}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            Saya setuju dengan{' '}
            <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500">
              Syarat & Ketentuan
            </Link>{' '}
            dan{' '}
            <Link href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500">
              Kebijakan Privasi
            </Link>
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Membuat akun...
            </>
          ) : (
            'Buat Akun'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Masuk
        </Link>
      </p>
    </div>
  )
}