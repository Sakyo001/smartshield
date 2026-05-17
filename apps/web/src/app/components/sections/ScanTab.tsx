"use client";

import { createClient as createSupabaseClient } from "@lib/supabase";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DotGridCanvas from "../ui/DotGridCanvas";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ScanResult {
  url: string;
  expandedUrl?: string;
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
    feedbackComments?: number;
    riskAdjustment?: any;
    screenshot?: string | null;
    pageBehavior?: {
      has_login_form?: boolean;
      login_forms_detected?: number;
      html_findings_count?: number;
      findings?: string[];
      interaction_ready?: boolean;
      js_rendered_analysis?: boolean;
    } | null;
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
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError")
      throw new Error("Request timeout: API is taking too long to respond");
    throw error;
  }
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
    if (!enabled) {
      setText("");
      return;
    }
    const url = EXAMPLE_URLS[urlIdx];
    const delay = deleting ? 22 : charIdx >= url.length ? 1600 : 48;
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
    if (!scanning) {
      setStageIdx(0);
      setProgress(0);
      return;
    }
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
              <span className="text-[11px] font-mono text-faded tabular-nums">
                {Math.round(progress)}%
              </span>
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
    if (!active) {
      setCount(0);
      return;
    }
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
   Bot Explainer — auto-generated plain-English
   analysis that appears as chat bubbles
───────────────────────────────────────────── */
interface BotMessage {
  id: string;
  text: string;
  accent?: "red" | "yellow" | "green" | "blue";
}

function generateBotMessages(scan: ScanResult, xai: any): BotMessage[] {
  const msgs: BotMessage[] = [];
  const s = scan.riskScore;
  const status = scan.status;
  const flags: string[] =
    scan.details?.riskAdjustment?.deterministic_flags || [];
  const indicators: string[] = scan.details?.riskAdjustment?.indicators || [];
  const whois = scan.details?.whoisInfo;
  const ssl = scan.details?.sslCertificates;
  const isHTTP = scan.url.toLowerCase().startsWith("http://");

  const verdictColor =
    status === "Dangerous" ? "red" : status === "Warning" ? "yellow" : "green";

  // 1 — Greeting + overall verdict
  const verdictPhrase =
    status === "Dangerous"
      ? `**Bottom line:** This site shows **strong fraud signals**. I recommend you **exit immediately** and avoid interacting with it.`
      : status === "Warning"
        ? `**Bottom line:** This site carries **notable risks**. Proceed only if you must, and double-check every detail before interacting.`
        : `**Bottom line:** This site appears **legitimate**. Feel free to browse, but keep an eye out for anything unusual.`;
  msgs.push({ id: "verdict", text: verdictPhrase, accent: verdictColor });

  // 2 — Score meaning (contextual - unified traffic light metaphor)
  const scoreMeaning =
    s >= 67
      ? `**Bottom line:** Red band — score **${s}**. Multiple layers agree this is likely a phishing or scam destination built to harvest data.`
      : s >= 34
        ? `**Bottom line:** Amber band — score **${s}**. We found several warning signs; validate the site's authenticity before sharing any information.`
        : `**Bottom line:** Green band — score **${s}**. The site cleared our checks and looks trustworthy, though vigilance is still wise.`;
  msgs.push({ id: "score-meaning", text: scoreMeaning, accent: "blue" });

  // 3 — Specific threat flags
  if (flags.length > 0) {
    const flagLines = flags.map((f) => {
      const clean = f
        .replace(/^\u{1F6A8}\s*/u, "")
        .replace(/\s*\(legitimate site: [^)]+\)/, "");
      if (f.includes("Brand Impersonation") || f.includes("Impersonating")) {
        const m = f.match(/\(legitimate site: ([^)]+)\)/);
        return `• **Brand Impersonation** — This site is pretending to be **${m ? m[1] : "a well-known brand"}**. Scammers create look-alike websites to trick you into entering your passwords, credit card numbers, or personal information.`;
      }
      if (f.includes("Untrusted TLD") || f.includes("Suspicious TLD"))
        return "• **Suspicious Domain Ending** — The website uses an unusual domain extension (like .xyz, .tk, .cc) that's commonly used by scam sites because they're cheap and easy to register anonymously.";
      if (f.includes("VERY NEW DOMAIN") || f.includes("New Domain"))
        return "• **Brand New Website** — This domain was registered very recently. Most scam sites are created, used for a few days to steal data, then abandoned. Legitimate businesses usually have domains that are months or years old.";
      if (f.includes("CRITICAL")) return `• **Critical Threat** — ${clean}`;
      return `• ${clean}`;
    });
    msgs.push({
      id: "flags",
      text: `Key signals we flagged:\n\n${flagLines.join("\n\n")}`,
      accent: "red",
    });
  }

  // 4 — XAI risk factors (from the AI explanation engine)
  if (xai?.risk_factors?.length > 0) {
    const factorLines = xai.risk_factors
      .slice(0, 4)
      .map((f: any) => `• **${f.title}** — ${f.description}`);
    msgs.push({
      id: "xai-risks",
      text: `SHAP-based explanation: these features pulled the score upward:\n\n${factorLines.join("\n\n")}`,
      accent: "red",
    });
  }

  // 5 — HTTP warning
  if (isHTTP) {
    msgs.push({
      id: "http",
      text: "**Bottom line:** This site uses **HTTP**, so traffic is **not encrypted**. Anyone sharing the network (like public Wi‑Fi) could read or tamper with what you send — passwords, payments, or personal data.",
      accent: "yellow",
    });
  }

  // 6 — WHOIS insights
  if (whois) {
    const reg = whois.registrar || null;
    const created = whois.creation_date || null;
    if (reg || created) {
      let whoisText = "Ownership check: ";
      if (reg) whoisText += `Registered via **${reg}**. `;
      if (created) {
        const d = new Date(created);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays < 30)
          whoisText += `Domain age: **brand new** (${diffDays} day${diffDays !== 1 ? "s" : ""}); very limited history available.`;
        else if (diffDays < 365)
          whoisText += `Domain age: **growing** (${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""}); still relatively young.`;
        else
          whoisText += `Domain age: **well-established** (${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? "s" : ""}); long-running presence suggests stability.`;
      }
      msgs.push({
        id: "whois",
        text: whoisText.trim(),
        accent:
          status === "Dangerous" && whois.creation_date ? "yellow" : "blue",
      });
    }
  }

  // 7 — SSL (unified message with status-specific caveat)
  if (ssl && !ssl.error) {
    const rawIssuer = ssl.issuer || ssl.issuer_organization || null;
    const issuer =
      rawIssuer && typeof rawIssuer === "object"
        ? ((rawIssuer.O ||
            rawIssuer.CN ||
            rawIssuer.organizationName ||
            Object.values(rawIssuer).find(
              (v: unknown) => typeof v === "string",
            ) ||
            null) as string | null)
        : rawIssuer;

    let sslText = `**Bottom line:** The connection is encrypted, but certificates alone don't prove trustworthiness. `;
    if (issuer) {
      sslText += `SSL certificate verified by **${issuer}**. `;
    }
    sslText += `Encryption blocks eavesdropping, yet scammers can also obtain certificates. `;

    if (status === "Dangerous") {
      sslText += `Given the overall risk, I still recommend steering clear of this site.`;
    } else if (status === "Warning") {
      sslText += `Viewed alongside the other warning signs, proceed with caution.`;
    } else {
      sslText += `This is a positive security signal when combined with the other checks.`;
    }

    const sslAccent =
      status === "Dangerous"
        ? "yellow"
        : status === "Warning"
          ? "yellow"
          : "green";
    msgs.push({
      id: "ssl",
      text: sslText,
      accent: sslAccent,
    });
  } else if (ssl?.error) {
    msgs.push({
      id: "ssl-err",
      text: `I couldn't verify this site's SSL certificate — **${ssl.error}**. Without proper encryption, any data you send (passwords, personal info) could be intercepted by attackers.`,
      accent: "red",
    });
  }

  // 8 — Trust signals (only for non-dangerous sites, and be honest about them)
  const positive = indicators.filter(
    (i) =>
      !i.includes("CRITICAL") &&
      !i.includes("\u{1F6A8}") &&
      !i.includes("VERY NEW") &&
      !i.includes("New Domain (Risk Factor)"),
  );
  if (status === "Dangerous" && positive.length > 0) {
    msgs.push({
      id: "trust-warning",
      text: `We noted a few surface-level positives (${positive.slice(0, 2).join(", ")}), but they **do not outweigh** the critical threats. Modern phishing kits often include valid DNS and SSL to look convincing.`,
      accent: "yellow",
    });
  } else if (positive.length > 0) {
    msgs.push({
      id: "trust",
      text: `Positive signals found: **${positive.length}** (${positive.slice(0, 3).join(", ")}${positive.length > 3 ? `, plus ${positive.length - 3} more` : ""}). These are reassuring indicators.`,
      accent: "green",
    });
  }

  // 9 — Final advice (ALWAYS uses frontend verdict, never XAI)
  const finalAdvice =
    status === "Dangerous"
      ? "**Bottom line:** Avoid sharing any information or downloading files here. If this arrived via email or text, treat it as a likely phishing attempt and warn the sender their account may be compromised."
      : status === "Warning"
        ? "**Bottom line:** Move carefully. Only share sensitive details if you can independently confirm the site's legitimacy. When unsure, type the official address manually instead of clicking links."
        : "**Bottom line:** The site looks sound based on our checks. Browse normally, but stay mindful of unexpected prompts for personal data.";
  msgs.push({ id: "final", text: finalAdvice, accent: verdictColor });

  return msgs;
}

