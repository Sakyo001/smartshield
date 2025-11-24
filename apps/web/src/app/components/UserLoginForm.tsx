"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@lib/supabase"
import { useAuth } from "@lib/auth-context"

export default function UserLoginForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.id}`)
    }
  }, [user, router])

  const handleGoogleSignIn = async () => {
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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      router.push(`/dashboard/${data.user.id}`)
    }
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
          <Link href="/signup" className="text-white border border-white rounded-full px-6 py-2 hover:bg-white hover:text-black transition flex items-center gap-2">
            Sign Up
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </nav>
        <Link href="/signup" className="md:hidden text-white text-sm border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition">
          Sign Up
        </Link>
      </header>

      {/* Main Login Container */}
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl mt-20 md:mt-0">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
          <h1 className="text-2xl md:text-4xl font-bold text-black mb-6 md:mb-8">Welcome!</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-200 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#545BFF]"
              />
            </div>

            {/* Log In Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#545BFF] text-white rounded-lg font-medium hover:bg-[#4349dd] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10V12.05H15.5818C15.3364 13.3 14.5636 14.3591 13.3864 15.0682V17.5773H16.7182C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
              <path d="M10 20C12.7 20 14.9636 19.1045 16.7182 17.5773L13.3864 15.0682C12.3909 15.6682 11.1455 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.31364 11.9H0.863636V14.4909C2.60909 17.9591 6.07273 20 10 20Z" fill="#34A853"/>
              <path d="M4.31364 11.9C4.10909 11.3 4 10.6591 4 10C4 9.34091 4.10909 8.7 4.31364 8.1V5.50909H0.863636C0.313636 6.59091 0 7.75909 0 10C0 12.2409 0.313636 13.4091 0.863636 14.4909L4.31364 11.9Z" fill="#FBBC04"/>
              <path d="M10 3.97727C11.2636 3.97727 12.3909 4.38182 13.2909 5.23636L16.2409 2.28636C14.9545 1.08636 12.7 0 10 0C6.07273 0 2.60909 2.04091 0.863636 5.50909L4.31364 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
            </svg>
            Log In with Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 text-sm mt-6">
            Don't have an account? <Link href="/signup" className="text-[#545BFF] hover:underline font-medium">Sign up</Link>
          </p>
        </div>

        {/* Right Side - Blue Section */}
        <div className="hidden md:flex w-full md:w-1/2 bg-[#545BFF] p-8 md:p-12 flex-col items-center justify-center text-white relative overflow-hidden">
          {/* Background Ellipse */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Image 
              src="/images/Ellipse.png" 
              alt="" 
              width={600} 
              height={600}
              className="object-contain"
            />
          </div>

          {/* Logo */}
          <div className="relative z-10 mb-8">
            <div className="relative">
              <Image 
                src="/images/light-logo.png" 
                alt="SmartShield Logo" 
                width={180} 
                height={180}
                className="drop-shadow-2xl"
              />
              <div className="absolute -top-4 -right-8">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="25" stroke="white" strokeWidth="2" strokeDasharray="4 4" opacity="0.5"/>
                  <path d="M30 5C30 5 45 15 45 30C45 45 30 55 30 55" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Text */}
          <p className="text-center text-white/90 max-w-sm relative z-10 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-6 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <Image src="/images/light-logo.png" alt="SmartShield" width={32} height={32} />
          <span className="text-white text-lg font-semibold">SmartShield</span>
        </div>
        <nav className="flex items-center gap-8 text-sm">
          <a href="#" className="text-gray-400 hover:text-white">SmartShield</a>
          <a href="#" className="text-gray-400 hover:text-white">Terms and Condition</a>
          <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-white">About</a>
          <a href="#" className="text-gray-400 hover:text-white">Cookies</a>
        </nav>
      </footer>
    </div>
  )
}
