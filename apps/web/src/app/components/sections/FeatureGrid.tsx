"use client";

import { motion, useInView } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Feature accent colors use actual CSS values so they work as inline styles
const FEATURES = [
  {
    id: 1,
    from: "#818cf8",
    to: "#60a5fa",
    icon: "neural",
    title: "AI Threat Detection",
    label: "NEURAL·SCAN",
    description:
      "Advanced machine learning algorithms that proactively identify and neutralize emerging threats before they ever execute.",
    tags: ["ML Model", "Adaptive", "Zero-lag"],
    confidence: 98,
  },
  {
    id: 2,
    from: "#34d399",
    to: "#2dd4bf",
    icon: "monitor",
    title: "Real-Time Defense",
    label: "LIVE·MONITOR",
    description:
      "Continuous 24/7 monitoring ensures your digital environment is protected against attacks as they happen, globally.",
    tags: ["24/7", "Global", "Live"],
    confidence: 99,
  },
  {
    id: 3,
    from: "#fb923c",
    to: "#fbbf24",
    icon: "layers",
    title: "Multi-Layer Security",
    label: "DEPTH·SCAN",
    description:
      "A robust defense-in-depth strategy combining network, application, and endpoint security layers for maximum coverage.",
    tags: ["6 Layers", "Defense-in-Depth"],
    confidence: 97,
  },
  {
    id: 4,
    from: "#c084fc",
    to: "#818cf8",
    icon: "search",
    title: "Deep Link Analysis",
    label: "URL·PARSE",
    description:
      "We dissect complex URL structures and redirects to uncover hidden malicious payloads that traditional scanners miss.",
    tags: ["URL Parse", "Redirect Analysis"],
    confidence: 94,
  },
  {
    id: 5,
    from: "#38bdf8",
    to: "#34d399",
    icon: "shield",
    title: "SSL & Domain Verification",
    label: "CERT·CHECK",
    description:
      "Instantly validates SSL certificates and domain ownership to ensure you're always connecting to authentic, secure websites.",
    tags: ["SSL", "WHOIS", "DNS"],
    confidence: 98,
  },
  {
    id: 6,
    from: "#f87171",
    to: "#fb923c",
    icon: "zeroday",
    title: "Zero-Day Protection",
    label: "0DAY·SHIELD",
    description:
      "Stay ahead with predictive analysis that blocks never-before-seen exploits and zero-day vulnerabilities in real time.",
    tags: ["Predictive AI", "0-Day"],
    confidence: 93,
  },
] as const;

const STATS = [
  { value: "96.9%", label: "Detection rate" },
  { value: "<10s", label: "Scan speed" },
  { value: "6×", label: "Layered defense" },
];

/* SVG Icon Renderer — adapts to light/dark mode */
function IconRenderer({ type, color }: { type: string; color: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    neural: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="5" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <path d="M12 6v6M12 12v6M6 12h6M12 12h6" strokeWidth="1" />
      </svg>
    ),
    monitor: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <circle cx="7" cy="10" r="1.5" fill="currentColor" />
        <circle cx="12" cy="10" r="1.5" fill="currentColor" />
        <circle cx="17" cy="10" r="1.5" fill="currentColor" />
      </svg>
    ),
    layers: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7v4c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
        <path d="M12 8v4M8 10h8" />
        <path d="M9 16h6" />
      </svg>
    ),
    search: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    shield: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 12l-3-3M12 12l3 3M12 12l3-3M12 12l-3 3" />
      </svg>
    ),
    zeroday: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="currentColor"
        >
          0
        </text>
        <path d="M3 12h18M12 3v18" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
  };

  return <div style={{ color }}>{iconMap[type] || iconMap.neural}</div>;
}

const CARD_H = 360;
const SHOWN = 3;
const PEEK = 20;
const SCALE_D = 0.055;
const OPACITY_D = 0.17;
const ROTATE_Z = [0, 2.5, -1.5] as const;
const DECK_H = CARD_H + (SHOWN - 1) * PEEK + 8;

const SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.85,
};

/* CSS dot-grid texture — mirrors HeroSection's DotGrid aesthetic */
function DeckDotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(84,91,255,0.55) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        opacity: 0.055,
      }}
    />
  );
}

/* Horizontal scan beam that sweeps top→bottom on the active front card */
function ScanBeam({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-x-0 h-[2px] pointer-events-none z-20"
      style={{
        background: `linear-gradient(to right, transparent 5%, ${color}60 40%, ${color}90 50%, ${color}60 60%, transparent 95%)`,
        animation: "ss-card-beam 4.6s linear infinite",
      }}
    />
  );
}

