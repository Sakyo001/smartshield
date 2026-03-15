"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ScanTab = dynamic(() => import("./ScanTab"), {
  ssr: false,
  loading: () => <section className="min-h-[100vh]" aria-hidden />,
});

export default function DeferredScanTab() {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [mountScan, setMountScan] = useState(false);

  useEffect(() => {
    if (mountScan) return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setMountScan(true);
        observer.disconnect();
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [mountScan]);

  return (
    <section id="scan" className="scroll-mt-24" aria-label="Website scan section">
      <div ref={anchorRef}>
        {mountScan ? <ScanTab /> : <section className="min-h-[100vh]" aria-hidden />}
      </div>
    </section>
  );
}
