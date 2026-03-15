"use client";

import { useEffect } from "react";

export default function ResetScrollOnReload() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReload = navEntry?.type === "reload";

    // Force refreshes to start at the hero instead of restoring previous scroll/hash.
    if (!isReload) return;

    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, []);

  return null;
}
