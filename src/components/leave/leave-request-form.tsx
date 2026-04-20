// src/components/leave/leave-request-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Loader2,
  FileText,
  Info,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  INDONESIAN_LEAVE_TYPES,
  getLeaveType,
  calculateWorkingDays,
  calculateEndDate,
  shouldAutoCalculate,
  getAutoDays,
  requiresTimeInput,
  shouldExcludeWeekends,
  requiresDelegation,
} from "@/src/lib/leave-types";

interface Employee {
  id: string;
  name: string;
}
interface LeaveBalance {
  annual: number;
  sick: number;
}

export function LeaveRequestForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    reason: "",
    attachment: null as File | null,
    delegateTo: "",
    delegateNotes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedLeaveType = formData.leaveType
    ? getLeaveType(formData.leaveType)
    : null;
  const isAutoCalculated = selectedLeaveType
    ? shouldAutoCalculate(selectedLeaveType.id)
    : false;
  const needsTime = selectedLeaveType
    ? requiresTimeInput(selectedLeaveType.id)
    : false;
  const needsDelegation = selectedLeaveType
    ? requiresDelegation(selectedLeaveType.id)
    : false;

  // Fetch leave balance
  useEffect(() => {
    fetch("/api/leave/balance")
      .then((r) => r.json())
      .then((data) => {
        if (data.success)
          setBalance({ annual: data.balance.annual, sick: data.balance.sick });
      })
      .catch(() => {});
  }, []);

  // Auto-calculate end date for special leaves
  useEffect(() => {
    if (isAutoCalculated && formData.startDate && selectedLeaveType) {
      const autoDays = getAutoDays(selectedLeaveType.id)!;
      const start = new Date(formData.startDate);
      const end = calculateEndDate(
        start,
        autoDays,
        shouldExcludeWeekends(selectedLeaveType.id),
      );
      setFormData((prev) => ({
        ...prev,
        endDate: end.toISOString().split("T")[0],
      }));
    }
  }, [formData.startDate, formData.leaveType]);

  // Fetch employees for delegation
  useEffect(() => {
    if (!needsDelegation) return;
    fetch("/api/employees/list")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.employees ?? []).map((e: any) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
        }));
        setEmployees(list);
      })
      .catch(() => {});
  }, [needsDelegation]);

  const calculateDays = (): number => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (selectedLeaveType && shouldExcludeWeekends(selectedLeaveType.id)) {
      return calculateWorkingDays(start, end);
    }
    return (
      Math.ceil(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1
    );
  };

  const calculateHours = (): number => {
    if (!formData.startTime || !formData.endTime) return 0;
    const [sh, sm] = formData.startTime.split(":").map(Number);
    const [eh, em] = formData.endTime.split(":").map(Number);
    return (eh * 60 + em - (sh * 60 + sm)) / 60;
  };

  const requestedDays = calculateDays();
  const totalHours = calculateHours();

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.leaveType) e.leaveType = "Please select a leave type";
    if (!formData.startDate) e.startDate = "Start date is required";
    if (!formData.endDate) e.endDate = "End date is required";
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate))
        e.endDate = "End date must be after start date";
      if (
        selectedLeaveType?.maxDays &&
        requestedDays > selectedLeaveType.maxDays
      )
        e.leaveType = `Maximum ${selectedLeaveType.maxDays} days for ${selectedLeaveType.name}`;
    }
    if (needsTime) {
      if (!formData.startTime) e.startTime = "Start time is required";
      if (!formData.endTime) e.endTime = "End time is required";
      if (
        formData.startTime &&
        formData.endTime &&
        formData.endTime <= formData.startTime
      )
        e.endTime = "End time must be after start time";
    }
    if (!formData.reason.trim()) e.reason = "Reason is required";
    else if (formData.reason.trim().length < 10)
      e.reason = "Reason must be at least 10 characters";
    if (selectedLeaveType?.requiresDocument && !formData.attachment)
      e.attachment = `Supporting document required for ${selectedLeaveType.name}`;
    if (needsDelegation && !formData.delegateTo)
      e.delegateTo = "Delegation is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelect = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "leaveType" ? { endDate: "" } : {}),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        attachment: "File size must be under 5MB",
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, attachment: file }));
    setErrors((prev) => ({ ...prev, attachment: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setIsLoading(true);
    try {
      const body = new FormData();
      body.append("leaveType", formData.leaveType);
      body.append("startDate", formData.startDate);
      body.append("endDate", formData.endDate);
      body.append("reason", formData.reason);
      if (needsTime) {
        body.append("startTime", formData.startTime);
        body.append("endTime", formData.endTime);
        body.append("totalHours", totalHours.toString());
      }
      if (needsDelegation && formData.delegateTo) {
        body.append("delegateTo", formData.delegateTo);
        if (formData.delegateNotes)
          body.append("delegateNotes", formData.delegateNotes);
      }
      if (formData.attachment) body.append("attachment", formData.attachment);

      const res = await fetch("/api/leave/request", { method: "POST", body });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to submit leave request");
      setSubmitSuccess(true);
      setTimeout(() => router.push("/leave"), 1500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit leave request");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">
          Leave Request Submitted
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Redirecting to leave requests...
        </p>
      </div>
    );
  }

  const byCategory = (cat: string) =>
    INDONESIAN_LEAVE_TYPES.filter((t) => t.category === cat);

  const GROUPS = [
    { label: "ANNUAL LEAVE", cat: "annual" },
    { label: "HEALTH LEAVE", cat: "health" },
    { label: "MATERNITY LEAVE", cat: "maternity" },
    { label: "SPECIAL LEAVE", cat: "special" },
    { label: "WORK ARRANGEMENT", cat: "work" },
    { label: "UNPAID LEAVE", cat: "unpaid" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Balance cards */}
      {balance && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Annual Leave Balance</p>
            <p className="text-xl font-bold text-gray-900">
              {balance.annual} days
            </p>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Sick Leave</p>
            <p className="text-xl font-bold text-gray-900">Unlimited</p>
          </div>
        </div>
      )}

      {/* Leave type */}
      <div className="space-y-2">
        <Label>
          Leave Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.leaveType}
          onValueChange={(v) => handleSelect("leaveType", v)}
          disabled={isLoading}
        >
          <SelectTrigger className={errors.leaveType ? "border-red-500" : ""}>
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            {GROUPS.map(({ label, cat }) => {
              const items = byCategory(cat);
              if (!items.length) return null;
              return (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label}
                  </SelectLabel>
                  {items.map((leave) => (
                    <SelectItem key={leave.id} value={leave.id}>
                      <span className="font-medium">{leave.name}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {leave.maxDays ? `${leave.maxDays} days` : "Unlimited"}
                        {!leave.isPaid ? " · Unpaid" : ""}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
        {errors.leaveType && (
          <p className="text-xs text-red-600">{errors.leaveType}</p>
        )}
      </div>

      {/* Info card */}
      {selectedLeaveType && (
        <div
          className={`rounded-lg border p-4 ${selectedLeaveType.isPaid ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}
        >
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">
                {selectedLeaveType.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLeaveType.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-white px-2 py-1 border">
                  {selectedLeaveType.maxDays
                    ? `Max ${selectedLeaveType.maxDays} days`
                    : "Unlimited"}
                </span>
                <span
                  className={`rounded px-2 py-1 border ${selectedLeaveType.isPaid ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                >
                  {selectedLeaveType.isPaid ? "Paid" : "Unpaid"}
                </span>
                {selectedLeaveType.requiresDocument && (
                  <span className="rounded bg-yellow-50 px-2 py-1 border border-yellow-200 text-yellow-700">
                    Document required
                  </span>
                )}
                {isAutoCalculated && (
                  <span className="rounded bg-purple-50 px-2 py-1 border border-purple-200 text-purple-700">
                    Auto-calculated dates
                  </span>
                )}
                {needsTime && (
                  <span className="rounded bg-indigo-50 px-2 py-1 border border-indigo-200 text-indigo-700">
                    Time input required
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              disabled={isLoading}
              className={`pl-10 ${errors.startDate ? "border-red-500" : ""}`}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          {errors.startDate && (
            <p className="text-xs text-red-600">{errors.startDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">
            End Date <span className="text-red-500">*</span>
            {isAutoCalculated && (
              <span className="ml-2 text-xs text-blue-600">(Auto-filled)</span>
            )}
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              disabled={isLoading || !!isAutoCalculated}
              className={`pl-10 ${errors.endDate ? "border-red-500" : ""} ${isAutoCalculated ? "bg-gray-100" : ""}`}
              min={formData.startDate || new Date().toISOString().split("T")[0]}
            />
          </div>
          {errors.endDate && (
            <p className="text-xs text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Time (Out of Office) */}
      {needsTime && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">
              Start Time <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                disabled={isLoading}
                className={`pl-10 ${errors.startTime ? "border-red-500" : ""}`}
              />
            </div>
            {errors.startTime && (
              <p className="text-xs text-red-600">{errors.startTime}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">
              End Time <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                disabled={isLoading}
                className={`pl-10 ${errors.endTime ? "border-red-500" : ""}`}
              />
            </div>
            {errors.endTime && (
              <p className="text-xs text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>
      )}

      {/* Duration summary */}
      {(requestedDays > 0 || totalHours > 0) && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Duration</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {needsTime
              ? `${totalHours.toFixed(1)} hours`
              : `${requestedDays} working day${requestedDays !== 1 ? "s" : ""}`}
          </p>
        </div>
      )}

      {/* Delegation */}
      {needsDelegation && (
        <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Task Delegation</h3>
          </div>
          <div className="space-y-2">
            <Label>
              Delegate to <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.delegateTo}
              onValueChange={(v) => handleSelect("delegateTo", v)}
              disabled={isLoading}
            >
              <SelectTrigger
                className={errors.delegateTo ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.delegateTo && (
              <p className="text-xs text-red-600">{errors.delegateTo}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="delegateNotes">Notes for delegate (Optional)</Label>
            <Textarea
              id="delegateNotes"
              name="delegateNotes"
              rows={2}
              value={formData.delegateNotes}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g. Please handle the client meeting on..."
            />
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="space-y-2">
        <Label htmlFor="reason">
          Reason <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          value={formData.reason}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.reason ? "border-red-500" : ""}
          placeholder="Describe the reason for your leave request (min. 10 characters)..."
        />
        {errors.reason && (
          <p className="text-xs text-red-600">{errors.reason}</p>
        )}
        <p className="text-xs text-gray-400">
          {formData.reason.length} characters
        </p>
      </div>

      {/* Attachment */}
      <div className="space-y-2">
        <Label htmlFor="attachment">
          Supporting Document{" "}
          {selectedLeaveType?.requiresDocument ? (
            <span className="text-red-500">*</span>
          ) : (
            <span className="text-gray-400">(Optional)</span>
          )}
        </Label>
        {selectedLeaveType?.requiresDocument && (
          <div className="flex items-start gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              {selectedLeaveType.name} requires a supporting document (medical
              certificate, letter, etc.)
            </span>
          </div>
        )}
        <Input
          id="attachment"
          name="attachment"
          type="file"
          onChange={handleFile}
          disabled={isLoading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-200"
        />
        {formData.attachment && (
          <p className="flex items-center gap-1.5 text-sm text-green-700">
            <FileText className="h-4 w-4" />
            {formData.attachment.name} (
            {(formData.attachment.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {errors.attachment && (
          <p className="text-xs text-red-600">{errors.attachment}</p>
        )}
        <p className="text-xs text-gray-400">
          Formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
        </p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 border-t pt-4">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Submitting..." : "Submit Request"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/leave")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
