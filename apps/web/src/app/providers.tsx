// app/providers.tsx
"use client";

import { ThemeProvider } from "./lib/theme-context";
import TermsModal from "./components/ui/TermsModal";
import CookieConsent from "./components/ui/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <TermsModal />
      <CookieConsent />
    </ThemeProvider>
  );
}