function FeatureCard({
  feature,
  isFront,
  compact = false,
}: {
  feature: (typeof FEATURES)[number];
  isFront: boolean;
  compact?: boolean;
}) {
  const accentGrad = `linear-gradient(155deg, ${feature.from}, ${feature.to})`;

  return (
    <div
      className="relative h-full rounded-2xl overflow-hidden flex flex-col select-none
        bg-white/95 dark:bg-[#090d1a] backdrop-blur-2xl transition-colors duration-300"
      style={{
        border: isFront
          ? `1px solid ${feature.from}45`
          : "1px solid rgba(84,91,255,0.12)",
        boxShadow: isFront
          ? `0 0 0 1px ${feature.from}15, 0 24px 64px rgba(0,0,0,0.45), 0 0 48px ${feature.from}18`
          : "0 8px 28px rgba(0,0,0,0.22)",
      }}
    >
      {/* Dot-grid texture */}
      <DeckDotGrid />

      {/* Scanning beam only on front card */}
      {isFront && !compact && <ScanBeam color={feature.from} />}

      {/* Top gradient wash */}
      <div
        className="absolute top-0 inset-x-0 h-28 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${feature.from}0d, transparent)`,
        }}
      />

      {/* HUD terminal header bar */}
      <div
        className="relative z-10 flex items-center gap-1.5 px-3.5 py-2.5 shrink-0"
        style={{
          borderBottom: `1px solid ${feature.from}22`,
          background: `linear-gradient(to right, ${feature.from}0b, transparent 55%)`,
        }}
      >
        {/* Traffic-light status dots */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: feature.from,
            boxShadow: `0 0 6px ${feature.from}cc`,
          }}
        />
        <span className="w-2 h-2 rounded-full bg-[#545BFF]/25 shrink-0" />
        <span className="w-2 h-2 rounded-full bg-[#545BFF]/12 shrink-0" />

        <div className="flex-1 mx-2 h-px bg-gradient-to-r from-transparent via-[#545BFF]/15 to-transparent" />

        <span
          className="text-[8.5px] font-mono tracking-[0.14em] uppercase shrink-0"
          style={{ color: isFront ? feature.from : "rgba(148,163,184,0.4)" }}
        >
          {feature.label}
        </span>

        <div className="flex-1 mx-2 h-px bg-gradient-to-r from-transparent via-[#545BFF]/15 to-transparent" />

        <span className="text-[8.5px] font-mono text-faded/30 tabular-nums shrink-0">
          {String(feature.id).padStart(2, "0")}/
          {String(FEATURES.length).padStart(2, "0")}
        </span>
      </div>

      {/* Card body */}
      <div
        className={`relative z-10 flex flex-col flex-1 ${compact ? "px-4 pt-3 pb-2.5" : "px-5 pt-4 pb-3"}`}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[2.5px] rounded-r-full"
          style={{
            background: accentGrad,
            opacity: isFront ? 1 : 0.4,
            boxShadow: isFront ? `0 0 8px ${feature.from}65` : "none",
          }}
        />

        {/* Icon + title row */}
        <div
          className={`flex items-start ${compact ? "gap-2.5 mb-2.5" : "gap-3 mb-3"}`}
        >
          <div
            className={`relative shrink-0 ${compact ? "w-10 h-10" : "w-11 h-11"}`}
          >
            {/* Icon glow halo */}
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-35"
              style={{ background: accentGrad }}
            />
            <div
              className="relative w-full h-full rounded-xl flex items-center justify-center
                bg-white/65 dark:bg-[#11172b] dark:border-[#545BFF]/28 border-[#545BFF]/15 border transition-colors duration-300"
              style={{
                transition:
                  "background-color 0.3s ease, border-color 0.3s ease",
              }}
            >
              <IconRenderer type={feature.icon} color={feature.from} />
            </div>
            {/* Pulse scan ring around icon — front card only */}
            {isFront && !compact && (
              <div
                className="absolute -inset-1.5 rounded-2xl border pointer-events-none"
                style={{
                  borderColor: feature.from,
                  animation: "ss-icon-ring 2.8s ease-out infinite",
                }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={`${compact ? "text-[1rem]" : "text-[1.05rem]"} font-extrabold text-heading tracking-tight leading-tight`}
            >
              {feature.title}
            </h3>
            {isFront && !compact && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-[5px] h-[5px] rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: feature.from }}
                />
                <span className="text-[8.5px] font-mono tracking-widest uppercase text-faded/45">
                  Active Shield
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p
          className={`text-copy/65 ${compact ? "text-[12.5px]" : "text-[13px]"} leading-relaxed flex-1 mb-3`}
        >
          {feature.description}
        </p>

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] font-mono uppercase tracking-widest text-faded/38">
              Confidence
            </span>
            <span
              className="text-[8px] font-mono tabular-nums"
              style={{
                color: isFront ? feature.from : "rgba(148,163,184,0.45)",
              }}
            >
              {feature.confidence}%
            </span>
          </div>
          <div className="h-[3px] rounded-full bg-[#545BFF]/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: accentGrad }}
              initial={{ width: "0%" }}
              animate={{ width: `${feature.confidence}%` }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.12,
              }}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {feature.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-[3px] rounded-full text-[9px] font-semibold tracking-wide"
              style={{
                background: `${feature.from}12`,
                border: `1px solid ${feature.from}30`,
                color: isFront ? feature.from : "rgba(148,163,184,0.55)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {isFront && !compact && (
          <p className="mt-2 text-[8px] text-faded/28 font-mono flex items-center gap-1.5">
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            CLICK · SWIPE · ← →
          </p>
        )}
      </div>
    </div>
  );
}

