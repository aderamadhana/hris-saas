"use client";

// src/app/(auth)/forgot-password/page.tsx

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";

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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getResetErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to send reset instructions. Please try again.";
  }

  if (error.message) {
    return error.message;
  }

  return "Unable to send reset instructions. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [emailSent, setEmailSent] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fieldError, setFieldError] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const normalizedEmail = email.trim();

  const validate = () => {
    if (!normalizedEmail) {
      setFieldError("Email is required.");
      return false;
    }

    if (!isValidEmail(normalizedEmail)) {
      setFieldError("Enter a valid email address.");
      return false;
    }

    setFieldError("");
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) {
        throw error;
      }

      setEmailSent(true);
    } catch (error) {
      setSubmitError(getResetErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setSubmitError(null);
    setFieldError("");
  };

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
              Reset access securely and get back to work.
            </p>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Enter your company email. If an account exists, we will send a
              secure password reset link.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              <FeatureItem label="Secure reset" />
              <FeatureItem label="Email verification" />
              <FeatureItem label="Protected access" />
              <FeatureItem label="Fast recovery" />
            </div>
          </div>

          <div className="relative p-10 text-xs text-white/45">
            © {new Date().getFullYear()} ARSADAYA. All rights reserved.
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-6">
          <div className="w-full max-w-[420px]">
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
              {!emailSent ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0B5A43]">
                      Password recovery
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
                      Forgot your password?
                    </h1>

                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      Enter your email address and we will send password reset
                      instructions if your account exists.
                    </p>
                  </div>

                  {submitError && (
                    <div className="mt-5 flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{submitError}</p>
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-5"
                    noValidate
                  >
                    <div className="space-y-1.5">
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
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          value={email}
                          disabled={isLoading}
                          aria-invalid={Boolean(fieldError)}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            if (fieldError) setFieldError("");
                            if (submitError) setSubmitError(null);
                          }}
                          className="h-11 pl-9 text-sm focus-visible:ring-[#0B5A43]"
                        />
                      </div>

                      {fieldError && (
                        <p className="text-xs text-red-600">{fieldError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0B5A43] px-4 text-sm font-semibold text-white transition hover:bg-[#084735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A43] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending instructions
                        </>
                      ) : (
                        <>
                          Send reset instructions
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
                      Back to login
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF5F0] text-[#0B5A43]">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#0B5A43]">
                      Check your inbox
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
                      Reset instructions sent
                    </h1>

                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      If an account exists for this email, you will receive a
                      secure password reset link shortly.
                    </p>

                    <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="break-words text-sm font-semibold text-gray-900">
                        {normalizedEmail}
                      </p>
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-gray-500">
                      Did not receive the email? Check your spam folder or try
                      again with another email address.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <button
                      type="button"
                      onClick={handleTryAgain}
                      className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#0B5A43]/30 px-4 text-sm font-semibold text-[#0B5A43] transition hover:border-[#0B5A43] hover:bg-[#EAF5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A43] focus-visible:ring-offset-2"
                    >
                      Try another email
                    </button>

                    <Link
                      href="/login"
                      className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0B5A43] px-4 text-sm font-semibold text-white transition hover:bg-[#084735] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5A43] focus-visible:ring-offset-2"
                    >
                      Back to login
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </>
              )}
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-gray-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0B5A43] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
