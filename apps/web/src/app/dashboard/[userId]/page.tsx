"use client"
import { useAuth } from "@lib/auth-context"
import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function UserInfo() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])

  if (loading) return <p>Loading...</p>
  if (!user) return null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>User ID: {user.id}</p>
      <p>Email: {user.email}</p>
    </div>
  )
}