function CardSwapDeck() {
  const count = FEATURES.length;
  const [front, setFront] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const locked = useRef(false);
  const dragX = useRef(0);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const shownCount = isMobileViewport ? 2 : SHOWN;
  const cardHeight = isMobileViewport ? 332 : CARD_H;
  const deckHeight = cardHeight + (shownCount - 1) * PEEK + 8;

  const advance = useCallback(
    (dir = 1) => {
      if (locked.current) return;
      locked.current = true;
      setFront((f) => (f + dir + count) % count);
      setTimeout(() => {
        locked.current = false;
      }, 300);
    },
    [count],
  );

  /* Keyboard: ← / → navigate cards */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance(1);
      if (e.key === "ArrowLeft") advance(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  /* Auto-cycle — paused while hovering the deck */
  useEffect(() => {
    if (hovered || isMobileViewport) return;
    const id = setInterval(() => advance(1), 4200);
    return () => clearInterval(id);
  }, [advance, hovered, isMobileViewport]);

  const frontFeat = FEATURES[front];

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="relative w-full" style={{ height: deckHeight }}>
        {/* Dynamic ambient glow — hue follows front card accent */}
        <div
          className="absolute -inset-8 rounded-[40px] blur-3xl pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse at 50% 35%, ${frontFeat.from}20, transparent 65%)`,
          }}
        />

        {/* Deck interactive area */}
        <div
          className="relative w-full touch-pan-y"
          style={{ height: deckHeight }}
          onPointerDown={(e) => {
            dragX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            const delta = e.clientX - dragX.current;
            if (Math.abs(delta) > 36) advance(delta < 0 ? 1 : -1);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {FEATURES.map((feat, i) => {
            const pos = (i - front + count) % count;
            const vis = pos < shownCount;
            const zIdx = vis ? shownCount - pos : 0;

            return (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  height: cardHeight,
                  zIndex: zIdx,
                  cursor: pos === 0 ? "pointer" : "default",
                  willChange: "transform, opacity",
                }}
                animate={{
                  y: vis ? pos * PEEK : cardHeight + 24,
                  scale: vis ? 1 - pos * SCALE_D : 0.78,
                  rotateZ: vis
                    ? isMobileViewport
                      ? 0
                      : (ROTATE_Z[pos] ?? 0)
                    : 0,
                  opacity: vis ? 1 - pos * OPACITY_D : 0,
                  filter:
                    !isMobileViewport && vis && pos > 0
                      ? `blur(${pos * 0.45}px) saturate(0.65)`
                      : "blur(0px) saturate(1)",
                }}
                transition={SPRING}
                onClick={pos === 0 ? () => advance(1) : undefined}
                whileTap={pos === 0 ? { scale: 0.993 } : {}}
              >
                <FeatureCard
                  feature={feat}
                  isFront={pos === 0}
                  compact={isMobileViewport}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pill dot nav — active pill hue tracks front card accent */}
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Feature navigation"
      >
        {FEATURES.map((feat, i) => (
          <button
            key={i}
            onClick={() => {
              locked.current = false;
              setFront(i);
            }}
            aria-label={feat.title}
            aria-current={i === front ? "true" : undefined}
            className="rounded-full"
            suppressHydrationWarning={true}
            style={{
              width: i === front ? 24 : 8,
              height: 8,
              background:
                i === front
                  ? `linear-gradient(to right, ${frontFeat.from}, ${frontFeat.to})`
                  : "rgba(84,91,255,0.14)",
              boxShadow: i === front ? `0 0 12px ${frontFeat.from}85` : "none",
              transition:
                "width 0.3s ease, background 0.4s ease, box-shadow 0.4s ease",
            }}
          />
        ))}
      </div>

      {/* Feature label — re-animates on every card change via key */}
      <motion.p
        key={front}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[9px] font-mono tracking-[0.18em] uppercase -mt-1.5"
        style={{ color: frontFeat.from + "99" }}
      >
        {frontFeat.label} · {String(front + 1).padStart(2, "0")} of {count}
      </motion.p>
    </div>
  );
}

function SectionBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "0px 0px -40% 0px" });

  return (
    <div
      ref={ref}
      className="relative h-28 md:h-36 bg-page overflow-hidden flex items-center justify-center"
      aria-hidden
    >
      {/* Gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-page via-[#545BFF]/5 to-page pointer-events-none" />

      {/* Animated scan line */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/60 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Three pulsing dots */}
      <div className="relative z-10 flex items-center gap-4">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block rounded-full bg-[#545BFF]"
            style={{
              width: i === 1 ? 8 : 5,
              height: i === 1 ? 8 : 5,
              boxShadow: "0 0 10px rgba(84,91,255,0.8)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={
              inView
                ? { opacity: [0, 1, 0.5, 1], scale: 1 }
                : { opacity: 0, scale: 0 }
            }
            transition={{
              delay: 0.15 + i * 0.12,
              duration: 0.5,
              opacity: {
                repeat: Infinity,
                duration: 2.4,
                delay: 0.15 + i * 0.12,
              },
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function FeatureGrid() {
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, margin: "-80px" });

  return (
    <>
      <section
        id="features"
        className="min-h-screen py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-5 md:px-6 bg-page relative overflow-hidden flex flex-col justify-center"
      >
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-[8%] w-64 h-64 md:w-[480px] md:h-[480px] rounded-full bg-[#545BFF]/6 blur-[140px]" />
          <div className="absolute bottom-0 left-[5%] w-56 h-56 md:w-[360px] md:h-[360px] rounded-full bg-[#b19eef]/5 blur-[120px]" />
        </div>

        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/35 to-transparent" />

        <div ref={contentRef} className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 xl:gap-24 items-center">
            {/* Left: copy + stats — shown first on mobile */}
            <motion.div
              className="lg:order-1"
              initial={{ opacity: 0, x: -32 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full mb-3.5 sm:mb-5
                  dark:bg-[#545BFF]/10 bg-[#545BFF]/12
                  dark:border-[#545BFF]/20 border-[#545BFF]/30 border
                  backdrop-blur-sm shadow-sm dark:shadow-none"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-70" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#545BFF]" />
                </span>
                <span className="text-[#545BFF] dark:text-[#a89de8] text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase">
                  Core Capabilities
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.13 }}
                className="text-[1.85rem] sm:text-3xl md:text-[2.5rem] font-extrabold text-heading tracking-tight leading-[1.1] mb-3 sm:mb-4"
              >
                Six Ways{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                  SmartShield
                </span>{" "}
                Keeps You Safe
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-copy/70 text-[13px] sm:text-sm md:text-base leading-relaxed mb-5 sm:mb-8 max-w-[400px]"
              >
                We combine cutting-edge technology with proactive defense
                mechanisms to create an impenetrable barrier for your browsing
                experience.
              </motion.p>

              {/* Stats — matches HeroSection stat card pattern exactly */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3 mb-4.5 sm:mb-6">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 18, scale: 0.92 }}
                    animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{
                      duration: 0.45,
                      delay: 0.28 + i * 0.09,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative overflow-hidden px-2 py-2.5 sm:px-3 sm:py-3 md:py-3.5 rounded-xl cursor-default
                      bg-white/86 dark:bg-[#11182d]/80 backdrop-blur-sm
                      border border-[#545BFF]/18 hover:border-[#545BFF]/45
                      shadow-[0_1px_10px_rgba(84,91,255,0.07)]
                      transition-colors duration-300"
                  >
                    {/* Left accent bar — same as HeroSection stat cards */}
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-[#545BFF] to-[#b19eef] opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div
                      className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight mb-0.5 pl-1
                      text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]"
                    >
                      {stat.value}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-faded font-medium tracking-wide pl-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Security note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.52 }}
                className="flex items-center gap-2 text-faded/40 text-[10px] font-mono tracking-widest uppercase"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#545BFF]/50 shrink-0"
                  aria-hidden
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                All 6 defenses · every scan
              </motion.div>
            </motion.div>

            {/* Right: CardSwap deck — shown at bottom on mobile */}
            <motion.div
              className="lg:order-2"
              initial={{ opacity: 0, x: 32 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.12,
              }}
            >
              <CardSwapDeck />
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-divider to-transparent" />
      </section>
    </>
  );
}
