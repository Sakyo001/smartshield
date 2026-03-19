// src/app/admin/login/page.tsx
import { AdminLoginForm } from "@components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="dark">
      <main className="min-h-screen w-screen flex items-center justify-center bg-page">
        <AdminLoginForm />
      </main>
    </div>
  );
}
