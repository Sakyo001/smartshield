"use client";
import { useAuth } from "@lib/auth-context";
import { createClient } from "@lib/supabase";
import { syncUserToDatabase, linkSocialAccount } from "@lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserLoginForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendLink, setShowResendLink] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.id}`);
    }
  }, [user, router]);

  useEffect(() => {
    const authError = searchParams.get("error");
    const reason = searchParams.get("reason");
    if (authError === "auth_failed") {
      setError(
        reason
          ? `Authentication failed: ${reason}`
          : "Authentication failed. Check the browser console and server logs for details."
      );
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowResendLink(false);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if error is due to unconfirmed email
      if (error.message.toLowerCase().includes('email') && 
          (error.message.toLowerCase().includes('confirm') || 
           error.message.toLowerCase().includes('verif'))) {
        setError("Please verify your email address before logging in. Check your inbox for the confirmation email.");
        setShowResendLink(true);
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else if (data.user) {
      // Sync user to users table on login
      await syncUserToDatabase(data.user.id, email);
      router.push(`/dashboard/${data.user.id}`);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      setError(null);
      alert("Confirmation email sent! Please check your inbox and spam folder.");
    } catch (err) {
      setError("Failed to resend confirmation email. Please try signing up again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Back to home */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-faded hover:text-heading transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/">
            <Image
              src="/images/miniloginlogo.png"
              alt="SmartShield"
              width={48}
              height={48}
              className="object-contain"
            />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-heading">
          Log in to SmartShield
        </h2>
        <p className="mt-2 text-center text-sm text-faded">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-[#7B83FF] hover:text-[#a5adff] transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-panel py-8 px-4 sm:rounded-xl sm:px-10 border border-divider">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <svg
                  className="flex-shrink-0 mt-0.5"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                </svg>
                <div className="flex-1">
                  <p>{error}</p>
                  {showResendLink && (
                    <button
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      className="mt-2 text-sm font-semibold text-red-300 hover:text-red-200 underline disabled:opacity-50"
                    >
                      Resend confirmation email
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-copy">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-divider bg-inset px-3 py-2.5 text-heading placeholder-gray-500 focus:border-[#545BFF] focus:outline-none focus:ring-1 focus:ring-[#545BFF] sm:text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-copy">
                  Password
                </label>
                <div className="text-sm">
                  <Link href="#" className="font-medium text-[#7B83FF] hover:text-[#a5adff] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-divider bg-inset px-3 py-2.5 text-heading placeholder-gray-500 focus:border-[#545BFF] focus:outline-none focus:ring-1 focus:ring-[#545BFF] sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-divider bg-inset text-[#545BFF] focus:ring-[#545BFF]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-faded">
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-[#545BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4349dd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#545BFF] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-divider" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-panel px-2 text-faded">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-inset px-4 py-2.5 text-sm font-semibold text-copy border border-divider hover:bg-panel hover:border-faded transition-colors disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10V12.05H15.5818C15.3364 13.3 14.5636 14.3591 13.3864 15.0682V17.5773H16.7182C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
                  <path d="M10 20C12.7 20 14.9636 19.1045 16.7182 17.5773L13.3864 15.0682C12.3909 15.6682 11.1455 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.31364 11.9H0.863636V14.4909C2.60909 17.9591 6.07273 20 10 20Z" fill="#34A853"/>
                  <path d="M4.31364 11.9C4.10909 11.3 4 10.6591 4 10C4 9.34091 4.10909 8.7 4.31364 8.1V5.50909H0.863636C0.318182 6.59091 0 7.76364 0 10C0 12.2364 0.318182 13.4091 0.863636 14.4909L4.31364 11.9Z" fill="#FBBC05"/>
                  <path d="M10 3.97727C11.2636 3.97727 12.4091 4.40909 13.3182 5.27273L16.2727 2.31818C14.9636 1.08182 12.7 0 10 0C6.07273 0 2.60909 2.04091 0.863636 5.50909L4.31364 8.1C5.19091 5.73736 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
