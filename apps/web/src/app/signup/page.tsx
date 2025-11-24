"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@lib/supabase"
import { useAuth } from "@lib/auth-context"

export default function SignUpPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      router.replace(`/dashboard/${user.id}`)
    }
  }, [user, router])

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate inputs
    if (!email || !password || !confirmPassword) {
      setError("All fields are required")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      })

      if (signUpError) throw signUpError

      if (data.user) {
        setSuccess(true)
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-12 max-w-md text-center">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-black mb-4">Account Created!</h2>
          <p className="text-gray-600 mb-6">
            Please check your email to verify your account. Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4 pt-24 md:pt-4">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 md:px-8 py-4 md:py-6 z-50 bg-[#141414]/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/light-logo.png" alt="SmartShield" width={32} height={32} className="md:w-10 md:h-10" />
          <span className="text-white text-lg md:text-xl font-semibold">SmartShield</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-white hover:text-gray-300">Home</Link>
          <Link href="/#scan" className="text-white hover:text-gray-300">Scan</Link>
          <Link href="/#about" className="text-white hover:text-gray-300">About</Link>
          <Link href="/#faq" className="text-white hover:text-gray-300">FAQ</Link>
          <Link href="/login" className="text-white border border-white rounded-full px-6 py-2 hover:bg-white hover:text-black transition flex items-center gap-2">
            Log In
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </nav>
        <Link href="/login" className="md:hidden text-white text-sm border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition">
          Log In
        </Link>
      </header>

      {/* Main Sign Up Container */}
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl mt-20 md:mt-0">
        {/* Left Side - Sign Up Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
          <h1 className="text-2xl md:text-4xl font-bold text-black mb-2">Create Account</h1>
          <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">Join SmartShield to protect your browsing</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
            {/* Display Name Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="7" r="3" stroke="#999" strokeWidth="1.5" fill="none"/>
                  <path d="M4 17c0-2.5 2.5-5 6-5s6 2.5 6 5" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Display Name (Optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-200 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#545BFF]"
              />
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="#999" strokeWidth="1.5" fill="none"/>
                  <path d="M2 5l8 5 8-5" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-200 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#545BFF]"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="9" width="12" height="8" rx="1" stroke="#999" strokeWidth="1.5" fill="none"/>
                  <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-200 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#545BFF]"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="9" width="12" height="8" rx="1" stroke="#999" strokeWidth="1.5" fill="none"/>
                  <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="13" r="1" fill="#999"/>
                </svg>
              </div>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-200 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#545BFF]"
              />
            </div>

            {/* Sign Up Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#545BFF] text-white rounded-lg font-medium hover:bg-[#4349dd] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10V12.05H15.5818C15.3364 13.3 14.5636 14.3591 13.3864 15.0682V17.5773H16.7182C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
              <path d="M10 20C12.7 20 14.9636 19.1045 16.7182 17.5773L13.3864 15.0682C12.3909 15.6682 11.1455 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.31364 11.9H0.863636V14.4909C2.60909 17.9591 6.07273 20 10 20Z" fill="#34A853"/>
              <path d="M4.31364 11.9C4.10909 11.3 4 10.6591 4 10C4 9.34091 4.10909 8.7 4.31364 8.1V5.50909H0.863636C0.318182 6.59091 0 7.76364 0 10C0 12.2364 0.318182 13.4091 0.863636 14.4909L4.31364 11.9Z" fill="#FBBC05"/>
              <path d="M10 3.97727C11.2636 3.97727 12.4091 4.40909 13.3182 5.27273L16.2727 2.31818C14.9636 1.08182 12.7 0 10 0C6.07273 0 2.60909 2.04091 0.863636 5.50909L4.31364 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Already have account */}
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#545BFF] hover:underline font-medium">
              Log In
            </Link>
          </p>
        </div>

        {/* Right Side - Image/Illustration */}
        <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-[#545BFF] to-[#7B83FF] items-center justify-center p-8 md:p-12">
          <div className="text-center text-white">
            <div className="mb-6 md:mb-8">
              <Image 
                src="/images/light-logo.png" 
                alt="SmartShield Logo" 
                width={100} 
                height={100}
                className="mx-auto filter brightness-0 invert md:w-[120px] md:h-[120px]"
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Join SmartShield</h2>
            <p className="text-base md:text-lg opacity-90 max-w-sm mx-auto">
              Protect your browsing with AI-powered phishing detection. Scan websites instantly and browse safely.
            </p>
            <div className="mt-12 space-y-4 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Real-time phishing detection</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Browser extension included</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Scan history & analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
