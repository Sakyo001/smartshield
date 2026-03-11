"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ScanResult {
  url: string;
  riskScore: number;
  status: "Safe" | "Warning" | "Dangerous";
  date: string;
  details?: {
    registrar?: string;
    creationDate?: string;
    lastAnalysisDate?: string;
    detections?: Array<{ service: string; category: string; result: string }>;
    whoisInfo?: any;
    dnsRecords?: any;
    sslCertificates?: any;
    communityComments?: number;
    riskAdjustment?: any;
    screenshot?: string | null;
  };
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
async function fetchWithTimeout(resource: RequestInfo, options: any = {}) {
  const { timeout = 30000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") throw new Error("Request timeout: API is taking too long to respond");
    throw error;
  }
}

/* ─────────────────────────────────────────────
   Animated dot-grid background
───────────────────────────────────────────── */
function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const lastRef = useRef(0);

  const initNodes = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 36000), 22);
    nodesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
    }));
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    let w = (cvs.width = cvs.offsetWidth);
    let h = (cvs.height = cvs.offsetHeight);
    initNodes(w, h);
    const onResize = () => {
      w = cvs.width = cvs.offsetWidth;
      h = cvs.height = cvs.offsetHeight;
      initNodes(w, h);
    };
    window.addEventListener("resize", onResize);
    const draw = (ts: number) => {
      animRef.current = requestAnimationFrame(draw);
      if (ts - lastRef.current < 34) return; // ~30 fps cap
      lastRef.current = ts;
      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      const maxDist = 80;
      const maxDist2 = maxDist * maxDist;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < maxDist2) {
            const alpha = (1 - Math.sqrt(dist2) / maxDist) * 0.2;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(84,91,255,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(84,91,255,0.45)";
        ctx.fill();
      }
    };
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [initNodes]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

