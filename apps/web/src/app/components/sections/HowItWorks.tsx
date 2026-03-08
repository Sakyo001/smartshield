"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";

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
      { name: "Meta Learner (LR)", confidence: 94, color: "#ef4444" },
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
      { name: "Meta Learner (LR)", confidence: 97, color: "#22c55e" },
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
      { name: "Meta Learner (LR)", confidence: 91, color: "#ef4444" },
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
    simple: "Copy-paste a suspicious link. No technical knowledge needed. SmartShield takes it from there.",
    tech: "Extracts domain, subdomain, TLD, path, query params, and traces any redirect chains in real time.",
    tags: ["URL Parser", "Redirect Tracer", "Domain Split"],
    metric: "<50ms",
    metricLabel: "parse time",
  },
  {
    number: "02",
    from: "#34d399",
    to: "#2dd4bf",
    label: "AI ANALYSIS",
    title: "AI checks 30+ signals",
    simple: "The AI examines the website behind the URL. It checks how old the domain is, whether the SSL certificate is real, and whether the site is on any known blacklist.",
    tech: "Runs WHOIS lookups, SSL validation, Google Safe Browsing queries, and HTML content analysis in parallel.",
    tags: ["WHOIS", "SSL Check", "Google SB", "30+ Features"],
    metric: "30+",
    metricLabel: "signals checked",
  },
  {
    number: "03",
    from: "#f97316",
    to: "#fb923c",
    label: "ENSEMBLE VOTE",
    title: "4 AI models vote",
    simple: "Four separate AI models each give their verdict independently, like getting a second, third, and fourth opinion. The combined result is far more reliable than any single model alone.",
    tech: "Random Forest, Decision Tree, and Naive Bayes each classify the URL. A Logistic Regression meta-learner weighs their outputs for the final call.",
    tags: ["Random Forest", "Decision Tree", "Naive Bayes", "Meta Learner"],
    metric: "4-model",
    metricLabel: "ensemble vote",
  },
  {
    number: "04",
    from: "#b19eef",
    to: "#818cf8",
    label: "XAI VERDICT",
    title: "You get a clear answer",
    simple: "Instead of just showing a warning, SmartShield tells you exactly why the site is dangerous. Each reason is explained in plain language you can actually understand.",
    tech: "LIME and SHAP explainability techniques produce human-readable factor weights showing which signals drove the detection decision.",
    tags: ["LIME", "SHAP", "Plain language", "Risk Score"],
    metric: "99.2%",
    metricLabel: "detection accuracy",
  },
] as const;

type StepDef = (typeof STEPS)[number];

/* ─── Step SVG icons (no emojis) ─────────────────────────────────────────── */
function IconLink() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[14px] h-[14px]">
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[14px] h-[14px]">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  );
}
function IconCpu() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[14px] h-[14px]">
      <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[14px] h-[14px]">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

const STEP_ICONS = [IconLink, IconSearch, IconCpu, IconShield];

/* ─── HUD corner brackets ────────────────────────────────────────────────── */
function HudCorners({ inView }: { inView: boolean }) {
  const base = "absolute border-[#545BFF]/30 pointer-events-none";
  const anim = (delay: number) => ({
    initial: { width: 0, height: 0, opacity: 0 },
    animate: inView ? { width: 32, height: 32, opacity: 1 } : {},
    transition: { duration: 0.4, delay, ease: "easeOut" as const },
  });
  return (
    <>
      <motion.div {...anim(0.05)} className={`${base} top-5 left-5 border-t border-l`} />
      <motion.div {...anim(0.10)} className={`${base} top-5 right-5 border-t border-r`} />
      <motion.div {...anim(0.15)} className={`${base} bottom-5 left-5 border-b border-l`} />
      <motion.div {...anim(0.20)} className={`${base} bottom-5 right-5 border-b border-r`} />
    </>
  );
}

