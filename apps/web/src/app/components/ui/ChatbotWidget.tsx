"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@lib/theme-context";

// ─── FAQ data ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "What is SmartShield?",
    a: "SmartShield is an AI-powered phishing detection system that analyzes URLs in real-time. It combines machine learning, WHOIS data, DNS records, and SSL certificate inspection to give every URL a Risk Score — telling you whether a site is Safe, Suspicious, or Dangerous before you visit it.",
  },
  {
    q: "How does phishing detection work?",
    a: "SmartShield runs the URL through a trained machine learning model that learned patterns from millions of real phishing and legitimate sites. It checks for suspicious TLDs, lookalike brand names, newly registered domains, missing HTTPS, redirects to unrelated hosts, and dozens of other signals — all in seconds.",
  },
  {
    q: "What does the Risk Score mean?",
    a: "The Risk Score (0–100) tells you how likely a URL is to be malicious:\n• 0–39 → Safe (green) — proceed normally.\n• 40–69 → Warning (yellow) — exercise caution, something looks off.\n• 70–100 → Dangerous (red) — avoid this site immediately.\nThe score combines the AI model's confidence with deterministic rule signals like domain age and brand impersonation flags.",
  },
  {
    q: "What is XAI / Explainable AI?",
    a: "XAI (Explainable AI) means the system doesn't just classify a URL — it shows you *why*. After each scan you'll see a list of Risk Indicators such as:\n• 🚨 CRITICAL: Brand impersonation detected\n• ⚠️ Domain registered < 30 days ago\n• ⚠️ SSL certificate issuer mismatch\n• ✅ Verified known-safe domain\nThis transparency lets you make an informed decision rather than blindly trusting a black-box result.",
  },
  {
    q: "What do WHOIS results show?",
    a: "WHOIS is a public registry that records who owns a domain and when. SmartShield highlights:\n• Creation date — domains under 30 days old are a major red flag.\n• Expiry date — very short registrations (1 month) suggest disposable phishing domains.\n• Registrar & country — certain registrars and jurisdictions are heavily abused.\n• Registrant name — hidden/anonymized details can indicate malicious intent.",
  },
  {
    q: "What are DNS records?",
    a: "DNS records map domain names to infrastructure. SmartShield checks:\n• A records — the IP address the domain resolves to. Rapidly changing IPs (fast-flux) signal botnet infrastructure.\n• MX records — mail servers. No MX often means the domain was never built for real communication.\n• TXT records — SPF/DKIM/DMARC policies. Missing email authentication is common on phishing domains.",
  },
  {
    q: "Why does SSL / HTTPS matter?",
    a: "SSL encrypts data between your browser and the server. SmartShield checks:\n• Validity — an expired or self-signed cert is an immediate warning.\n• Issuer — legitimate sites use trusted Certificate Authorities.\n• CN mismatch — if the certificate's domain doesn't match the URL you scanned, the connection can be intercepted.\nNote: HTTPS alone doesn't mean safe — phishers obtain free SSL certs too. SmartShield considers SSL as one signal among many.",
  },
  {
    q: "How does brand impersonation detection work?",
    a: "SmartShield maintains a registry of legitimate Philippine banks, e-wallets (GCash, Maya, UnionBank…), and globally known sites (Google, PayPal, Amazon…). If a scanned URL resembles a registered brand name but the domain doesn't match the real one — e.g. gcash-promo[.]xyz vs gcash.com — it's immediately flagged as a high-risk impersonation attempt.",
  },
  {
    q: "Does SmartShield store my data?",
    a: "No. SmartShield stores only the URL and scan result you explicitly submit — never your IP address, browsing history, or personal identity. Scan history is tied to your account (if signed in) for your own reference only and is never shared or sold.",
  },
  {
    q: "Why am I rate limited?",
    a: "To ensure fair access for all users and prevent automated abuse, each device is limited to 3 scans per minute. When you hit the limit, a countdown timer appears in the scan panel. Scanning resumes automatically once the 60-second window resets — no action needed.",
  },
  {
    q: "Can I use the browser extension?",
    a: "Yes! The SmartShield browser extension provides automatic protection as you browse. It scans links in real-time in the background and alerts you before a dangerous page loads — so you never have to remember to manually check a URL.",
  },
];

