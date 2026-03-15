"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView } from "motion/react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type DemoPhase = "idle" | "typing" | "extracting" | "modeling" | "xai" | "verdict";

function phaseToStep(phase: DemoPhase): number {
  if (phase === "idle" || phase === "typing") return 0;
  if (phase === "extracting") return 1;
  if (phase === "modeling") return 2;
  return 3;
}

/* ─── Demo scan scenarios ────────────────────────────────────────────────── */
const DEMOS = [
  {
    url: "https://paypal-secure-reset.xyz/verify-now",
    verdict: "Phishing" as const,
    score: 94,
    verdictColor: "#ef4444",
    features: [
      { label: "URL Length: 38 chars",      flag: true  },
      { label: "Domain Age: 2 days",         flag: true  },
      { label: "SSL: Self-signed cert",      flag: true  },
      { label: "WHOIS: Hidden registrant",   flag: true  },
      { label: "Google Safe Browsing",       flag: true  },
      { label: "TLD: .xyz (low trust)",      flag: true  },
    ],
    models: [
      { name: "Random Forest",   confidence: 97, color: "#ef4444" },
      { name: "Decision Tree",   confidence: 91, color: "#ef4444" },
      { name: "Naive Bayes",     confidence: 88, color: "#ef4444" },
    ],
    xaiReasons: [
      { factor: "PayPal brand impersonation",   weight: 0.38, color: "#ef4444" },
      { factor: "Suspicious TLD (.xyz)",         weight: 0.27, color: "#ef4444" },
      { factor: "Domain registered 2 days ago",  weight: 0.21, color: "#f97316" },
      { factor: "Hidden WHOIS registrant",       weight: 0.14, color: "#eab308" },
    ],
  },
  {
    url: "https://github.com/microsoft/vscode",
    verdict: "Legitimate" as const,
    score: 3,
    verdictColor: "#22c55e",
    features: [
      { label: "URL Length: 32 chars",       flag: false },
      { label: "Domain Age: 26 years",       flag: false },
      { label: "SSL: Valid CA-signed cert",  flag: false },
      { label: "WHOIS: Public registrant",   flag: false },
      { label: "Google Safe Browsing: Clean",flag: false },
      { label: "TLD: .com (high trust)",     flag: false },
    ],
    models: [
      { name: "Random Forest",   confidence: 99, color: "#22c55e" },
      { name: "Decision Tree",   confidence: 97, color: "#22c55e" },
      { name: "Naive Bayes",     confidence: 95, color: "#22c55e" },
    ],
    xaiReasons: [
      { factor: "Established domain (26+ years)",   weight: 0.42, color: "#22c55e" },
      { factor: "Valid CA-issued SSL certificate",   weight: 0.31, color: "#22c55e" },
      { factor: "No suspicious URL patterns",        weight: 0.18, color: "#22c55e" },
      { factor: "Clean Google Safe Browsing record", weight: 0.09, color: "#22c55e" },
    ],
  },
  {
    url: "https://gcash-login-update.info/verify",
    verdict: "Phishing" as const,
    score: 91,
    verdictColor: "#ef4444",
    features: [
      { label: "URL Length: 42 chars",       flag: true  },
      { label: "Domain Age: 5 days",         flag: true  },
      { label: "SSL: Free Let's Encrypt",    flag: false },
      { label: "WHOIS: Hidden registrant",   flag: true  },
      { label: "Google Safe Browsing: Alert",flag: true  },
      { label: "TLD: .info (very low trust)",flag: true  },
    ],
    models: [
      { name: "Random Forest",   confidence: 95, color: "#ef4444" },
      { name: "Decision Tree",   confidence: 89, color: "#ef4444" },
      { name: "Naive Bayes",     confidence: 86, color: "#ef4444" },
    ],
    xaiReasons: [
      { factor: "GCash brand impersonation",    weight: 0.41, color: "#ef4444" },
      { factor: "Domain registered 5 days ago", weight: 0.29, color: "#ef4444" },
      { factor: "Untrusted TLD (.info)",         weight: 0.20, color: "#f97316" },
      { factor: "Google Safe Browsing alert",    weight: 0.10, color: "#eab308" },
    ],
  },
] as const;

