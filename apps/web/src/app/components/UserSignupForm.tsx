"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { createClient } from "@lib/supabase";
import { useTheme } from "@lib/theme-context";
import DotGridCanvas from "./ui/DotGridCanvas";

export function UserSignupForm() {
  const supabase = createClient();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTheme = mounted ? theme : "dark";
  const [signupComplete, setSignupComplete] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const getCallbackRedirectUrl = () => {
    const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const envOrigin =
      envSiteUrl && /^https?:\/\//i.test(envSiteUrl)
        ? envSiteUrl.replace(/\/+$/, "")
        : null;

    const origin =
      envOrigin ??
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

    return `${origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`;
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsEmailLoading(true);

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please try again.");
        return;
      }

      // Validate password length
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }

      // Check if email already exists
      const checkEmailResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!checkEmailResponse.ok) {
        setError("Unable to verify email. Please try again.");
        return;
      }

      const { exists } = await checkEmailResponse.json();

      if (exists) {
        setError("This email is already in use");
        return;
      }

      const callbackRedirectUrl = getCallbackRedirectUrl();
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackRedirectUrl,
        },
      });
 
      if (signupError) {
        const duplicateEmailPatterns = [
          "already registered",
          "already been registered",
          "user already registered",
          "email already",
        ];

        const isDuplicateEmailError = duplicateEmailPatterns.some((pattern) =>
          (signupError.message || "").toLowerCase().includes(pattern)
        );

        if (isDuplicateEmailError) {
          setError("This email is already in use");
        } else {
          setError(signupError.message || "Unable to create account.");
        }
        return;
      }

      // Persist stay signed in preference and email if checkbox is checked
      if (staySignedIn) {
        localStorage.setItem("staySignedIn", "true");
        localStorage.setItem("lastEmail", email);
      }

      // Show verification message instead of redirecting
      setSignupComplete(true);
      setSignupEmail(email);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Email signup failed:", err);
      setError("Something went wrong while signing up.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendError("");
    setResendMessage("");
    setIsResendLoading(true);

    try {
      const response = await fetch("/api/auth/resend-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: signupEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        setResendError(data.error || "Failed to resend email. Please try again.");
        return;
      }

      setResendMessage("Verification email sent! Check your inbox.");
    } catch (err) {
      console.error("Resend email failed:", err);
      setResendError("Something went wrong. Please try again.");
    } finally {
      setIsResendLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const callbackRedirectUrl = getCallbackRedirectUrl();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackRedirectUrl,
        },
      });

      if (oauthError) {
        setError(oauthError.message || "Google sign-up failed.");
        setIsGoogleLoading(false);
      }
    } catch (err) {
      console.error("Google signup failed:", err);
      setError("Something went wrong while starting Google sign-up.");
      setIsGoogleLoading(false);
    }
  };

  // Show verification confirmation screen after successful signup
  if (signupComplete) {
    return (
      <div className="relative min-h-screen w-full bg-page flex items-center justify-center px-4 py-10 overflow-hidden">
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <DotGridCanvas maxNodes={22} />
        </div>
        
        {/* Subtly animated glow blob for depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-[460px] h-[460px] md:w-[720px] md:h-[720px] rounded-full dark:bg-[#545BFF]/16 bg-[#545BFF]/12 blur-[100px] pointer-events-none transform-gpu animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative z-[10] w-full max-w-md rounded-2xl border border-[#545BFF]/20 dark:bg-[#0d0e1a]/70 bg-white/85 backdrop-blur-xl shadow-[0_12px_40px_rgba(84,91,255,0.12)] dark:shadow-none p-5 sm:p-6 transition-[border-color,box-shadow] duration-300 hover:border-[#545BFF]/40">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-3 flex items-center gap-2 text-[13px] text-faded hover:text-heading transition"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center">
              <Image
                src={effectiveTheme === "dark" ? "/images/light-logo.png" : "/images/dark-logo (1).png"}
                alt="SmartShield"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">Verify Your Email</h1>
            <p className="mt-1 text-sm text-copy/75 font-light">
              We've sent a verification email to <strong>{signupEmail}</strong>
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-[#545BFF]/40 dark:bg-[#545BFF]/10 bg-[#545BFF]/5 px-4 py-2 text-[13px] text-copy">
              <p className="font-semibold text-[#545BFF] dark:text-[#a89de8] mb-1">📧 Account Created Successfully!</p>
              <p>Please check your email and click the verification link to activate your account.</p>
            </div>

            <div className="rounded-lg border border-[#545BFF]/20 dark:bg-[#0a0d1a]/50 bg-white/50 px-4 py-2 text-[13px] text-copy/80 space-y-1 backdrop-blur-sm">
              <p>✓ Check your inbox for the verification email</p>
              <p>✓ Click the confirmation link to verify your email</p>
              <p>✓ You'll be redirected to the homepage after verification</p>
              <p>✓ If it's a Gmail account, check your spam/promotions folder</p>
            </div>

            {resendError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 backdrop-blur-sm">
                {resendError}
              </div>
            )}

            {resendMessage && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
                {resendMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResendLoading}
              className="w-full mt-1.5 rounded-lg border border-[#545BFF]/30 dark:bg-[#0a0d1a]/50 bg-white/60 px-4 py-2.5 text-sm font-semibold text-heading hover:bg-[#545BFF]/5 dark:hover:bg-[#545BFF]/15 transition-all duration-300 disabled:opacity-65 shadow-sm"
            >
              {isResendLoading ? "Sending..." : "Resend Verification Email"}
            </button>

            <p className="text-center text-[13px] text-copy/70 mt-4">
              Changed your mind?{" "}
              <button
                onClick={() => {
                  setSignupComplete(false);
                  setSignupEmail("");
                  setResendMessage("");
                  setResendError("");
                }}
                className="text-[#545BFF] dark:text-[#7c83ff] hover:text-[#6b72ff] dark:hover:text-[#a3a8ff] font-semibold transition-colors"
              >
                Create a different account
              </button>
            </p>

            <p className="text-center text-[13px] text-copy/70">
              Already have an account?{" "}
              <Link href="/login" className="text-[#545BFF] dark:text-[#7c83ff] hover:text-[#6b72ff] dark:hover:text-[#a3a8ff] font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-page flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <DotGridCanvas maxNodes={22} />
      </div>
      
      {/* Subtly animated glow blob for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-[460px] h-[460px] md:w-[720px] md:h-[720px] rounded-full dark:bg-[#545BFF]/16 bg-[#545BFF]/12 blur-[100px] pointer-events-none transform-gpu animate-pulse" style={{ animationDuration: '4s' }} />

      <div className="relative z-[10] w-full max-w-md rounded-2xl border border-[#545BFF]/20 dark:bg-[#0d0e1a]/70 bg-white/85 backdrop-blur-xl shadow-[0_12px_40px_rgba(84,91,255,0.12)] dark:shadow-none p-5 sm:p-6 transition-[border-color,box-shadow] duration-300 hover:border-[#545BFF]/40">          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-3 flex items-center gap-2 text-[13px] text-faded hover:text-heading transition"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>        <div className="mb-5 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Image
              src={effectiveTheme === "dark" ? "/images/light-logo.png" : "/images/dark-logo (1).png"}
              alt="SmartShield"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">Create your SmartShield account</h1>
          <p className="mt-2 text-sm text-copy/75 font-light">
            Sign up with email and password or continue with Google.
          </p>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-[13px] font-medium text-copy">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#545BFF]/20 dark:bg-[#0a0d1a]/50 bg-white/50 px-3.5 py-2.5 text-sm text-heading placeholder:text-faded focus:outline-none focus:border-[#545BFF]/50 focus:ring-1 focus:ring-[#545BFF]/50 backdrop-blur-sm transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-[13px] font-medium text-copy">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border border-[#545BFF]/20 dark:bg-[#0a0d1a]/50 bg-white/50 px-3.5 py-2.5 pr-11 text-sm text-heading placeholder:text-faded focus:outline-none focus:border-[#545BFF]/50 focus:ring-1 focus:ring-[#545BFF]/50 backdrop-blur-sm transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-faded hover:text-copy"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-copy">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-[#545BFF]/20 dark:bg-[#0a0d1a]/50 bg-white/50 px-3.5 py-2.5 pr-11 text-sm text-heading placeholder:text-faded focus:outline-none focus:border-[#545BFF]/50 focus:ring-1 focus:ring-[#545BFF]/50 backdrop-blur-sm transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-faded hover:text-copy"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 backdrop-blur-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
              {message}
            </div>
          )}

          <div className="pt-1">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="w-4 h-4 rounded border-[#545BFF]/30 dark:bg-[#0a0d1a]/70 bg-white/50 text-[#545BFF] focus:ring-[#545BFF]/30 cursor-pointer"
              />
              <span className="ml-2.5 text-[13px] text-copy/80 group-hover:text-copy transition-colors">Stay signed in</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isEmailLoading || isGoogleLoading}
            className="relative mt-1.5 w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF] py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(84,91,255,0.3)] hover:shadow-[0_0_32px_rgba(84,91,255,0.5)] hover:-translate-y-px transition-all duration-300 disabled:opacity-65 disabled:hover:translate-y-0 overflow-hidden group"
          >
            <span className="relative z-10">{isEmailLoading ? "Creating account..." : "Sign up"}</span>
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-divider/30" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-faded/70">or continue with</span>
          <span className="h-px flex-1 bg-divider/30" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading || isEmailLoading}
          className="w-full flex justify-center items-center gap-2.5 rounded-lg border border-[#545BFF]/20 dark:bg-[#0d0e1a]/40 bg-white/60 px-4 py-2.5 text-sm font-semibold text-heading shadow-sm hover:border-[#545BFF]/40 dark:hover:bg-[#545BFF]/10 hover:bg-[#545BFF]/5 hover:-translate-y-px transition-all duration-300 disabled:opacity-65 disabled:hover:translate-y-0"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {isGoogleLoading ? "Redirecting..." : "Google"}
        </button>

        <p className="mt-5 text-center text-[13px] text-copy/70">
          Already have an account?{" "}
          <Link href="/login" className="text-[#545BFF] dark:text-[#7c83ff] hover:text-[#6b72ff] dark:hover:text-[#a3a8ff] font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}