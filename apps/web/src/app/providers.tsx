// app/providers.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ThemeProvider } from "./lib/theme-context";

const TermsModal = dynamic(() => import("./components/ui/TermsModal"), {
  ssr: false,
  loading: () => null,
});

const CookieConsent = dynamic(() => import("./components/ui/CookieConsent"), {
  ssr: false,
  loading: () => null,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [showOverlays, setShowOverlays] = useState(false);

  useEffect(() => {
    type IdleCapableWindow = Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const w = window as IdleCapableWindow;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const enableOverlays = () => setShowOverlays(true);

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(enableOverlays, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(enableOverlays, 1200);
    }

    return () => {
      if (idleId !== null && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <ThemeProvider>
      {children}
      {showOverlays && (
        <>
          <TermsModal />
          <CookieConsent />
        </>
      )}
    </ThemeProvider>
  );
}
