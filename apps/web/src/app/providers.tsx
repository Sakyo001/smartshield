// app/providers.tsx
"use client";

import { AuthProvider } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-context";
import TermsModal from "./components/ui/TermsModal";
import CookieConsent from "./components/ui/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <TermsModal />
        <CookieConsent />
      </AuthProvider>
    </ThemeProvider>
  );
}
