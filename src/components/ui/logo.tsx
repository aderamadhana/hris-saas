'use client'

// src/components/ui/logo.tsx
// Komponen logo ARSADAYA — gunakan di sidebar, header, login page

import Link from 'next/link'
import { cn } from '@/src/lib/utils'

interface LogoIconProps {
  size?: number
  className?: string
}

// Ikon saja (SVG murni tanpa teks)
export function LogoIcon({ size = 32, className }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ARSADAYA"
    >
      {/* Latar teal */}
      <rect width="200" height="200" rx="42" fill="#0A5140" />
      {/* Huruf A – kaki kiri */}
      <line x1="100" y1="52" x2="44" y2="162" stroke="white" strokeWidth="22" strokeLinecap="round" />
      {/* Huruf A – kaki kanan */}
      <line x1="100" y1="52" x2="156" y2="162" stroke="white" strokeWidth="22" strokeLinecap="round" />
      {/* Huruf A – palang tengah */}
      <line x1="65" y1="122" x2="135" y2="122" stroke="white" strokeWidth="19" strokeLinecap="round" />
      {/* Titik amber – aksen energi */}
      <circle cx="100" cy="38" r="16" fill="#F5A623" />
    </svg>
  )
}

// -----------------------------------------------
// Varian tampilan
// -----------------------------------------------

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizeMap = {
  sm: { icon: 24, name: 'text-base', tag: 'text-[9px]' },
  md: { icon: 32, name: 'text-lg',  tag: 'text-[10px]' },
  lg: { icon: 44, name: 'text-2xl', tag: 'text-xs'     },
}

export function Logo({ variant = 'full', size = 'md', href = '/dashboard', className }: LogoProps) {
  const s = sizeMap[size]

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoIcon size={s.icon} />

      {variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(s.name, 'font-bold tracking-wider')}
            style={{ color: '#0A5140', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            ARSADAYA
          </span>
          {variant === 'full' && (
            <span
              className={cn(s.tag, 'tracking-widest uppercase mt-0.5')}
              style={{ color: '#9CA3AF' }}
            >
              Energi untuk SDM Anda
            </span>
          )}
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

// -----------------------------------------------
// Logo untuk latar gelap (sidebar teal)
// -----------------------------------------------
export function LogoDark({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Versi ikon dengan latar transparan untuk sidebar */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ARSADAYA"
      >
        <rect width="200" height="200" rx="42" fill="rgba(255,255,255,0.12)" />
        <line x1="100" y1="52" x2="44"  y2="162" stroke="white" strokeWidth="22" strokeLinecap="round" />
        <line x1="100" y1="52" x2="156" y2="162" stroke="white" strokeWidth="22" strokeLinecap="round" />
        <line x1="65"  y1="122" x2="135" y2="122" stroke="white" strokeWidth="19" strokeLinecap="round" />
        <circle cx="100" cy="38" r="16" fill="#F5A623" />
      </svg>

      <div className="flex flex-col leading-none">
        <span
          className={cn(s.name, 'font-bold tracking-wider text-white')}
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          ARSADAYA
        </span>
        <span className={cn(s.tag, 'tracking-widest uppercase mt-0.5 text-white/40')}>
          Energi untuk SDM Anda
        </span>
      </div>
    </div>
  )
}