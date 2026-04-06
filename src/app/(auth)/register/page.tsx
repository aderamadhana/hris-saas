// src/app/(auth)/register/page.tsx
// FIXED - Centered card layout, no overlap, mobile-friendly

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { useToast } from "@/src/hooks/use-toast";
import {
  Loader2,
  Mail,
  Lock,
  Building2,
  User,
  Chrome,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    organizationName: "",
    acceptedTerms: false,
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    organizationName: "",
    acceptedTerms: "",
  });

  const validate = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      organizationName: "",
      acceptedTerms: "",
    };
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
      isValid = false;
    }

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = "You must accept the Terms of Service";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          organizationName: formData.organizationName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create organization");
      }

      toast({
        title: "Success",
        description: "Account created! Please check your email to verify.",
      });

      router.push("/login?registered=true");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!formData.acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms of Service to continue",
        variant: "destructive",
      });
      return;
    }

    setIsGoogleLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 shadow-lg">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">HRIS</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white shadow-xl rounded-lg">
          <div className="px-6 py-8 sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`pl-10 ${errors.firstName ? "border-red-500" : ""}`}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="mt-2">
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.lastName ? "border-red-500" : ""}
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Organization */}
              <div>
                <Label htmlFor="organizationName">Organization</Label>
                <div className="relative mt-2">
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="organizationName"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`pl-10 ${errors.organizationName ? "border-red-500" : ""}`}
                    placeholder="Acme Inc."
                  />
                </div>
                {errors.organizationName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.organizationName}
                  </p>
                )}
              </div>

              {/* ToS Checkbox */}
              <div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="acceptedTerms"
                    checked={formData.acceptedTerms}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        acceptedTerms: checked as boolean,
                      }));
                      if (errors.acceptedTerms) {
                        setErrors((prev) => ({ ...prev, acceptedTerms: "" }));
                      }
                    }}
                    disabled={isLoading}
                    className={errors.acceptedTerms ? "border-red-500" : ""}
                  />
                  <Label
                    htmlFor="acceptedTerms"
                    className="text-xs font-normal text-gray-700 cursor-pointer leading-tight"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.acceptedTerms && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.acceptedTerms}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading || !formData.acceptedTerms}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>
            {!formData.acceptedTerms && (
              <p className="mt-2 text-xs text-center text-gray-500">
                Accept Terms to enable Google sign-up
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
