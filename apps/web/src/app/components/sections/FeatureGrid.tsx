"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

// Feature accent colors use actual CSS values so they work as inline styles
const FEATURES = [
  {
    id: 1,
    from: "#818cf8",
    to:   "#60a5fa",
    icon: "/images/Artificial Intelligence.png",
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
    to:   "#2dd4bf",
    icon: "/images/Geography.png",
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
    to:   "#fbbf24",
    icon: "/images/Layers.png",
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
    to:   "#818cf8",
    icon: "/images/Search More.png",
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
    to:   "#34d399",
    icon: "/images/Security Lock.png",
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
    to:   "#fb923c",
    icon: "/images/Protect.png",
    title: "Zero-Day Protection",
    label: "0DAY·SHIELD",
    description:
      "Stay ahead with predictive analysis that blocks never-before-seen exploits and zero-day vulnerabilities in real time.",
    tags: ["Predictive AI", "0-Day"],
    confidence: 93,
  },
] as const;

const STATS = [
  { value: "99.7%", label: "Detection rate" },
  { value: "<200ms", label: "Scan speed" },
  { value: "6×",    label: "Layered defense" },
];

const CARD_H    = 360;
const SHOWN     = 3;
const PEEK      = 20;
const SCALE_D   = 0.055;
const OPACITY_D = 0.17;
const ROTATE_Z  = [0, 2.5, -1.5] as const;
const DECK_H    = CARD_H + (SHOWN - 1) * PEEK + 8;

const SPRING = { type: "spring" as const, stiffness: 380, damping: 36, mass: 0.85 };

/* CSS dot-grid texture — mirrors HeroSection's DotGrid aesthetic */
function DeckDotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(84,91,255,0.55) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        opacity: 0.055,
      }}
    />
  );
}

/* HUD corner brackets — same motif as HeroSection's HudCorners */
function CardCorners({ color }: { color: string }) {
  return (
    <>
      <span className="absolute top-[10px] left-[10px] w-[14px] h-[14px] border-t-[1.5px] border-l-[1.5px] pointer-events-none" style={{ borderColor: color, opacity: 0.65 }} />
      <span className="absolute top-[10px] right-[10px] w-[14px] h-[14px] border-t-[1.5px] border-r-[1.5px] pointer-events-none" style={{ borderColor: color, opacity: 0.65 }} />
      <span className="absolute bottom-[10px] left-[10px] w-[14px] h-[14px] border-b-[1.5px] border-l-[1.5px] pointer-events-none" style={{ borderColor: color, opacity: 0.65 }} />
      <span className="absolute bottom-[10px] right-[10px] w-[14px] h-[14px] border-b-[1.5px] border-r-[1.5px] pointer-events-none" style={{ borderColor: color, opacity: 0.65 }} />
    </>
  );
}

/* Horizontal scan beam that sweeps top→bottom on the active front card */
function ScanBeam({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-x-0 h-[2px] pointer-events-none z-20"
      style={{
        background: `linear-gradient(to right, transparent 5%, ${color}60 40%, ${color}90 50%, ${color}60 60%, transparent 95%)`,
      }}
      initial={{ y: -2 }}
      animate={{ y: CARD_H + 2 }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1.8 }}
    />
  );
}

