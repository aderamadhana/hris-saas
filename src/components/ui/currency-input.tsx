// src/components/ui/currency-input.tsx
// Input Rupiah yang menampilkan format "Rp 12.000.000"
// tapi menyimpan value sebagai number

"use client";

import { useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

function formatRupiah(value: number): string {
  if (!value || value === 0) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseRupiah(raw: string): number {
  // Hapus semua karakter non-digit
  const digits = raw.replace(/\D/g, "");
  const parsed = parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CurrencyInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Rp 0",
  className,
  id,
  name,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Saat focus: tampilkan angka saja (tanpa format) agar mudah diedit
  // Saat blur: tampilkan format Rupiah
  const displayValue = isFocused
    ? value > 0
      ? String(value)
      : ""
    : value > 0
      ? formatRupiah(value)
      : "";

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      value={displayValue}
      placeholder={isFocused ? "0" : placeholder}
      disabled={disabled}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => {
        const parsed = parseRupiah(e.target.value);
        onChange(parsed);
      }}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A43] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}
