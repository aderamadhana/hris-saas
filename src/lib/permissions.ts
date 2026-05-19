// src/lib/permissions.ts
// Utility terpusat untuk permission check.
// Import di page.tsx dan API route agar konsisten.

export type UserRole = "employee" | "manager" | "hr" | "admin" | "owner";

// ─── Role hierarchy ───────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<UserRole, number> = {
  employee: 1,
  manager: 2,
  hr: 3,
  admin: 4,
  owner: 5,
};

/** Apakah role punya level >= role minimum yang dibutuhkan */
export function hasMinRole(role: string, minRole: UserRole): boolean {
  const level = ROLE_LEVEL[role as UserRole] ?? 0;
  const minLevel = ROLE_LEVEL[minRole];
  return level >= minLevel;
}

// ─── Per-fitur permission helpers ────────────────────────────────────────────

/** Bisa lihat daftar karyawan (minimal manager) */
export function canViewEmployees(role: string) {
  return ["manager", "hr", "admin", "owner"].includes(role);
}

/** Bisa tambah/edit karyawan */
export function canManageEmployees(role: string) {
  return ["hr", "admin", "owner"].includes(role);
}

/** Bisa hapus karyawan */
export function canDeleteEmployees(role: string) {
  return ["admin", "owner"].includes(role);
}

/** Bisa lihat & kelola semua absensi */
export function canManageAttendance(role: string) {
  return ["hr", "admin", "owner"].includes(role);
}

/** Bisa approve/reject leave */
export function canApproveLeave(role: string) {
  return ["manager", "hr", "admin", "owner"].includes(role);
}

/** Bisa generate & kelola payroll */
export function canManagePayroll(role: string) {
  return ["hr", "admin", "owner"].includes(role);
}

/** Bisa akses settings organisasi */
export function canAccessSettings(role: string) {
  return ["admin", "owner"].includes(role);
}

/** Bisa akses billing */
export function canAccessBilling(role: string) {
  return role === "owner";
}

/** Bisa kelola departemen */
export function canManageDepartments(role: string) {
  return ["hr", "admin", "owner"].includes(role);
}

/** Bisa lihat laporan */
export function canViewReports(role: string) {
  return ["hr", "admin", "owner"].includes(role);
}

/** Bisa kelola dokumen */
export function canManageDocuments(role: string) {
  return ["hr", "admin", "owner"].includes(role);
}

// ─── Route guard map (dipakai middleware & page) ──────────────────────────────

export const ROUTE_PERMISSIONS: Record<string, (role: string) => boolean> = {
  "/employees": canViewEmployees,
  "/departments": canManageDepartments,
  "/payroll": canManagePayroll,
  "/reports": canViewReports,
  "/settings": canAccessSettings,
  "/billing": canAccessBilling,
  "/documents": canManageDocuments,
  "/performance": canViewEmployees,
};

/** Cek apakah role boleh akses path tertentu */
export function canAccessRoute(pathname: string, role: string): boolean {
  // Strip /dashboard prefix
  const normalizedPath = pathname.startsWith("/dashboard")
    ? pathname.slice("/dashboard".length) || "/"
    : pathname;

  for (const [prefix, checker] of Object.entries(ROUTE_PERMISSIONS)) {
    if (
      normalizedPath === prefix ||
      normalizedPath.startsWith(`${prefix}/`)
    ) {
      return checker(role);
    }
  }

  // Route tidak ada di map → boleh diakses semua role yang sudah login
  return true;
}