function FeatureCard({
  feature,
  isFront,
}: {
  feature: (typeof FEATURES)[number];
  isFront: boolean;
}) {
  const accentGrad = `linear-gradient(155deg, ${feature.from}, ${feature.to})`;

  return (
    <div
      className="relative h-full rounded-2xl overflow-hidden flex flex-col select-none
        dark:bg-[#070810]/96 bg-white/98 backdrop-blur-2xl"
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

      {/* Scanning beam + HUD corners only on front card */}
      {isFront && <ScanBeam color={feature.from} />}
      {isFront && <CardCorners color={feature.from} />}

      {/* Top gradient wash */}
      <div
        className="absolute top-0 inset-x-0 h-28 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${feature.from}0d, transparent)` }}
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
          style={{ background: feature.from, boxShadow: `0 0 6px ${feature.from}cc` }}
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
          {String(feature.id).padStart(2, "0")}/{String(FEATURES.length).padStart(2, "0")}
        </span>
      </div>

      {/* Card body */}
      <div className="relative z-10 flex flex-col flex-1 px-5 pt-4 pb-3">
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
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0 w-11 h-11">
            {/* Icon glow halo */}
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-35"
              style={{ background: accentGrad }}
            />
            <div
              className="relative w-full h-full rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(7,8,16,0.85)",
                border: `1px solid ${feature.from}28`,
              }}
            >
              <Image src={feature.icon} alt={feature.title} width={22} height={22} className="object-contain" />
            </div>
            {/* Pulse scan ring around icon — front card only */}
            {isFront && (
              <motion.div
                className="absolute -inset-1.5 rounded-2xl border pointer-events-none"
                style={{ borderColor: feature.from }}
                animate={{ opacity: [0, 0.55, 0], scale: [0.82, 1.12, 1.12] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", repeatDelay: 0.6 }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[1.05rem] font-extrabold text-heading tracking-tight leading-tight">
              {feature.title}
            </h3>
            {isFront && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <motion.span
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{ backgroundColor: feature.from }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <span className="text-[8.5px] font-mono tracking-widest uppercase text-faded/45">
                  Active Shield
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-copy/65 text-[13px] leading-relaxed flex-1 mb-3">
          {feature.description}
        </p>

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] font-mono uppercase tracking-widest text-faded/38">Confidence</span>
            <span
              className="text-[8px] font-mono tabular-nums"
              style={{ color: isFront ? feature.from : "rgba(148,163,184,0.45)" }}
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
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
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

        {isFront && (
          <p className="mt-2 text-[8px] text-faded/28 font-mono flex items-center gap-1.5">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  const count               = FEATURES.length;
  const [front, setFront]   = useState(0);
  const [hovered, setHovered] = useState(false);
  const locked              = useRef(false);
  const dragX               = useRef(0);

  const advance = useCallback((dir = 1) => {
    if (locked.current) return;
    locked.current = true;
    setFront((f) => (f + dir + count) % count);
    setTimeout(() => { locked.current = false; }, 300);
  }, [count]);

  /* Keyboard: ← / → navigate cards */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance(1);
      if (e.key === "ArrowLeft")  advance(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  /* Auto-cycle — paused while hovering the deck */
  useEffect(() => {
    if (hovered) return;
    const id = setInterval(() => advance(1), 4200);
    return () => clearInterval(id);
  }, [advance, hovered]);

  const frontFeat = FEATURES[front];

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="relative w-full" style={{ height: DECK_H }}>
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
          style={{ height: DECK_H }}
          onPointerDown={(e) => { dragX.current = e.clientX; }}
          onPointerUp={(e) => {
            const delta = e.clientX - dragX.current;
            if (Math.abs(delta) > 36) advance(delta < 0 ? 1 : -1);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {FEATURES.map((feat, i) => {
            const pos  = (i - front + count) % count;
            const vis  = pos < SHOWN;
            const zIdx = vis ? SHOWN - pos : 0;

            return (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  height: CARD_H,
                  zIndex: zIdx,
                  cursor: pos === 0 ? "pointer" : "default",
                  willChange: "transform, opacity",
                }}
                animate={{
                  y:       vis ? pos * PEEK     : CARD_H + 24,
                  scale:   vis ? 1 - pos * SCALE_D : 0.78,
                  rotateZ: vis ? ROTATE_Z[pos] ?? 0 : 0,
                  opacity: vis ? 1 - pos * OPACITY_D : 0,
                  filter:  vis && pos > 0
                    ? `blur(${pos * 0.45}px) saturate(0.65)`
                    : "blur(0px) saturate(1)",
                }}
                transition={SPRING}
                onClick={pos === 0 ? () => advance(1) : undefined}
                whileTap={pos === 0 ? { scale: 0.993 } : {}}
              >
                <FeatureCard feature={feat} isFront={pos === 0} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pill dot nav — active pill hue tracks front card accent */}
      <div className="flex items-center gap-2" role="group" aria-label="Feature navigation">
        {FEATURES.map((feat, i) => (
          <button
            key={i}
            onClick={() => { locked.current = false; setFront(i); }}
            aria-label={feat.title}
            aria-current={i === front ? "true" : undefined}
            className="rounded-full"
            style={{
              width:      i === front ? 24 : 8,
              height:     8,
              background: i === front
                ? `linear-gradient(to right, ${frontFeat.from}, ${frontFeat.to})`
                : "rgba(84,91,255,0.14)",
              boxShadow: i === front ? `0 0 12px ${frontFeat.from}85` : "none",
              transition: "width 0.3s ease, background 0.4s ease, box-shadow 0.4s ease",
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
  const ref   = useRef<HTMLDivElement>(null);
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
            animate={inView
              ? { opacity: [0, 1, 0.5, 1], scale: 1 }
              : { opacity: 0, scale: 0 }}
            transition={{
              delay: 0.15 + i * 0.12,
              duration: 0.5,
              opacity: { repeat: Infinity, duration: 2.4, delay: 0.15 + i * 0.12 },
            }}
          />
        ))}
      </div>

      {/* HUD corner brackets */}
      <span className="absolute top-4 left-4 block w-5 h-5 border-t-2 border-l-2 border-[#545BFF]/35 rounded-tl-sm" />
      <span className="absolute top-4 right-4 block w-5 h-5 border-t-2 border-r-2 border-[#545BFF]/35 rounded-tr-sm" />
      <span className="absolute bottom-4 left-4 block w-5 h-5 border-b-2 border-l-2 border-[#545BFF]/35 rounded-bl-sm" />
      <span className="absolute bottom-4 right-4 block w-5 h-5 border-b-2 border-r-2 border-[#545BFF]/35 rounded-br-sm" />
    </div>
  );
}

export default function FeatureGrid() {
  const contentRef = useRef<HTMLDivElement>(null);
  const inView     = useInView(contentRef, { once: true, margin: "-80px" });

  return (
    <>
      <section
        id="features"
        className="min-h-screen py-12 md:py-16 lg:py-20 px-4 md:px-6 bg-page relative overflow-hidden flex flex-col justify-center"
      >
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-[8%] w-64 h-64 md:w-[480px] md:h-[480px] rounded-full bg-[#545BFF]/6 blur-[140px]" />
          <div className="absolute bottom-0 left-[5%] w-56 h-56 md:w-[360px] md:h-[360px] rounded-full bg-[#b19eef]/5 blur-[120px]" />
        </div>

        {/* Section HUD corners — matching HeroSection's HudCorners motif */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-5 left-5 md:top-7 md:left-7 w-9 h-9 border-t-[1.5px] border-l-[1.5px] border-[#545BFF]/22" />
          <div className="absolute top-5 right-5 md:top-7 md:right-7 w-9 h-9 border-t-[1.5px] border-r-[1.5px] border-[#545BFF]/22" />
          <div className="absolute bottom-5 left-5 md:bottom-7 md:left-7 w-9 h-9 border-b-[1.5px] border-l-[1.5px] border-[#545BFF]/22" />
          <div className="absolute bottom-5 right-5 md:bottom-7 md:right-7 w-9 h-9 border-b-[1.5px] border-r-[1.5px] border-[#545BFF]/22" />
        </div>

        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/35 to-transparent" />

        <div ref={contentRef} className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-24 items-center">

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
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5
                  dark:bg-[#545BFF]/10 bg-[#545BFF]/12
                  dark:border-[#545BFF]/20 border-[#545BFF]/30 border
                  backdrop-blur-sm shadow-sm dark:shadow-none"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-70" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#545BFF]" />
                </span>
                <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
                  Core Capabilities
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.13 }}
                className="text-[1.75rem] sm:text-3xl md:text-[2.5rem] font-extrabold text-heading tracking-tight leading-[1.1] mb-4"
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
                className="text-copy/70 text-base md:text-[17px] leading-relaxed mb-8 max-w-[400px]"
              >
                We combine cutting-edge technology with proactive defense mechanisms
                to create an impenetrable barrier for your browsing experience.
              </motion.p>

              {/* Stats — matches HeroSection stat card pattern exactly */}
              <div className="grid grid-cols-3 gap-2.5 md:gap-3 mb-6">
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 18, scale: 0.92 }}
                    animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.45, delay: 0.28 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative overflow-hidden px-3 py-3 md:py-3.5 rounded-xl cursor-default
                      dark:bg-[#0c0d1c]/60 bg-white/85 backdrop-blur-sm
                      border border-[#545BFF]/18 hover:border-[#545BFF]/45
                      shadow-[0_1px_10px_rgba(84,91,255,0.07)]
                      transition-colors duration-300"
                  >
                    {/* Left accent bar — same as HeroSection stat cards */}
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-[#545BFF] to-[#b19eef] opacity-70 group-hover:opacity-100 transition-opacity" />
                    <div className="text-xl md:text-2xl font-bold tracking-tight mb-0.5 pl-1
                      text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                      {stat.value}
                    </div>
                    <div className="text-[9px] md:text-[10px] text-faded font-medium tracking-wide pl-1">
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#545BFF]/50 shrink-0" aria-hidden>
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
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
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
