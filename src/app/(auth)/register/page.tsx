"use client";

// src/app/(auth)/register/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

function ArsadayaIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="200" height="200" rx="42" fill="#2D6A50" />
      <line
        x1="100"
        y1="52"
        x2="44"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="52"
        x2="156"
        y2="162"
        stroke="white"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="65"
        y1="122"
        x2="135"
        y2="122"
        stroke="white"
        strokeWidth="19"
        strokeLinecap="round"
      />
      <circle cx="100" cy="38" r="16" fill="#F5A623" />
    </svg>
  );
}

const schema = z
  .object({
    firstName: z.string().min(2, "At least 2 characters"),
    lastName: z.string().min(2, "At least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    organizationName: z.string().min(3, "At least 3 characters"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

const inputStyle = { borderColor: "#E5E7EB", background: "white" };
const labelStyle = { color: "#374151" };

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-xs font-medium mb-1.5 block"
      style={labelStyle}
    >
      {children}
    </Label>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPwd, setShowPwd] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [acceptTos, setAcceptTos] = useState(false);
  const [tosError, setTosError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const onSubmit = async (data: FormData) => {
    if (!acceptTos) {
      setTosError(true);
      return;
    }
    setTosError(false);
    setIsLoading(true);
    setError(null);
    try {
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { first_name: data.firstName, last_name: data.lastName },
        },
      });
      if (authErr) throw authErr;
      if (!auth.user) throw new Error("Failed to create account");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: auth.user.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          organizationName: data.organizationName,
          organizationSlug: generateSlug(data.organizationName),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(
        err.message?.includes("User already registered")
          ? "This email is already registered."
          : (err.message ?? "Something went wrong."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F4F5F7" }}
      >
        <div
          className="bg-white rounded-xl p-10 text-center max-w-sm w-full shadow-sm"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <CheckCircle2
            className="h-12 w-12 mx-auto mb-4"
            style={{ color: "#2D6A50" }}
          />
          <h2
            className="text-lg font-semibold mb-1.5"
            style={{ color: "#111827" }}
          >
            Account created!
          </h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Check your email to verify. Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F5F7" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "#111B15" }}
      >
        <div className="flex items-center gap-2.5">
          <ArsadayaIcon size={32} />
          <span
            className="text-white font-bold tracking-widest text-base"
            style={{ fontFamily: "Georgia, serif" }}
          >
            ARSADAYA
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-white leading-snug mb-3">
            Manage your team
            <br />
            with confidence.
          </p>
          <p className="text-sm" style={{ color: "#52A688" }}>
            Attendance · Leave · Payroll · Reports
          </p>
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} ARSADAYA. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <ArsadayaIcon size={28} />
            <span
              className="font-bold tracking-widest text-sm"
              style={{ color: "#111B15", fontFamily: "Georgia, serif" }}
            >
              ARSADAYA
            </span>
          </div>

          <h1
            className="text-xl font-semibold mb-1"
            style={{ color: "#111827" }}
          >
            Create account
          </h1>
          <p className="text-sm mb-7" style={{ color: "#6B7280" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "#2D6A50" }}
              className="font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>

          {error && (
            <div
              className="mb-5 px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: "#FEF2F2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Section: Personal */}
            <p
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "#9CA3AF" }}
            >
              Personal
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                  className="h-9 text-sm"
                  style={inputStyle}
                />
                {errors.firstName && (
                  <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                  className="h-9 text-sm"
                  style={inputStyle}
                />
                {errors.lastName && (
                  <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                {...register("email")}
                className="h-9 text-sm"
                style={inputStyle}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Section: Organization */}
            <p
              className="text-[10px] font-semibold tracking-widest uppercase pt-1"
              style={{ color: "#9CA3AF" }}
            >
              Organization
            </p>

            <div>
              <FieldLabel htmlFor="organizationName">Company Name</FieldLabel>
              <Input
                id="organizationName"
                placeholder="Acme Corporation"
                {...register("organizationName")}
                className="h-9 text-sm"
                style={inputStyle}
              />
              {errors.organizationName && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            {/* Section: Security */}
            <p
              className="text-[10px] font-semibold tracking-widest uppercase pt-1"
              style={{ color: "#9CA3AF" }}
            >
              Security
            </p>

            <div>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  {...register("password")}
                  className="h-9 text-sm pr-9"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#9CA3AF" }}
                >
                  {showPwd ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="confirmPassword">
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConf ? "text" : "password"}
                  placeholder="Repeat password"
                  {...register("confirmPassword")}
                  className="h-9 text-sm pr-9"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(!showConf)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#9CA3AF" }}
                >
                  {showConf ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* ToS */}
            <div className="flex items-start gap-2.5">
              <input
                id="tos"
                type="checkbox"
                checked={acceptTos}
                onChange={(e) => {
                  setAcceptTos(e.target.checked);
                  if (e.target.checked) setTosError(false);
                }}
                className="h-3.5 w-3.5 mt-0.5 cursor-pointer rounded"
                style={{ accentColor: "#2D6A50" }}
              />
              <label
                htmlFor="tos"
                className="text-xs leading-relaxed cursor-pointer"
                style={{ color: "#6B7280" }}
              >
                I agree to ARSADAYA's{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="hover:underline"
                  style={{ color: "#2D6A50" }}
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="hover:underline"
                  style={{ color: "#2D6A50" }}
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
            {tosError && (
              <p className="text-xs" style={{ color: "#DC2626" }}>
                You must accept the terms to continue.
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: "#2D6A50" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating
                  account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
