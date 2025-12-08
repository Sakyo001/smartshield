"use client";
import { useAuth } from "@lib/auth-context";
import { createClient } from "@lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserLoginForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.id}`);
    }
  }, [user, router]);

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      router.push(`/dashboard/${data.user.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Login Container */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex w-full max-w-5xl gap-0">
          {/* Left Side - Blue Section with Shield */}
          <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-2xl p-12 flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Heading */}
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Securely manage your system and operations.
            </h2>

            {/* Shield Icon */}
            <div className="relative mb-12 ">
              <Image
                src="/images/loginlogo.png"
                alt="SmartShield Shield"
                width={400}
                height={400}
                className="drop-shadow-2xl"
              />
            </div>

            {/* Bottom Text */}
            <p className="text-center text-white/80 max-w-sm">
              Log in to access your tools and keep everything running smoothly.
            </p>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center lg:rounded-r-2xl rounded-2xl lg:rounded-l-none bg-white border lg:border-l-0 border-gray-200">
            {/* Logo and Title */}
            {/* Top Back Link */}
            <div className="">
              <Link href="/">
                <button className="text-sm text-black hover:text-black flex items-center gap-1">
                  ← Go back
                </button>
              </Link>
            </div>
            <div className="mb-8 flex justify-center ">
              <div className="flex items-center gap-2 mb-2">
                <Image
                  src="/images/miniloginlogo.png"
                  alt="SmartShield"
                  width={55}
                  height={55}
                />
                <span className="text-3xl font-bold text-gray-900">
                  SmartShield
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSignIn} className="space-y-5 mb-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#545BFF] focus:border-transparent"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#545BFF] focus:border-transparent"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-[#545BFF] rounded border-gray-300 focus:ring-[#545BFF]"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>

              {/* Log In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#545BFF] text-white rounded-lg font-medium hover:bg-[#4349dd] transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "Signing in..." : "Log In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-400 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10V12.05H15.5818C15.3364 13.3 14.5636 14.3591 13.3864 15.0682V17.5773H16.7182C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z"
                  fill="#4285F4"
                />
                <path
                  d="M10 20C12.7 20 14.9636 19.1045 16.7182 17.5773L13.3864 15.0682C12.3909 15.6682 11.1455 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.31364 11.9H0.863636V14.4909C2.60909 17.9591 6.07273 20 10 20Z"
                  fill="#34A853"
                />
                <path
                  d="M4.31364 11.9C4.10909 11.3 4 10.6591 4 10C4 9.34091 4.10909 8.7 4.31364 8.1V5.50909H0.863636C0.313636 6.59091 0 7.75909 0 10C0 12.2409 0.313636 13.4091 0.863636 14.4909L4.31364 11.9Z"
                  fill="#FBBC04"
                />
                <path
                  d="M10 3.97727C11.2636 3.97727 12.3909 4.38182 13.2909 5.23636L16.2409 2.28636C14.9545 1.08636 12.7 0 10 0C6.07273 0 2.60909 2.04091 0.863636 5.50909L4.31364 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 text-sm mt-8">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-[#545BFF] hover:underline font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
