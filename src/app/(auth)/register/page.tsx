"use client";

// src/app/(auth)/register/page.tsx

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

import { createClient } from "@/src/lib/supabase/client";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

function ArsadayaIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="200" height="200" fill="#0B5A43" />
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
      <circle cx="100" cy="38" r="16" fill="#F7A81B" />
    </svg>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-sm font-medium text-white">{label}</p>
    </div>
  );
}

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    organizationName: z
      .string()
      .trim()
      .min(3, "Company name must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRegisterErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to create account. Please try again.";
  }

  if (error.message.includes("User already registered")) {
    return "This email is already registered.";
  }

  if (error.message.includes("already exists")) {
    return "This account or organization already exists.";
  }

  if (error.message.includes("Password should be at least")) {
    return "Password does not meet the minimum security requirement.";
  }

  return error.message || "Unable to create account. Please try again.";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-xs text-red-600">{message}</p>;
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [termsError, setTermsError] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      organizationName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (!acceptTerms) {
      setTermsError("You must accept the terms to continue.");
      return;
    }

    setIsSubmitting(true);
    setTermsError("");
    setError(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
            },
          },
        },
      );

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("Failed to create account.");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: authData.user.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          organizationName: data.organizationName,
          organizationSlug: generateSlug(data.organizationName),
        }),
      });

      if (!response.ok) {
        const responseData = await response.json().catch(() => null);
        throw new Error(
          responseData?.error ?? "Failed to create organization.",
        );
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (registerError) {
      setError(getRegisterErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#F8FBF8]">
        <div className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px] rounded-xl border border-gray-200 bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF5F0] text-[#0B5A43]">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#0B5A43]">
              Account created
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
              Check your email
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Your account has been created. Please verify your email before
              signing in.
            </p>

            <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                Redirecting to login page...
              </p>
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0B5A43] px-4 text-sm font-semibold text-white transition hover:bg-[#084735]"
            >
              Go to login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FBF8]">
      <div className="grid min-h-screen lg:grid-cols-[520px_1fr]">
        <section className="relative hidden overflow-hidden bg-[#0B5A43] text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F7A81B]/25" />
          <div className="pointer-events-none absolute bottom-24 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-black/10" />

          <div className="relative p-10">
            <div className="flex items-center gap-3">
              <ArsadayaIcon size={42} />
              <div>
                <p className="text-base font-bold tracking-[0.28em]">
                  ARSADAYA
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  HR management system
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-10">
            <p className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Start managing your people operations with confidence.
            </p>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Create your company workspace and set up attendance, leave,
              payroll, and employee records in one place.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              <FeatureItem label="Employee records" />
              <FeatureItem label="Attendance" />
              <FeatureItem label="Leave policy" />
              <FeatureItem label="Payroll" />
            </div>
          </div>

          <div className="relative p-10 text-xs text-white/45">
            © {new Date().getFullYear()} ARSADAYA. All rights reserved.
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-6">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <ArsadayaIcon size={38} />
              <div>
                <p className="text-sm font-bold tracking-[0.25em] text-[#0B5A43]">
                  ARSADAYA
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  HR management system
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B5A43]">
                  Create workspace
                </p>

                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
                  Create your account
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  Set up your company account and organization workspace.
                </p>
              </div>

              {error && (
                <div className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-5"
                noValidate
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Personal information
                  </p>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium text-gray-800"
                      >
                        First name
                      </Label>

                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          autoComplete="given-name"
                          disabled={isSubmitting}
                          aria-invalid={Boolean(errors.firstName)}
                          className="h-11 pl-9 text-sm focus-visible:ring-[#0B5A43]"
                          {...register("firstName")}
                        />
                      </div>

                      <FieldError message={errors.firstName?.message} />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-medium text-gray-800"
                      >
                        Last name
                      </Label>

                      <Input
                        id="lastName"
                        placeholder="Doe"
                        autoComplete="family-name"
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.lastName)}
                        className="h-11 text-sm focus-visible:ring-[#0B5A43]"
                        {...register("lastName")}
                      />

                      <FieldError message={errors.lastName?.message} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-800"
                    >
                      Email address
                    </Label>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.email)}
                        className="h-11 pl-9 text-sm focus-visible:ring-[#0B5A43]"
                        {...register("email")}
                      />
                    </div>

                    <FieldError message={errors.email?.message} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Organization
                  </p>

                  <div className="mt-3 space-y-1.5">
                    <Label
                      htmlFor="organizationName"
                      className="text-sm font-medium text-gray-800"
                    >
                      Company name
                    </Label>

                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="organizationName"
                        placeholder="Acme Corporation"
                        autoComplete="organization"
                        disabled={isSubmitting}
                        aria-invalid={Boolean(errors.organizationName)}
                        className="h-11 pl-9 text-sm focus-visible:ring-[#0B5A43]"
                        {...register("organizationName")}
                      />
                    </div>

                    <FieldError message={errors.organizationName?.message} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Security
                  </p>

                  <div className="mt-3 space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-800"
                      >
                        Password
                      </Label>

                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          aria-invalid={Boolean(errors.password)}
                          className="h-11 pl-9 pr-10 text-sm focus-visible:ring-[#0B5A43]"
                          {...register("password")}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          disabled={isSubmitting}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0B5A43] disabled:opacity-50"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <FieldError message={errors.password?.message} />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-gray-800"
                      >
                        Confirm password
                      </Label>

                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repeat your password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          aria-invalid={Boolean(errors.confirmPassword)}
                          className="h-11 pl-9 pr-10 text-sm focus-visible:ring-[#0B5A43]"
                          {...register("confirmPassword")}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((current) => !current)
                          }
                          disabled={isSubmitting}
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0B5A43] disabled:opacity-50"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <FieldError message={errors.confirmPassword?.message} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptTerms}
                      disabled={isSubmitting}
                      onChange={(event) => {
                        setAcceptTerms(event.target.checked);
                        if (event.target.checked) setTermsError("");
                      }}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 accent-[#0B5A43]"
                    />

                    <span className="text-xs leading-relaxed text-gray-600">
                      I agree to ARSADAYA&apos;s{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="font-semibold text-[#0B5A43] hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="font-semibold text-[#0B5A43] hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {termsError && (
                    <p className="mt-1.5 text-xs text-red-600">{termsError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0B5A43] px-4 text-sm font-semibold text-white transition hover:bg-[#084735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A43] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm font-semibold text-[#0B5A43] hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Already have an account? Sign in
                </Link>
              </div>
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
              This will create an owner account for your organization workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
