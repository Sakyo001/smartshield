"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@lib/supabase";

export function UserSignupForm() {
  const supabase = createClient();
  const router = useRouter();
  const [signupComplete, setSignupComplete] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const getCallbackRedirectUrl = () => {
    if (typeof window === "undefined") {
      return "http://localhost:3001/auth/callback?next=/";
    }

    const { protocol, hostname } = window.location;
    const canonicalOrigin =
      hostname === "www.smartshield.it.com"
        ? "https://smartshield.it.com"
        : `${protocol}//${hostname}${window.location.port ? `:${window.location.port}` : ""}`;

    return `${canonicalOrigin}/auth/callback?next=/`;
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
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-black flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-800/55 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Image
                src="/images/light-logo.png"
                alt="SmartShield"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Verify Your Email</h1>
            <p className="mt-2 text-sm text-slate-300">
              We've sent a verification email to <strong>{signupEmail}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
              <p className="font-semibold mb-2">📧 Account Created Successfully!</p>
              <p>Please check your email and click the verification link to activate your account.</p>
            </div>

            <div className="rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 space-y-2">
              <p>✓ Check your inbox for the verification email</p>
              <p>✓ Click the confirmation link to verify your email</p>
              <p>✓ You'll be redirected to the homepage after verification</p>
              <p>✓ If it's a Gmail account, check your spam/promotions folder</p>
            </div>

            {resendError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {resendError}
              </div>
            )}

            {resendMessage && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {resendMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResendLoading}
              className="w-full rounded-lg border border-slate-500 bg-slate-900/70 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-300 disabled:opacity-65"
            >
              {isResendLoading ? "Sending..." : "Resend Verification Email"}
            </button>

            <p className="text-center text-xs text-slate-400 mt-6">
              Changed your mind?{" "}
              <button
                onClick={() => {
                  setSignupComplete(false);
                  setSignupEmail("");
                  setResendMessage("");
                  setResendError("");
                }}
                className="text-[#8d93ff] hover:text-[#b2b6ff] font-semibold"
              >
                Create a different account
              </button>
            </p>

            <p className="text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-[#8d93ff] hover:text-[#b2b6ff] font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-900 to-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-800/55 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Image
              src="/images/light-logo.png"
              alt="SmartShield"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Create your SmartShield account</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign up with email and password or continue with Google.
          </p>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B73FF]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B73FF]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6B73FF]"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {message}
            </div>
          )}

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={staySignedIn}
              onChange={(e) => setStaySignedIn(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-900/70 text-[#6B73FF] accent-[#6B73FF] cursor-pointer"
            />
            <span className="ml-2 text-sm text-slate-300">Stay signed in</span>
          </label>

          <button
            type="submit"
            disabled={isEmailLoading || isGoogleLoading}
            className="w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-65"
          >
            {isEmailLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-600/70" />
          <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-600/70" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading || isEmailLoading}
          className="w-full rounded-lg border border-slate-500 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-white transition hover:border-slate-300 disabled:opacity-65"
        >
          {isGoogleLoading ? "Redirecting to Google..." : "Sign up with Google"}
        </button>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8d93ff] hover:text-[#b2b6ff] font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}