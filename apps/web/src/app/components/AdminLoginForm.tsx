// src/app/components/AdminLoginForm.tsx
"use client"

import { createClient } from "@lib/supabase"
import { useState } from "react"

export function AdminLoginForm() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin/dashboard`
      }
    })
  }

  return (
    <div className="flex flex-col max-w-sm mx-auto p-4 border rounded text-center">
      <h2 className="text-xl font-bold mb-4">Admin Login</h2>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
      >
        {loading ? "Loading..." : "Sign in with Google"}
      </button>
    </div>
  )
}