const TYPING_FRAME_MS = 32;
const TYPING_CHARS_PER_FRAME = 2;

// ─── Small HUD corner brackets (mirrors ScrollToTopButton aesthetic) ─────────
function HudCorners() {
  const base = "absolute w-[9px] h-[9px] border-[#545BFF]/70";
  return (
    <>
      <span className={`${base} top-[5px] left-[5px] border-t border-l`} />
      <span className={`${base} top-[5px] right-[5px] border-t border-r`} />
      <span className={`${base} bottom-[5px] left-[5px] border-b border-l`} />
      <span className={`${base} bottom-[5px] right-[5px] border-b border-r`} />
    </>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const typingTextRef = useRef("");
  const typingIndexRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  const stopTyping = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Start typing animation for a chosen FAQ
  const startTyping = (idx: number) => {
    stopTyping();
    setSelected(idx);
    setDisplayed("");
    setTyping(true);
    typingTextRef.current = FAQS[idx].a;
    typingIndexRef.current = 0;
    lastTickRef.current = 0;

    const tick = (ts: number) => {
      if (lastTickRef.current === 0) {
        lastTickRef.current = ts;
      }

      const elapsed = ts - lastTickRef.current;
      if (elapsed >= TYPING_FRAME_MS) {
        lastTickRef.current = ts;
        typingIndexRef.current = Math.min(
          typingIndexRef.current + TYPING_CHARS_PER_FRAME,
          typingTextRef.current.length
        );
        setDisplayed(typingTextRef.current.slice(0, typingIndexRef.current));

        if (typingIndexRef.current >= typingTextRef.current.length) {
          stopTyping();
          setTyping(false);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    stopTyping();
    setSelected(null);
    setDisplayed("");
    setTyping(false);
    typingIndexRef.current = 0;
    typingTextRef.current = "";
  };

  // Cleanup on unmount
  useEffect(() => () => { stopTyping(); }, []);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 640);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Auto-scroll the body as text is typed
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [displayed]);

  // ── Shared styles ─────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    ...(isDark
      ? {
          background: "linear-gradient(145deg, rgba(13,14,26,0.97) 0%, rgba(22,20,48,0.96) 100%)",
          border: "1px solid rgba(84,91,255,0.42)",
          boxShadow:
            "0 0 0 1px rgba(84,91,255,0.10), 0 0 48px rgba(84,91,255,0.20), 0 24px 70px rgba(0,0,0,0.72)",
        }
      : {
          background: "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(236,239,255,0.97) 100%)",
          border: "1px solid rgba(84,91,255,0.26)",
          boxShadow:
            "0 0 0 1px rgba(84,91,255,0.07), 0 0 32px rgba(84,91,255,0.10), 0 16px 50px rgba(0,0,0,0.13)",
        }),
  };

  const btnStyle: React.CSSProperties = {
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    ...(isDark
      ? {
          background:
            "linear-gradient(145deg, rgba(13,14,26,0.94) 0%, rgba(22,20,48,0.90) 100%)",
          border: "1px solid rgba(84,91,255,0.60)",
          boxShadow:
            "0 0 0 1px rgba(84,91,255,0.15), 0 0 28px rgba(84,91,255,0.50), 0 0 70px rgba(84,91,255,0.18), 0 10px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.09)",
        }
      : {
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(232,236,242,0.92) 100%)",
          border: "1px solid rgba(84,91,255,0.45)",
          boxShadow:
            "0 0 0 1px rgba(84,91,255,0.12), 0 0 22px rgba(84,91,255,0.30), 0 4px 20px rgba(84,91,255,0.12), 0 8px 30px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.80)",
        }),
  };

  const headerBorder = isDark ? "rgba(84,91,255,0.22)" : "rgba(84,91,255,0.16)";
  const bubbleBg = isDark ? "rgba(84,91,255,0.12)" : "rgba(84,91,255,0.08)";
  const bubbleText = isDark ? "#c8caff" : "#35387a";
  const chipBg = isDark ? "rgba(84,91,255,0.07)" : "rgba(84,91,255,0.05)";
  const chipBorder = isDark ? "rgba(84,91,255,0.22)" : "rgba(84,91,255,0.18)";
  const chipText = isDark ? "#b0b4ff" : "#4a4ea8";
  const headingText = isDark ? "#e6e8ff" : "#1e1f4a";
  const subText = isDark ? "rgba(177,158,239,0.75)" : "rgba(84,91,255,0.70)";

  return (
    <>
      {/* ── Chat panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chatbot-panel"
            initial={{ opacity: 0, scale: 0.88, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 18 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-[124px] right-3 sm:bottom-[152px] sm:right-7 z-99 w-[calc(100vw-24px)] max-w-[330px] sm:w-[380px] rounded-xl sm:rounded-2xl overflow-hidden"
            style={panelStyle}
          >
            {/* Header */}
            <div
              className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 border-b"
              style={{ borderColor: headerBorder }}
            >
              {/* Avatar */}
              <div
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl"
                style={{ background: "linear-gradient(135deg,#545BFF 0%,#9B73FF 100%)" }}
              >
                {/* Shield icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2L4 6v6c0 5.25 3.5 10.14 8 11.36C16.5 22.14 20 17.25 20 12V6l-8-4z"
                    fill="rgba(255,255,255,0.25)"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Online indicator */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 bg-green-400"
                  style={{ borderColor: isDark ? "#0d0e1a" : "#fff" }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] sm:text-sm font-bold leading-none" style={{ color: headingText }}>
                  SmartShield AI
                </p>
                <p className="text-[10px] sm:text-[11px] mt-0.5" style={{ color: subText }}>
                  Ask me anything · always here
                </p>
              </div>

              <button
                onClick={() => { setOpen(false); reset(); }}
                aria-label="Close assistant"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#545BFF]/10"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={isDark ? "text-slate-400" : "text-slate-500"}>
                  <line x1="1" y1="1" x2="13" y2="13" />
                  <line x1="13" y1="1" x2="1" y2="13" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div
              ref={bodyRef}
              className="overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3 space-y-2 sm:space-y-2.5 scrollbar-hide"
              style={{
                maxHeight: isMobileViewport
                  ? selected === null
                    ? "300px"
                    : "240px"
                  : selected === null
                    ? "360px"
                    : "300px",
              }}
            >
              {selected === null ? (
                <>
                  {/* Intro bubble */}
                  <div className="flex gap-2.5 items-start">
                    <div
                      className="h-6 w-6 shrink-0 mt-0.5 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#545BFF,#9B73FF)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
                      </svg>
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm px-3 py-2 sm:px-3.5 sm:py-2.5 text-[11px] sm:text-xs leading-relaxed flex-1"
                      style={{ background: bubbleBg, color: bubbleText }}
                    >
                      Hi! I'm SmartShield AI. Tap a question below and I'll explain how I keep you safe online.
                    </div>
                  </div>

                  {/* FAQ chips */}
                  <div className="space-y-1.5 pt-1">
                    {FAQS.map((faq, i) => (
                      <button
                        key={i}
                        onClick={() => startTyping(i)}
                        className="w-full text-left text-[11px] sm:text-xs px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-2.5 transition-all duration-150"
                        style={{ background: chipBg, border: `1px solid ${chipBorder}`, color: chipText }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = isDark ? "rgba(84,91,255,0.18)" : "rgba(84,91,255,0.12)";
                          el.style.borderColor = isDark ? "rgba(84,91,255,0.44)" : "rgba(84,91,255,0.36)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = chipBg;
                          el.style.borderColor = chipBorder;
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B73FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70" aria-hidden>
                          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
                        </svg>
                        <span className="flex-1">{faq.q}</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B73FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-40" aria-hidden>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* User bubble */}
                  <div className="flex justify-end">
                    <div
                      className="max-w-[82%] rounded-2xl rounded-br-sm px-3 py-2 sm:px-3.5 sm:py-2.5 text-[11px] sm:text-xs leading-relaxed font-medium"
                      style={{ background: "linear-gradient(135deg,#545BFF,#7B73FF)", color: "#fff" }}
                    >
                      {FAQS[selected].q}
                    </div>
                  </div>

                  {/* AI response bubble */}
                  <div className="flex gap-2.5 items-start">
                    <div
                      className="h-6 w-6 shrink-0 mt-0.5 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#545BFF,#9B73FF)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
                      </svg>
                    </div>
                    <div
                      className="rounded-2xl rounded-tl-sm px-3 py-2 sm:px-3.5 sm:py-2.5 text-[11px] sm:text-xs leading-relaxed flex-1 whitespace-pre-line"
                      style={{ background: bubbleBg, color: bubbleText }}
                    >
                      {displayed}
                      {typing && (
                        <span className="inline-flex gap-0.5 ml-1 align-middle">
                          <span className="h-1 w-1 rounded-full bg-[#6B73FF] animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1 w-1 rounded-full bg-[#6B73FF] animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1 w-1 rounded-full bg-[#6B73FF] animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer — only in answer view */}
            {selected !== null && (
              <div className="px-3 sm:px-4 pb-3 pt-1">
                <button
                  onClick={reset}
                  className="w-full text-[11px] sm:text-xs py-2 rounded-lg sm:rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all duration-150"
                  style={{
                    background: isDark ? "rgba(84,91,255,0.10)" : "rgba(84,91,255,0.07)",
                    border: isDark ? "1px solid rgba(84,91,255,0.24)" : "1px solid rgba(84,91,255,0.20)",
                    color: isDark ? "#9ea8ff" : "#545BFF",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to questions
                </button>
              </div>
            )}

            {/* Bottom shimmer line */}
            <span
              className="pointer-events-none absolute bottom-0 left-6 right-6 h-px rounded-full"
              style={{
                background: isDark
                  ? "linear-gradient(90deg,transparent,rgba(84,91,255,0.35),transparent)"
                  : "linear-gradient(90deg,transparent,rgba(84,91,255,0.22),transparent)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle button ─────────────────────────────────────────────────── */}
      <motion.button
        onClick={() => { setOpen((o) => !o); if (open) reset(); }}
        aria-label={open ? "Close SmartShield assistant" : "Open SmartShield assistant"}
        initial={{ opacity: 0, scale: 0.4, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.2 }}
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.86 }}
        className="fixed bottom-[86px] right-3 sm:bottom-[88px] sm:right-7 z-100 w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-lg sm:rounded-xl flex items-center justify-center cursor-pointer overflow-visible"
        style={btnStyle}
      >
        {/* Pulse ring — only when closed */}
        {!open && (
          <motion.span
            className="absolute rounded-xl pointer-events-none"
            style={{ inset: -7, border: "1px solid rgba(84,91,255,0.55)" }}
            animate={{ opacity: [0.75, 0, 0.75], scale: [1, 1.22, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />
        )}

        {/* HUD corner brackets */}
        <HudCorners />

        {/* Top shimmer edge */}
        <span
          className="absolute top-0 left-3 right-3 h-px rounded-full pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(90deg,transparent,rgba(177,158,239,0.55),transparent)"
              : "linear-gradient(90deg,transparent,rgba(84,91,255,0.40),transparent)",
          }}
        />

        {/* Icon: chat ↔ X with crossfade */}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg
              key="x-icon"
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden
            >
              <defs>
                <linearGradient id="cb-x-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b19eef" />
                  <stop offset="100%" stopColor="#6B73FF" />
                </linearGradient>
              </defs>
              <line x1="18" y1="6" x2="6" y2="18" stroke="url(#cb-x-grad)" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="url(#cb-x-grad)" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat-icon"
              initial={{ opacity: 0, rotate: 90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <defs>
                <linearGradient id="cb-chat-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b19eef" />
                  <stop offset="100%" stopColor="#6B73FF" />
                </linearGradient>
              </defs>
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="url(#cb-chat-grad)"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