/* ─── Step definitions ───────────────────────────────────────────────────── */
const STEPS = [
  {
    number: "01",
    from: "#545BFF",
    to: "#6B73FF",
    label: "URL INPUT",
    title: "Paste any URL",
    desc: "Copy-paste a suspicious link. No technical knowledge needed, SmartShield takes it from there.",
    metric: "<50ms",
    metricLabel: "parse time",
  },
  {
    number: "02",
    from: "#34d399",
    to: "#2dd4bf",
    label: "AI ANALYSIS",
    title: "AI checks 30+ signals",
    desc: "Domain age, SSL certificates, blacklist status, and WHOIS data are all analysed in parallel.",
    metric: "30+",
    metricLabel: "signals checked",
  },
  {
    number: "03",
    from: "#f97316",
    to: "#fb923c",
    label: "ENSEMBLE VOTE",
    title: "3 AI models vote",
    desc: "Random Forest, Decision Tree, and Naive Bayes each cast an independent verdict, combining their strengths for higher accuracy.",
    metric: "3-model",
    metricLabel: "ensemble vote",
  },
  {
    number: "04",
    from: "#b19eef",
    to: "#818cf8",
    label: "XAI VERDICT",
    title: "You get a clear answer",
    desc: "LIME & SHAP explain exactly why a site is flagged, in plain language, not jargon.",
    metric: "99.2%",
    metricLabel: "accuracy",
  },
] as const;

type StepDef = (typeof STEPS)[number];