/* ─── Mini HUD corners for cards ────────────────────────────────────────── */
function CardCorners({ color, opacity = 0.45 }: { color: string; opacity?: number }) {
  const s: React.CSSProperties = { borderColor: color, opacity };
  return (
    <>
      <span className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l pointer-events-none" style={s} />
      <span className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r pointer-events-none" style={s} />
      <span className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l pointer-events-none" style={s} />
      <span className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r pointer-events-none" style={s} />
    </>
  );
}

/* ─── Scanner Demo ───────────────────────────────────────────────────────── */
function ScannerDemo({ onPhaseChange, isActive }: { onPhaseChange: (phase: DemoPhase) => void; isActive: boolean }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [typedUrl, setTypedUrl] = useState("");
  const [featuresRevealed, setFeaturesRevealed] = useState(0);
  const [modelsRevealed, setModelsRevealed] = useState(0);
  const [modelProgress, setModelProgress] = useState([0, 0, 0, 0]);
  const [xaiRevealed, setXaiRevealed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  const clearAll = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  const addTimer = useCallback((fn: () => void, delay: number) => {
    timers.current.push(setTimeout(fn, delay));
  }, []);

  const setPhaseTracked = useCallback((p: DemoPhase) => {
    setPhase(p);
    onPhaseChange(p);
    // Scroll body to bottom so the latest stage is always visible on mobile
    requestAnimationFrame(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
      }
    });
  }, [onPhaseChange]);

  useEffect(() => {
    if (!isActive) {
      clearAll();
      setPhase("idle");
      onPhaseChange("idle");
      setTypedUrl("");
      setFeaturesRevealed(0);
      setModelsRevealed(0);
      setModelProgress([0, 0, 0, 0]);
      setXaiRevealed(0);
      return;
    }
    clearAll();
    const demo = DEMOS[idx];
    const url = demo.url;

    setPhaseTracked("typing");
    setTypedUrl("");
    setFeaturesRevealed(0);
    setModelsRevealed(0);
    setModelProgress([0, 0, 0, 0]);
    setXaiRevealed(0);

    // Typewriter
    url.split("").forEach((_, i) => addTimer(() => setTypedUrl(url.slice(0, i + 1)), i * 34));
    const t1 = url.length * 34 + 320;

    // Feature extraction
    addTimer(() => setPhaseTracked("extracting"), t1);
    demo.features.forEach((_, i) => addTimer(() => setFeaturesRevealed(i + 1), t1 + 60 + i * 160));
    const t2 = t1 + 60 + demo.features.length * 160 + 320;

    // Ensemble model
    addTimer(() => { setPhaseTracked("modeling"); setModelProgress([0, 0, 0, 0]); }, t2);
    demo.models.forEach((m, i) => {
      const start = t2 + i * 260;
      addTimer(() => setModelsRevealed(i + 1), start);
      let p = 0;
      const tick = () => {
        p = Math.min(p + 4, m.confidence);
        setModelProgress(prev => { const n = [...prev] as [number, number, number, number]; n[i] = p; return n; });
        if (p < m.confidence) addTimer(tick, 13);
      };
      addTimer(tick, start + 60);
    });
    const t3 = t2 + demo.models.length * 260 + 420;

    // XAI
    addTimer(() => setPhaseTracked("xai"), t3);
    demo.xaiReasons.forEach((_, i) => addTimer(() => setXaiRevealed(i + 1), t3 + 90 + i * 210));
    const t4 = t3 + 90 + demo.xaiReasons.length * 210 + 320;

    // Verdict + cycle
    addTimer(() => setPhaseTracked("verdict"), t4);
    addTimer(() => setIdx(prev => (prev + 1) % DEMOS.length), t4 + 3800);

    return clearAll;
  }, [idx, isActive, addTimer, clearAll, setPhaseTracked, onPhaseChange]);

  const demo = DEMOS[idx];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#545BFF]/22 dark:bg-[#070810] bg-white shadow-xl shadow-[#545BFF]/10">
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#545BFF]/15 dark:bg-[#0b0c1a] bg-slate-50">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
        <span className="ml-3 font-mono text-[10px] tracking-widest text-[#545BFF] uppercase select-none">
          SmartShield AI · Detection Engine
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="font-mono text-[9px] dark:text-slate-400 text-slate-500 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* URL bar */}
      <div className="px-3 py-2.5 border-b border-[#545BFF]/08 dark:bg-[#0a0b17] bg-slate-50/70">
        <div className="flex items-center gap-2 rounded-lg border border-[#545BFF]/18 dark:bg-[#0d0e1e] bg-white px-2.5 py-1.5">
          <svg className="w-3 h-3 shrink-0 dark:text-slate-500 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
          </svg>
          <span className="flex-1 font-mono text-[10px] dark:text-slate-200 text-slate-700 min-w-0 truncate">
            {typedUrl || <span className="dark:text-slate-600 text-slate-300">Enter a URL to scan...</span>}
            {phase === "typing" && <span className="inline-block w-0.5 h-2.5 bg-[#545BFF] ml-0.5 animate-pulse align-middle" />}
          </span>
          {phase === "verdict" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.45 }}
              className="shrink-0 font-mono font-bold text-[9px] px-2 py-0.5 rounded-full"
              style={{ color: demo.verdictColor, background: `${demo.verdictColor}20`, border: `1px solid ${demo.verdictColor}40` }}
            >
              {demo.verdict.toUpperCase()}
            </motion.span>
          )}
        </div>
      </div>

      {/* Pipeline body — fixed height on mobile so it never pushes surrounding layout */}
      <div
        ref={bodyRef}
        className="divide-y divide-[#545BFF]/05 overflow-y-auto max-h-[280px] sm:max-h-[320px] lg:max-h-none [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >

        {/* Feature Extraction */}
        <AnimatePresence>
          {(phase === "extracting" || phase === "modeling" || phase === "xai" || phase === "verdict") && (
            <motion.div
              key="extracting"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-3 py-2.5 dark:bg-[#0a0b17]/80"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                  style={{ color: "#34d399", background: "#34d39914", border: "1px solid #34d39928" }}>
                  STEP 02 · FEATURE EXTRACTION
                </span>
                {phase !== "extracting" && <span className="font-mono text-[9px] text-[#34d399]">checkmark {demo.features.length} signals done</span>}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {demo.features.slice(0, featuresRevealed).map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded px-2 py-1 gap-1.5"
                    style={{ background: f.flag ? "#ef444410" : "#22c55e10", border: `1px solid ${f.flag ? "#ef444420" : "#22c55e18"}` }}>
                    <span className="font-mono text-[9px] dark:text-slate-400 text-slate-500 truncate leading-tight">{f.label}</span>
                    <span className="font-mono text-[9px] font-bold shrink-0 leading-none" style={{ color: f.flag ? "#ef4444" : "#22c55e" }}>
                      {f.flag ? "!" : "ok"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ensemble Model */}
        <AnimatePresence>
          {(phase === "modeling" || phase === "xai" || phase === "verdict") && (
            <motion.div
              key="modeling"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-3 py-2.5 dark:bg-[#0a0b17]/60"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                  style={{ color: "#f97316", background: "#f9731614", border: "1px solid #f9731828" }}>
                  STEP 03 · ENSEMBLE MODEL
                </span>
                {phase !== "modeling" && (
                  <span className="font-mono text-[9px] font-bold" style={{ color: demo.verdictColor }}>
                    {demo.verdict}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {demo.models.slice(0, modelsRevealed).map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                    <span className="font-mono text-[9px] dark:text-slate-400 text-slate-500 w-28 shrink-0 truncate">{m.name}</span>
                    <div className="flex-1 h-1.5 rounded-full dark:bg-[#1a1b2e] bg-slate-200 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ width: `${modelProgress[i]}%`, background: `linear-gradient(90deg,${m.color}60,${m.color})` }} />
                    </div>
                    <span className="font-mono text-[9px] font-bold w-7 text-right shrink-0" style={{ color: m.color }}>{modelProgress[i]}%</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* XAI Reasoning */}
        <AnimatePresence>
          {(phase === "xai" || phase === "verdict") && (
            <motion.div
              key="xai"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-3 py-2.5 dark:bg-[#0a0b17]/40"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest"
                  style={{ color: "#b19eef", background: "#b19eef14", border: "1px solid #b19eef28" }}>
                  STEP 04 · XAI REASONING
                </span>
                <span className="font-mono text-[9px] dark:text-slate-500 text-slate-400">LIME + SHAP</span>
              </div>
              <div className="flex flex-col gap-1">
                {demo.xaiReasons.slice(0, xaiRevealed).map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 rounded px-2 py-1"
                    style={{ background: `${r.color}0d`, border: `1px solid ${r.color}22` }}>
                    <span className="font-mono text-[9px] dark:text-slate-300 text-slate-600 flex-1 truncate">{r.factor}</span>
                    <div className="w-12 h-1.5 rounded-full dark:bg-[#1a1b2e] bg-slate-200 overflow-hidden shrink-0">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${r.weight * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.07 }}
                        className="h-full rounded-full" style={{ background: r.color }} />
                    </div>
                    <span className="font-mono text-[9px] font-bold shrink-0 w-6 text-right" style={{ color: r.color }}>{Math.round(r.weight * 100)}%</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Verdict */}
        <AnimatePresence>
          {phase === "verdict" && (
            <motion.div
              key="verdict"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="px-3 py-3"
            >
              <div className="flex items-center gap-3 rounded-xl p-2.5"
                style={{ background: `${demo.verdictColor}10`, border: `1px solid ${demo.verdictColor}28` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${demo.verdictColor}18` }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: demo.verdictColor }}>
                    {demo.verdict === "Phishing"
                      ? <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    }
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black font-mono text-xs" style={{ color: demo.verdictColor }}>{demo.verdict.toUpperCase()}</span>
                    <span className="font-mono text-[9px] dark:text-slate-400 text-slate-500">Risk score: {demo.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full dark:bg-[#1a1b2e] bg-slate-200 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${demo.score}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: `linear-gradient(90deg,${demo.verdictColor}60,${demo.verdictColor})` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle / typing */}
        {(phase === "idle" || phase === "typing") && (
          <div className="px-3 py-6 flex flex-col items-center gap-2.5">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#545BFF]/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="font-mono text-[10px] dark:text-slate-500 text-slate-400">
              {phase === "idle" ? "Initializing engine..." : "Reading URL structure..."}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#545BFF]/08 dark:bg-[#0b0c1a] bg-slate-50 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-[#22c55e] animate-pulse" />
        <span className="hidden sm:block font-mono text-[9px] dark:text-slate-500 text-slate-400 flex-1 min-w-0 truncate">
          Random Forest · Decision Tree · Naive Bayes · LR Meta
        </span>
        <div className="flex gap-1 shrink-0">
          {DEMOS.map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full transition-colors duration-300"
              style={{ background: i === idx ? "#545BFF" : "#545BFF28" }} />
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
}: {
  step: StepDef;
  index: number;
  isLast: boolean;
  inView: boolean;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const Icon = STEP_ICONS[index];

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: 24, y: 6 }}
        animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 0.5, delay: index * 0.12 + 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative rounded-xl border overflow-hidden transition-all duration-500"
        style={{
          borderColor: isActive ? `${step.from}70` : isCompleted ? `${step.from}30` : `${step.from}1a`,
          background: isActive
            ? `linear-gradient(135deg, ${step.from}0a 0%, ${step.to}06 100%)`
            : "transparent",
          boxShadow: isActive ? `0 0 0 1px ${step.from}30, 0 4px 24px ${step.from}12` : "none",
        }}
      >
        {/* Card corners — brighter when active */}
        <CardCorners color={step.from} opacity={isActive ? 0.75 : isCompleted ? 0.4 : 0.3} />

        {/* Left accent bar */}
        <motion.div
          className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full"
          style={{ background: `linear-gradient(to bottom, ${step.from}, ${step.to})` }}
          animate={{ opacity: isActive ? 1 : isCompleted ? 0.5 : 0.25 }}
          transition={{ duration: 0.4 }}
        />

        {/* Completed badge */}
        {isCompleted && !isActive && (
          <div className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: `${step.from}20` }}>
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: step.from }}>
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        <div className="pl-4 pr-3 py-2.5 sm:pl-5 sm:pr-4 sm:py-3.5">
          {/* Header row */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono text-xs text-white shadow-sm shrink-0 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${step.from}, ${step.to})`,
                boxShadow: isActive ? `0 0 12px ${step.from}50` : "none",
              }}
            >
              {step.number}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] font-bold tracking-widest shrink-0" style={{ color: step.from }}>
                {step.label}
              </span>
              <span className="shrink-0 dark:text-slate-500 text-slate-400" style={{ color: isActive ? step.from : undefined }}>
                <Icon />
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-black text-[15px] text-heading mb-1.5 leading-snug">{step.title}</h3>

          {/* Plain language description */}
          <p className="text-[13px] text-copy leading-relaxed mb-2">{step.simple}</p>

          {/* Technical note */}
          <p
            className="hidden sm:block text-[11px] text-faded leading-relaxed mb-3 pl-3 border-l"
            style={{ borderColor: `${step.from}35` }}
          >
            {step.tech}
          </p>

          {/* Tags + metric */}
          <div className="flex flex-wrap items-center gap-1.5">
            {step.tags.map(tag => (
              <span
                key={tag}
                className="hidden sm:inline font-mono text-[9px] px-1.5 py-0.5 rounded-full dark:bg-[#111225] bg-slate-100 dark:text-slate-400 text-slate-500 border"
                style={{ borderColor: `${step.from}18` }}
              >
                {tag}
              </span>
            ))}
            <span className="sm:ml-auto flex items-baseline gap-1 shrink-0">
              <span className="font-black font-mono text-sm" style={{ color: step.from }}>{step.metric}</span>
              <span className="font-mono text-[9px] dark:text-slate-500 text-slate-400">{step.metricLabel}</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Connector */}
      {!isLast && (
        <div className="flex justify-start pl-[18px] my-1">
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={inView ? { scaleY: 1, opacity: 1 } : {}}
            transition={{ duration: 0.35, delay: index * 0.12 + 0.5 }}
            className="w-px h-5 origin-top"
            style={{ background: `linear-gradient(to bottom, ${step.from}50, transparent)` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main section ───────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const sectionVisible = useInView(ref, { once: false, amount: 0.15 });
  const [activeStep, setActiveStep] = useState(0);

  const handlePhaseChange = useCallback((phase: DemoPhase) => {
    setActiveStep(phaseToStep(phase));
  }, []);

  function scrollToScan() {
    document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section ref={ref} className="relative py-12 md:py-28 px-4 md:px-6 bg-page overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-[#545BFF]/5 blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-[#b19eef]/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.022] dark:opacity-[0.038]"
          style={{ backgroundImage: "radial-gradient(circle, #545BFF 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        {/* Scan sweep on entry */}
        {inView && (
          <motion.div
            initial={{ top: "-2px", opacity: 0.7 }}
            animate={{ top: "104%", opacity: 0 }}
            transition={{ duration: 1.6, delay: 0.1, ease: "easeInOut" }}
            className="absolute inset-x-0 h-px z-0"
            style={{ background: "linear-gradient(to right, transparent 5%, #545BFF25 30%, #545BFF60 50%, #545BFF25 70%, transparent 95%)" }}
          />
        )}
      </div>

      {/* HUD corners */}
      <HudCorners inView={inView} />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#545BFF]/28 dark:bg-[#545BFF]/08 bg-[#545BFF]/5 mb-5"
          >
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-55" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-[#545BFF]" />
            </span>
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#545BFF] uppercase">How It Works</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.07 }}
            className="text-3xl md:text-[2.75rem] font-black text-heading leading-tight mb-4"
          >
            See the{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #545BFF 0%, #b19eef 100%)" }}>
              AI Detection Pipeline
            </span>{" "}
            Live
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.13 }}
            className="hidden sm:block text-base md:text-lg text-faded max-w-2xl mx-auto leading-relaxed"
          >
            SmartShield runs a 4-step AI pipeline, from reading a URL to delivering a plain-language verdict, all in under a second.
          </motion.p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-12 items-start">

          {/* Left: Step cards — shown first on mobile */}
          <div className="flex flex-col lg:order-1">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.number}
                step={step}
                index={i}
                isLast={i === STEPS.length - 1}
                inView={inView}
                isActive={activeStep === i}
                isCompleted={activeStep > i}
              />
            ))}
          </div>

          {/* Right: Live demo + CTA — shown after steps on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 32, scale: 0.97 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:order-2 lg:sticky lg:top-24 flex flex-col gap-4"
          >
            {/* Demo header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="font-mono text-[10px] tracking-widest dark:text-slate-400 text-slate-500 uppercase">
                  Live AI Pipeline Demo
                </span>
              </div>
              {/* Active step indicator */}
              <div className="hidden sm:flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <motion.div
                    key={i}
                    className="h-1 rounded-full transition-all duration-400"
                    animate={{
                      width: activeStep === i ? 16 : 4,
                      opacity: activeStep === i ? 1 : activeStep > i ? 0.5 : 0.2,
                    }}
                    style={{ background: s.from }}
                  />
                ))}
              </div>
            </div>

            <ScannerDemo onPhaseChange={handlePhaseChange} isActive={sectionVisible} />

            <p className="text-center font-mono text-[9px] dark:text-slate-600 text-slate-400 tracking-widest uppercase">
              Simulated demo · {DEMOS.length} real-world scenarios
            </p>

            {/* CTA — lives below demo on both mobile and desktop */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.68 }}
              className="flex flex-col gap-3"
            >
              <style>{`
                @keyframes button-glow-pulse {
                  0%, 100% { box-shadow: 0 0 8px rgba(84,91,255,0.4), 0 0 16px rgba(84,91,255,0.2), inset 0 1px 0 rgba(255,255,255,0.08); }
                  50% { box-shadow: 0 0 16px rgba(84,91,255,0.6), 0 0 32px rgba(84,91,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12); }
                }
                @keyframes scan-line {
                  0% { transform: translateX(-110%); opacity: 0; }
                  5% { opacity: 1; }
                  95% { opacity: 1; }
                  100% { transform: translateX(110%); opacity: 0; }
                }
                .button-glow {
                  animation: button-glow-pulse 3s ease-in-out infinite;
                }
                .button-glow:hover {
                  animation: button-glow-pulse 1.5s ease-in-out infinite;
                }
              `}</style>

              {/* Button row — full-width on mobile, left-aligned on desktop */}
              <div className="relative w-full group/btn">
                <div className="absolute -inset-[6px] rounded-[14px] bg-gradient-to-r from-[#545BFF]/30 via-[#7B6FFF]/40 to-[#b19eef]/30 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <button
                  onClick={scrollToScan}
                  className="button-glow group relative w-full inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-[12px] font-bold text-white text-[15px] overflow-hidden transition-all duration-300 hover:scale-[1.04] active:scale-[0.96]"
                  style={{ background: "linear-gradient(135deg, #545BFF 0%, #7B6FFF 50%, #b19eef 100%)" }}
                >
                  <span className="absolute inset-0 rounded-[12px] overflow-hidden pointer-events-none">
                    <span className="absolute inset-0 translate-x-[-110%]" style={{ animation: "scan-line 1.2s ease-in-out forwards" }}>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </span>
                  </span>
                  <span className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none rounded-[12px]" />
                  <svg className="relative z-10 w-[18px] h-[18px] shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(84,91,255,0.8)] transition-all duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0117.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="relative z-10 tracking-[0.05em] font-semibold group-hover:text-white/80 transition-colors duration-300">Scan a URL Now</span>
                  <svg className="relative z-10 w-4 h-4 shrink-0 transition-all duration-300 group-hover:translate-x-1 group-hover:drop-shadow-[0_0_4px_rgba(177,158,239,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-faded">
                <svg className="w-3.5 h-3.5 text-[#22c55e] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No account needed · No data stored · Free forever</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
