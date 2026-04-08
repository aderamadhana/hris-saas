// src/components/leave/leave-request-form.tsx
"use client";

import { useState } from "react";
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
import { useToast } from "@/src/hooks/use-toast";
import {
  AlertCircle,
  Baby,
  CalendarDays,
  Car,
  Church,
  CircleOff,
  Clock3,
  FileText,
  Globe,
  Heart,
  HeartCrack,
  HeartPulse,
  House,
  Info,
  Landmark,
  Loader2,
  Plane,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { INDONESIAN_LEAVE_TYPES, getLeaveType } from "@/src/lib/leave-types";

const LEAVE_ICON_MAP = {
  Baby,
  CalendarDays,
  Car,
  Church,
  CircleOff,
  Clock3,
  Globe,
  Heart,
  HeartCrack,
  HeartPulse,
  House,
  Landmark,
  Plane,
  RefreshCw,
  Shield,
  Users,
} as const;

type LeaveIconName = keyof typeof LEAVE_ICON_MAP;

function LeaveTypeIcon({ iconName }: { iconName: string }) {
  const Icon = LEAVE_ICON_MAP[iconName as LeaveIconName];

  if (!Icon) {
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }

  return <Icon className="h-4 w-4 text-gray-600" />;
}

export function LeaveRequestForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
    attachment: "",
  });

  const selectedLeaveType = formData.leaveType
    ? getLeaveType(formData.leaveType)
    : null;

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateDays(formData.startDate, formData.endDate);

  const validate = () => {
    const newErrors = {
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      attachment: "",
    };
    let isValid = true;

    if (!formData.leaveType) {
      newErrors.leaveType = "Pilih jenis cuti";
      isValid = false;
    }

    if (!formData.startDate) {
      newErrors.startDate = "Tanggal mulai wajib diisi";
      isValid = false;
    }

    if (!formData.endDate) {
      newErrors.endDate = "Tanggal selesai wajib diisi";
      isValid = false;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = "Tanggal selesai harus setelah tanggal mulai";
        isValid = false;
      }

      if (selectedLeaveType?.maxDays !== null && selectedLeaveType?.maxDays) {
        if (requestedDays > selectedLeaveType.maxDays) {
          newErrors.leaveType = `Maksimal ${selectedLeaveType.maxDays} hari untuk ${selectedLeaveType.name}`;
          isValid = false;
        }
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Alasan wajib diisi";
      isValid = false;
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = "Alasan minimal 10 karakter";
      isValid = false;
    }

    if (selectedLeaveType?.requiresDocument && !formData.attachment) {
      newErrors.attachment = `Dokumen pendukung diperlukan untuk ${selectedLeaveType.name}`;
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

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, leaveType: value }));
    if (errors.leaveType) {
      setErrors((prev) => ({ ...prev, leaveType: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File terlalu besar",
          description: "Maksimal ukuran file 5MB",
          variant: "destructive",
        });
        return;
      }
      setFormData((prev) => ({ ...prev, attachment: file }));
      setErrors((prev) => ({ ...prev, attachment: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: "Validasi Gagal",
        description: "Mohon periksa semua field",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
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
        throw new Error(data.error || "Gagal mengajukan cuti");
      }

      toast({
        title: "Berhasil",
        description: "Pengajuan cuti berhasil dikirim",
      });

      router.push("/leave");
      router.refresh();
    } catch (error: any) {
      console.error("Submit leave error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengajukan cuti",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const annualLeaves = INDONESIAN_LEAVE_TYPES.filter(
    (t) => t.category === "annual",
  );
  const healthLeaves = INDONESIAN_LEAVE_TYPES.filter(
    (t) => t.category === "health",
  );
  const specialLeaves = INDONESIAN_LEAVE_TYPES.filter(
    (t) => t.category === "special",
  );
  const workLeaves = INDONESIAN_LEAVE_TYPES.filter(
    (t) => t.category === "work",
  );
  const unpaidLeaves = INDONESIAN_LEAVE_TYPES.filter(
    (t) => t.category === "unpaid",
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="leaveType">
          Jenis Cuti <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.leaveType}
          onValueChange={handleSelectChange}
          disabled={isLoading}
        >
          <SelectTrigger className={errors.leaveType ? "border-red-500" : ""}>
            <SelectValue placeholder="Pilih jenis cuti" />
          </SelectTrigger>

          <SelectContent>
            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI TAHUNAN
              </SelectLabel>
              {annualLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <LeaveTypeIcon iconName={leave.icon} />
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        {leave.maxDays
                          ? `Maks ${leave.maxDays} hari/tahun`
                          : "Tidak terbatas"}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI KESEHATAN
              </SelectLabel>
              {healthLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <LeaveTypeIcon iconName={leave.icon} />
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        Tidak terbatas • Perlu surat dokter
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI KHUSUS
              </SelectLabel>
              {specialLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <LeaveTypeIcon iconName={leave.icon} />
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        {leave.maxDays
                          ? `${leave.maxDays} hari`
                          : "Tidak terbatas"}{" "}
                        •{" "}
                        {leave.requiresDocument
                          ? "Perlu dokumen"
                          : "Tanpa dokumen"}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                PENGATURAN KERJA
              </SelectLabel>
              {workLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <LeaveTypeIcon iconName={leave.icon} />
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-gray-500">
                        {leave.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>

            <SelectGroup>
              <SelectLabel className="text-xs font-semibold text-gray-500">
                CUTI TIDAK BERBAYAR
              </SelectLabel>
              {unpaidLeaves.map((leave) => (
                <SelectItem key={leave.id} value={leave.id}>
                  <div className="flex items-center gap-2">
                    <LeaveTypeIcon iconName={leave.icon} />
                    <div>
                      <div className="font-medium">{leave.name}</div>
                      <div className="text-xs text-red-600">Tidak dibayar</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {errors.leaveType && (
          <p className="text-sm text-red-600">{errors.leaveType}</p>
        )}
      </div>

      {selectedLeaveType && (
        <div
          className={`rounded-lg border p-4 ${
            selectedLeaveType.isPaid
              ? "border-blue-200 bg-blue-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <LeaveTypeIcon iconName={selectedLeaveType.icon} />
                <p className="font-medium text-gray-900">
                  {selectedLeaveType.name}
                </p>
              </div>

              <p className="mt-1 text-sm text-gray-600">
                {selectedLeaveType.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Durasi: </span>
                  <span className="font-medium">
                    {selectedLeaveType.maxDays
                      ? `${selectedLeaveType.maxDays} hari`
                      : "Tidak terbatas"}
                  </span>
                </div>

                <div>
                  <span className="text-gray-600">Status: </span>
                  <span
                    className={`font-medium ${
                      selectedLeaveType.isPaid
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedLeaveType.isPaid ? "Berbayar" : "Tidak berbayar"}
                  </span>
                </div>

                {selectedLeaveType.requiresDocument && (
                  <div className="flex items-center gap-1 text-amber-600 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    <span>Perlu dokumen pendukung</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Tanggal Mulai <span className="text-red-500">*</span>
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

        <div className="space-y-2">
          <Label htmlFor="endDate">
            Tanggal Selesai <span className="text-red-500">*</span>
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

      {requestedDays > 0 && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Durasi Pengajuan</p>
              <p className="text-2xl font-bold text-gray-900">
                {requestedDays} hari
              </p>
            </div>

            {selectedLeaveType?.maxDays && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Maksimal Durasi</p>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedLeaveType.maxDays} hari
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">
          Alasan <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="reason"
          name="reason"
          rows={4}
          value={formData.reason}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.reason ? "border-red-500" : ""}
          placeholder="Jelaskan alasan pengajuan cuti..."
        />
        {errors.reason && (
          <p className="text-sm text-red-600">{errors.reason}</p>
        )}
        <p className="text-xs text-gray-500">
          {formData.reason.length} karakter (minimal 10)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachment">
          Dokumen Pendukung{" "}
          {selectedLeaveType?.requiresDocument ? (
            <span className="text-red-500">*</span>
          ) : (
            <span className="text-gray-500">(Opsional)</span>
          )}
        </Label>

        {selectedLeaveType?.requiresDocument && (
          <p className="rounded border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-700">
            {selectedLeaveType.name} memerlukan dokumen pendukung (surat dokter,
            undangan, dll)
          </p>
        )}

        <Input
          id="attachment"
          name="attachment"
          type="file"
          onChange={handleFileChange}
          disabled={isLoading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />

        {formData.attachment && (
          <p className="flex items-center gap-2 text-sm text-green-600">
            <FileText className="h-4 w-4" />
            {formData.attachment.name} (
            {(formData.attachment.size / 1024).toFixed(1)} KB)
          </p>
        )}

        {errors.attachment && (
          <p className="text-sm text-red-600">{errors.attachment}</p>
        )}

        <p className="text-xs text-gray-500">
          Format: PDF, JPG, PNG, DOC, DOCX (Maks 5MB)
        </p>
      </div>

      <div className="flex items-center gap-3 border-t pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Mengirim..." : "Ajukan Cuti"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/leave")}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