/** Renders bold **text** in messages */
function BotMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-heading">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function BotExplainer({ scan, xai }: { scan: ScanResult; xai: any }) {
  const messages = generateBotMessages(scan, xai);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(0);
    setIsTyping(true);
    setCollapsed(false);
  }, [scan.url, scan.riskScore]);

  useEffect(() => {
    if (visibleCount >= messages.length) {
      setIsTyping(false);
      return;
    }
    setIsTyping(true);
    const delay =
      visibleCount === 0
        ? 600
        : 900 +
          Math.min(messages[visibleCount - 1]?.text.length ?? 0, 150) * 2.5;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount, messages.length]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleCount]);

  const statusColor =
    scan.status === "Dangerous"
      ? "red"
      : scan.status === "Warning"
        ? "yellow"
        : "green";
  const progress =
    messages.length > 0 ? (visibleCount / messages.length) * 100 : 0;

  const getCategory = (id: string): { label: string; iconPath: string } => {
    switch (id) {
      case "verdict":
        return {
          label: "Verdict",
          iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        };
      case "score-meaning":
        return { label: "Risk Score", iconPath: "M3 3v18h18M7 16l4-7 4 4 5-9" };
      case "flags":
        return {
          label: "Threats Detected",
          iconPath:
            "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
        };
      case "xai-risks":
        return {
          label: "AI Analysis",
          iconPath:
            "M12 2a4 4 0 014 4c0 1.95-2 4-2 6h-4c0-2-2-4.05-2-6a4 4 0 014-4zM10 16v1a2 2 0 004 0v-1",
        };
      case "http":
        return {
          label: "Connection",
          iconPath:
            "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01",
        };
      case "whois":
        return {
          label: "Domain Info",
          iconPath:
            "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
        };
      case "ssl":
        return {
          label: "SSL Certificate",
          iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
        };
      case "ssl-err":
        return {
          label: "SSL Warning",
          iconPath:
            "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM15 9l-6 6M9 9l6 6",
        };
      case "trust":
        return {
          label: "Trust Signals",
          iconPath: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
        };
      case "trust-warning":
        return {
          label: "Trust Advisory",
          iconPath: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4M12 16h.01",
        };
      case "final":
        return {
          label: "Recommendation",
          iconPath:
            "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
        };
      default:
        return {
          label: "Info",
          iconPath: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01",
        };
    }
  };

  const accentMap: Record<
    string,
    { bg: string; text: string; border: string; glow: string; dot: string }
  > = {
    red: {
      bg: "bg-red-500/8 dark:bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/25 dark:border-red-500/30",
      glow: "shadow-red-500/8",
      dot: "bg-red-500",
    },
    yellow: {
      bg: "bg-yellow-500/8 dark:bg-yellow-500/10",
      text: "text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-500/25 dark:border-yellow-500/30",
      glow: "shadow-yellow-500/8",
      dot: "bg-yellow-500",
    },
    green: {
      bg: "bg-green-500/8 dark:bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/25 dark:border-green-500/30",
      glow: "shadow-green-500/8",
      dot: "bg-green-500",
    },
    blue: {
      bg: "bg-[#545BFF]/8 dark:bg-[#545BFF]/10",
      text: "text-[#545BFF] dark:text-[#a89de8]",
      border: "border-[#545BFF]/25 dark:border-[#545BFF]/30",
      glow: "shadow-[#545BFF]/8",
      dot: "bg-[#545BFF]",
    },
  };

  const statusBorderCls =
    statusColor === "red"
      ? "border-red-500/25"
      : statusColor === "yellow"
        ? "border-yellow-500/20"
        : "border-green-500/15";
  const statusGradient =
    scan.status === "Dangerous"
      ? "from-red-500 to-red-600"
      : scan.status === "Warning"
        ? "from-yellow-500 to-yellow-600"
        : "from-green-500 to-green-600";

  const statusLine = isTyping
    ? "Running multi-layer checks + SHAP explainability"
    : scan.status === "Dangerous"
      ? "Analysis complete — high risk detected"
      : scan.status === "Warning"
        ? "Analysis complete — caution advised"
        : "Analysis complete — no major threats detected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.55,
        type: "spring",
        stiffness: 110,
        damping: 20,
      }}
      className={`mb-8 rounded-2xl border ${statusBorderCls} dark:bg-[#080814]/95 bg-white/95 backdrop-blur-2xl overflow-hidden shadow-2xl relative`}
    >
      {/* Futuristic grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(84,91,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(84,91,255,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Scan-line animation */}
      {isTyping && (
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/30 to-transparent pointer-events-none z-10"
          animate={{ y: [0, 500, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Animated top accent line */}
      <div className="h-[2px] w-full relative overflow-hidden">
        {isTyping ? (
          <motion.div
            className={`h-full ${scan.status === "Dangerous" ? "bg-gradient-to-r from-transparent via-red-500 to-transparent" : scan.status === "Warning" ? "bg-gradient-to-r from-transparent via-yellow-500 to-transparent" : "bg-gradient-to-r from-transparent via-green-500 to-transparent"}`}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            style={{ width: "100%" }}
          />
        ) : (
          <div
            className={`absolute inset-0 ${scan.status === "Dangerous" ? "bg-gradient-to-r from-red-500/20 via-red-500/60 to-red-500/20" : scan.status === "Warning" ? "bg-gradient-to-r from-yellow-500/20 via-yellow-500/60 to-yellow-500/20" : "bg-gradient-to-r from-green-500/20 via-green-500/60 to-green-500/20"}`}
          />
        )}
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-divider/20">
        <div className="flex items-center gap-4">
          {/* Holographic avatar */}
          <div className="relative">
            <motion.div
              className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${statusGradient} opacity-20 blur-md`}
              animate={{ opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-gradient-to-br from-[#545BFF] via-[#6B73FF] to-[#8B5CF6] flex items-center justify-center shadow-xl shadow-[#545BFF]/30 ring-1 ring-white/10">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-[24px] sm:h-[24px] drop-shadow-lg"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <motion.span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2px] dark:border-[#080814] border-white shadow-md ${
                isTyping
                  ? "bg-yellow-400"
                  : scan.status === "Dangerous"
                    ? "bg-red-500"
                    : scan.status === "Warning"
                      ? "bg-yellow-500"
                      : "bg-green-500"
              }`}
              animate={
                isTyping ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}
              }
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-heading font-bold text-base sm:text-[17px] tracking-tight">
                SmartShield AI Analyst
              </span>
              <span className="px-2 py-0.5 text-[8px] sm:text-[9px] font-bold tracking-[0.16em] uppercase bg-gradient-to-r from-[#545BFF]/15 to-[#8B5CF6]/15 text-[#545BFF] dark:text-[#b19eef] rounded-md border border-[#545BFF]/20 shadow-inner">
                Explainable AI
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-faded text-[10px] sm:text-[11px] font-medium">
                {statusLine}
              </span>
              {isTyping && (
                <span className="flex items-center gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="w-1 h-1 rounded-full bg-[#545BFF]"
                    />
                  ))}
                </span>
              )}
              {!isTyping && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-md ${
                    scan.status === "Dangerous"
                      ? "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"
                      : scan.status === "Warning"
                        ? "bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border border-yellow-500/20"
                        : "bg-green-500/10 text-green-500 dark:text-green-400 border border-green-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${scan.status === "Dangerous" ? "bg-red-500" : scan.status === "Warning" ? "bg-yellow-500" : "bg-green-500"}`}
                  />
                  {scan.status}
                </motion.span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-all text-faded hover:text-heading border border-transparent hover:border-divider/30"
          aria-label={collapsed ? "Expand analysis" : "Collapse analysis"}
        >
          <motion.svg
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </motion.svg>
        </button>
      </div>

      {/* Chat area */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div
              ref={containerRef}
              className="px-5 sm:px-6 py-5 sm:py-6 space-y-4 max-h-[520px] overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(84,91,255,0.15) transparent",
              }}
            >
              {messages.slice(0, visibleCount).map((msg) => {
                const cat = getCategory(msg.id);
                const colors = accentMap[msg.accent || "blue"];
                const isVerdict = msg.id === "verdict";
                const isFinal = msg.id === "final";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.45,
                      type: "spring",
                      stiffness: 140,
                      damping: 18,
                    }}
                  >
                    {/* Category label row */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-5 h-5 rounded-md ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={colors.text}
                        >
                          <path d={cat.iconPath} />
                        </svg>
                      </div>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold tracking-[0.12em] uppercase ${colors.text}`}
                      >
                        {cat.label}
                      </span>
                      <div
                        className={`flex-1 h-px ${colors.border} border-t border-dashed`}
                      />
                    </div>

                    {/* Message card */}
                    <div
                      className={`relative rounded-xl px-4 sm:px-5 py-3.5 sm:py-4 border ${colors.border} ${
                        isVerdict || isFinal
                          ? `${colors.bg} shadow-lg ${colors.glow}`
                          : "dark:bg-white/[0.02] bg-white/60 shadow-sm"
                      } backdrop-blur-sm hover:dark:bg-white/[0.04] hover:bg-white/80 transition-all duration-200`}
                    >
                      {/* Left accent bar */}
                      <div
                        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${colors.dot}`}
                      />
                      <p
                        className={`text-copy ${isVerdict ? "text-[13.5px] sm:text-[14.5px]" : "text-[12.5px] sm:text-[13.5px]"} leading-[1.75] whitespace-pre-line pl-2`}
                      >
                        <BotMarkdown text={msg.text} />
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3 pt-1"
                  >
                    <div className="w-5 h-5 rounded-md bg-[#545BFF]/10 border border-[#545BFF]/20 flex items-center justify-center flex-shrink-0">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-2.5 h-2.5 border border-[#545BFF]/60 border-t-[#545BFF] rounded-full"
                      />
                    </div>
                    <div className="dark:bg-white/[0.025] bg-white/60 rounded-xl px-4 py-3 border dark:border-divider/30 border-divider/50 inline-flex items-center gap-2">
                      <span className="text-faded text-[11px]">
                        Processing insight {visibleCount + 1}
                      </span>
                      <span className="flex items-center gap-[3px]">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 0.65,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: "easeInOut",
                            }}
                            className="w-[5px] h-[5px] rounded-full bg-[#545BFF]"
                          />
                        ))}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer with step progress */}
            <div className="relative px-5 sm:px-6 pb-4 pt-2">
              <div className="h-[3px] w-full rounded-full dark:bg-white/[0.04] bg-slate-200/60 overflow-hidden mb-3">
                <motion.div
                  className={`h-full rounded-full ${
                    !isTyping
                      ? `bg-gradient-to-r ${statusGradient}`
                      : "bg-gradient-to-r from-[#545BFF] to-[#8B5CF6]"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {messages.map((m, i) => (
                      <motion.div
                        key={m.id}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i < visibleCount
                            ? `${accentMap[messages[i].accent || "blue"].dot} w-3`
                            : "dark:bg-white/10 bg-slate-300/50 w-1.5"
                        }`}
                        initial={false}
                        animate={
                          i === visibleCount - 1 && i >= 0
                            ? { scale: [1, 1.4, 1] }
                            : {}
                        }
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-faded tracking-wider uppercase">
                    {visibleCount}/{messages.length} Insights
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-faded/40 tracking-wider uppercase hidden sm:inline">
                  AI-powered · Privacy-first
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${safeSeconds}s`;
}

/* ─────────────────────────────────────────────
   Guest Scanner (no auth required)
───────────────────────────────────────────── */
function GuestScanner({
  inView,
  lowPerformanceMode,
  hideGuestMode,
}: {
  inView: boolean;
  lowPerformanceMode: boolean;
  hideGuestMode: boolean;
}) {
  const LEGACY_WHOIS_API_URL = "https://web-production-568aa.up.railway.app";
  const DEFAULT_WHOIS_API_URL = "https://web-production-60049.up.railway.app";
  const WHOIS_API_URL =
    process.env.NEXT_PUBLIC_WHOIS_API_URL === LEGACY_WHOIS_API_URL
      ? DEFAULT_WHOIS_API_URL
      : (process.env.NEXT_PUBLIC_WHOIS_API_URL ?? DEFAULT_WHOIS_API_URL);
  const supabase = createSupabaseClient();

  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState<{ retryAfter: number } | null>(
    null,
  );
  const [guestDailyQuota, setGuestDailyQuota] = useState<{
    dailyLimit: number;
    resetAt: number;
    retryAfter: number;
  } | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );
  const [activeTab, setActiveTab] = useState<
    | "detection"
    | "explanation"
    | "details"
    | "relations"
    | "feedback"
    | "history"
  >("detection");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [hasCompletedScan, setHasCompletedScan] = useState(false);

  // XAI explanation
  const [xaiExplanation, setXaiExplanation] = useState<any>(null);
  const [loadingXAI, setLoadingXAI] = useState(false);

  // Relations / history
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Community (read-only for guests)
  const [communityComments, setCommunityComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentFlag, setCommentFlag] = useState<
    "phishing" | "legitimate" | "neutral"
  >("neutral");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  // User scan history (authenticated only)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [loadingScanHistory, setLoadingScanHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySort, setHistorySort] = useState<
    "newest" | "oldest" | "riskDesc" | "riskAsc"
  >("newest");
  const [historyFilter, setHistoryFilter] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRiskFilter, setHistoryRiskFilter] = useState<
    "all" | "safe" | "warning" | "dangerous"
  >("all");

  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilter, historySort, historyRiskFilter, scanHistory.length]);

  // Scroll targets
  const riskScoreRef = useRef<HTMLDivElement>(null);
  const botExplainerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax for shield
  const contentRef = useRef<HTMLDivElement>(null);
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);
  const smx = useSpring(mxRaw, {
    stiffness: 55,
    damping: 18,
    restDelta: 0.001,
  });
  const smy = useSpring(myRaw, {
    stiffness: 55,
    damping: 18,
    restDelta: 0.001,
  });
  const shieldX = useTransform(smx, [-0.5, 0.5], [-14, 14]);
  const shieldY = useTransform(smy, [-0.5, 0.5], [-9, 9]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (lowPerformanceMode) return;
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return;
      mxRaw.set((e.clientX - rect.left) / rect.width - 0.5);
      myRaw.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [lowPerformanceMode, mxRaw, myRaw],
  );

  // Countdown for rate-limit banner
  useEffect(() => {
    if (!rateLimited) return;
    if (retryCountdown <= 0) {
      setRateLimited(null);
      return;
    }
    const t = setTimeout(() => setRetryCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [rateLimited, retryCountdown]);

  useEffect(() => {
    if (isAuthenticated && guestDailyQuota) {
      setGuestDailyQuota(null);
    }
  }, [isAuthenticated, guestDailyQuota]);

  useEffect(() => {
    if (!guestDailyQuota) return;

    const tick = () => {
      const nextRetryAfter = Math.max(
        0,
        Math.ceil((guestDailyQuota.resetAt - Date.now()) / 1000),
      );

      if (nextRetryAfter <= 0) {
        setGuestDailyQuota(null);
        return;
      }

      setGuestDailyQuota((prev) =>
        prev
          ? {
              ...prev,
              retryAfter: nextRetryAfter,
            }
          : prev,
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [guestDailyQuota?.resetAt]);

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

  // Two-step scroll: Risk Score card first, then Bot Explainer
  useEffect(() => {
    if (!currentScan) return;
    // Step 1 — scroll to risk score card quickly after results appear
    const t1 = setTimeout(() => {
      riskScoreRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 400);
    // Step 2 — after user has seen the risk score, scroll to bot explainer
    const t2 = setTimeout(() => {
      botExplainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentScan?.url, currentScan?.riskScore]);

  // Typewriter placeholder (active when input is empty + not scanning)
  const typingPlaceholder = useTypingPlaceholder(
    !lowPerformanceMode && !urlInput && !scanning && inView,
  );
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

  useEffect(() => {
    let mounted = true;

    const syncAuthState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsAuthenticated(Boolean(user));
      setCurrentUserEmail(user?.email || null);
    };

    void syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthenticated(Boolean(session?.user));
      setCurrentUserEmail(session?.user?.email || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

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
            deterministic_flags:
              currentScan.details?.riskAdjustment?.deterministic_flags || [],
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

  /* Fetch feedback when tab active */
  useEffect(() => {
    if (
      activeTab !== "feedback" ||
      !currentScan ||
      !isAuthenticated ||
      !hasCompletedScan
    )
      return;
    setLoadingComments(true);
    (async () => {
      try {
        const res = await fetch(
          `${WHOIS_API_URL}/api/reports?url=${encodeURIComponent(currentScan.url)}`,
        );
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
  }, [activeTab, currentScan, isAuthenticated, hasCompletedScan]);

  /* Fetch relations / history when tab active */
  useEffect(() => {
    if (
      activeTab !== "relations" ||
      !currentScan ||
      historicalData ||
      loadingHistory
    )
      return;
    setLoadingHistory(true);
    (async () => {
      try {
        const res = await fetchWithTimeout(
          `${WHOIS_API_URL}/api/domain-history`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentScan.url }),
            timeout: 15000,
          },
        );
        if (res.ok) setHistoricalData(await res.json());
      } catch {
        /* ignore */
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [activeTab, currentScan]);

  const refreshCommunityComments = useCallback(async () => {
    if (!currentScan) return;
    setLoadingComments(true);
    try {
      const res = await fetch(
        `${WHOIS_API_URL}/api/reports?url=${encodeURIComponent(currentScan.url)}`,
      );
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
  }, [WHOIS_API_URL, currentScan]);

  /* Fetch user's scan history from extension_activity */
  const fetchUserScanHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingScanHistory(true);
    setHistoryError(null);

    try {
      const res = await fetch("/api/community/scan-history");
      if (res.ok) {
        const data = await res.json();
        setScanHistory(data.history || []);
      } else {
        setHistoryError("Unable to fetch history");
        setScanHistory([]);
      }
    } catch (err) {
      setHistoryError("Error loading history");
      setScanHistory([]);
    } finally {
      setLoadingScanHistory(false);
    }
  }, [isAuthenticated]);

  /* Fetch user scan history when history tab active */
  useEffect(() => {
    if (activeTab !== "history" || !isAuthenticated) return;
    fetchUserScanHistory();
  }, [activeTab, isAuthenticated, fetchUserScanHistory]);

  /* Persistent per-device ID so every browser gets its own rate-limit bucket */
  const getDeviceId = (): string => {
    try {
      let id = localStorage.getItem("smartshield-device-id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("smartshield-device-id", id);
      }
      return id;
    } catch {
      return "";
    }
  };

  /* Core scan logic */
  const doScan = async (url: string) => {
    setScanning(true);
    setError(null);
    setRateLimited(null);
    setRetryCountdown(0);
    setCurrentScan(null);
    setUrlInput(url);

    try {
      const deviceId = getDeviceId();
      const response = await fetchWithTimeout("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(deviceId ? { "X-Device-ID": deviceId } : {}),
        },
        body: JSON.stringify({ url }),
        timeout: 55000,
      });

      if (response.status === 429) {
        const errData = await response.json().catch(() => ({}));
        const retryAfter = errData.retryAfter ?? 60;

        if (errData.quotaType === "guest_daily_quota") {
          const resetAt =
            typeof errData.resetAt === "number"
              ? errData.resetAt
              : Date.now() + retryAfter * 1000;

          setGuestDailyQuota({
            dailyLimit:
              typeof errData.dailyLimit === "number" ? errData.dailyLimit : 3,
            resetAt,
            retryAfter,
          });
          return;
        }

        setRateLimited({ retryAfter });
        setRetryCountdown(retryAfter);
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error ?? `Scan failed (${response.status})`);
      }

      const data = await response.json();

      let whoisInfo = data.whois || null;
      let dnsRecords = data.dns || null;
      let sslInfo = data.ssl || null;
      let riskAdjustment = data.risk_adjustment || null;
      let screenshot = data.screenshot || null;
      const pageBehavior = data.page_behavior || null;

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
        const deterministicIncrease =
          riskAdjustment.deterministic_increase || 0;
        const contextualReduction = riskAdjustment.reduction_percentage || 0;
        const indicators = riskAdjustment.indicators || [];

        const criticalIndicators = indicators.filter(
          (i: string) =>
            typeof i === "string" &&
            (i.includes("CRITICAL") || i.includes("\u{1F6A8}")),
        );

        if (criticalIndicators.length > 0) {
          riskScore = 100;
          status = "Dangerous";
        } else {
          riskScore = riskScore + deterministicIncrease - contextualReduction;
          riskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

          const hasWhoisWarning = indicators.some(
            (i: string) =>
              typeof i === "string" &&
              i.includes("WHOIS Information Unavailable") &&
              !i.includes("CRITICAL"),
          );
          if (hasWhoisWarning && riskScore < 45) riskScore = 45;

          if (riskScore >= 70) status = "Dangerous";
          else if (riskScore >= 40) status = "Warning";
          else status = "Safe";
        }
      }

      const scanResult: ScanResult = {
        url,
        expandedUrl: data.expanded_url || undefined,
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
          feedbackComments: data.community_comments || 0,
          riskAdjustment,
          screenshot,
          pageBehavior,
        },
      };

      setCurrentScan(scanResult);

      // Scan is automatically saved to extension_activity by the /api/scan endpoint
      setHasCompletedScan(true);
      setCommentError(null);
      setCommentSuccess(null);

      setActiveTab("detection");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while scanning",
      );
    } finally {
      setScanning(false);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    if (urlInput.trim().length > 100) {
      setUrlError("URL must be 100 characters or fewer.");
      return;
    }
    if (!/^https?:\/\//i.test(urlInput.trim())) {
      setUrlError(
        "Please include the full URL starting with http:// or https://",
      );
      return;
    }
    setUrlError(null);
    doScan(urlInput.trim());
  };

  const handleReanalyze = () => {
    if (!currentScan) return;
    doScan(currentScan.url);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    setCommentSuccess(null);

    if (!isAuthenticated || !hasCompletedScan || !currentScan) {
      setCommentError("Please log in and complete a scan before commenting.");
      return;
    }

    const description = commentText.trim();
    if (description.length < 3) {
      setCommentError("Comment must be at least 3 characters.");
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentScan.url,
          description,
          flag: commentFlag,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCommentError(body.error || "Unable to submit comment.");
        return;
      }

      setCommentText("");
      setCommentFlag("neutral");
      setCommentSuccess("Comment submitted successfully.");
      await refreshCommunityComments();
    } catch {
      setCommentError("Unable to submit comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const showGuestMessaging = !isAuthenticated && !hideGuestMode;
  const guestQuotaLocked = showGuestMessaging && Boolean(guestDailyQuota);

  const filteredAndSortedHistory = useMemo(() => {
    const query = historyFilter.trim().toLowerCase();
    const safeDate = (scan: ScanResult) => {
      const ts = new Date(scan.date).getTime();
      return Number.isFinite(ts) ? ts : 0;
    };

    const filtered = scanHistory.filter((scan) => {
      const matchesText = query
        ? scan.url.toLowerCase().includes(query) ||
          scan.status.toLowerCase().includes(query) ||
          (scan.expandedUrl
            ? scan.expandedUrl.toLowerCase().includes(query)
            : false)
        : true;

      const matchesRisk =
        historyRiskFilter === "all"
          ? true
          : historyRiskFilter === "safe"
            ? scan.status === "Safe"
            : historyRiskFilter === "warning"
              ? scan.status === "Warning"
              : scan.status === "Dangerous";

      return matchesText && matchesRisk;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (historySort) {
        case "oldest":
          return safeDate(a) - safeDate(b);
        case "riskDesc":
          return b.riskScore - a.riskScore;
        case "riskAsc":
          return a.riskScore - b.riskScore;
        case "newest":
        default:
          return safeDate(b) - safeDate(a);
      }
    });

    return sorted;
  }, [historyFilter, historySort, historyRiskFilter, scanHistory]);

  const itemsPerPage = 5;
  const totalHistoryPages = Math.max(
    1,
    Math.ceil(filteredAndSortedHistory.length / itemsPerPage),
  );
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const paginatedHistory = filteredAndSortedHistory.slice(
    (currentHistoryPage - 1) * itemsPerPage,
    currentHistoryPage * itemsPerPage,
  );
  const historyRangeStart =
    filteredAndSortedHistory.length === 0
      ? 0
      : (currentHistoryPage - 1) * itemsPerPage + 1;
  const historyRangeEnd = Math.min(
    filteredAndSortedHistory.length,
    currentHistoryPage * itemsPerPage,
  );

  return (
    <div
      ref={contentRef}
      onMouseMove={lowPerformanceMode ? undefined : handleMouseMove}
      className="max-w-4xl mx-auto px-4 sm:px-6"
    >
      {/* ─── Shield Logo (mouse-parallax + rotating HUD rings) ─── */}
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 1.4 }}
        animate={inView ? { y: 0, opacity: 1, scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 58, damping: 14, delay: 0.05 }}
        style={{
          x: lowPerformanceMode ? 0 : shieldX,
          y: lowPerformanceMode ? 0 : shieldY,
        }}
        className="relative flex justify-center mb-6 sm:mb-8 will-change-transform"
      >
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36">
          {/* Slow-rotating dashed outer ring */}
          {!lowPerformanceMode && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-5 rounded-full border border-dashed border-[#545BFF]/20 pointer-events-none"
            />
          )}
          {/* Counter-rotating dashed accent ring */}
          {!lowPerformanceMode && (
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2.5 rounded-full border border-dashed border-[#545BFF]/12 pointer-events-none"
            />
          )}
          {/* The 3D shield */}
          <Image
            src="/images/3D Logo.png"
            alt="SmartShield"
            width={144}
            height={144}
            className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_44px_rgba(84,91,255,0.58)]"
          />
          {/* Ripple rings expanding after settle */}
          {!lowPerformanceMode &&
            [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={inView ? { scale: 3.4 + i * 1.5, opacity: 0 } : {}}
                transition={{
                  duration: 1.9,
                  delay: 0.48 + i * 0.2,
                  ease: "easeOut",
                }}
                className="absolute inset-0 rounded-full border-2 border-[#545BFF]/30 pointer-events-none"
              />
            ))}
          {/* Sustained ambient glow */}
          {!lowPerformanceMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1.2, duration: 0.9 }}
              className="absolute -inset-12 rounded-full bg-[#545BFF]/5 dark:bg-[#545BFF]/13 blur-3xl pointer-events-none -z-10"
            />
          )}
          {/* HUD corner accent dots */}
          {[
            "top-0 left-0",
            "top-0 right-0",
            "bottom-0 left-0",
            "bottom-0 right-0",
          ].map((pos, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                delay: 0.88 + i * 0.06,
                type: "spring",
                stiffness: 280,
              }}
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
            {showGuestMessaging ? "Guest Mode" : "Scan URLs Instantly"}
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
          {showGuestMessaging
            ? "Scan any URL with no account needed."
            : "Protect yourself from phishing attacks instantly."}
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="dark:text-slate-500 text-slate-400 flex-shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setUrlInput(e.target.value);
                  setUrlError(null);
                }
              }}
              placeholder={
                urlInput
                  ? "Paste a URL to scan..."
                  : typingPlaceholder ||
                    "Paste a URL to scan (e.g. https://example.com)..."
              }
              className="w-full bg-transparent border-none text-heading placeholder:text-faded focus:outline-none focus:ring-0 py-3 text-sm sm:text-base"
              maxLength={100}
              required
              disabled={guestQuotaLocked}
              suppressHydrationWarning
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !urlInput || guestQuotaLocked}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-medium transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 text-sm sm:text-base ${
              scanning || guestQuotaLocked
                ? "bg-inset text-faded cursor-wait"
                : "bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#5a62ff] text-white shadow-lg shadow-[#545BFF]/20 hover:shadow-[#545BFF]/40"
            }`}
          >
            {scanning ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Scanning...</span>
              </>
            ) : guestQuotaLocked ? (
              <>
                <span>Daily Limit Reached</span>
              </>
            ) : (
              <>
                <span>Scan Now</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </>
            )}
          </button>
        </div>
      </motion.form>

      <AnimatePresence>
        {guestQuotaLocked && (
          <motion.div
            key="guest-daily-quota"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28 }}
            className="mb-6 rounded-2xl border border-[#545BFF]/30 bg-[#545BFF]/10 dark:bg-[#0f1333]/55 p-4 sm:p-5"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#545BFF]/20">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#545BFF] dark:text-[#a89de8]"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-[15px] font-semibold text-[#545BFF] dark:text-[#a89de8]">
                  Guest daily quota reached
                </p>
                <p className="text-xs sm:text-sm text-copy/75 mt-1 leading-relaxed">
                  You used all {guestDailyQuota?.dailyLimit ?? 3} guest scans for
                  this device today. Sign in to continue scanning right now.
                </p>
                <p className="text-[11px] text-faded mt-2">
                  Daily quota resets in {formatDuration(guestDailyQuota?.retryAfter ?? 0)}.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#5a62ff] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#545BFF] dark:text-[#a89de8] border border-[#545BFF]/35 hover:bg-[#545BFF]/10 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* character counter — only visible once the user starts typing */}
      {urlInput.length > 0 && (
        <p
          className={`text-xs mt-1.5 px-1 text-right tabular-nums ${urlInput.length >= 100 ? "text-red-500 dark:text-red-400 font-semibold" : urlInput.length >= 80 ? "text-amber-500 dark:text-amber-400" : "text-faded"}`}
        >
          {urlInput.length}/100
        </p>
      )}

      <ScanProgress scanning={scanning} />

      {urlError && (
        <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mt-2 px-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
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
          <span
            className={`text-xs font-medium tracking-wide ${apiStatus === "online" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            SYSTEM STATUS:{" "}
            {apiStatus === "online"
              ? "OPERATIONAL"
              : apiStatus === "checking"
                ? "CHECKING..."
                : "OFFLINE"}
          </span>
        </div>
      </motion.div>

      {/* ─── Rate Limit Banner ─── */}
      <AnimatePresence>
        {rateLimited && (
          <motion.div
            key="rate-limit"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 dark:bg-amber-900/20 p-4 flex items-start gap-3"
          >
            {/* flame / clock icon */}
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm">
                Scan limit reached
              </p>
              <p className="text-amber-600/90 dark:text-amber-400/80 text-xs mt-0.5">
                You&apos;ve used all{" "}
                <span className="font-semibold">3 scans</span> allowed per
                minute.
                {retryCountdown > 0 && (
                  <>
                    {" "}
                    Try again in&nbsp;
                    <span className="font-semibold tabular-nums">
                      {retryCountdown}s
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
            {/* circular countdown ring */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg
                width="40"
                height="40"
                className="-rotate-90"
                viewBox="0 0 40 40"
              >
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-amber-400/20"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-amber-500 transition-all duration-1000"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - retryCountdown / (rateLimited.retryAfter || 60))}`}
                />
              </svg>
              <span className="absolute text-[10px] font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {retryCountdown}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Error ─── */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-200 text-sm">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* ─── Scan Results ─── */}
      {currentScan && (
        <motion.div
          ref={riskScoreRef}
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 110,
            damping: 20,
          }}
          className="mt-4 scroll-mt-20"
        >
          {/* Risk Score Card */}
          <div
            className={`relative overflow-hidden rounded-2xl border ${
              currentScan.status === "Dangerous"
                ? "border-red-500/25 dark:bg-[#0c0810]/80 bg-white/90"
                : currentScan.status === "Warning"
                  ? "border-yellow-500/25 dark:bg-[#0c0c10]/80 bg-white/90"
                  : "border-green-500/25 dark:bg-[#080c10]/80 bg-white/90"
            } p-5 sm:p-6 md:p-8 mb-8 backdrop-blur-xl shadow-2xl`}
          >
            {/* Top accent bar */}
            <div
              className={`absolute top-0 inset-x-0 h-[2px] ${currentScan.status === "Dangerous" ? "bg-gradient-to-r from-transparent via-red-500 to-transparent" : currentScan.status === "Warning" ? "bg-gradient-to-r from-transparent via-yellow-500 to-transparent" : "bg-gradient-to-r from-transparent via-green-500 to-transparent"}`}
            />

            {/* Glow */}
            <div
              className={`absolute top-0 right-0 -mr-24 -mt-24 w-[28rem] h-[28rem] rounded-full blur-[100px] opacity-[0.12] pointer-events-none ${
                currentScan.status === "Dangerous"
                  ? "bg-red-500"
                  : currentScan.status === "Warning"
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
            />
            <div
              className={`absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full blur-[80px] opacity-[0.05] pointer-events-none bg-[#545BFF]`}
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8 md:gap-12">
              {/* Risk Circle */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52">
                  {/* Outer ambient ring */}
                  <div
                    className={`absolute inset-[-6px] rounded-full border ${
                      currentScan.status === "Dangerous"
                        ? "border-red-500/10"
                        : currentScan.status === "Warning"
                          ? "border-yellow-500/10"
                          : "border-green-500/10"
                    }`}
                  />
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-divider/40"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className={
                        currentScan.status === "Dangerous"
                          ? "text-red-500"
                          : currentScan.status === "Warning"
                            ? "text-yellow-500"
                            : "text-green-500"
                      }
                      strokeDasharray={`${(currentScan.riskScore / 100) * 283} 283`}
                      strokeLinecap="round"
                      style={{
                        filter: `drop-shadow(0 0 8px ${currentScan.status === "Dangerous" ? "rgba(239,68,68,0.4)" : currentScan.status === "Warning" ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)"})`,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      key={currentScan.riskScore}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 16,
                        delay: 0.2,
                      }}
                      className="text-4xl sm:text-5xl md:text-6xl font-bold text-heading tracking-tighter tabular-nums"
                    >
                      {displayScore}
                    </motion.span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-faded mt-1 font-mono">
                      Risk Score
                    </span>
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.4,
                    type: "spring",
                    stiffness: 150,
                    damping: 14,
                  }}
                  className={`mt-3 sm:mt-4 px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase flex items-center gap-2 ${
                    currentScan.status === "Dangerous"
                      ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10"
                      : currentScan.status === "Warning"
                        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 shadow-lg shadow-yellow-500/10"
                        : "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentScan.status === "Dangerous"
                        ? "bg-red-500 animate-pulse"
                        : currentScan.status === "Warning"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
                  {currentScan.status}
                </motion.div>
              </div>

              {/* Info */}
              <div className="flex-1 w-full text-center lg:text-left">
                <div className="flex items-center gap-2.5 mb-3 justify-center lg:justify-start">
                  <div
                    className={`p-1.5 rounded-lg ${
                      currentScan.status === "Dangerous"
                        ? "bg-red-500/10 text-red-500"
                        : currentScan.status === "Warning"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-green-500/10 text-green-500"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-heading break-all font-mono">
                    {currentScan.url}
                  </h2>
                </div>

                {/* Expanded URL banner — shown when a shortened URL was resolved */}
                {currentScan.expandedUrl && (
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-[#545BFF]/8 dark:bg-[#545BFF]/10 border border-[#545BFF]/20 rounded-xl flex items-start gap-3 text-left backdrop-blur-sm">
                    <div className="p-1.5 bg-[#545BFF]/15 rounded-lg text-[#545BFF] shrink-0 mt-0.5">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#545BFF] dark:text-[#7c83ff] font-semibold text-xs sm:text-sm mb-0.5">
                        Shortened URL — Real Destination Revealed
                      </p>
                      <p className="text-copy/70 text-[11px] sm:text-xs mb-1">
                        This link redirected to:
                      </p>
                      <a
                        href={currentScan.expandedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-heading text-xs sm:text-sm font-mono break-all hover:text-[#545BFF] transition-colors"
                      >
                        {currentScan.expandedUrl}
                      </a>
                      <p className="text-faded text-[10px] sm:text-xs mt-1.5">
                        Risk analysis was performed on the destination URL
                        above.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-5 sm:mb-6 ${
                    currentScan.status === "Dangerous"
                      ? "bg-red-500/8 border-red-500/15 text-red-700 dark:text-red-300"
                      : currentScan.status === "Warning"
                        ? "bg-yellow-500/8 border-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                        : "bg-green-500/8 border-green-500/15 text-green-700 dark:text-green-300"
                  }`}
                >
                  {currentScan.status === "Dangerous" ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6" />
                      <path d="M9 9l6 6" />
                    </svg>
                  ) : currentScan.status === "Warning" ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                  <span className="text-xs sm:text-sm font-medium">
                    {currentScan.status === "Dangerous"
                      ? "High threat level detected. Avoid this site."
                      : currentScan.status === "Warning"
                        ? "Potential risks detected. Proceed with caution."
                        : "No major threats detected. Safe to browse."}
                  </span>
                </div>

                {/* HTTP Warning */}
                {currentScan.url.toLowerCase().startsWith("http://") && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-500/8 border border-yellow-500/20 rounded-xl flex items-start gap-3 text-left">
                    <div className="p-1.5 bg-yellow-500/15 rounded-lg text-yellow-500 shrink-0">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-yellow-600 dark:text-yellow-400 font-bold text-xs sm:text-sm">
                        Insecure Connection (HTTP)
                      </h4>
                      <p className="text-yellow-700/80 dark:text-yellow-200/70 text-[11px] sm:text-xs mt-0.5">
                        Data sent to this website is not encrypted and could be
                        intercepted.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {[
                    {
                      label: "Registrar",
                      value: currentScan.details?.registrar || "Unknown",
                      icon: (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[#545BFF]"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      ),
                    },
                    {
                      label: "Created",
                      value: currentScan.details?.creationDate || "Unknown",
                      icon: (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[#b19eef]"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      ),
                    },
                    {
                      label: "Last Analysis",
                      value: currentScan.details?.lastAnalysisDate || "N/A",
                      icon: (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-green-500"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ),
                    },
                  ].map(({ label, value, icon }) => (
                    <div
                      key={label}
                      className="dark:bg-white/[0.025] bg-white/60 p-3 sm:p-4 rounded-xl border border-divider/50 backdrop-blur-sm hover:border-divider transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                          {icon}
                        </div>
                        <div className="text-faded text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-mono">
                          {label}
                        </div>
                      </div>
                      <div className="text-heading font-semibold text-[11px] sm:text-xs truncate">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reanalyze + signup nudge */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-divider/30">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-faded flex-wrap justify-center sm:justify-start">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-[#545BFF]/60 shrink-0"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="font-mono tracking-wider">
                  Results are not saved.
                </span>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={scanning}
                className="group px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl dark:bg-white/[0.04] bg-white/80 hover:bg-white dark:hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed text-heading transition-all text-xs sm:text-sm font-semibold border border-divider/60 hover:border-[#545BFF]/30 backdrop-blur-sm flex items-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-[#545BFF] group-hover:rotate-180 transition-transform duration-500"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                {scanning ? "Scanning..." : "Reanalyze"}
              </button>
            </div>
          </div>

          {/* ─── SmartShield AI Bot Explainer ─── */}
          <div ref={botExplainerRef} className="scroll-mt-20">
            <BotExplainer scan={currentScan} xai={xaiExplanation} />
          </div>

          {/* ─── Detail Tabs ─── */}
          <div className="dark:bg-[#080814]/80 bg-white/90 backdrop-blur-xl border border-divider/40 dark:border-[#545BFF]/10 rounded-2xl overflow-hidden shadow-2xl dark:shadow-[0_8px_48px_rgba(84,91,255,0.06)]">
            {/* Tab bar with responsive design */}
            <div className="flex overflow-x-auto p-1 sm:p-2 gap-1 border-b border-divider/20 dark:bg-white/[0.01] bg-slate-50/50 scrollbar-hide">
              {[
                {
                  key: "detection" as const,
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                  label: "Detection",
                },
                {
                  key: "explanation" as const,
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ),
                  label: "Explanation",
                },
                {
                  key: "details" as const,
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  ),
                  label: "Details",
                },
                {
                  key: "relations" as const,
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ),
                  label: "Relations",
                },
                {
                  key: "feedback" as const,
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  ),
                  label: "Feedback",
                },
                ...(isAuthenticated
                  ? [
                      {
                        key: "history" as const,
                        icon: (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        ),
                        label: "History",
                      },
                    ]
                  : []),
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  title={label}
                  className={`relative flex items-center gap-1 sm:gap-2 px-2 xs:px-2.5 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-250 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#545BFF]/50 flex-shrink-0 ${
                    activeTab === key
                      ? "text-white bg-gradient-to-r from-[#545BFF] to-[#6B73FF] shadow-lg shadow-[#545BFF]/25"
                      : "text-faded hover:text-heading dark:hover:bg-white/[0.04] hover:bg-slate-100/80"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 ${activeTab === key ? "text-white" : "text-faded"}`}
                  >
                    {icon}
                  </span>
                  <span className="hidden sm:inline text-[10px] xs:text-[11px] sm:text-sm font-medium">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3 xs:p-4 sm:p-6 md:p-8">
              {/* ── Detection ── */}
              {activeTab === "detection" &&
                (() => {
                  const detFlags: string[] =
                    currentScan.details?.riskAdjustment?.deterministic_flags ||
                    [];
                  const allIndicators: string[] =
                    currentScan.details?.riskAdjustment?.indicators || [];
                  const screenshot = currentScan.details?.screenshot || null;
                  const pageBehavior =
                    currentScan.details?.pageBehavior || null;
                  const isBrandImpersonation = (f: string) =>
                    f.includes("Brand Impersonation") ||
                    f.includes("Impersonating");
                  const isSuspiciousTLD = (f: string) =>
                    f.includes("Untrusted TLD") || f.includes("Suspicious TLD");
                  const isCritical = (f: string) =>
                    f.includes("\u{1F6A8}") ||
                    f.includes("CRITICAL") ||
                    f.includes("VERY NEW DOMAIN") ||
                    f.includes("New Domain (Risk Factor)");
                  const positiveIndicators = allIndicators.filter(
                    (i) => !isCritical(i),
                  );
                  const negativeIndicators = allIndicators.filter((i) =>
                    isCritical(i),
                  );

                  return (
                    <div className="space-y-6 sm:space-y-7">
                      {/* URL + Status row */}
                      <div
                        className={`dark:bg-white/[0.02] bg-white/70 border rounded-xl p-3.5 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 backdrop-blur-sm ${
                          currentScan.riskScore >= 70
                            ? "border-red-500/20"
                            : currentScan.riskScore >= 40
                              ? "border-yellow-500/20"
                              : "border-green-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${currentScan.riskScore >= 70 ? "bg-red-500" : currentScan.riskScore >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                          />
                          <span className="text-heading text-xs md:text-sm break-all font-mono">
                            {currentScan.url}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold tracking-wide whitespace-nowrap uppercase border ${
                            currentScan.riskScore >= 70
                              ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25"
                              : currentScan.riskScore >= 40
                                ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/25"
                                : "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25"
                          }`}
                        >
                          {currentScan.riskScore >= 70
                            ? "Phishing Detected"
                            : currentScan.riskScore >= 40
                              ? "Suspicious"
                              : "Safe"}
                        </span>
                      </div>

                      {/* Page Screenshot (Warning / Dangerous only) */}
                      {screenshot && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5 flex-wrap">
                            <div
                              className={`w-1 h-6 rounded-full ${currentScan.riskScore >= 70 ? "bg-red-500" : "bg-yellow-500"}`}
                            />
                            <h4 className="text-heading font-bold text-xs sm:text-sm md:text-[15px]">
                              Page Screenshot
                            </h4>
                            <span
                              className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                                currentScan.riskScore >= 70
                                  ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"
                                  : "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                              }`}
                            >
                              {currentScan.riskScore >= 70
                                ? "PHISHING"
                                : "SUSPICIOUS"}
                            </span>
                          </div>
                          <div
                            className={`rounded-xl border overflow-hidden shadow-lg ${currentScan.riskScore >= 70 ? "border-red-500/30" : "border-yellow-500/30"}`}
                          >
                            <div
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-mono flex items-center gap-2 ${currentScan.riskScore >= 70 ? "bg-red-500/8 text-red-600 dark:text-red-400" : "bg-yellow-500/8 text-yellow-600 dark:text-yellow-400"}`}
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="3"
                                  y="3"
                                  width="18"
                                  height="18"
                                  rx="2"
                                />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                              Live capture at time of scan
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`data:image/png;base64,${screenshot}`}
                              alt="Screenshot of scanned page"
                              className="w-full object-cover"
                              style={{
                                maxHeight: "400px",
                                objectPosition: "top",
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {pageBehavior && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                            <div className="w-1 h-6 bg-blue-500 rounded-full" />
                            <h4 className="text-heading font-bold text-xs sm:text-sm md:text-[15px]">
                              Playwright Behavior Analysis
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/8">
                              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-300/90">
                                Login Form Detection
                              </p>
                              <p className="text-sm text-heading font-semibold mt-1">
                                {pageBehavior.has_login_form
                                  ? `Detected (${pageBehavior.login_forms_detected || 1})`
                                  : "Not detected"}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/8">
                              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-300/90">
                                JS/Interaction Probe
                              </p>
                              <p className="text-sm text-heading font-semibold mt-1">
                                {pageBehavior.js_rendered_analysis &&
                                pageBehavior.interaction_ready
                                  ? "Playwright active"
                                  : "Unavailable"}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/8 sm:col-span-2">
                              <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-300/90">
                                Dynamic Findings
                              </p>
                              <p className="text-sm text-heading font-semibold mt-1">
                                {pageBehavior.html_findings_count || 0}{" "}
                                browser-derived signal
                                {(pageBehavior.html_findings_count || 0) === 1
                                  ? ""
                                  : "s"}
                              </p>
                            </div>
                          </div>

                          {Array.isArray(pageBehavior.findings) &&
                            pageBehavior.findings.length > 0 && (
                              <div className="mt-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/6">
                                <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-300/90 mb-2">
                                  Playwright Findings
                                </p>
                                <div className="space-y-1.5">
                                  {pageBehavior.findings.map((finding, idx) => (
                                    <div
                                      key={`${finding}-${idx}`}
                                      className="text-xs text-copy/90 flex items-start gap-2"
                                    >
                                      <span className="text-blue-500 mt-0.5">
                                        •
                                      </span>
                                      <span>{finding}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Threat Flags */}
                      {detFlags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                            <div className="w-1 h-6 bg-red-500 rounded-full" />
                            <h4 className="text-heading font-bold text-xs sm:text-sm md:text-[15px]">
                              Threat Indicators
                            </h4>
                            <span className="text-[9px] sm:text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                              {detFlags.length} FLAG
                              {detFlags.length !== 1 ? "S" : ""}
                            </span>
                          </div>
                          <div className="space-y-2 sm:space-y-2.5">
                            {detFlags.map((flag, i) => {
                              const isBrand = isBrandImpersonation(flag);
                              const isTLD = isSuspiciousTLD(flag);
                              const isRed = isCritical(flag) || isBrand;
                              return (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border transition-all hover:shadow-md ${
                                    isBrand
                                      ? "bg-red-500/8 border-red-500/25 hover:border-red-500/40"
                                      : isTLD
                                        ? "bg-orange-500/8 border-orange-500/25 hover:border-orange-500/40"
                                        : isRed
                                          ? "bg-red-500/8 border-red-500/20 hover:border-red-500/35"
                                          : "bg-yellow-500/8 border-yellow-500/20 hover:border-yellow-500/35"
                                  }`}
                                >
                                  {isBrand ? (
                                    <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-red-500/15">
                                      <svg
                                        className="text-red-500 dark:text-red-400"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        <path d="M12 8v4" />
                                        <path d="M12 16h.01" />
                                      </svg>
                                    </div>
                                  ) : isTLD ? (
                                    <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-orange-500/15">
                                      <svg
                                        className="text-orange-500 dark:text-orange-400"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v4" />
                                        <path d="M12 16h.01" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div
                                      className={`shrink-0 mt-0.5 p-1.5 rounded-lg ${isRed ? "bg-red-500/15" : "bg-yellow-500/15"}`}
                                    >
                                      <svg
                                        className={`${isRed ? "text-red-500 dark:text-red-400" : "text-yellow-500 dark:text-yellow-400"}`}
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                      >
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <path d="M12 9v4" />
                                        <path d="M12 17h.01" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    {isBrand && (
                                      <span className="inline-block text-[9px] sm:text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1.5 bg-red-500/15 px-2 py-0.5 rounded-md">
                                        Brand Impersonation
                                      </span>
                                    )}
                                    {isTLD && (
                                      <span className="inline-block text-[9px] sm:text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1.5 bg-orange-500/15 px-2 py-0.5 rounded-md">
                                        Suspicious TLD
                                      </span>
                                    )}
                                    <p
                                      className={`text-xs sm:text-sm leading-relaxed ${
                                        isBrand
                                          ? "text-red-700 dark:text-red-200"
                                          : isTLD
                                            ? "text-orange-700 dark:text-orange-200"
                                            : isRed
                                              ? "text-red-700 dark:text-red-200"
                                              : "text-yellow-700 dark:text-yellow-200"
                                      }`}
                                    >
                                      {flag
                                        .replace(/^\u{1F6A8}\s*/u, "")
                                        .replace(
                                          /\s*\(legitimate site: [^)]+\)/,
                                          "",
                                        )}
                                    </p>
                                    {isBrand &&
                                      (() => {
                                        const m = flag.match(
                                          /\(legitimate site: ([^)]+)\)/,
                                        );
                                        return m ? (
                                          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/8 border border-blue-500/15 w-fit">
                                            <svg
                                              width="11"
                                              height="11"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              className="text-blue-500 shrink-0"
                                            >
                                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                            </svg>
                                            <span className="text-[10px] text-faded">
                                              Real site:
                                            </span>
                                            <a
                                              href={`https://${m[1]}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[10px] sm:text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline underline-offset-2 font-medium"
                                            >
                                              {m[1]}
                                            </a>
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
                          <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                            <div className="w-1 h-6 bg-red-600 rounded-full" />
                            <h4 className="text-heading font-bold text-xs sm:text-sm md:text-[15px]">
                              Critical Signals
                            </h4>
                            <span className="text-[9px] sm:text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                              {negativeIndicators.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {negativeIndicators.map((ind, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-500/8 border border-red-500/20 rounded-xl hover:border-red-500/35 transition-colors"
                              >
                                <div className="shrink-0 p-1 rounded-lg bg-red-500/15">
                                  <svg
                                    className="text-red-500 dark:text-red-400"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M15 9l-6 6" />
                                    <path d="M9 9l6 6" />
                                  </svg>
                                </div>
                                <span className="text-red-700 dark:text-red-200 text-xs sm:text-sm">
                                  {ind.replace(/^\u{1F6A8}\s*/u, "")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trust signals */}
                      {positiveIndicators.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
                            <div className="w-1 h-6 bg-green-500 rounded-full" />
                            <h4 className="text-heading font-bold text-xs sm:text-sm md:text-[15px]">
                              Trust Signals
                            </h4>
                            <span className="text-[9px] sm:text-[10px] font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                              {positiveIndicators.length} FOUND
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {positiveIndicators.map((ind, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-500/8 border border-green-500/15 rounded-xl text-green-700 dark:text-green-300 text-xs sm:text-[13px] hover:border-green-500/30 transition-colors"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  className="shrink-0"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {ind}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {detFlags.length === 0 && allIndicators.length === 0 && (
                        <div className="text-center py-10">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="text-green-500"
                            >
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <path d="M9 12l2 2 4-4" />
                            </svg>
                          </div>
                          <p className="text-heading font-medium text-sm">
                            No threat indicators detected
                          </p>
                          <p className="text-faded text-xs mt-1">
                            This URL passed all security checks
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* ── Details ── */}
              {activeTab === "details" && (
                <div className="space-y-5">
                  {[
                    {
                      title: "WHOIS Information",
                      icon: (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[#545BFF]"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      ),
                      data: currentScan.details?.whoisInfo,
                      accent: "[#545BFF]",
                    },
                    {
                      title: "DNS Records",
                      icon: (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[#b19eef]"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      ),
                      data: currentScan.details?.dnsRecords,
                      accent: "[#b19eef]",
                    },
                    {
                      title: "SSL Certificate",
                      icon: (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-green-500"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ),
                      data:
                        currentScan.details?.sslCertificates &&
                        !currentScan.details.sslCertificates.error
                          ? currentScan.details.sslCertificates
                          : null,
                      accent: "green-500",
                      error: currentScan.details?.sslCertificates?.error,
                    },
                  ].map(({ title, icon, data, error: dataError }) => (
                    <div key={title}>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="p-1.5 rounded-lg dark:bg-white/[0.03] bg-slate-50">
                          {icon}
                        </div>
                        <h4 className="text-heading font-bold text-sm sm:text-[15px]">
                          {title}
                        </h4>
                        {data && (
                          <span className="text-[9px] font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/15 uppercase tracking-wider">
                            Available
                          </span>
                        )}
                      </div>
                      <div className="dark:bg-white/[0.02] bg-slate-50/80 p-4 rounded-xl border border-divider/50 font-mono text-xs overflow-x-auto backdrop-blur-sm">
                        {data ? (
                          <pre className="text-xs text-copy leading-relaxed">
                            {JSON.stringify(data, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-xs text-center py-5 text-faded">
                            {dataError || `No ${title.toLowerCase()} available`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Explanation ── */}
              {activeTab === "explanation" && (
                <div className="space-y-6 sm:space-y-8">
                  {loadingXAI ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
                      <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 border-t-2 border-[#545BFF] rounded-full animate-spin" />
                        <div
                          className="absolute inset-2 border-r-2 border-[#b19eef] rounded-full animate-spin"
                          style={{ animationDirection: "reverse" }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-[#545BFF]"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-heading font-medium text-sm mb-1">
                        AI Analysis in Progress
                      </p>
                      <p className="text-faded font-mono text-[10px] tracking-wide animate-pulse">
                        Processing threat vectors...
                      </p>
                    </div>
                  ) : xaiExplanation ? (
                    <>
                      {/* Recommendation */}
                      <div
                        className={`rounded-xl border overflow-hidden shadow-sm ${
                          currentScan.riskScore >= 70
                            ? "border-red-500/20 bg-red-500/5"
                            : currentScan.riskScore >= 40
                              ? "border-yellow-500/20 bg-yellow-500/5"
                              : "border-green-500/20 bg-green-500/5"
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
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="sm:w-8 sm:h-8"
                              >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M12 8v4" />
                                <path d="M12 16h.01" />
                              </svg>
                            ) : currentScan.riskScore >= 40 ? (
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="sm:w-8 sm:h-8"
                              >
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                              </svg>
                            ) : (
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="sm:w-8 sm:h-8"
                              >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                            )}
                          </div>
                          <div className="text-center md:text-left flex-1">
                            <h4
                              className={`text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] mb-2 sm:mb-3 ${
                                currentScan.riskScore >= 70
                                  ? "text-red-600 dark:text-red-400"
                                  : currentScan.riskScore >= 40
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-green-600 dark:text-green-400"
                              }`}
                            >
                              AI Recommendation
                            </h4>
                            <p className="text-copy text-sm md:text-base font-medium leading-relaxed">
                              {currentScan.riskScore >= 70
                                ? "This site is highly dangerous. Do not enter any personal information, credentials, or payment details. Leave the site immediately."
                                : currentScan.riskScore >= 40
                                  ? "This site shows suspicious characteristics. Exercise caution and avoid entering sensitive information unless you can verify its legitimacy."
                                  : "Site appears safe, but always practice good security habits. Avoid sharing unnecessary personal information."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Factors Grid */}
                      <div
                        className={`grid gap-5 sm:gap-6 ${
                          xaiExplanation.risk_factors?.length > 0 &&
                          xaiExplanation.positive_factors?.length > 0
                            ? "grid-cols-1 lg:grid-cols-2"
                            : "grid-cols-1"
                        }`}
                      >
                        {xaiExplanation.risk_factors?.length > 0 && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-1 h-6 bg-red-500 rounded-full" />
                              <h4 className="text-heading font-bold text-sm sm:text-[15px]">
                                Threat Vectors
                              </h4>
                              <span className="text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                {xaiExplanation.risk_factors.length}
                              </span>
                            </div>
                            <div className="grid gap-2.5">
                              {xaiExplanation.risk_factors.map(
                                (factor: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="dark:bg-white/[0.02] bg-white/70 border border-red-500/15 rounded-xl p-3.5 sm:p-4 hover:border-red-500/30 transition-all group backdrop-blur-sm"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500/60 group-hover:text-red-500 transition-colors font-mono text-[10px] font-bold">
                                        {String(idx + 1).padStart(2, "0")}
                                      </span>
                                      <div>
                                        <h5 className="text-red-700 dark:text-red-300 font-semibold text-xs sm:text-sm mb-0.5">
                                          {factor.title}
                                        </h5>
                                        <p className="text-faded text-xs leading-relaxed">
                                          {factor.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {xaiExplanation.positive_factors?.length > 0 && (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-1 h-6 bg-green-500 rounded-full" />
                              <h4 className="text-heading font-bold text-sm sm:text-[15px]">
                                Trust Signals
                              </h4>
                              <span className="text-[10px] font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                                {xaiExplanation.positive_factors.length}
                              </span>
                            </div>
                            <div className="grid gap-2.5">
                              {xaiExplanation.positive_factors.map(
                                (factor: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="dark:bg-white/[0.02] bg-white/70 border border-green-500/15 rounded-xl p-3.5 sm:p-4 hover:border-green-500/30 transition-all group backdrop-blur-sm"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500/60 group-hover:text-green-500 transition-colors font-mono text-[10px] font-bold">
                                        {String(idx + 1).padStart(2, "0")}
                                      </span>
                                      <div>
                                        <h5 className="text-green-700 dark:text-green-300 font-semibold text-xs sm:text-sm mb-0.5">
                                          {factor.title}
                                        </h5>
                                        <p className="text-faded text-xs leading-relaxed">
                                          {factor.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-14">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#545BFF]/10 flex items-center justify-center">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-[#545BFF]"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <p className="text-heading font-medium text-sm">
                        Unable to generate explanation
                      </p>
                      <p className="text-faded text-xs mt-1">
                        The AI analysis service may be temporarily unavailable
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Relations ── */}
              {activeTab === "relations" && (
                <div>
                  {loadingHistory && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="relative w-14 h-14 mb-5">
                        <div className="absolute inset-0 border-t-2 border-[#545BFF] rounded-full animate-spin" />
                        <div
                          className="absolute inset-2.5 border-r-2 border-[#b19eef] rounded-full animate-spin"
                          style={{ animationDirection: "reverse" }}
                        />
                      </div>
                      <p className="text-heading font-medium text-sm mb-1">
                        Loading Historical Data
                      </p>
                      <p className="text-faded text-[10px] font-mono tracking-wide animate-pulse">
                        Fetching domain timeline...
                      </p>
                    </div>
                  )}
                  {!loadingHistory && historicalData && (
                    <div className="space-y-6 sm:space-y-7">
                      {historicalData.whois_changes?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-3.5">
                            <div className="p-1.5 rounded-lg bg-[#545BFF]/10">
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-[#545BFF]"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </div>
                            <h4 className="text-heading font-bold text-sm sm:text-[15px]">
                              WHOIS Changes
                            </h4>
                            <span className="text-[10px] font-mono text-[#545BFF] dark:text-[#a89de8] bg-[#545BFF]/10 px-2 py-0.5 rounded-md border border-[#545BFF]/15">
                              {historicalData.whois_changes.length}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {historicalData.whois_changes.map(
                              (change: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="dark:bg-white/[0.02] bg-white/60 border border-divider/50 rounded-xl p-4 hover:border-[#545BFF]/25 transition-all backdrop-blur-sm"
                                >
                                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-divider/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#545BFF]" />
                                    <span className="text-faded text-[10px] sm:text-xs font-mono">
                                      {new Date(change.date).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-2.5">
                                    {Object.entries(change.changes).map(
                                      ([field, fieldChange]: [string, any]) => (
                                        <div
                                          key={field}
                                          className="text-sm border-l-2 border-[#545BFF]/20 pl-3 py-1.5"
                                        >
                                          <div className="text-faded text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">
                                            {field}
                                          </div>
                                          <div className="flex flex-col gap-1.5 text-xs">
                                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                              <span className="w-4 font-mono font-bold">
                                                -
                                              </span>
                                              <span className="font-mono bg-red-500/8 px-1.5 py-0.5 rounded-md truncate">
                                                {JSON.stringify(
                                                  fieldChange.from,
                                                ).replace(/^"|"$/g, "")}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                              <span className="w-4 font-mono font-bold">
                                                +
                                              </span>
                                              <span className="font-mono bg-green-500/8 px-1.5 py-0.5 rounded-md truncate">
                                                {JSON.stringify(
                                                  fieldChange.to,
                                                ).replace(/^"|"$/g, "")}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {historicalData.dns_changes?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-3.5">
                            <div className="p-1.5 rounded-lg bg-[#b19eef]/10">
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-[#b19eef]"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                            </div>
                            <h4 className="text-heading font-bold text-sm sm:text-[15px]">
                              DNS Changes
                            </h4>
                            <span className="text-[10px] font-mono text-[#b19eef] bg-[#b19eef]/10 px-2 py-0.5 rounded-md border border-[#b19eef]/15">
                              {historicalData.dns_changes.length}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {historicalData.dns_changes.map(
                              (change: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="dark:bg-white/[0.02] bg-white/60 border border-divider/50 rounded-xl p-4 hover:border-[#b19eef]/25 transition-all backdrop-blur-sm"
                                >
                                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-divider/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#b19eef]" />
                                    <span className="text-faded text-[10px] sm:text-xs font-mono">
                                      {new Date(change.date).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="space-y-2.5">
                                    {Object.entries(change.changes).map(
                                      ([recordType, recordChange]: [
                                        string,
                                        any,
                                      ]) => (
                                        <div
                                          key={recordType}
                                          className="text-sm border-l-2 border-[#b19eef]/25 pl-3 py-1.5"
                                        >
                                          <div className="text-[#b19eef] text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5">
                                            {recordType} Records
                                          </div>
                                          {recordChange.added?.map(
                                            (val: string, i: number) => (
                                              <div
                                                key={i}
                                                className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-mono mb-1"
                                              >
                                                <span className="font-bold">
                                                  +
                                                </span>
                                                <span className="bg-green-500/8 px-1.5 py-0.5 rounded-md break-all">
                                                  {val}
                                                </span>
                                              </div>
                                            ),
                                          )}
                                          {recordChange.removed?.map(
                                            (val: string, i: number) => (
                                              <div
                                                key={i}
                                                className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-mono mb-1"
                                              >
                                                <span className="font-bold">
                                                  -
                                                </span>
                                                <span className="bg-red-500/8 px-1.5 py-0.5 rounded-md break-all">
                                                  {val}
                                                </span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {historicalData.ssl_history?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2.5 mb-3.5">
                            <div className="p-1.5 rounded-lg bg-green-500/10">
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-green-500"
                              >
                                <rect
                                  x="3"
                                  y="11"
                                  width="18"
                                  height="11"
                                  rx="2"
                                  ry="2"
                                />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                            </div>
                            <h4 className="text-heading font-bold text-sm sm:text-[15px]">
                              SSL Certificate History
                            </h4>
                            <span className="text-[10px] font-mono text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/15">
                              {historicalData.ssl_history.length}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {historicalData.ssl_history
                              .slice(0, 5)
                              .map((cert: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="dark:bg-white/[0.02] bg-white/60 border border-divider/50 rounded-xl p-4 hover:border-green-500/25 transition-all backdrop-blur-sm"
                                >
                                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-divider/30">
                                    <div className="p-1 rounded-lg bg-green-500/10">
                                      <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="text-green-500"
                                      >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                      </svg>
                                    </div>
                                    <span className="text-faded text-[10px] sm:text-xs font-mono">
                                      Captured:{" "}
                                      {new Date(
                                        cert.snapshot_date,
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs ml-0 sm:ml-8">
                                    <div>
                                      <div className="text-faded uppercase tracking-[0.15em] text-[10px] font-bold mb-0.5">
                                        Issuer
                                      </div>
                                      <div className="text-copy font-medium truncate">
                                        {cert.issuer}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-faded uppercase tracking-[0.15em] text-[10px] font-bold mb-0.5">
                                        Serial Number
                                      </div>
                                      <div className="text-copy font-mono text-[10px] truncate">
                                        {cert.serial_number}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-faded uppercase tracking-[0.15em] text-[10px] font-bold mb-0.5">
                                        Valid From
                                      </div>
                                      <div className="text-green-600 dark:text-green-400 font-mono text-[11px]">
                                        {cert.valid_from}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-faded uppercase tracking-[0.15em] text-[10px] font-bold mb-0.5">
                                        Valid Until
                                      </div>
                                      <div className="text-yellow-600 dark:text-yellow-400 font-mono text-[11px]">
                                        {cert.valid_until}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {!historicalData.whois_changes?.length &&
                        !historicalData.dns_changes?.length &&
                        !historicalData.ssl_history?.length && (
                          <div className="text-center py-14">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#545BFF]/10 flex items-center justify-center">
                              <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="text-[#545BFF]"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </div>
                            <p className="text-heading font-medium text-sm">
                              No historical changes detected
                            </p>
                            <p className="text-faded text-xs mt-1">
                              Changes will appear as we track this domain over
                              time
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                  {!loadingHistory && !historicalData && (
                    <div className="text-center py-14">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#545BFF]/10 flex items-center justify-center">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="text-[#545BFF]"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <p className="text-heading font-medium text-sm">
                        No historical data available
                      </p>
                      <p className="text-faded text-xs mt-1">
                        Domain timeline data is not yet available for this URL
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Feedback ── */}
              {activeTab === "feedback" && (
                <div>
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="p-1.5 rounded-lg dark:bg-white/[0.03] bg-slate-50">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-[#545BFF]"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-heading font-bold text-sm sm:text-[15px]">
                      Feedback
                    </h4>
                    {communityComments.length > 0 && (
                      <span className="text-[10px] font-mono text-[#545BFF] dark:text-[#a89de8] bg-[#545BFF]/10 px-2 py-0.5 rounded-md border border-[#545BFF]/15">
                        {communityComments.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-6 sm:space-y-7">
                    {loadingComments && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative w-14 h-14 mb-5">
                          <div className="absolute inset-0 border-t-2 border-[#545BFF] rounded-full animate-spin" />
                          <div
                            className="absolute inset-2.5 border-r-2 border-[#b19eef] rounded-full animate-spin"
                            style={{ animationDirection: "reverse" }}
                          />
                        </div>
                        <p className="text-heading font-medium text-sm mb-1">
                          Loading Feedback
                        </p>
                        <p className="text-faded text-[10px] font-mono tracking-wide animate-pulse">
                          Fetching community insights...
                        </p>
                      </div>
                    )}

                    {!loadingComments &&
                      (!isAuthenticated || !hasCompletedScan) && (
                        <div className="rounded-xl border border-[#545BFF]/20 bg-[#545BFF]/8 p-4 sm:p-5 text-center">
                          <p className="text-sm font-semibold text-[#545BFF] dark:text-[#a89de8]">
                            Feedback Locked
                          </p>
                          <p className="text-xs text-faded mt-1">
                            Please log in and complete a scan to view and share
                            feedback.
                          </p>
                        </div>
                      )}

                    {!loadingComments &&
                      isAuthenticated &&
                      hasCompletedScan && (
                        <>
                          {/* Feedback submission form */}
                          <div className="rounded-xl border border-[#545BFF]/20 dark:bg-white/[0.01] bg-slate-50/80 p-4 sm:p-5 backdrop-blur-sm">
                            <p className="text-sm font-semibold text-heading mb-2.5">
                              Share Your Observation
                            </p>
                            <p className="text-xs text-faded mb-4">
                              Help the community by sharing what you observed on
                              this scanned URL.
                            </p>

                            <form
                              onSubmit={handleSubmitComment}
                              className="space-y-3"
                            >
                              <div>
                                <label
                                  htmlFor="feedback-flag"
                                  className="block text-[11px] font-medium text-faded mb-1.5"
                                >
                                  Flag this URL as
                                </label>
                                <div className="relative">
                                  <select
                                    id="feedback-flag"
                                    value={commentFlag}
                                    onChange={(e) =>
                                      setCommentFlag(
                                        e.target.value as
                                          | "phishing"
                                          | "legitimate"
                                          | "neutral",
                                      )
                                    }
                                    className="w-full appearance-none rounded-lg border dark:border-[#545BFF]/30 border-divider dark:bg-[#1a1a2e] bg-white/80 dark:text-white text-copy px-3 py-2.5 text-xs sm:text-sm dark:placeholder:text-slate-400 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#545BFF]/50 focus:border-transparent cursor-pointer hover:dark:border-[#545BFF]/50 hover:border-divider/80 transition-colors"
                                  >
                                    <option value="phishing">Phishing</option>
                                    <option value="legitimate">
                                      Legitimate
                                    </option>
                                    <option value="neutral">Neutral</option>
                                  </select>
                                  <svg
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-faded pointer-events-none"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2"
                                  >
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </div>
                              </div>
                              <div>
                                <label
                                  htmlFor="feedback-text"
                                  className="block text-[11px] font-medium text-faded mb-1.5"
                                >
                                  Your Feedback
                                </label>
                                <textarea
                                  id="feedback-text"
                                  value={commentText}
                                  onChange={(e) =>
                                    setCommentText(e.target.value)
                                  }
                                  placeholder="Share your observations..."
                                  rows={4}
                                  className="w-full rounded-lg border border-divider/60 dark:bg-white/[0.03] bg-white/70 px-3 py-2 text-xs sm:text-sm text-copy focus:outline-none focus:ring-2 focus:ring-[#545BFF]/50"
                                />
                              </div>
                              {commentError && (
                                <p className="text-xs text-red-500 dark:text-red-400">
                                  {commentError}
                                </p>
                              )}
                              {commentSuccess && (
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  {commentSuccess}
                                </p>
                              )}
                              <button
                                type="submit"
                                disabled={
                                  submittingComment ||
                                  commentText.trim().length < 3
                                }
                                className="w-full rounded-lg bg-gradient-to-r from-[#545BFF] to-[#6B73FF] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:from-[#4349dd] hover:to-[#5a62ff] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                              >
                                {submittingComment
                                  ? "Submitting..."
                                  : "Submit Feedback"}
                              </button>
                            </form>
                          </div>

                          {/* Feedback list */}
                          {communityComments.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#545BFF]/10 flex items-center justify-center">
                                <svg
                                  width="22"
                                  height="22"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  className="text-[#545BFF]"
                                >
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                              </div>
                              <p className="text-heading font-medium text-sm">
                                No feedback yet
                              </p>
                              <p className="text-faded text-xs mt-1">
                                Be the first to share your observations
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {communityComments.map((cmt, idx) => (
                                <div
                                  key={idx}
                                  className="dark:bg-white/[0.02] bg-white/60 backdrop-blur-sm border border-divider/40 rounded-xl p-4 sm:p-5 hover:border-[#545BFF]/25 transition-all"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#545BFF] to-[#b19eef] p-[2px]">
                                        <div className="w-full h-full rounded-[10px] dark:bg-[#080814] bg-white flex items-center justify-center">
                                          <span className="text-[10px] font-bold text-[#545BFF] dark:text-[#a89de8]">
                                            {cmt.user_id
                                              ? cmt.user_id
                                                  .substring(0, 2)
                                                  .toUpperCase()
                                              : "AN"}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-heading font-medium">
                                          {cmt.user_id
                                            ? `User ${cmt.user_id.substring(0, 8)}...`
                                            : "Anonymous"}
                                        </div>
                                        <div className="text-[10px] text-faded font-mono">
                                          {cmt.created_at
                                            ? new Date(
                                                cmt.created_at,
                                              ).toLocaleString()
                                            : ""}
                                        </div>
                                      </div>
                                    </div>
                                    {cmt.flag && (
                                      <div
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                                          cmt.flag === "legitimate"
                                            ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                                            : cmt.flag === "phishing"
                                              ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                                        }`}
                                      >
                                        {cmt.flag === "legitimate" ? (
                                          <>
                                            <svg
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2.5"
                                            >
                                              <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                              Legitimate
                                            </span>
                                          </>
                                        ) : cmt.flag === "phishing" ? (
                                          <>
                                            <svg
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2.5"
                                            >
                                              <line
                                                x1="18"
                                                y1="6"
                                                x2="6"
                                                y2="18"
                                              />
                                              <line
                                                x1="6"
                                                y1="6"
                                                x2="18"
                                                y2="18"
                                              />
                                            </svg>
                                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                              Phishing
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <svg
                                              width="12"
                                              height="12"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <circle cx="12" cy="12" r="9" />
                                              <line
                                                x1="8"
                                                y1="12"
                                                x2="16"
                                                y2="12"
                                              />
                                            </svg>
                                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                              Neutral
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs sm:text-[13px] text-copy leading-relaxed pl-12">
                                    {cmt.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                  </div>
                </div>
              )}

              {/* ── History ── */}
              {activeTab === "history" && (
                <div className="py-2 sm:py-4 max-w-2xl mx-auto">
                  <div className="flex flex-col items-center mb-4">
                    <div className="flex items-center justify-center gap-2.5 mb-3">
                      <div className="p-1.5 rounded-lg bg-[#545BFF]/10">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-[#545BFF]"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <h3 className="text-heading font-bold text-sm sm:text-[15px]">
                        Your Scan History
                      </h3>
                      {scanHistory.length > 0 && (
                        <span className="text-[10px] font-mono text-[#545BFF] dark:text-[#a89de8] bg-[#545BFF]/10 px-2 py-0.5 rounded-md border border-[#545BFF]/15">
                          {scanHistory.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {scanHistory.length > 0 && (
                    <div className="space-y-3 mb-5">
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div className="flex-1 relative">
                          <label className="sr-only" htmlFor="history-filter">
                            Filter history
                          </label>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-faded/70">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="7" />
                              <line x1="16.65" y1="16.65" x2="21" y2="21" />
                            </svg>
                          </div>
                          <input
                            id="history-filter"
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value)}
                            placeholder="Search URL, status, or expanded URL"
                            className="w-full rounded-lg border border-divider bg-white/70 dark:bg-white/[0.03] pl-9 pr-10 py-2.5 text-sm text-copy focus:outline-none focus:ring-2 focus:ring-[#545BFF]/60 shadow-[0_6px_16px_rgba(84,91,255,0.08)]"
                          />
                          {historyFilter && (
                            <button
                              aria-label="Clear filter"
                              onClick={() => setHistoryFilter("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faded hover:text-heading transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:w-auto">
                          <label htmlFor="history-sort" className="text-[11px] uppercase tracking-wide text-faded">
                            Sort
                          </label>
                          <select
                            id="history-sort"
                            value={historySort}
                            onChange={(e) => setHistorySort(e.target.value as typeof historySort)}
                            className="rounded-lg border border-divider bg-white/90 dark:bg-[#0f1024] px-3 py-2 text-sm text-heading dark:text-white focus:outline-none focus:ring-2 focus:ring-[#545BFF]/60 shadow-[0_6px_16px_rgba(84,91,255,0.08)]"
                          >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="riskDesc">Risk high → low</option>
                            <option value="riskAsc">Risk low → high</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {["all", "safe", "warning", "dangerous"].map((tier) => {
                          const label =
                            tier === "all"
                              ? "All"
                              : tier === "safe"
                                ? "Safe"
                                : tier === "warning"
                                  ? "Warning"
                                  : "Dangerous";
                          const isActive = historyRiskFilter === tier;
                          const chipStyles =
                            tier === "safe"
                              ? "bg-green-500/12 text-green-600 dark:text-green-400 border-green-500/20"
                              : tier === "warning"
                                ? "bg-yellow-500/12 text-yellow-600 dark:text-yellow-400 border-yellow-500/25"
                                : tier === "dangerous"
                                  ? "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/25"
                                  : "bg-white/70 dark:bg-white/[0.05] text-copy border-divider";
                          return (
                            <button
                              key={tier}
                              onClick={() => setHistoryRiskFilter(tier as typeof historyRiskFilter)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${chipStyles} ${isActive ? "ring-2 ring-offset-0 ring-[#545BFF]/50" : "opacity-80 hover:opacity-100"}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  tier === "safe"
                                    ? "bg-green-500"
                                    : tier === "warning"
                                      ? "bg-yellow-500"
                                      : tier === "dangerous"
                                        ? "bg-red-500"
                                        : "bg-[#545BFF]"
                                }`}
                              />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {loadingScanHistory ? (
                    <div className="flex flex-col items-center py-12">
                      <div className="relative w-10 h-10 mb-4">
                        <div className="absolute inset-0 border-t-2 border-[#545BFF] rounded-full animate-spin" />
                      </div>
                      <p className="text-faded text-xs font-mono animate-pulse">
                        Loading history...
                      </p>
                    </div>
                  ) : historyError ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-4 sm:p-5 text-center">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        Unable to load history
                      </p>
                      <p className="text-xs text-faded mt-1">{historyError}</p>
                    </div>
                  ) : scanHistory.length === 0 ? (
                    <div className="rounded-xl border border-[#545BFF]/20 bg-[#545BFF]/8 p-4 sm:p-5 text-center">
                      <p className="text-sm font-semibold text-[#545BFF] dark:text-[#a89de8]">
                        No scans yet
                      </p>
                      <p className="text-xs text-faded mt-1">
                        Your completed scans will appear here.
                      </p>
                    </div>
                  ) : filteredAndSortedHistory.length === 0 ? (
                    <div className="rounded-xl border border-divider bg-white/60 dark:bg-white/[0.03] p-4 sm:p-5 text-center">
                      <p className="text-sm font-semibold text-heading">No history matches your filter.</p>
                      <p className="text-xs text-faded mt-1">Try a different keyword or clear the filter.</p>
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-3">
                        {paginatedHistory.map((scan, idx) => (
                          <li
                            key={`${scan.url}-${idx}-${scan.date}`}
                            className="rounded-xl border border-divider/40 dark:border-[#545BFF]/12 bg-white/70 dark:bg-white/[0.04] p-3 sm:p-4 shadow-[0_8px_22px_rgba(9,10,35,0.14)] hover:shadow-[0_10px_26px_rgba(84,91,255,0.14)] hover:border-[#545BFF]/40 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <div
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${scan.riskScore >= 70 ? "bg-red-500" : scan.riskScore >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                                  />
                                  <span className="text-heading text-xs md:text-sm break-all font-mono flex-1">
                                    {scan.url}
                                  </span>
                                </div>
                                <div className="text-[10px] text-faded font-mono">
                                  {scan.date}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold tracking-wide whitespace-nowrap uppercase border ${
                                    scan.riskScore >= 70
                                      ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25"
                                      : scan.riskScore >= 40
                                        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/25"
                                        : "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25"
                                  }`}
                                >
                                  {scan.riskScore}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-faded">
                              <span className="font-mono">{scan.status}</span>
                              <button
                                onClick={() => {
                                  setUrlInput(scan.url);
                                  doScan(scan.url);
                                }}
                                className="px-3 py-1 rounded-md text-[#545BFF] dark:text-[#a89de8] border border-[#545BFF]/30 bg-[#545BFF]/10 hover:bg-[#545BFF]/20 transition-colors duration-150 font-semibold"
                              >
                                Rescan
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
                        <span className="text-[11px] text-faded font-mono">
                          Showing {historyRangeStart}-{historyRangeEnd} of {filteredAndSortedHistory.length}
                        </span>
                        <div className="flex items-center gap-2 bg-white/60 dark:bg-white/[0.03] border border-divider px-2 py-1.5 rounded-lg shadow-[0_6px_16px_rgba(84,91,255,0.08)]">
                          <button
                            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                            disabled={currentHistoryPage === 1}
                            className="px-3 py-1.5 rounded-md border border-divider text-sm text-copy disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 dark:bg-white/[0.05] hover:border-[#545BFF]/40"
                          >
                            Prev
                          </button>
                          <span className="text-[11px] font-mono text-faded">
                            Page {currentHistoryPage} / {totalHistoryPages}
                          </span>
                          <button
                            onClick={() =>
                              setHistoryPage((p) =>
                                Math.min(totalHistoryPages, p + 1),
                              )
                            }
                            disabled={currentHistoryPage === totalHistoryPages}
                            className="px-3 py-1.5 rounded-md border border-divider text-sm text-copy disabled:opacity-50 disabled:cursor-not-allowed bg-white/80 dark:bg-white/[0.05] hover:border-[#545BFF]/40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
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
export default function ScanTab({
  hideGuestMode = false,
}: {
  hideGuestMode?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [lowPerformanceMode, setLowPerformanceMode] = useState(false);

  useEffect(() => {
    const evaluateMode = () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const smallViewport = window.innerWidth < 1024;
      const lowMemory =
        typeof (navigator as Navigator & { deviceMemory?: number })
          .deviceMemory === "number" &&
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
          8) <= 4;
      const lowCpu =
        typeof navigator.hardwareConcurrency === "number" &&
        navigator.hardwareConcurrency <= 4;

      setLowPerformanceMode(
        reducedMotion || coarsePointer || smallViewport || lowMemory || lowCpu,
      );
    };

    evaluateMode();

    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMq = window.matchMedia("(pointer: coarse)");
    const onMediaChange = () => evaluateMode();

    reducedMq.addEventListener("change", onMediaChange);
    coarseMq.addEventListener("change", onMediaChange);
    window.addEventListener("resize", evaluateMode);

    return () => {
      reducedMq.removeEventListener("change", onMediaChange);
      coarseMq.removeEventListener("change", onMediaChange);
      window.removeEventListener("resize", evaluateMode);
    };
  }, []);

  // Section-level mouse tracking → moves rings + glow
  const mxRaw = useMotionValue(0.5);
  const myRaw = useMotionValue(0.5);
  const smx = useSpring(mxRaw, {
    stiffness: 32,
    damping: 14,
    restDelta: 0.001,
  });
  const smy = useSpring(myRaw, {
    stiffness: 32,
    damping: 14,
    restDelta: 0.001,
  });
  const glowX = useTransform(smx, [0, 1], [-50, 50]);
  const glowY = useTransform(smy, [0, 1], [-34, 34]);
  const ringsX = useTransform(smx, [0, 1], [-22, 22]);
  const ringsY = useTransform(smy, [0, 1], [-15, 15]);

  const onSectionMouse = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (lowPerformanceMode) return;
      const rect = e.currentTarget.getBoundingClientRect();
      mxRaw.set((e.clientX - rect.left) / rect.width);
      myRaw.set((e.clientY - rect.top) / rect.height);
    },
    [lowPerformanceMode, mxRaw, myRaw],
  );

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
      className={`relative min-h-screen bg-page overflow-hidden flex flex-col items-center justify-start scroll-mt-20 ${lowPerformanceMode ? "ss-low-perf" : ""}`}
      onMouseMove={lowPerformanceMode ? undefined : onSectionMouse}
    >
      {/* ── Inline keyframes for ticker + persistent scan beam ── */}
      <style>{`
        @keyframes ss-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes ss-beam { 0%{opacity:0;transform:translateY(-100%)} 4%{opacity:0.8} 92%{opacity:0.5} 100%{opacity:0;transform:translateY(110vh)} }
        .ss-ticker-inner { display:flex; width:max-content; animation:ss-ticker 42s linear infinite; }
        .ss-beam { animation:ss-beam 14s ease-in-out 4s infinite; }
        .ss-low-perf .ss-ticker-inner { animation: none; transform: translateX(0) !important; }
        .ss-low-perf .ss-beam { animation: none; opacity: 0; }
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
        <DotGridCanvas
          densityDivisor={36000}
          maxNodes={22}
          maxDistance={80}
          nodeRadius={1.4}
          nodeAlpha={0.45}
          lineAlpha={0.2}
          lineWidth={0.6}
        />
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
        style={{
          x: lowPerformanceMode ? 0 : glowX,
          y: lowPerformanceMode ? 0 : glowY,
        }}
      >
        <div className="w-[380px] h-[380px] md:w-[600px] md:h-[600px] rounded-full bg-[#545BFF]/6 dark:bg-[#545BFF]/11 blur-[110px]" />
      </motion.div>

      {/* ── Layer 5: Scan rings — mouse-reactive (desktop) ── */}
      {!lowPerformanceMode && (
        <motion.div
          className="absolute top-[36%] left-1/2 z-[5] pointer-events-none hidden md:block"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.4 }}
          style={{ x: ringsX, y: ringsY }}
        >
          <ScanRings />
        </motion.div>
      )}

      {/* ── Persistent slow scan beam (looping) ── */}
      <div
        className="absolute inset-x-0 h-px z-[7] pointer-events-none ss-beam"
        style={{
          top: 0,
          background:
            "linear-gradient(to right, transparent 8%, rgba(84,91,255,0.12) 28%, rgba(84,91,255,0.5) 50%, rgba(84,91,255,0.12) 72%, transparent 92%)",
          boxShadow: "0 0 12px 2px rgba(84,91,255,0.08)",
        }}
      />

      {/* ── Entry scan beam (one-time on inView) ── */}
      {inView && !lowPerformanceMode && (
        <motion.div
          initial={{ top: "-2px", opacity: 0.9 }}
          animate={{ top: "100%", opacity: 0 }}
          transition={{ duration: 1.9, delay: 0.08, ease: "easeInOut" }}
          className="absolute inset-x-0 h-[2px] z-[8] pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, transparent 5%, #545BFF25 20%, #545BFF85 50%, #545BFF25 80%, transparent 95%)",
            boxShadow: "0 0 28px 8px rgba(84,91,255,0.16)",
          }}
        />
      )}

      {/* ── Dot pattern overlay ── */}
      <div
        className="absolute inset-0 z-[6] opacity-[0.014] dark:opacity-[0.028] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #545BFF 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-[10] w-full pt-[calc(4rem+1px)] pb-16 sm:pt-[calc(5rem+1px)] sm:pb-20 md:pt-[calc(7rem+1px)] md:pb-28 lg:pt-[calc(8rem+1px)] lg:pb-32">
        <GuestScanner
          inView={inView}
          lowPerformanceMode={lowPerformanceMode}
          hideGuestMode={hideGuestMode}
        />
      </div>
    </section>
  );
}
