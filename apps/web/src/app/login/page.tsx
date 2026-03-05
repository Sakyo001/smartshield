// src/app/login/page.tsx
import { Suspense } from "react"
import UserLoginForm from "@components/UserLoginForm"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <UserLoginForm />
    </Suspense>
  )
}
