"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";

interface CheckInButtonProps {
  currentAttendance: {
    id: string;
    checkIn: string | null;
    checkOut: string | null;
  } | null;
  employeeId: string;
  employeeName: string;
}

const BRAND_GREEN = "#0B5A43";
const BRAND_ORANGE = "#F7A81B";

function formatTime(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getApiError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export function CheckInButton({
  currentAttendance,
  employeeId,
  employeeName,
}: CheckInButtonProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<"check-in" | "check-out" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const hasCheckedIn = Boolean(currentAttendance?.checkIn);
  const hasCheckedOut = Boolean(currentAttendance?.checkOut);

  const checkInTime = useMemo(
    () => formatTime(currentAttendance?.checkIn),
    [currentAttendance?.checkIn],
  );

  const checkOutTime = useMemo(
    () => formatTime(currentAttendance?.checkOut),
    [currentAttendance?.checkOut],
  );

  const displayName = employeeName?.trim() || "Employee";

  const handleCheckIn = async () => {
    if (!employeeId || isLoading) return;

    setIsLoading(true);
    setActionType("check-in");
    setError(null);

    try {
      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response, "Failed to check in."));
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check in.");
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleCheckOut = async () => {
    if (!currentAttendance?.id || isLoading) {
      setError("Attendance record is missing. Please refresh the page.");
      return;
    }

    setIsLoading(true);
    setActionType("check-out");
    setError(null);

    try {
      const response = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendanceId: currentAttendance.id,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response, "Failed to check out."));
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check out.");
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  if (hasCheckedIn && hasCheckedOut) {
    return (
      <section className="border-l-4 border-[#0B5A43] bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center bg-[#EAF5F0] text-[#0B5A43]">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-950">
                Attendance completed
              </p>
              <p className="mt-1 text-sm text-gray-500">
                You checked in at{" "}
                <span className="font-medium text-gray-800">{checkInTime}</span>{" "}
                and checked out at{" "}
                <span className="font-medium text-gray-800">
                  {checkOutTime}
                </span>
                .
              </p>
            </div>
          </div>

          <Button
            disabled
            className="h-11 cursor-not-allowed bg-gray-200 px-5 text-sm font-semibold text-gray-500"
          >
            Completed
          </Button>
        </div>
      </section>
    );
  }

  if (hasCheckedIn && !hasCheckedOut) {
    return (
      <section className="border-l-4 border-[#0B5A43] bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center bg-[#EAF5F0] text-[#0B5A43]">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-950">
                You are checked in
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Started at{" "}
                <span className="font-medium text-gray-800">{checkInTime}</span>
                . Remember to check out before leaving.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCheckOut}
            disabled={isLoading}
            className="h-11 bg-[#F7A81B] px-5 text-sm font-semibold text-[#0B5A43] shadow-sm hover:bg-[#E89A10] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading && actionType === "check-out" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Check out
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="border-l-4 border-[#F7A81B] bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center bg-[#FFF4D9] text-[#0B5A43]">
            <LogIn className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-950">
              Ready to start work?
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Hi {displayName}, press the button to record your attendance for
              today.
            </p>
          </div>
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={isLoading}
          className="h-12 bg-[#0B5A43] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#084934] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading && actionType === "check-in" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Check in now
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </section>
  );
}