/* ─────────────────────────────────────────────
   Pulsing scan rings (centered behind scanner)
───────────────────────────────────────────── */
function ScanRings() {
  const rings = [
    { size: 260, delay: 0 },
    { size: 460, delay: 1.8 },
  ];
  return (
    <>
      <div
        className="absolute rounded-full border border-[#545BFF]/20"
        style={{ width: 140, height: 140, top: -70, left: -70 }}
      />
      {rings.map(({ size, delay }, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-[#545BFF]/15"
          style={{
            width: size,
            height: size,
            top: -size / 2,
            left: -size / 2,
            animation: `pulseScaleRing 6s ease-out ${delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   Typewriter placeholder — cycles example URLs
───────────────────────────────────────────── */
const EXAMPLE_URLS = [
  "https://paypal-secure-login.vercel.app",
  "https://amazon-account-verify.xyz",
  "https://google.com",
  "https://mynetflixbilling.tk",
  "https://github.com/smartshield",
  "https://bank-of-america-reset.info/login",
];

function useTypingPlaceholder(enabled: boolean) {
  const [text, setText] = useState("");
  const [urlIdx, setUrlIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled) { setText(""); return; }
    const url = EXAMPLE_URLS[urlIdx];
    const delay = deleting
      ? 22
      : charIdx >= url.length
      ? 1600
      : 48;
    const t = setTimeout(() => {
      if (!deleting && charIdx < url.length) {
        // advance 2 chars at a time to halve setState frequency
        const next = Math.min(charIdx + 2, url.length);
        setText(url.slice(0, next));
        setCharIdx(next);
      } else if (!deleting && charIdx >= url.length) {
        setDeleting(true);
      } else if (deleting && charIdx > 0) {
        const next = Math.max(charIdx - 2, 0);
        setText(url.slice(0, next));
        setCharIdx(next);
      } else {
        setDeleting(false);
        setUrlIdx((i) => (i + 1) % EXAMPLE_URLS.length);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [enabled, charIdx, deleting, urlIdx]);

  return text;
}

/* ─────────────────────────────────────────────
   Live scan-progress indicator
───────────────────────────────────────────── */
const SCAN_STAGES = [
  { label: "Resolving DNS" },
  { label: "Fetching WHOIS" },
  { label: "Checking SSL" },
  { label: "Running AI Model" },
  { label: "Generating Report" },
];

function ScanProgress({ scanning }: { scanning: boolean }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!scanning) { setStageIdx(0); setProgress(0); return; }
    let stage = 0;
    const durations = [650, 1050, 650, 1250, 850];
    const step = () => {
      stage++;
      if (stage < SCAN_STAGES.length) {
        setStageIdx(stage);
        setProgress(((stage + 1) / SCAN_STAGES.length) * 90);
        setTimeout(step, durations[stage] + Math.random() * 280);
      }
    };
    setStageIdx(0);
    setProgress(10);
    setTimeout(step, durations[0] + Math.random() * 200);
  }, [scanning]);

  return (
    <AnimatePresence>
      {scanning && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.28 }}
          className="overflow-hidden"
        >
          <div className="mt-3 mb-2 dark:bg-[#0a0b18]/85 bg-white/85 backdrop-blur-md border border-[#545BFF]/20 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stageIdx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.16 }}
                  className="flex items-center gap-2"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#545BFF]" />
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#545BFF] uppercase tracking-widest">
                    {SCAN_STAGES[stageIdx].label}
                  </span>
                </motion.div>
              </AnimatePresence>
              <span className="text-[11px] font-mono text-faded tabular-nums">{Math.round(progress)}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-[3px] rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/8 overflow-hidden mb-3">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                style={{
                  background: "linear-gradient(90deg, #545BFF, #b19eef)",
                  boxShadow: "0 0 10px rgba(84,91,255,0.7)",
                }}
              />
            </div>
            {/* Stage segments */}
            <div className="flex items-center gap-1.5">
              {SCAN_STAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i < stageIdx
                      ? "bg-[#545BFF]"
                      : i === stageIdx
                      ? "bg-[#545BFF] shadow-[0_0_6px_rgba(84,91,255,0.8)] animate-pulse"
                      : "dark:bg-[#545BFF]/12 bg-[#545BFF]/8"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Count-up animation hook
───────────────────────────────────────────── */
function useCountUp(target: number, active: boolean, duration = 950) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    let startTs: number | null = null;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, active, duration]);
  return count;
}

/* ─────────────────────────────────────────────
   Guest Scanner (no auth required)
───────────────────────────────────────────── */
function GuestScanner({ inView }: { inView: boolean }) {
  const WHOIS_API_URL = process.env.NEXT_PUBLIC_WHOIS_API_URL;

  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [activeTab, setActiveTab] = useState<"detection" | "explanation" | "details" | "relations" | "community">("detection");

  // XAI explanation
  const [xaiExplanation, setXaiExplanation] = useState<any>(null);
  const [loadingXAI, setLoadingXAI] = useState(false);

  // Relations / history
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Community (read-only for guests)
  const [communityComments, setCommunityComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Mouse parallax for shield
  const contentRef = useRef<HTMLDivElement>(null);
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const smx = useSpring(mxRaw, { stiffness: 55, damping: 18, restDelta: 0.001 });
  const smy = useSpring(myRaw, { stiffness: 55, damping: 18, restDelta: 0.001 });
  const shieldX = useTransform(smx, [-0.5, 0.5], [-14, 14]);
  const shieldY = useTransform(smy, [-0.5, 0.5], [-9, 9]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    mxRaw.set((e.clientX - rect.left) / rect.width - 0.5);
    myRaw.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mxRaw, myRaw]);

  // Score counter animation
  const [scoreActive, setScoreActive] = useState(false);
  useEffect(() => {
    if (currentScan) {
      setScoreActive(false);
      const t = setTimeout(() => setScoreActive(true), 320);
      return () => clearTimeout(t);
    }
    setScoreActive(false);
  }, [currentScan]);

  // Typewriter placeholder (active when input is empty + not scanning)
  const typingPlaceholder = useTypingPlaceholder(!urlInput && !scanning && inView);
  const displayScore = useCountUp(currentScan?.riskScore ?? 0, scoreActive);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${WHOIS_API_URL}/health`).catch(() => null);
        setApiStatus(res?.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    })();
  }, []);

  /* Fetch XAI explanation whenever currentScan changes */
  useEffect(() => {
    if (!currentScan) return;
    setXaiExplanation(null);
    setHistoricalData(null);
    setLoadingXAI(true);

    (async () => {
      try {
        const res = await fetch(`${WHOIS_API_URL}/api/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: currentScan.url,
            scan_result: {
              riskScore: currentScan.riskScore,
              decision: currentScan.status,
              detections: currentScan.details?.detections || [],
            },
            whois_info: currentScan.details?.whoisInfo || {},
            dns_info: currentScan.details?.dnsRecords || {},
            ssl_info: currentScan.details?.sslCertificates || {},
            deterministic_flags: currentScan.details?.riskAdjustment?.deterministic_flags || [],
          }),
        });
        if (res.ok) setXaiExplanation(await res.json());
      } catch {
        /* ignore */
      } finally {
        setLoadingXAI(false);
      }
    })();
  }, [currentScan]);

  /* Fetch community comments when tab active */
  useEffect(() => {
    if (activeTab !== "community" || !currentScan) return;
    setLoadingComments(true);
    (async () => {
      try {
        const res = await fetch(`${WHOIS_API_URL}/api/reports?url=${encodeURIComponent(currentScan.url)}`);
        if (res.ok) {
          const data = await res.json();
          setCommunityComments(data.reports || []);
        } else {
          setCommunityComments([]);
        }
      } catch {
        setCommunityComments([]);
      } finally {
        setLoadingComments(false);
      }
    })();
  }, [activeTab, currentScan]);

  /* Fetch relations / history when tab active */
  useEffect(() => {
    if (activeTab !== "relations" || !currentScan || historicalData || loadingHistory) return;
    setLoadingHistory(true);
    (async () => {
      try {
        const res = await fetchWithTimeout(`${WHOIS_API_URL}/api/domain-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentScan.url }),
          timeout: 15000,
        });
        if (res.ok) setHistoricalData(await res.json());
      } catch {
        /* ignore */
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [activeTab, currentScan]);

  /* Core scan logic */
  const doScan = async (url: string) => {
    setScanning(true);
    setError(null);
    setCurrentScan(null);
    setUrlInput(url);

    try {
      const response = await fetchWithTimeout(`${WHOIS_API_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        timeout: 45000,
      });

      if (!response.ok) throw new Error("Failed to scan URL");

      const data = await response.json();

      let whoisInfo = data.whois || null;
      let dnsRecords = data.dns || null;
      let sslInfo = data.ssl || null;
      let riskAdjustment = data.risk_adjustment || null;
      let screenshot = data.screenshot || null;

      let riskScore = 0;
      let status: "Safe" | "Warning" | "Dangerous" = "Safe";

      if (data.decision === "PHISHING") {
        riskScore = Math.round(data.confidence || 100);
      } else if (data.decision === "LEGITIMATE") {
        riskScore = Math.round(100 - (data.confidence || 0));
      } else {
        riskScore = Math.round(data.score * 100 || 0);
      }

      if (riskScore >= 70) status = "Dangerous";
      else if (riskScore >= 40) status = "Warning";

      if (url.toLowerCase().startsWith("http://") && riskScore < 40) {
        riskScore = 40;
        status = "Warning";
      }

      if (riskAdjustment) {
        const deterministicIncrease = riskAdjustment.deterministic_increase || 0;
        const contextualReduction = riskAdjustment.reduction_percentage || 0;
        const indicators = riskAdjustment.indicators || [];

        const criticalIndicators = indicators.filter(
          (i: string) => typeof i === "string" && (i.includes("CRITICAL") || i.includes("\u{1F6A8}"))
        );

        if (criticalIndicators.length > 0) {
          riskScore = 100;
          status = "Dangerous";
        } else {
          riskScore = riskScore + deterministicIncrease - contextualReduction;
          riskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

          const hasWhoisWarning = indicators.some(
            (i: string) => typeof i === "string" && i.includes("WHOIS Information Unavailable") && !i.includes("CRITICAL")
          );
          if (hasWhoisWarning && riskScore < 45) riskScore = 45;

          if (riskScore >= 70) status = "Dangerous";
          else if (riskScore >= 40) status = "Warning";
          else status = "Safe";
        }
      }

      setCurrentScan({
        url,
        riskScore,
        status,
        date: new Date().toLocaleString(),
        details: {
          registrar: whoisInfo?.registrar || "N/A",
          creationDate: whoisInfo?.creation_date || "N/A",
          lastAnalysisDate: new Date().toLocaleDateString(),
          detections: data.detections || [],
          whoisInfo,
          dnsRecords,
          sslCertificates: sslInfo,
          communityComments: data.community_comments || 0,
          riskAdjustment,
          screenshot,
        },
      });

      setActiveTab("detection");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while scanning");
    } finally {
      setScanning(false);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    if (!/^https?:\/\//i.test(urlInput.trim())) {
      setUrlError("Please include the full URL starting with http:// or https://");
      return;
    }
    setUrlError(null);
    doScan(urlInput.trim());
  };

  const handleReanalyze = () => {
    if (!currentScan) return;
    doScan(currentScan.url);
  };

  return (
    <div ref={contentRef} onMouseMove={handleMouseMove} className="max-w-4xl mx-auto px-4 sm:px-6">

      {/* ─── Shield Logo (mouse-parallax + rotating HUD rings) ─── */}
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 1.4 }}
        animate={inView ? { y: 0, opacity: 1, scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 58, damping: 14, delay: 0.05 }}
        style={{ x: shieldX, y: shieldY }}
        className="relative flex justify-center mb-6 sm:mb-8 will-change-transform"
      >
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36">
          {/* Slow-rotating dashed outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-5 rounded-full border border-dashed border-[#545BFF]/20 pointer-events-none"
          />
          {/* Counter-rotating dashed accent ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-2.5 rounded-full border border-dashed border-[#545BFF]/12 pointer-events-none"
          />
          {/* The 3D shield */}
          <Image
            src="/images/3D Logo.png"
            alt="SmartShield"
            width={144}
            height={144}
            className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_44px_rgba(84,91,255,0.58)]"
            priority
          />
          {/* Ripple rings expanding after settle */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={inView ? { scale: 3.4 + i * 1.5, opacity: 0 } : {}}
              transition={{ duration: 1.9, delay: 0.48 + i * 0.2, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-[#545BFF]/30 pointer-events-none"
            />
          ))}
          {/* Sustained ambient glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 1.2, duration: 0.9 }}
            className="absolute -inset-12 rounded-full bg-[#545BFF]/5 dark:bg-[#545BFF]/13 blur-3xl pointer-events-none -z-10"
          />
          {/* HUD corner accent dots */}
          {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.88 + i * 0.06, type: "spring", stiffness: 280 }}
              className={`absolute ${pos} w-1.5 h-1.5 rounded-full bg-[#545BFF] shadow-[0_0_7px_rgba(84,91,255,0.9)] z-20`}
            />
          ))}
        </div>
      </motion.div>

      {/* ─── Header ─── */}
      <div className="mb-6 sm:mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm mb-3 sm:mb-5 shadow-sm dark:shadow-none"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#545BFF]" />
          </span>
          <span className="text-[#545BFF] dark:text-[#a89de8] text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase">
            Guest Mode
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-2xl sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1] mb-2 sm:mb-3"
        >
          Try SmartShield{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
            Instantly
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-copy/80 text-[13px] sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
        >
          Scan any URL with no account needed.
        </motion.p>
      </div>

      {/* ─── Scan Form ─── */}
      <motion.form
        onSubmit={handleScan}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="relative group z-20 mb-4"
      >
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-[#545BFF] to-[#b19eef] rounded-xl opacity-30 blur transition duration-1000 group-hover:opacity-60 pointer-events-none ${
            scanning ? "animate-pulse" : ""
          }`}
        />
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 dark:bg-panel bg-white/90 backdrop-blur-md rounded-xl border border-divider dark:border-[#545BFF]/15 shadow-[0_1px_10px_rgba(84,91,255,0.06)] dark:shadow-none">
          <div className="flex-1 flex items-center gap-3 px-4 w-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dark:text-slate-500 text-slate-400 flex-shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); }}
              placeholder={urlInput ? "Paste a URL to scan..." : (typingPlaceholder || "Paste a URL to scan (e.g. https://example.com)...")}
              className="w-full bg-transparent border-none text-heading placeholder:text-faded focus:outline-none focus:ring-0 py-3 text-sm sm:text-base"
              required
              suppressHydrationWarning
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !urlInput}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 text-sm sm:text-base ${
              scanning
                ? "bg-inset text-faded cursor-wait"
                : "bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#5a62ff] text-white shadow-lg shadow-[#545BFF]/20 hover:shadow-[#545BFF]/40"
            }`}
          >
            {scanning ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <span>Scan Now</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </>
            )}
          </button>
        </div>
      </motion.form>

      <ScanProgress scanning={scanning} />

      {urlError && (
        <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mt-2 px-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {urlError}
        </p>
      )}

      {/* ─── API Status ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 1.0 }}
        className="flex justify-center mb-6"
      >
        <div className="inline-flex items-center gap-3 px-4 py-2 dark:bg-inset/60 bg-white/60 border border-divider/50 rounded-full backdrop-blur-sm shadow-sm dark:shadow-none">
          <div className="relative flex h-2.5 w-2.5">
            {apiStatus === "online" ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            )}
          </div>
          <span className={`text-xs font-medium tracking-wide ${apiStatus === "online" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            SYSTEM STATUS: {apiStatus === "online" ? "OPERATIONAL" : apiStatus === "checking" ? "CHECKING..." : "OFFLINE"}
          </span>
        </div>
      </motion.div>

      {/* ─── Error ─── */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-200 text-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      {/* ─── Scan Results ─── */}
      {currentScan && (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 110, damping: 20 }}
          className="mt-4"
        >
          {/* Risk Score Card */}
          <div
            className={`relative overflow-hidden rounded-2xl border ${
              currentScan.status === "Dangerous"
                ? "bg-red-500/5 border-red-500/20"
                : currentScan.status === "Warning"
                ? "bg-yellow-500/5 border-yellow-500/20"
                : "bg-green-500/5 border-green-500/20"
            } p-5 sm:p-6 md:p-8 mb-8 backdrop-blur-sm`}
          >
            {/* Glow */}
            <div
              className={`absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
                currentScan.status === "Dangerous" ? "bg-red-500" : currentScan.status === "Warning" ? "bg-yellow-500" : "bg-green-500"
              }`}
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8 md:gap-12">
              {/* Risk Circle */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-divider" />
                    <circle
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                      className={currentScan.status === "Dangerous" ? "text-red-500" : currentScan.status === "Warning" ? "text-yellow-500" : "text-green-500"}
                      strokeDasharray={`${(currentScan.riskScore / 100) * 283} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      key={currentScan.riskScore}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 180, damping: 16, delay: 0.2 }}
                      className="text-4xl sm:text-5xl md:text-6xl font-bold text-heading tracking-tighter tabular-nums"
                    >
                      {displayScore}
                    </motion.span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-faded mt-1">Risk Score</span>
                  </div>
                </div>
                <div
                  className={`mt-3 sm:mt-4 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase ${
                    currentScan.status === "Dangerous"
                      ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                      : currentScan.status === "Warning"
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30"
                      : "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                  }`}
                >
                  {currentScan.status}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 w-full text-center lg:text-left">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-heading mb-2 break-all">{currentScan.url}</h2>
                <p
                  className={`text-sm sm:text-base md:text-lg mb-4 sm:mb-6 ${
                    currentScan.status === "Dangerous" ? "text-red-700 dark:text-red-300" : currentScan.status === "Warning" ? "text-yellow-700 dark:text-yellow-300" : "text-green-700 dark:text-green-300"
                  }`}
                >
                  {currentScan.status === "Dangerous"
                    ? "Strictly recommended to avoid this site. High threat level detected."
                    : currentScan.status === "Warning"
                    ? "Potential security risks detected. Proceed with caution."
                    : "No major threats detected. Safe to browse."}
                </p>

                {/* HTTP Warning */}
                {currentScan.url.toLowerCase().startsWith("http://") && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3 sm:gap-4 text-left">
                    <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg text-yellow-500 shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                    </div>
                    <div>
                      <h4 className="text-yellow-600 dark:text-yellow-400 font-bold text-sm sm:text-base">Insecure Connection (HTTP)</h4>
                      <p className="text-yellow-700/80 dark:text-yellow-200/80 text-xs sm:text-sm mt-1">Data sent to this website is not encrypted and could be intercepted by attackers.</p>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="dark:bg-inset/50 bg-white/60 p-3 sm:p-4 rounded-xl border border-divider backdrop-blur-sm">
                    <div className="text-faded text-[10px] sm:text-xs uppercase tracking-wider mb-1">Registrar</div>
                    <div className="text-heading font-medium text-xs sm:text-sm truncate">{currentScan.details?.registrar || "Unknown"}</div>
                  </div>
                  <div className="dark:bg-inset/50 bg-white/60 p-3 sm:p-4 rounded-xl border border-divider backdrop-blur-sm">
                    <div className="text-faded text-[10px] sm:text-xs uppercase tracking-wider mb-1">Created</div>
                    <div className="text-heading font-medium text-xs sm:text-sm">{currentScan.details?.creationDate || "Unknown"}</div>
                  </div>
                  <div className="dark:bg-inset/50 bg-white/60 p-3 sm:p-4 rounded-xl border border-divider col-span-2 md:col-span-1 backdrop-blur-sm">
                    <div className="text-faded text-[10px] sm:text-xs uppercase tracking-wider mb-1">Last Analysis</div>
                    <div className="text-heading font-medium text-xs sm:text-sm">{currentScan.details?.lastAnalysisDate}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reanalyze + signup nudge */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-divider/50">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-faded flex-wrap justify-center sm:justify-start">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#545BFF] shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span>Results are not saved.</span>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={scanning}
                className="px-5 sm:px-6 py-2 rounded-lg dark:bg-inset bg-white/70 hover:bg-white dark:hover:bg-panel disabled:opacity-50 disabled:cursor-not-allowed text-heading transition text-xs sm:text-sm font-medium border border-divider backdrop-blur-sm"
              >
                {scanning ? "Scanning..." : "Reanalyze"}
              </button>
            </div>
          </div>

          {/* ─── Detail Tabs ─── */}
          <div className="dark:bg-inset/60 bg-white/70 backdrop-blur-md border border-divider rounded-2xl overflow-hidden shadow-xl dark:shadow-[0_4px_36px_rgba(84,91,255,0.06)]">
            <div className="flex overflow-x-auto p-1.5 sm:p-2 gap-1.5 sm:gap-2 border-b border-divider/50 dark:bg-panel/50 bg-slate-50/80 scrollbar-hide">
              {(["detection", "explanation", "details", "relations", "community"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-200 whitespace-nowrap outline-none focus:ring-2 focus:ring-[#545BFF]/50 ${
                    activeTab === tab
                      ? "text-white bg-gradient-to-r from-[#545BFF] to-[#6B73FF] shadow-lg shadow-[#545BFF]/25"
                      : "text-faded hover:text-heading dark:hover:bg-heading/5 hover:bg-slate-100"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-b from-page/50 to-page">

              {/* ── Detection ── */}
              {activeTab === "detection" && (() => {
                const detFlags: string[] = currentScan.details?.riskAdjustment?.deterministic_flags || [];
                const allIndicators: string[] = currentScan.details?.riskAdjustment?.indicators || [];
                const screenshot = currentScan.details?.screenshot || null;
                const isBrandImpersonation = (f: string) => f.includes("Brand Impersonation") || f.includes("Impersonating");
                const isSuspiciousTLD = (f: string) => f.includes("Untrusted TLD") || f.includes("Suspicious TLD");
                const isCritical = (f: string) =>
                  f.includes("\u{1F6A8}") || f.includes("CRITICAL") ||
                  f.includes("VERY NEW DOMAIN") || f.includes("New Domain (Risk Factor)");
                const positiveIndicators = allIndicators.filter((i) => !isCritical(i));
                const negativeIndicators = allIndicators.filter((i) => isCritical(i));

                return (
                  <div className="space-y-5 sm:space-y-6">
                    {/* URL + Status row */}
                    <div className="dark:bg-panel bg-white/80 border border-divider rounded-xl p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 backdrop-blur-sm">
                      <span className="text-heading text-xs md:text-sm break-all font-mono">{currentScan.url}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                        currentScan.riskScore >= 70 ? "bg-red-500/20 text-red-600 dark:text-red-400" : currentScan.riskScore >= 40 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" : "bg-green-500/20 text-green-600 dark:text-green-400"
                      }`}>
                        {currentScan.riskScore >= 70 ? "Phishing" : currentScan.riskScore >= 40 ? "Suspicious" : "Safe"}
                      </span>
                    </div>

                    {/* Page Screenshot (Warning / Dangerous only) */}
                    {screenshot && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-1 h-5 rounded-full ${currentScan.riskScore >= 70 ? "bg-red-500" : "bg-yellow-500"}`} />
                          <h4 className="text-heading font-semibold text-sm">Page Screenshot</h4>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                            currentScan.riskScore >= 70
                              ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
                              : "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                          }`}>
                            {currentScan.riskScore >= 70 ? "PHISHING SITE" : "SUSPICIOUS SITE"}
                          </span>
                        </div>
                        <div className={`rounded-xl border overflow-hidden ${currentScan.riskScore >= 70 ? "border-red-500/40" : "border-yellow-500/40"}`}>
                          <div className={`px-3 py-1.5 text-xs font-mono flex items-center gap-2 ${currentScan.riskScore >= 70 ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                            Live capture at time of scan
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`data:image/png;base64,${screenshot}`}
                            alt="Screenshot of scanned page"
                            className="w-full object-cover"
                            style={{ maxHeight: "400px", objectPosition: "top" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Threat Flags */}
                    {detFlags.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 bg-red-500 rounded-full" />
                          <h4 className="text-heading font-semibold text-sm">Threat Indicators</h4>
                          <span className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{detFlags.length} FLAG{detFlags.length !== 1 ? "S" : ""}</span>
                        </div>
                        <div className="space-y-2">
                          {detFlags.map((flag, i) => {
                            const isBrand = isBrandImpersonation(flag);
                            const isTLD = isSuspiciousTLD(flag);
                            const isRed = isCritical(flag) || isBrand;
                            return (
                              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                                isBrand ? "bg-red-500/10 border-red-500/30" :
                                isTLD   ? "bg-orange-500/10 border-orange-500/30" :
                                isRed   ? "bg-red-500/10 border-red-500/20" :
                                          "bg-yellow-500/10 border-yellow-500/20"
                              }`}>
                                {isBrand ? (
                                  <svg className="shrink-0 mt-0.5 text-red-500 dark:text-red-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                                ) : isTLD ? (
                                  <svg className="shrink-0 mt-0.5 text-orange-500 dark:text-orange-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                                ) : (
                                  <svg className={`shrink-0 mt-0.5 ${isRed ? "text-red-500 dark:text-red-400" : "text-yellow-500 dark:text-yellow-400"}`} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                )}
                                <div className="flex-1 min-w-0">
                                  {isBrand && <span className="inline-block text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 bg-red-500/20 px-1.5 py-0.5 rounded">Brand Impersonation</span>}
                                  {isTLD  && <span className="inline-block text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1 bg-orange-500/20 px-1.5 py-0.5 rounded">Suspicious TLD</span>}
                                  <p className={`text-xs leading-relaxed ${
                                    isBrand ? "text-red-700 dark:text-red-200" : isTLD ? "text-orange-700 dark:text-orange-200" : isRed ? "text-red-700 dark:text-red-200" : "text-yellow-700 dark:text-yellow-200"
                                  }`}>{flag.replace(/^\u{1F6A8}\s*/u, "").replace(/\s*\(legitimate site: [^)]+\)/, "")}</p>
                                  {isBrand && (() => {
                                    const m = flag.match(/\(legitimate site: ([^)]+)\)/);
                                    return m ? (
                                      <div className="mt-1.5 flex items-center gap-1.5">
                                        <span className="text-xs text-faded">Legitimate site:</span>
                                        <a href={`https://${m[1]}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline underline-offset-2">{m[1]}</a>
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Critical indicators from contextual layer */}
                    {negativeIndicators.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 bg-red-600 rounded-full" />
                          <h4 className="text-heading font-semibold text-sm">Critical Signals</h4>
                        </div>
                        <div className="space-y-2">
                          {negativeIndicators.map((ind, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <svg className="shrink-0 text-red-500 dark:text-red-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6" /><path d="M9 9l6 6" /></svg>
                              <span className="text-red-700 dark:text-red-200 text-xs">{ind.replace(/^\u{1F6A8}\s*/u, "")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trust signals */}
                    {positiveIndicators.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 bg-green-500 rounded-full" />
                          <h4 className="text-heading font-semibold text-sm">Trust Signals</h4>
                          <span className="text-xs font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">{positiveIndicators.length} FOUND</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {positiveIndicators.map((ind, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-700 dark:text-green-300 text-xs">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {detFlags.length === 0 && allIndicators.length === 0 && (
                      <p className="text-faded text-sm text-center py-6">No threat indicators detected.</p>
                    )}
                  </div>
                );
              })()}

              {/* ── Details ── */}
              {activeTab === "details" && (
                <div className="space-y-4 text-xs md:text-sm">
                  <div>
                    <h4 className="text-faded mb-2 font-medium flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#545BFF]"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      WHOIS Information
                    </h4>
                    <div className="dark:bg-inset bg-slate-50 p-3 md:p-4 rounded-lg border border-divider text-copy font-mono text-xs overflow-x-auto">
                      {currentScan.details?.whoisInfo ? (
                        <pre className="text-xs">{JSON.stringify(currentScan.details.whoisInfo, null, 2)}</pre>
                      ) : (
                        <p className="text-xs text-center py-4 text-faded">No WHOIS data available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-faded mb-2 font-medium flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#b19eef]"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                      DNS Records
                    </h4>
                    <div className="dark:bg-inset bg-slate-50 p-3 md:p-4 rounded-lg border border-divider text-copy">
                      {currentScan.details?.dnsRecords ? (
                        <pre className="text-xs font-mono overflow-x-auto">{JSON.stringify(currentScan.details.dnsRecords, null, 2)}</pre>
                      ) : (
                        <p className="text-xs text-center py-4 text-faded">No DNS records available</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-faded mb-2 font-medium flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      SSL Certificate
                    </h4>
                    <div className="dark:bg-inset bg-slate-50 p-3 md:p-4 rounded-lg border border-divider text-copy">
                      {currentScan.details?.sslCertificates && !currentScan.details.sslCertificates.error ? (
                        <pre className="text-xs font-mono overflow-x-auto">{JSON.stringify(currentScan.details.sslCertificates, null, 2)}</pre>
                      ) : (
                        <p className="text-xs text-center py-4 text-faded">
                          {currentScan.details?.sslCertificates?.error || "No SSL certificate data available"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Explanation ── */}
              {activeTab === "explanation" && (
                <div className="space-y-6 sm:space-y-8">
                  {loadingXAI ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
                      <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 border-t-2 border-[#545BFF] rounded-full animate-spin" />
                        <div className="absolute inset-2 border-r-2 border-[#b19eef] rounded-full animate-spin" style={{ animationDirection: "reverse" }} />
                      </div>
                      <p className="text-faded font-mono text-xs sm:text-sm tracking-wide animate-pulse">Initializing AI Analysis Protocol...</p>
                    </div>
                  ) : xaiExplanation ? (
                    <>
                      {/* Recommendation */}
                      <div
                        className={`rounded-xl border border-divider overflow-hidden ${
                          currentScan.riskScore >= 70 ? "bg-red-950/10 dark:bg-red-950/10 light:bg-red-50/50" : currentScan.riskScore >= 40 ? "bg-yellow-950/10 dark:bg-yellow-950/10 light:bg-yellow-50/50" : "bg-green-950/10 dark:bg-green-950/10 light:bg-green-50/50"
                        }`}
                      >
                        <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6">
                          <div
                            className={`flex-shrink-0 p-3 sm:p-4 rounded-xl border ${
                              currentScan.riskScore >= 70
                                ? "bg-red-500/10 border-red-500/20 text-red-500"
                                : currentScan.riskScore >= 40
                                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                : "bg-green-500/10 border-green-500/20 text-green-500"
                            }`}
                          >
                            {currentScan.riskScore >= 70 ? (
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-8 sm:h-8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                            ) : currentScan.riskScore >= 40 ? (
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-8 sm:h-8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                            ) : (
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="sm:w-8 sm:h-8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                            )}
                          </div>
                          <div className="text-center md:text-left flex-1">
                            <h4
                              className={`text-xs sm:text-sm font-mono uppercase tracking-widest mb-2 sm:mb-3 ${
                                currentScan.riskScore >= 70 ? "text-red-600 dark:text-red-400" : currentScan.riskScore >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              Strategic Recommendation
                            </h4>
                            <p className="text-copy text-sm md:text-lg font-medium">{xaiExplanation.recommendation}</p>
                          </div>
                        </div>
                      </div>

                      {/* Factors Grid */}
                      <div
                        className={`grid gap-4 sm:gap-6 ${
                          xaiExplanation.risk_factors?.length > 0 && xaiExplanation.positive_factors?.length > 0
                            ? "grid-cols-1 lg:grid-cols-2"
                            : "grid-cols-1"
                        }`}
                      >
                        {xaiExplanation.risk_factors?.length > 0 && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                              <h4 className="text-heading font-bold text-base sm:text-lg">Threat Vectors Detected</h4>
                              <span className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                {xaiExplanation.risk_factors.length} ISSUES
                              </span>
                            </div>
                            <div className="grid gap-3">
                              {xaiExplanation.risk_factors.map((factor: any, idx: number) => (
                                <div key={idx} className="dark:bg-inset bg-white/70 border border-red-500/20 rounded-lg p-3 sm:p-4 hover:border-red-500/40 transition-colors group backdrop-blur-sm">
                                  <div className="flex items-start gap-3 sm:gap-4">
                                    <span className="flex-shrink-0 mt-1 text-red-500/50 group-hover:text-red-500 transition-colors font-mono text-xs">0{idx + 1}</span>
                                    <div>
                                      <h5 className="text-red-700 dark:text-red-300 font-medium text-xs sm:text-sm mb-1">{factor.title}</h5>
                                      <p className="text-faded text-xs leading-relaxed">{factor.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {xaiExplanation.positive_factors?.length > 0 && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                              <h4 className="text-heading font-bold text-base sm:text-lg">Trust Signals Validated</h4>
                              <span className="text-xs font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                {xaiExplanation.positive_factors.length} VERIFIED
                              </span>
                            </div>
                            <div className="grid gap-3">
                              {xaiExplanation.positive_factors.map((factor: any, idx: number) => (
                                <div key={idx} className="dark:bg-inset bg-white/70 border border-green-500/20 rounded-lg p-3 sm:p-4 hover:border-green-500/40 transition-colors group backdrop-blur-sm">
                                  <div className="flex items-start gap-3 sm:gap-4">
                                    <span className="flex-shrink-0 mt-1 text-green-500/50 group-hover:text-green-500 transition-colors font-mono text-xs">0{idx + 1}</span>
                                    <div>
                                      <h5 className="text-green-700 dark:text-green-300 font-medium text-xs sm:text-sm mb-1">{factor.title}</h5>
                                      <p className="text-faded text-xs leading-relaxed">{factor.description}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-faded">Unable to generate explanation. Please try again.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Relations ── */}
              {activeTab === "relations" && (
                <div>
                  {loadingHistory && (
                    <div className="text-center py-12">
                      <p className="text-faded">Loading historical data...</p>
                    </div>
                  )}
                  {!loadingHistory && historicalData && (
                    <div className="space-y-5 sm:space-y-6">
                      {historicalData.whois_changes?.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-heading font-semibold mb-3 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#545BFF]"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            WHOIS Changes History
                          </h4>
                          <div className="space-y-3">
                            {historicalData.whois_changes.map((change: any, idx: number) => (
                              <div key={idx} className="dark:bg-inset/50 bg-white/60 border border-divider rounded-xl p-3 sm:p-4 hover:border-[#545BFF]/25 transition-all backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3 border-b border-divider pb-2">
                                  <span className="text-faded text-xs font-mono">{new Date(change.date).toLocaleString()}</span>
                                </div>
                                <div className="space-y-2">
                                  {Object.entries(change.changes).map(([field, fieldChange]: [string, any]) => (
                                    <div key={field} className="text-sm border-l-2 border-divider pl-3 py-1">
                                      <div className="text-faded text-xs font-medium uppercase tracking-wider mb-1">{field}</div>
                                      <div className="flex flex-col gap-1 text-xs">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400"><span className="w-4 font-mono">-</span><span className="font-mono bg-red-500/10 px-1 rounded truncate">{JSON.stringify(fieldChange.from).replace(/^"|"$/g, "")}</span></div>
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400"><span className="w-4 font-mono">+</span><span className="font-mono bg-green-500/10 px-1 rounded truncate">{JSON.stringify(fieldChange.to).replace(/^"|"$/g, "")}</span></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {historicalData.dns_changes?.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-heading font-semibold mb-3 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#b19eef]"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                            DNS Changes History
                          </h4>
                          <div className="space-y-3">
                            {historicalData.dns_changes.map((change: any, idx: number) => (
                              <div key={idx} className="dark:bg-inset/50 bg-white/60 border border-divider rounded-xl p-3 sm:p-4 hover:border-[#b19eef]/25 transition-all backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3 border-b border-divider pb-2">
                                  <span className="text-faded text-xs font-mono">{new Date(change.date).toLocaleString()}</span>
                                </div>
                                <div className="space-y-2">
                                  {Object.entries(change.changes).map(([recordType, recordChange]: [string, any]) => (
                                    <div key={recordType} className="text-sm border-l-2 border-[#b19eef]/30 pl-3 py-1">
                                      <div className="text-[#b19eef] text-xs font-medium uppercase tracking-wider mb-1">{recordType} Records</div>
                                      {recordChange.added?.map((val: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-mono"><span>+</span><span className="bg-green-500/10 px-1 rounded break-all">{val}</span></div>
                                      ))}
                                      {recordChange.removed?.map((val: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-mono"><span>-</span><span className="bg-red-500/10 px-1 rounded break-all">{val}</span></div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {historicalData.ssl_history?.length > 0 && (
                        <div>
                          <h4 className="flex items-center gap-2 text-heading font-semibold mb-3 text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            SSL Certificate History
                          </h4>
                          <div className="space-y-3">
                            {historicalData.ssl_history.slice(0, 5).map((cert: any, idx: number) => (
                              <div key={idx} className="dark:bg-inset/50 bg-white/60 border border-divider rounded-xl p-3 sm:p-4 hover:border-green-500/25 transition-all backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1.5 bg-green-500/10 rounded-lg">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                  </div>
                                  <span className="text-faded text-xs font-mono">Captured: {new Date(cert.snapshot_date).toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs ml-0 sm:ml-9">
                                  <div><div className="text-faded uppercase tracking-widest text-[10px]">Issuer</div><div className="text-copy font-medium truncate">{cert.issuer}</div></div>
                                  <div><div className="text-faded uppercase tracking-widest text-[10px]">Serial Number</div><div className="text-copy font-mono truncate">{cert.serial_number}</div></div>
                                  <div><div className="text-faded uppercase tracking-widest text-[10px]">Valid From</div><div className="text-green-600 dark:text-green-400 font-mono">{cert.valid_from}</div></div>
                                  <div><div className="text-faded uppercase tracking-widest text-[10px]">Valid Until</div><div className="text-yellow-600 dark:text-yellow-400 font-mono">{cert.valid_until}</div></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!historicalData.whois_changes?.length && !historicalData.dns_changes?.length && !historicalData.ssl_history?.length) && (
                        <div className="text-center py-12">
                          <p className="text-faded">No historical changes detected yet.</p>
                          <p className="text-faded text-sm mt-2">Changes will appear as we track this domain over time.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!loadingHistory && !historicalData && (
                    <div className="text-center py-12">
                      <p className="text-faded text-sm">No historical data available.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Community ── */}
              {activeTab === "community" && (
                <div className="py-4 sm:py-6 max-w-2xl mx-auto">
                  <h3 className="text-heading font-semibold mb-4 text-center">Community Feedback</h3>

                  {loadingComments ? (
                    <div className="text-faded text-center mb-6">Loading feedback...</div>
                  ) : communityComments.length === 0 ? (
                    <div className="text-faded text-center mb-6">No feedback yet for this URL.</div>
                  ) : (
                    <ul className="mb-6 space-y-4">
                      {communityComments.map((cmt, idx) => (
                        <li key={idx} className="dark:bg-inset/50 bg-white/60 backdrop-blur-sm border border-divider/50 rounded-xl p-4 sm:p-5 hover:border-[#545BFF]/30 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#545BFF] to-[#b19eef] p-0.5">
                                <div className="w-full h-full rounded-full dark:bg-inset bg-white flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-[#545BFF] dark:text-white">{cmt.user_id ? cmt.user_id.substring(0, 2).toUpperCase() : "AN"}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-faded">User: {cmt.user_id ? `${cmt.user_id.substring(0, 8)}...` : "Anonymous"}</div>
                                <div className="text-[10px] text-faded">{cmt.created_at ? new Date(cmt.created_at).toLocaleString() : ""}</div>
                              </div>
                            </div>
                            {cmt.flag && cmt.flag !== "neutral" && (
                              <div
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
                                  cmt.flag === "legitimate" ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {cmt.flag === "legitimate" ? (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Legitimate</span>
                                  </>
                                ) : (
                                  <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Phishing</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-copy leading-relaxed pl-11">{cmt.description}</div>
                        </li>
                      ))}
                    </ul>
                  )}


                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ScanTab root export
   Full-screen futuristic section: dot-grid,
   mouse-reactive rings & glow, HUD corners,
   security ticker, scan-beam sweeps.
───────────────────────────────────────────── */
export default function ScanTab() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // Section-level mouse tracking → moves rings + glow
  const mxRaw = useMotionValue(0.5);
  const myRaw = useMotionValue(0.5);
  const smx = useSpring(mxRaw, { stiffness: 32, damping: 14, restDelta: 0.001 });
  const smy = useSpring(myRaw, { stiffness: 32, damping: 14, restDelta: 0.001 });
  const glowX = useTransform(smx, [0, 1], [-50, 50]);
  const glowY = useTransform(smy, [0, 1], [-34, 34]);
  const ringsX = useTransform(smx, [0, 1], [-22, 22]);
  const ringsY = useTransform(smy, [0, 1], [-15, 15]);

  const onSectionMouse = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mxRaw.set((e.clientX - rect.left) / rect.width);
    myRaw.set((e.clientY - rect.top) / rect.height);
  }, [mxRaw, myRaw]);

  const TICKER = [
    "AI-POWERED THREAT DETECTION",
    "ML MODEL v2.4 ACTIVE",
    "50K+ THREATS BLOCKED",
    "99.2% DETECTION ACCURACY",
    "SUB-500MS SCAN SPEED",
    "ZERO DATA STORED",
    "REAL-TIME PROTECTION",
    "PHISHING ANALYSIS ONLINE",
  ];

  return (
    <section
      ref={ref}
      id="scan"
      className="relative min-h-screen bg-page overflow-hidden flex flex-col items-center justify-start scroll-mt-20"
      onMouseMove={onSectionMouse}
    >
      {/* ── Inline keyframes for ticker + persistent scan beam ── */}
      <style>{`
        @keyframes ss-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes ss-beam { 0%{opacity:0;transform:translateY(-100%)} 4%{opacity:0.8} 92%{opacity:0.5} 100%{opacity:0;transform:translateY(110vh)} }
        .ss-ticker-inner { display:flex; width:max-content; animation:ss-ticker 42s linear infinite; }
        .ss-beam { animation:ss-beam 14s ease-in-out 4s infinite; }
      `}</style>

      {/* ── Security ticker bar ── */}
      <div className="absolute top-0 inset-x-0 z-[20] overflow-hidden border-b border-[#545BFF]/10 dark:bg-[#545BFF]/5 bg-[#545BFF]/3">
        <div className="ss-ticker-inner items-center py-[7px]">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span
              key={i}
              className="text-[9px] font-mono text-[#545BFF]/40 dark:text-[#545BFF]/55 tracking-[0.22em] uppercase flex items-center"
            >
              <span className="mx-7 inline-block w-0.5 h-0.5 rounded-full bg-[#545BFF]/35" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Layer 1: Animated dot-grid ── */}
      <div className="absolute inset-0 z-[1]">
        <DotGrid />
      </div>

      {/* ── Layer 2: Gradient vignettes ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-page/75 via-transparent to-page/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-page/35 via-transparent to-page/35 hidden md:block" />
      </div>

      {/* ── HUD corner data labels (desktop) ── */}
      <motion.div
        className="absolute top-12 left-6 z-[15] pointer-events-none hidden lg:block"
        initial={{ opacity: 0, x: -10 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.55 }}
      >
        <div className="text-[9px] font-mono text-[#545BFF]/38 tracking-widest uppercase leading-[1.8]">
          <div>SHIELD v2.4.1</div>
          <div>PROTOCOL ACTIVE</div>
        </div>
      </motion.div>
      <motion.div
        className="absolute top-12 right-6 z-[15] pointer-events-none hidden lg:block"
        initial={{ opacity: 0, x: 10 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.65 }}
      >
        <div className="text-[9px] font-mono text-[#545BFF]/38 tracking-widest uppercase leading-[1.8] text-right">
          <div>ML MODEL READY</div>
          <div>XAI ENGINE LOADED</div>
        </div>
      </motion.div>

      {/* ── Layer 4: Ambient glow (mouse-reactive) ── */}
      <motion.div
        className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[4] pointer-events-none"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.4, delay: 0.2 }}
        style={{ x: glowX, y: glowY }}
      >
        <div className="w-[380px] h-[380px] md:w-[600px] md:h-[600px] rounded-full bg-[#545BFF]/6 dark:bg-[#545BFF]/11 blur-[110px]" />
      </motion.div>

      {/* ── Layer 5: Scan rings — mouse-reactive (desktop) ── */}
      <motion.div
        className="absolute top-[36%] left-1/2 z-[5] pointer-events-none hidden md:block"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.9, delay: 0.4 }}
        style={{ x: ringsX, y: ringsY }}
      >
        <ScanRings />
      </motion.div>

      {/* ── Persistent slow scan beam (looping) ── */}
      <div
        className="absolute inset-x-0 h-px z-[7] pointer-events-none ss-beam"
        style={{
          top: 0,
          background: "linear-gradient(to right, transparent 8%, rgba(84,91,255,0.12) 28%, rgba(84,91,255,0.5) 50%, rgba(84,91,255,0.12) 72%, transparent 92%)",
          boxShadow: "0 0 12px 2px rgba(84,91,255,0.08)",
        }}
      />

      {/* ── Entry scan beam (one-time on inView) ── */}
      {inView && (
        <motion.div
          initial={{ top: "-2px", opacity: 0.9 }}
          animate={{ top: "100%", opacity: 0 }}
          transition={{ duration: 1.9, delay: 0.08, ease: "easeInOut" }}
          className="absolute inset-x-0 h-[2px] z-[8] pointer-events-none"
          style={{
            background: "linear-gradient(to right, transparent 5%, #545BFF25 20%, #545BFF85 50%, #545BFF25 80%, transparent 95%)",
            boxShadow: "0 0 28px 8px rgba(84,91,255,0.16)",
          }}
        />
      )}

      {/* ── Dot pattern overlay ── */}
      <div
        className="absolute inset-0 z-[6] opacity-[0.014] dark:opacity-[0.028] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #545BFF 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      {/* ── Content ── */}
      <div className="relative z-[10] w-full pt-[calc(4rem+1px)] pb-16 sm:pt-[calc(5rem+1px)] sm:pb-20 md:pt-[calc(7rem+1px)] md:pb-28 lg:pt-[calc(8rem+1px)] lg:pb-32">
        <GuestScanner inView={inView} />
      </div>
    </section>
  );
}

