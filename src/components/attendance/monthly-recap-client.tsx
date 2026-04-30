"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Badge } from "@/src/components/ui/badge";
import { ManualAttendanceDialog } from "./manual-attendance-dialog";
import { cn } from "@/src/lib/utils";

interface Department {
  id: string;
  name: string;
}
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  departmentId?: string | null;
}

interface RecapRecord {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    position: string;
    department: string;
    departmentId?: string;
  };
  summary: {
    workingDays: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
    holiday: number;
    attendanceRate: number;
    avgWorkHours: number;
    totalWorkHours: number;
  };
  dailyRecords: Array<{
    date: string;
    dayOfWeek: string;
    isWeekend: boolean;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    workHours: number | null;
  }>;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  present: { label: "H", color: "text-green-700", bg: "bg-green-100" },
  late: { label: "TL", color: "text-yellow-700", bg: "bg-yellow-100" },
  absent: { label: "A", color: "text-red-700", bg: "bg-red-100" },
  leave: { label: "C", color: "text-blue-700", bg: "bg-blue-100" },
  holiday: { label: "LB", color: "text-gray-600", bg: "bg-gray-100" },
  wfh: { label: "WFH", color: "text-purple-700", bg: "bg-purple-100" },
  weekend: { label: "-", color: "text-gray-400", bg: "bg-gray-50" },
  future: { label: "·", color: "text-gray-300", bg: "bg-white" },
};

interface Props {
  initialMonth: number;
  initialYear: number;
  initialDepartmentId?: string;
  initialEmployeeId?: string;
  departments: Department[];
  employees: Employee[];
  currentUserRole: string;
  currentUserId: string;
}

export function MonthlyRecapClient({
  initialMonth,
  initialYear,
  initialDepartmentId,
  initialEmployeeId,
  departments,
  employees,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [departmentId, setDepartmentId] = useState(
    initialDepartmentId || "all",
  );
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || "all");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<{
    period: any;
    data: RecapRecord[];
    totalEmployees: number;
  } | null>(null);
  const [view, setView] = useState<"summary" | "detail">("summary");

  const isAdminHR = ["admin", "hr", "owner"].includes(currentUserRole);

  const fetchRecap = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      if (departmentId !== "all") params.set("departmentId", departmentId);
      if (employeeId !== "all") params.set("employeeId", employeeId);

      const res = await fetch(`/api/attendance/monthly-recap?${params}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [month, year, departmentId, employeeId]);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("month", String(month));
    params.set("year", String(year));
    if (departmentId !== "all") params.set("departmentId", departmentId);
    if (employeeId !== "all") params.set("employeeId", employeeId);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }, [month, year, departmentId, employeeId, router, pathname]);

  const navigate = (dir: "prev" | "next") => {
    if (dir === "prev") {
      if (month === 1) {
        setMonth(12);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    } else {
      if (month === 12) {
        setMonth(1);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      [
        "Karyawan",
        "Departemen",
        "Posisi",
        "Hari Kerja",
        "Hadir",
        "Terlambat",
        "Absen",
        "Cuti",
        "Rate",
        "Avg Jam",
      ],
    ];
    data.data.forEach((r) => {
      rows.push([
        r.employee.name,
        r.employee.department,
        r.employee.position,
        String(r.summary.workingDays),
        String(r.summary.present),
        String(r.summary.late),
        String(r.summary.absent),
        String(r.summary.leave),
        `${r.summary.attendanceRate}%`,
        `${r.summary.avgWorkHours}j`,
      ]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-absensi-${MONTHS[month - 1]}-${year}.csv`;
    a.click();
  };

  // Filter employees by selected department
  const filteredEmployees =
    departmentId === "all"
      ? employees
      : employees.filter((e) => e.departmentId === departmentId);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4">
        {/* Month navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-semibold text-gray-900">
            {MONTHS[month - 1]} {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("next")}
            disabled={
              month === new Date().getMonth() + 1 &&
              year === new Date().getFullYear()
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Department filter */}
        <Select
          value={departmentId}
          onValueChange={(val) => {
            setDepartmentId(val);
            setEmployeeId("all");
          }}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <SelectValue placeholder="Semua Departemen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Departemen</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Employee filter */}
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <SelectValue placeholder="Semua Karyawan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Karyawan</SelectItem>
            {filteredEmployees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setView("summary")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium",
                view === "summary"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              Ringkasan
            </button>
            <button
              onClick={() => setView("detail")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium",
                view === "detail"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              Detail Harian
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecap}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={!data}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Karyawan",
              value: data.totalEmployees,
              icon: Users,
              color: "text-blue-600",
            },
            {
              label: "Hari Kerja",
              value: data.period?.workingDays,
              icon: Calendar,
              color: "text-gray-600",
            },
            {
              label: "Avg Kehadiran",
              value:
                data.data.length > 0
                  ? `${Math.round(data.data.reduce((s, r) => s + r.summary.attendanceRate, 0) / data.data.length)}%`
                  : "-",
              icon: CheckCircle,
              color: "text-green-600",
            },
            {
              label: "Total Absen",
              value: data.data.reduce((s, r) => s + r.summary.absent, 0),
              icon: XCircle,
              color: "text-red-600",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{c.label}</p>
                <c.icon className={cn("h-4 w-4", c.color)} />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Memuat data...
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-white py-16 text-center text-gray-400">
          <Calendar className="h-10 w-10 mb-3" />
          <p className="font-medium">Tidak ada data</p>
          <p className="text-sm">Coba ubah filter atau pilih bulan lain</p>
        </div>
      ) : view === "summary" ? (
        <SummaryTable
          data={data.data}
          isAdminHR={isAdminHR}
          onRefresh={fetchRecap}
        />
      ) : (
        <DetailTable
          data={data.data}
          isAdminHR={isAdminHR}
          onRefresh={fetchRecap}
        />
      )}
    </div>
  );
}

