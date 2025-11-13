"use client"

import { useState } from "react"
import type { Session } from "next-auth"

interface Props {
  session: Session
}

export default function AdminDashboardClient({ session }: Props) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  return (
    <div>
      <h1>Welcome, Admin {session.user.name}</h1>
      <p>Your email: {session.user.email}</p>

      <hr />

      <h2>Manage Users</h2>
      <button onClick={() => setSelectedUser("u123")}>View User u123</button>

      {selectedUser && (
        <div style={{ marginTop: "1rem" }}>
          <p>Currently viewing: {selectedUser}</p>
          {/* here you could fetch more data */}
        </div>
      )}
    </div>
  )
}
