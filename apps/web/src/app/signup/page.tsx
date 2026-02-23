"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@lib/supabase"
import { syncUserToDatabase, linkSocialAccount } from "@lib/supabase"
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
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
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

  const handleResendConfirmation = async () => {
    setResendingEmail(true)
    setResendMessage(null)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
      
      setResendMessage("Confirmation email sent! Please check your inbox and spam folder.")
    } catch (err) {
      setResendMessage("Failed to resend email. Please try again or contact support.")
    } finally {
      setResendingEmail(false)
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
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) throw signUpError

      // Supabase returns identities: [] when email already exists (no error thrown)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("An account with this email already exists. Please sign in instead.")
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if email confirmation is required
        // If session exists, email confirmation is disabled
        // If session is null, email confirmation is required
        if (data.session) {
          // Email confirmation is disabled - user is automatically logged in
          // Sync user to users table
          await syncUserToDatabase(
            data.user.id,
            email,
            displayName || email.split('@')[0]
          )
          
          setSuccess(true)
          setNeedsEmailConfirmation(false)
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            if (data.user) router.push(`/dashboard/${data.user.id}`)
          }, 2000)
        } else {
          // Email confirmation is required - user needs to check their email
          setSuccess(true)
          setNeedsEmailConfirmation(true)
          setLoading(false)
          
          // Note: User will be synced to database when they click the confirmation link
          // The auth callback route handles that
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-[#0f0f1e] py-10 px-6 sm:rounded-xl sm:px-12 border border-gray-800 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-4">
              {needsEmailConfirmation ? "Check your email" : "Account created"}
            </h2>
            
            {needsEmailConfirmation ? (
              <>
                <p className="text-sm text-gray-400 mb-6">
                  We've sent a confirmation link to <span className="font-medium text-white">{email}</span>. 
                  Please click the link to verify your account.
                </p>
                
                {resendMessage && (
                  <div className={`mb-6 p-3 rounded-lg text-sm ${
                    resendMessage.includes('sent') 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {resendMessage}
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resendingEmail}
                    className="w-full rounded-lg bg-[#1a1a2e] px-4 py-2.5 text-sm font-semibold text-gray-200 border border-gray-700 hover:bg-[#252540] hover:border-gray-600 transition-colors disabled:opacity-50"
                  >
                    {resendingEmail ? "Sending..." : "Resend email"}
                  </button>
                  <Link
                    href="/login"
                    className="w-full rounded-lg bg-[#545BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4349dd] transition-colors text-center block"
                  >
                    Back to login
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-6">
                  Redirecting you to the dashboard...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#545BFF] mx-auto"></div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#7B83FF] hover:text-[#a5adff] transition-colors">
            Log in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0f0f1e] py-8 px-4 sm:rounded-xl sm:px-10 border border-gray-800">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <svg className="flex-shrink-0 mt-0.5" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                </svg>
                <p>
                  {error}
                  {error?.includes("already exists") && (
                    <> <Link href="/login" className="underline font-semibold text-red-300 hover:text-red-200">Sign in</Link></>
                  )}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailSignUp} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
                Name <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <circle cx="10" cy="7" r="3" strokeWidth="1.5" />
                    <path d="M4 17c0-2.5 2.5-5 6-5s6 2.5 6 5" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-700 bg-[#1a1a2e] pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-[#545BFF] focus:outline-none focus:ring-1 focus:ring-[#545BFF] sm:text-sm transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" strokeWidth="1.5"/>
                    <path d="M2 5l8 5 8-5" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-700 bg-[#1a1a2e] pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-[#545BFF] focus:outline-none focus:ring-1 focus:ring-[#545BFF] sm:text-sm transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <rect x="4" y="9" width="12" height="8" rx="1" strokeWidth="1.5"/>
                    <path d="M7 9V6a3 3 0 0 1 6 0v3" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-700 bg-[#1a1a2e] pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-[#545BFF] focus:outline-none focus:ring-1 focus:ring-[#545BFF] sm:text-sm transition-colors"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <rect x="4" y="9" width="12" height="8" rx="1" strokeWidth="1.5"/>
                    <path d="M7 9V6a3 3 0 0 1 6 0v3" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="10" cy="13" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-gray-700 bg-[#1a1a2e] pl-10 pr-3 py-2.5 text-white placeholder-gray-500 focus:border-[#545BFF] focus:outline-none focus:ring-1 focus:ring-[#545BFF] sm:text-sm transition-colors"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-[#545BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4349dd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#545BFF] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#0f0f1e] px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#1a1a2e] px-4 py-2.5 text-sm font-semibold text-gray-200 border border-gray-700 hover:bg-[#252540] hover:border-gray-600 transition-colors disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10V12.05H15.5818C15.3364 13.3 14.5636 14.3591 13.3864 15.0682V17.5773H16.7182C18.7091 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
                  <path d="M10 20C12.7 20 14.9636 19.1045 16.7182 17.5773L13.3864 15.0682C12.3909 15.6682 11.1455 16.0227 10 16.0227C7.39545 16.0227 5.19091 14.2636 4.31364 11.9H0.863636V14.4909C2.60909 17.9591 6.07273 20 10 20Z" fill="#34A853"/>
                  <path d="M4.31364 11.9C4.10909 11.3 4 10.6591 4 10C4 9.34091 4.10909 8.7 4.31364 8.1V5.50909H0.863636C0.318182 6.59091 0 7.76364 0 10C0 12.2364 0.318182 13.4091 0.863636 14.4909L4.31364 11.9Z" fill="#FBBC05"/>
                  <path d="M10 3.97727C11.2636 3.97727 12.4091 4.40909 13.3182 5.27273L16.2727 2.31818C14.9636 1.08182 12.7 0 10 0C6.07273 0 2.60909 2.04091 0.863636 5.50909L4.31364 8.1C5.19091 5.73636 7.39545 3.97727 10 3.97727Z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