// ─── Summary Table ────────────────────────────────────────────────────────────
function SummaryTable({
  data,
  isAdminHR,
  onRefresh,
}: {
  data: RecapRecord[];
  isAdminHR: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Karyawan</th>
            <th className="px-4 py-3 text-left">Departemen</th>
            <th className="px-4 py-3 text-center">Hari Kerja</th>
            <th className="px-4 py-3 text-center">Hadir</th>
            <th className="px-4 py-3 text-center">Terlambat</th>
            <th className="px-4 py-3 text-center">Absen</th>
            <th className="px-4 py-3 text-center">Cuti</th>
            <th className="px-4 py-3 text-center">Rate</th>
            <th className="px-4 py-3 text-center">Avg Jam</th>
            {isAdminHR && <th className="px-4 py-3 text-center">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((r) => {
            const rate = r.summary.attendanceRate;
            const rateColor =
              rate >= 90
                ? "text-green-600"
                : rate >= 75
                  ? "text-yellow-600"
                  : "text-red-600";
            return (
              <tr key={r.employee.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.employee.name}</p>
                  <p className="text-xs text-gray-400">
                    {r.employee.employeeId} · {r.employee.position}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.employee.department}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.summary.workingDays}
                </td>
                <td className="px-4 py-3 text-center font-medium text-green-700">
                  {r.summary.present}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.summary.late > 0 && (
                    <Badge
                      variant="outline"
                      className="text-yellow-700 border-yellow-300"
                    >
                      {r.summary.late}
                    </Badge>
                  )}
                  {r.summary.late === 0 && (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.summary.absent > 0 && (
                    <Badge
                      variant="outline"
                      className="text-red-700 border-red-300"
                    >
                      {r.summary.absent}
                    </Badge>
                  )}
                  {r.summary.absent === 0 && (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-blue-600">
                  {r.summary.leave || "-"}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-center font-semibold",
                    rateColor,
                  )}
                >
                  {rate}%
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {r.summary.avgWorkHours}j
                </td>
                {isAdminHR && (
                  <td className="px-4 py-3 text-center">
                    <ManualAttendanceDialog
                      employeeId={r.employee.id}
                      employeeName={r.employee.name}
                      onSuccess={onRefresh}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Detail Table ─────────────────────────────────────────────────────────────
function DetailTable({
  data,
  isAdminHR,
  onRefresh,
}: {
  data: RecapRecord[];
  isAdminHR: boolean;
  onRefresh: () => void;
}) {
  const [openEmployee, setOpenEmployee] = useState<string | null>(
    data[0]?.employee.id || null,
  );

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div
          key={r.employee.id}
          className="rounded-lg border bg-white overflow-hidden"
        >
          {/* Header */}
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
            onClick={() =>
              setOpenEmployee(
                openEmployee === r.employee.id ? null : r.employee.id,
              )
            }
          >
            <div>
              <p className="font-semibold text-gray-900">{r.employee.name}</p>
              <p className="text-xs text-gray-500">
                {r.employee.department} · {r.employee.position}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-medium">
                {r.summary.present}H
              </span>
              <span className="text-red-600">{r.summary.absent}A</span>
              <span className="text-blue-600">{r.summary.leave}C</span>
              <Badge
                variant="outline"
                className={
                  r.summary.attendanceRate >= 90
                    ? "text-green-700 border-green-300"
                    : r.summary.attendanceRate >= 75
                      ? "text-yellow-700 border-yellow-300"
                      : "text-red-700 border-red-300"
                }
              >
                {r.summary.attendanceRate}%
              </Badge>
            </div>
          </button>

          {/* Daily records */}
          {openEmployee === r.employee.id && (
            <div className="border-t overflow-x-auto">
              <table className="w-full text-xs divide-y divide-gray-100">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Tanggal</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Masuk</th>
                    <th className="px-3 py-2 text-center">Keluar</th>
                    <th className="px-3 py-2 text-center">Jam Kerja</th>
                    {isAdminHR && (
                      <th className="px-3 py-2 text-center">Edit</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {r.dailyRecords.map((day) => {
                    const cfg =
                      STATUS_CONFIG[day.status] || STATUS_CONFIG.future;
                    return (
                      <tr
                        key={day.date}
                        className={cn(
                          day.isWeekend ? "opacity-40" : "hover:bg-gray-50",
                        )}
                      >
                        <td className="px-3 py-1.5 font-medium text-gray-700">
                          {day.date.slice(8)} {day.dayOfWeek}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded px-1.5 py-0.5 font-semibold text-[11px]",
                              cfg.bg,
                              cfg.color,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center text-gray-600">
                          {day.checkIn || "-"}
                        </td>
                        <td className="px-3 py-1.5 text-center text-gray-600">
                          {day.checkOut || "-"}
                        </td>
                        <td className="px-3 py-1.5 text-center text-gray-600">
                          {day.workHours ? `${day.workHours}j` : "-"}
                        </td>
                        {isAdminHR &&
                          !day.isWeekend &&
                          day.status !== "future" && (
                            <td className="px-3 py-1.5 text-center">
                              <ManualAttendanceDialog
                                employeeId={r.employee.id}
                                employeeName={r.employee.name}
                                date={day.date}
                                existingRecord={
                                  day.checkIn
                                    ? {
                                        checkIn: day.checkIn,
                                        checkOut: day.checkOut || undefined,
                                        status: day.status,
                                      }
                                    : null
                                }
                                onSuccess={onRefresh}
                              />
                            </td>
                          )}
                        {isAdminHR &&
                          (day.isWeekend || day.status === "future") && <td />}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