/* ─── Scanner Demo ───────────────────────────────────────────────────────── */
function ScannerDemo({
  onPhaseChange,
  isActive,
  isMobileView,
}: {
  onPhaseChange: (phase: DemoPhase) => void;
  isActive: boolean;
  isMobileView: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [typedUrl, setTypedUrl] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const add = useCallback((fn: () => void, delay: number) => {
    timers.current.push(setTimeout(fn, delay));
  }, []);

  const setP = useCallback(
    (p: DemoPhase) => { setPhase(p); onPhaseChange(p); },
    [onPhaseChange]
  );

  useEffect(() => {
    if (!isActive) {
      clearAll();
      setPhase("idle");
      onPhaseChange("idle");
      setTypedUrl("");
      return;
    }
    clearAll();
    const demo = DEMOS[idx];
    const url = demo.url;

    setP("typing");
    setTypedUrl("");

    const charsPerTick = isMobileView ? 4 : 3;
    const charDelay = isMobileView ? 20 : 28;
    const phaseDelay = isMobileView ? 650 : 900;
    const verdictHold = isMobileView ? 2500 : 3600;

    // Typewriter — batch every 3 chars to halve timer count
    url.split("").forEach((_, i) => {
      if (i % charsPerTick === 0) {
        add(() => setTypedUrl(url.slice(0, i + charsPerTick)), i * charDelay);
      }
    });
    const t1 = url.length * charDelay + 260;

    add(() => setP("extracting"), t1);
    const t2 = t1 + phaseDelay;

    add(() => setP("modeling"), t2);
    const t3 = t2 + phaseDelay;

    add(() => setP("xai"), t3);
    const t4 = t3 + phaseDelay;

    add(() => setP("verdict"), t4);
    add(() => setIdx((prev) => (prev + 1) % DEMOS.length), t4 + verdictHold);

    return clearAll;
  }, [idx, isActive, isMobileView, add, clearAll, setP, onPhaseChange]);

  const demo = DEMOS[idx];
  const visibleFeatures = isMobileView ? demo.features.slice(0, 4) : demo.features;
  const visibleReasons = isMobileView ? demo.xaiReasons.slice(0, 3) : demo.xaiReasons;

  return (
    <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden border dark:border-white/[0.07] border-slate-200 dark:bg-[#08090f] bg-white shadow-lg shadow-black/5 dark:shadow-black/30">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b dark:border-white/[0.06] border-slate-100 dark:bg-[#0c0d17] bg-slate-50">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ef4444]/70" />
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#eab308]/70" />
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#22c55e]/70" />
        <span className="ml-2 sm:ml-3 font-mono text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-widest text-[#545BFF] uppercase select-none truncate">
          {isMobileView ? "Detection Engine" : "SmartShield · Detection Engine"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="hidden sm:inline font-mono text-[9px] dark:text-slate-500 text-slate-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* URL bar */}
      <div className="px-3 sm:px-4 py-2 border-b dark:border-white/[0.05] border-slate-100">
        <div className="flex items-center gap-2 rounded-lg border dark:border-white/[0.07] border-slate-200 dark:bg-[#0f1020] bg-slate-50 px-3 py-1.5">
          <svg className="w-3 h-3 shrink-0 dark:text-slate-500 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
          <span className="flex-1 font-mono text-[10px] dark:text-slate-300 text-slate-600 min-w-0 truncate">
            {typedUrl || <span className="dark:text-slate-600 text-slate-300">{isMobileView ? "Paste URL..." : "Enter a URL to scan..."}</span>}
            {phase === "typing" && (
              <span className="inline-block w-0.5 h-3 bg-[#545BFF] ml-0.5 animate-pulse align-middle" />
            )}
          </span>
          {phase === "verdict" && (
            <span
              className="shrink-0 font-mono font-bold text-[9px] px-2 py-0.5 rounded-full transition-all duration-300"
              style={{ color: demo.verdictColor, background: `${demo.verdictColor}18`, border: `1px solid ${demo.verdictColor}35` }}
            >
              {demo.verdict.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline body — fixed height, single view crossfade */}
      <div className={`relative ${isMobileView ? "h-[300px]" : "h-[380px]"} overflow-hidden`}>

        {/* Idle / typing */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 transition-all duration-400"
          style={{ opacity: (phase === "idle" || phase === "typing") ? 1 : 0, pointerEvents: (phase === "idle" || phase === "typing") ? "auto" : "none" }}
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#545BFF]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="font-mono text-[10px] dark:text-slate-600 text-slate-400">
            {phase === "idle" ? "Initializing engine..." : "Reading URL structure..."}
          </span>
        </div>

        {/* Feature Extraction */}
        <div
          className="absolute inset-0 px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-400"
          style={{ opacity: phase === "extracting" ? 1 : 0, pointerEvents: phase === "extracting" ? "auto" : "none" }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-widest" style={{ color: "#34d399", background: "#34d39912", border: "1px solid #34d39922" }}>
              FEATURE EXTRACTION
            </span>
            <span className="font-mono text-[9px] opacity-60" style={{ color: "#34d399" }}>{visibleFeatures.length} signals</span>
          </div>
          <div className={`${isMobileView ? "grid grid-cols-1 gap-1" : "grid grid-cols-2 gap-1.5"}`}>
            {visibleFeatures.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-md px-2.5 py-1.5 gap-1.5"
                style={{ background: f.flag ? "#ef444408" : "#22c55e08", border: `1px solid ${f.flag ? "#ef444418" : "#22c55e15"}` }}>
                <span className="font-mono text-[9px] dark:text-slate-400 text-slate-500 truncate leading-tight">{f.label}</span>
                <span className="font-mono text-[9px] font-bold shrink-0" style={{ color: f.flag ? "#ef4444" : "#22c55e" }}>{f.flag ? "!" : "✓"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ensemble Model */}
        <div
          className="absolute inset-0 px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-400"
          style={{ opacity: phase === "modeling" ? 1 : 0, pointerEvents: phase === "modeling" ? "auto" : "none" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-widest" style={{ color: "#f97316", background: "#f9731612", border: "1px solid #f9731822" }}>
              ENSEMBLE MODEL
            </span>
          </div>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {demo.models.map((m, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <span className="font-mono text-[9px] dark:text-slate-400 text-slate-500 w-[84px] sm:w-[104px] shrink-0 truncate">{m.name}</span>
                <div className="flex-1 h-1 rounded-full dark:bg-white/[0.06] bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: phase === "modeling" ? `${m.confidence}%` : "0%", background: `linear-gradient(90deg, ${m.color}50, ${m.color})`, transitionDelay: `${i * 100}ms` }}
                  />
                </div>
                <span className="font-mono text-[9px] font-bold w-7 text-right shrink-0" style={{ color: m.color }}>{m.confidence}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* XAI Reasoning */}
        <div
          className="absolute inset-0 px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-400"
          style={{ opacity: phase === "xai" ? 1 : 0, pointerEvents: phase === "xai" ? "auto" : "none" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-widest" style={{ color: "#b19eef", background: "#b19eef12", border: "1px solid #b19eef22" }}>
              XAI REASONING
            </span>
            <span className="font-mono text-[9px] dark:text-slate-600 text-slate-400">LIME · SHAP</span>
          </div>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {visibleReasons.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-2 py-1.5 sm:px-2.5 sm:py-2"
                style={{ background: `${r.color}08`, border: `1px solid ${r.color}18` }}>
                <span className="font-mono text-[9px] dark:text-slate-300 text-slate-600 flex-1 truncate">{r.factor}</span>
                <div className="w-12 h-1 rounded-full dark:bg-white/[0.06] bg-slate-100 overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: phase === "xai" ? `${r.weight * 100}%` : "0%", background: r.color, transitionDelay: `${i * 70}ms` }}
                  />
                </div>
                <span className="font-mono text-[9px] font-bold shrink-0 w-6 text-right" style={{ color: r.color }}>{Math.round(r.weight * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verdict */}
        <div
          className="absolute inset-0 px-3 sm:px-4 flex flex-col justify-center gap-2.5 sm:gap-3 transition-all duration-400"
          style={{ opacity: phase === "verdict" ? 1 : 0, pointerEvents: phase === "verdict" ? "auto" : "none" }}
        >
          <div
            className="flex items-center gap-3 rounded-xl p-4"
            style={{ background: `${demo.verdictColor}0c`, border: `1px solid ${demo.verdictColor}22` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${demo.verdictColor}15` }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: demo.verdictColor }}>
                {demo.verdict === "Phishing" ? (
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                )}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold font-mono text-sm" style={{ color: demo.verdictColor }}>{demo.verdict.toUpperCase()}</span>
                <span className="font-mono text-[9px] dark:text-slate-500 text-slate-400">Risk score: {demo.score}/100</span>
              </div>
              <div className="h-1 w-full rounded-full dark:bg-white/[0.06] bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: phase === "verdict" ? `${demo.score}%` : "0%", background: `linear-gradient(90deg, ${demo.verdictColor}60, ${demo.verdictColor})` }}
                />
              </div>
            </div>
          </div>
          {/* Mini summary of all phase results */}
          {!isMobileView && <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Features", value: `${visibleFeatures.length} signals`, color: "#34d399" },
              { label: "Models", value: `${demo.models.length} voted`, color: "#f97316" },
              { label: "Confidence", value: `${demo.models[0].confidence}%`, color: "#b19eef" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-2 text-center dark:bg-white/[0.03] bg-slate-50 border dark:border-white/[0.05] border-slate-100">
                <div className="font-mono text-[10px] font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
                <div className="font-mono text-[8px] dark:text-slate-600 text-slate-400 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 py-2 border-t dark:border-white/[0.05] border-slate-100 dark:bg-[#0c0d17] bg-slate-50 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="hidden sm:block font-mono text-[9px] dark:text-slate-600 text-slate-400 flex-1 truncate">
          Random Forest · Decision Tree · Naive Bayes
        </span>
        <div className="flex gap-1 ml-auto shrink-0">
          {DEMOS.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === idx ? 14 : 4, background: i === idx ? "#545BFF" : "#545BFF30" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step Card ──────────────────────────────────────────────────────────── */
function StepCard({
  step,
  index,
  isLast,
  inView,
  isActive,
  isCompleted,
  isMobileView,
}: {
  step: StepDef;
  index: number;
  isLast: boolean;
  inView: boolean;
  isActive: boolean;
  isCompleted: boolean;
  isMobileView: boolean;
}) {
  return (
    <div className="relative flex gap-3.5 sm:gap-5">
      {/* Timeline column */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: index * 0.1 + 0.05 }}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black font-mono text-[12px] sm:text-[13px] z-10 transition-all duration-500"
          style={{
            background: isActive
              ? `linear-gradient(135deg, ${step.from}, ${step.to})`
              : isCompleted
              ? `linear-gradient(135deg, ${step.from}80, ${step.to}80)`
              : "transparent",
            border: `2px solid ${isActive ? step.from : isCompleted ? `${step.from}60` : `${step.from}30`}`,
            color: isActive ? "#fff" : step.from,
            boxShadow: isActive ? `0 0 18px ${step.from}40` : "none",
          }}
        >
          {isCompleted && !isActive ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            step.number
          )}
        </motion.div>

        {!isLast && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={inView ? { scaleY: 1, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
            className="w-px flex-1 mt-1 origin-top"
            style={{
              minHeight: 24,
              background: `linear-gradient(to bottom, ${step.from}40, transparent)`,
            }}
          />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.45, delay: index * 0.1 + 0.08 }}
        className={`flex-1 ${isLast ? "pb-0" : "pb-6 sm:pb-7"}`}
      >
        <span
          className="inline-block font-mono text-[10px] font-semibold tracking-widest mb-1.5 transition-opacity duration-300"
          style={{ color: step.from, opacity: isActive ? 1 : 0.6 }}
        >
          {step.label}
        </span>

        <div className={`flex ${isMobileView ? "flex-col gap-1" : "items-start justify-between gap-3"} mb-1.5`}>
          <h3 className="font-bold text-[15px] sm:text-base leading-snug text-heading">
            {step.title}
          </h3>
          <div className="flex items-baseline gap-1 shrink-0 pt-0.5">
            <span className="font-black font-mono text-sm" style={{ color: step.from }}>
              {step.metric}
            </span>
            {!isMobileView && <span className="font-mono text-[9px] dark:text-slate-500 text-slate-400">{step.metricLabel}</span>}
          </div>
        </div>

        <p className="text-[12.5px] sm:text-sm text-copy leading-relaxed">{step.desc}</p>

        {isActive && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "2rem" }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-2.5 h-0.5 rounded-full"
            style={{ background: `linear-gradient(to right, ${step.from}, ${step.to})` }}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ─── Main section ───────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const sectionVisible = useInView(ref, { once: false, amount: 0.15 });
  const [activeStep, setActiveStep] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const handlePhaseChange = useCallback((phase: DemoPhase) => {
    setActiveStep(phaseToStep(phase));
  }, []);

  return (
    <section ref={ref} className="relative py-10 sm:py-20 md:py-28 px-4 sm:px-6 bg-page overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[240px] sm:w-[600px] sm:h-[400px] rounded-full bg-[#545BFF]/[0.04] blur-[80px] sm:blur-[100px]" />
        <div
          className="absolute inset-0 dark:opacity-[0.012] opacity-[0.01] sm:dark:opacity-[0.025] sm:opacity-[0.018]"
          style={{
            backgroundImage: "radial-gradient(circle, #545BFF 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border dark:border-[#545BFF]/25 border-[#545BFF]/20 dark:bg-[#545BFF]/[0.07] bg-[#545BFF]/[0.05] mb-3.5 sm:mb-4"
          >
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-50" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-[#545BFF]" />
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-widest text-[#545BFF] uppercase">
              How It Works
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.07 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-heading leading-tight mb-3"
          >
            The{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #545BFF 0%, #b19eef 100%)" }}
            >
              AI Detection Pipeline
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.13 }}
            className="text-[13px] sm:text-base text-faded max-w-xl mx-auto leading-relaxed"
          >
            From URL to verdict in under a second, four precise steps, powered by an ensemble AI.
          </motion.p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 lg:items-stretch">
          {/* Left: Step cards */}
          <div className="lg:order-1 lg:flex lg:flex-col lg:justify-between">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.number}
                step={step}
                index={i}
                isLast={i === STEPS.length - 1}
                inView={inView}
                isActive={activeStep === i}
                isCompleted={activeStep > i}
                isMobileView={isMobileView}
              />
            ))}
          </div>

          {/* Right: Demo panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:order-2 lg:sticky lg:top-24 flex flex-col gap-2.5 sm:gap-3"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="font-mono text-[10px] tracking-widest dark:text-slate-500 text-slate-400 uppercase">
                  Live Demo
                </span>
              </div>
              <div className="flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <motion.div
                    key={i}
                    className="h-1 rounded-full"
                    animate={{
                      width: activeStep === i ? 14 : 4,
                      opacity: activeStep === i ? 1 : activeStep > i ? 0.45 : 0.15,
                    }}
                    style={{ background: s.from }}
                  />
                ))}
              </div>
            </div>

            <ScannerDemo onPhaseChange={handlePhaseChange} isActive={sectionVisible} isMobileView={isMobileView} />

            <p className="text-center font-mono text-[9px] dark:text-slate-700 text-slate-400 tracking-widest uppercase">
              Simulated · {DEMOS.length} real-world scenarios
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
