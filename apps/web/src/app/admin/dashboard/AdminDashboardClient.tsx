"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"

interface Props {
  user: User
}

export default function AdminDashboardClient({ user }: Props) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome, Admin {user.user_metadata?.name || user.email}</h1>
      <p className="mb-4">Your email: {user.email}</p>

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
      <button 
        onClick={() => setSelectedUser("u123")}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        View User u123
      </button>

      {selectedUser && (
        <div className="mt-4 p-4 border rounded">
          <p>Currently viewing: {selectedUser}</p>
          {/* here you could fetch more data */}
        </div>
      )}
    </div>
  )
}
