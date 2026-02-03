import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility untuk merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency ke Rupiah
export function formatCurrency(amount: number, currency: string = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format date
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short') {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj)
  }
  
  return new Intl.DateTimeFormat('id-ID').format(dateObj)
}

// Validate email
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Generate employee ID
export function generateEmployeeId(organizationSlug: string, count: number): string {
  const prefix = organizationSlug.substring(0, 3).toUpperCase()
  const number = String(count + 1).padStart(4, '0')
  return `${prefix}${number}`
}

// Get initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}