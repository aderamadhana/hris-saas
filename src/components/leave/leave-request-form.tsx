// src/components/leave/leave-request-form.tsx
// COMPLETE Leave Request Form - Fixed!

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useToast } from "@/src/hooks/use-toast";
import { Loader2, Calendar, FileText, Upload, AlertCircle } from "lucide-react";

interface LeaveBalance {
  annual: number;
  sick: number;
  emergency: number;
}

export function LeaveRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    annual: 0,
    sick: 0,
    emergency: 0,
  });

  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    attachment: null as File | null,
  });

  const [errors, setErrors] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Fetch leave balance
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await fetch("/api/leave/balance");
        if (!response.ok) throw new Error("Failed to fetch balance");
        const data = await response.json();
        setLeaveBalance(data.balance);
      } catch (error) {
        console.error("Error fetching leave balance:", error);
        toast({
          title: "Warning",
          description: "Could not load leave balance",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchLeaveBalance();
  }, [toast]);

  // Calculate days between dates
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const requestedDays = calculateDays(formData.startDate, formData.endDate);

  // Get available balance for selected type
  const getAvailableBalance = () => {
    if (!formData.leaveType) return 0;
    return leaveBalance[formData.leaveType as keyof LeaveBalance] || 0;
  };

  const validate = () => {
    const newErrors = {
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
    };
    let isValid = true;

    if (!formData.leaveType) {
      newErrors.leaveType = "Please select leave type";
      isValid = false;
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
      isValid = false;
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
      isValid = false;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = "End date must be after start date";
        isValid = false;
      }

      // Check if past date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(formData.startDate) < today) {
        newErrors.startDate = "Start date cannot be in the past";
        isValid = false;
      }

      // Check leave balance (except sick leave)
      if (formData.leaveType !== "sick" && formData.leaveType !== "emergency") {
        const available = getAvailableBalance();
        if (requestedDays > available) {
          newErrors.leaveType = `Insufficient balance. Available: ${available} days`;
          isValid = false;
        }
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
      isValid = false;
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }
      setFormData((prev) => ({ ...prev, attachment: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please check all fields and try again",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("leaveType", formData.leaveType);
      submitData.append("startDate", formData.startDate);
      submitData.append("endDate", formData.endDate);
      submitData.append("reason", formData.reason);
      if (formData.attachment) {
        submitData.append("attachment", formData.attachment);
      }

      const response = await fetch("/api/leave/request", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit leave request");
      }

      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });

      // Redirect to leave list
      router.push("/dashboard/leave");
      router.refresh();
    } catch (error: any) {
      console.error("Submit leave error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Balance Card */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          Your Leave Balance
        </h3>
        {isLoadingBalance ? (
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading balance...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-blue-700">Annual Leave</p>
              <p className="text-2xl font-bold text-blue-900">
                {leaveBalance.annual}
              </p>
              <p className="text-xs text-blue-600">days</p>
            </div>
            <div>
              <p className="text-xs text-blue-700">Sick Leave</p>
              <p className="text-2xl font-bold text-blue-900">
                {leaveBalance.sick}
              </p>
              <p className="text-xs text-blue-600">days</p>
            </div>
            <div>
              <p className="text-xs text-blue-700">Emergency</p>
              <p className="text-2xl font-bold text-blue-900">
                {leaveBalance.emergency}
              </p>
              <p className="text-xs text-blue-600">days</p>
            </div>
          </div>
        )}
      </div>

      {/* Leave Type */}
      <div className="space-y-2">
        <Label htmlFor="leaveType">
          Leave Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.leaveType}
          onValueChange={(value) => handleSelectChange("leaveType", value)}
          disabled={isLoading}
        >
          <SelectTrigger className={errors.leaveType ? "border-red-500" : ""}>
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="annual">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <div>
                  <div className="font-medium">Annual Leave</div>
                  <div className="text-xs text-gray-500">
                    Available: {leaveBalance.annual} days
                  </div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="sick">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <div className="font-medium">Sick Leave</div>
                  <div className="text-xs text-gray-500">
                    Available: {leaveBalance.sick} days
                  </div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="emergency">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="font-medium">Emergency Leave</div>
                  <div className="text-xs text-gray-500">
                    Available: {leaveBalance.emergency} days
                  </div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.leaveType && (
          <p className="text-sm text-red-600">{errors.leaveType}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            disabled={isLoading}
            className={errors.startDate ? "border-red-500" : ""}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.startDate && (
            <p className="text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="endDate">
            End Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            disabled={isLoading}
            className={errors.endDate ? "border-red-500" : ""}
            min={formData.startDate || new Date().toISOString().split("T")[0]}
          />
          {errors.endDate && (
            <p className="text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Days Summary */}
      {requestedDays > 0 && (
        <div className="rounded-lg bg-gray-50 p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Requested Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {requestedDays} {requestedDays === 1 ? "day" : "days"}
              </p>
            </div>
            {formData.leaveType && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Remaining Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    getAvailableBalance() - requestedDays >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {getAvailableBalance() - requestedDays}{" "}
                  {getAvailableBalance() - requestedDays === 1 ? "day" : "days"}
                </p>
              </div>
            )}
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
          placeholder="Please provide a detailed reason for your leave request..."
        />
        {errors.reason && (
          <p className="text-sm text-red-600">{errors.reason}</p>
        )}
        <p className="text-xs text-gray-500">
          {formData.reason.length} characters (minimum 10 required)
        </p>
      </div>

      {/* Attachment (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="attachment">
          Attachment <span className="text-gray-500">(Optional)</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="attachment"
            name="attachment"
            type="file"
            onChange={handleFileChange}
            disabled={isLoading}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {formData.attachment && (
          <p className="text-sm text-green-600 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {formData.attachment.name} (
            {(formData.attachment.size / 1024).toFixed(1)} KB)
          </p>
        )}
        <p className="text-xs text-gray-500">
          Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Submitting..." : "Submit Leave Request"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/leave")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
