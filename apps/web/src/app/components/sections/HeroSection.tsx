"use client";

import dynamic from "next/dynamic";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { useEffect, useRef, useCallback, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";

const ShieldModel = dynamic(() => import("../ui/ShieldModel"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const poppins = Poppins({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  display: "swap",
});

const stats = [
  { value: "50K+", label: "Threats Blocked" },
  { value: "99.2%", label: "Detection Rate" },
  { value: "<0.5s", label: "Scan Speed" },
  { value: "24/7", label: "Active Monitoring" },
];

/* ── Animated dot-grid background ── */
function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const lastRef = useRef(0);

  const initNodes = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 34000), 26);
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
      const maxDist = 85;
      const maxDist2 = maxDist * maxDist;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < maxDist2) {
            const alpha = (1 - Math.sqrt(dist2) / maxDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(84,91,255,${alpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(84,91,255,0.5)";
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

/* ── Pulsing scan rings — children positioned centered at parent's 0,0 point ── */
function ScanRings() {
  const rings = [
    { size: 200, delay: 0 },
    { size: 320, delay: 1.6 },
    { size: 450, delay: 3.2 },
    { size: 580, delay: 0.8 },
  ];
  return (
    <>
      {/* Static inner ring */}
      <div
        className="absolute rounded-full border border-[#545BFF]/35"
        style={{ width: 160, height: 160, top: -80, left: -80 }}
      />
      {/* Pulsing outer rings */}
      {rings.map(({ size, delay }, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-[#545BFF]/22"
          style={{
            width: size,
            height: size,
            top: -size / 2,
            left: -size / 2,
            animation: `pulseScaleRing 5s ease-out ${delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

/* ── Main exported component ── */
export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* scroll tracking relative to this container */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /* spring-smooth so motion feels fluid, not mechanical */
  const smooth = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 22,
    restDelta: 0.001,
  });

  /* ── Shield travels: right→left desktop, mobile stays centered ── */
  const shieldXDesktop = useTransform(smooth, [0, 0.52], ["26vw", "-19vw"]);
  const shieldXMobile  = useTransform(smooth, [0, 1],    ["0px",  "0px"]);

  /* ── Shield on mobile: upper-center in hero, glides subtly upward; desktop stays centered ── */
  const shieldYMobile  = useTransform(smooth, [0, 0.35], ["-16vh", "-28vh"]);
  const shieldYDesktop = useTransform(smooth, [0, 1],    ["0px", "0px"]);

  /* ── Scale: shrinks slightly (not too much) ── */
  const shieldScale = useTransform(smooth, [0, 0.52], [1, 0.85]);

  /* ── Hero content fades out while scrolling ── */
  const heroOpacity      = useTransform(smooth, [0, 0.25], [1, 0]);
  const heroY            = useTransform(smooth, [0, 0.25], [0, -40]);
  const scrollHintOpacity = useTransform(smooth, [0, 0.08], [1, 0]);

  /* ── Stats content fades in after shield settles ── */
  const statsOpacity = useTransform(smooth, [0.33, 0.53], [0, 1]);
  const statsY       = useTransform(smooth, [0.33, 0.53], [36, 0]);

  /* Pick responsive motion values */
  const shieldX = isMobile ? shieldXMobile : shieldXDesktop;
  const shieldY = isMobile ? shieldYMobile : shieldYDesktop;

  return (
    /*
     * Outer container — responsive height for scroll transitions.
     * Mobile: 160vh (stats removed), Desktop: 220vh
     * The sticky inner stays at the top of the viewport the whole time.
     */
    <div ref={containerRef} className="relative" style={{ height: isMobile ? "160vh" : "220vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-page">

        {/* ── Layer 1: dot-grid background ── */}
        <div className="absolute inset-0 z-[1]">
          <DotGrid />
        </div>

        {/* ── Layer 2: gradient vignettes for readability — light/dark mode aware ── */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          {/* Top-to-bottom darkening gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-page/30 via-transparent dark:via-transparent to-page/50 dark:to-page/65" />
          {/* Subtle radial gradient for light mode depth */}
          <div className="absolute inset-0 dark:hidden opacity-40 bg-radial-[circle_at_50%_30%] from-[#4349cd]/5 via-transparent to-transparent" />
          {/* left-side fade — makes text pop on desktop */}
          <div className="absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-page/50 dark:from-page/65 to-transparent hidden md:block" />
        </div>

        {/* ── Layer 4: ambient glow blob (follows shield) — light/dark aware ── */}
        <motion.div
          className="absolute top-1/2 z-[4] pointer-events-none transform-gpu"
          style={{ x: shieldX, y: shieldY, translateY: "-50%" }}
        >
          <div className="-translate-x-1/2 w-[460px] h-[460px] md:w-[720px] md:h-[720px] rounded-full dark:bg-[#545BFF]/16 bg-[#545BFF]/12 blur-[100px]" />
        </motion.div>

        {/* ── Layer 5: scan pulse rings — visible on mobile too, follows shield ── */}
        <motion.div
          className="absolute top-1/2 left-1/2 z-[5] pointer-events-none transform-gpu"
          style={{ x: shieldX, y: shieldY, translateX: "-50%", translateY: "-50%", scale: shieldScale }}
        >
          <ScanRings />
        </motion.div>

        {/* ── Layer 6: THE 3-D SHIELD ── */}
        <motion.div
          className="absolute inset-0 z-[6] flex items-center justify-center pointer-events-none transform-gpu"
          style={{ x: shieldX, y: shieldY, scale: shieldScale }}
        >
          <div className="w-[48vw] h-[48vw] sm:w-[54vw] sm:h-[54vw] md:w-[52vw] md:h-[52vw] max-w-[700px] max-h-[700px]">
            <ShieldModel />
          </div>
        </motion.div>

        {/* ── Layer 6.5: dark mode mobile gradient only ── */}
        <div className="absolute inset-x-0 bottom-0 z-[7] pointer-events-none md:hidden hidden dark:block" style={{ height: "70%", background: "linear-gradient(to top, var(--c-page, #05060f) 0%, var(--c-page, #05060f) 20%, rgba(5, 6, 15, 0.92) 42%, rgba(5, 6, 15, 0.55) 70%, transparent 100%)" }} />
        {/* Light mode mobile gradient */}
        <div className="absolute inset-x-0 bottom-0 z-[7] pointer-events-none md:hidden dark:hidden" style={{ height: "70%", background: "linear-gradient(to top, rgba(248, 249, 252, 1) 0%, rgba(248, 249, 252, 0.98) 22%, rgba(248, 249, 252, 0.94) 45%, rgba(248, 249, 252, 0.65) 70%, transparent 100%)" }} />

        {/* ── Layer 8: mobile HUD status strip — follows shield as it moves upward ── */}
        <motion.div
          className="absolute inset-x-0 z-[9] flex items-center justify-center gap-3 pointer-events-none md:hidden"
          style={{ top: "47vh", opacity: heroOpacity }}
        >
          <div className="h-px w-16 bg-gradient-to-l from-[#545BFF]/50 to-transparent" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#07080f]/95 border border-[#545BFF]/35 dark:border-[#545BFF]/25 backdrop-blur-md shadow-sm dark:shadow-none">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="font-mono text-[8px] tracking-[0.2em] text-[#4349cd] dark:text-[#7c83ff] uppercase font-semibold">Threat Scanner</span>
            <span className="font-mono text-[8px] text-[#22c55e] dark:text-[#4ade80] font-bold">Active</span>
          </div>
          <div className="h-px w-16 bg-gradient-to-r from-[#545BFF]/50 to-transparent" />
        </motion.div>

        {/* ──────────────────────────────────────────────────
            Layer 7: HERO CONTENT — fades out as we scroll
            Mobile: flex-col bottom-aligned with content space
            Desktop: center-aligned with proper vertical spacing
            pointer-events-none on wrapper; buttons get pointer-events-auto
        ────────────────────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 z-[10] flex flex-col md:items-center pointer-events-none transform-gpu"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-16 flex flex-col justify-end md:justify-center h-full">
            <div className="max-w-[360px] sm:max-w-[420px] md:max-w-[520px] pb-11 sm:pb-12 md:pb-0">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/15 dark:border-[#545BFF]/20 border-[#545BFF]/35 border backdrop-blur-sm mb-2.5 sm:mb-3 md:mb-4 shadow-sm dark:shadow-none"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#545BFF]" />
                </span>
                <span className="text-[#545BFF] dark:text-[#a89de8] text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase">
                  AI-Powered Protection
                </span>
              </motion.div>

              {/* Headline — improved light mode contrast */}
              <motion.h1
                className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold dark:text-heading text-[#0a0d1a] leading-[1.1] mb-2 sm:mb-3 md:mb-4 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                  AI Shield
                </span>
                <br />
                Against{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b19eef] to-[#545BFF]">
                  Suspicious
                </span>
                <br />
                Websites
              </motion.h1>

              {/* Description + feature bullets */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mb-3.5 sm:mb-4 md:mb-7"
              >
                {/* Mobile-only compact stat chips */}
                <div className="flex items-center gap-2 sm:hidden mb-3.5">
                  {[
                    { val: "99.2%", label: "Accuracy" },
                    { val: "<0.5s", label: "Speed" },
                    { val: "50K+", label: "Blocked" },
                  ].map(({ val, label }) => (
                    <div
                      key={label}
                      className="flex-1 text-center py-2 px-1 rounded-xl border dark:border-[#545BFF]/25 border-[#545BFF]/35 dark:bg-[#545BFF]/7 bg-[#545BFF]/12 backdrop-blur-sm"
                    >
                      <div className="dark:text-[#7c83ff] text-[#4349cd] font-bold text-[13px] leading-none mb-[3px]">{val}</div>
                      <div className="dark:text-faded/55 text-faded/65 text-[9px] font-medium uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>

                <p className={`${poppins.className} hidden sm:block dark:text-copy/80 text-copy/85 text-sm md:text-base leading-relaxed max-w-sm md:max-w-md mb-2.5 sm:mb-3 md:mb-4 font-light`}>
                  Real-time phishing detection powered by machine learning.
                  Every link scanned. Every threat stopped.
                </p>
                <div className="hidden sm:flex flex-col gap-2">
                  {[
                    "Instant threat score on every URL you visit",
                    "Explainable AI, know exactly why a site is flagged",
                    "Lightweight extension, zero data stored",
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <div className="mt-[3px] flex-shrink-0 w-4 h-4 rounded-full dark:bg-[#545BFF]/15 bg-[#545BFF]/12 dark:border-[#545BFF]/30 border-[#545BFF]/40 border flex items-center justify-center">
                        <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden>
                          <path d="M1 3.5L3 5.5L7 1.5" stroke="#545BFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`${poppins.className} dark:text-copy/75 text-copy/80 text-[13px] sm:text-sm font-light leading-snug`}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1 md:pt-2"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Link
                  href="https://chromewebstore.google.com/detail/smartshield/fggfmmhccdeaahhoihgohdjikfobmeeg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto group relative px-5 sm:px-7 h-10 sm:h-11 w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF] text-white text-[13px] sm:text-sm font-semibold rounded-full shadow-[0_0_24px_rgba(84,91,255,0.42)] hover:shadow-[0_0_40px_rgba(84,91,255,0.65)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get the Extension
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </Link>
                <a
                  href="#scan"
                  className="pointer-events-auto group relative px-5 sm:px-7 h-10 sm:h-11 w-full sm:w-auto flex items-center justify-center dark:text-heading text-[#263a5e] text-[13px] sm:text-sm border dark:border-divider/40 border-[#545BFF]/50 dark:hover:border-[#545BFF]/70 hover:border-[#545BFF]/80 dark:hover:bg-[#545BFF]/8 hover:bg-[#545BFF]/12 rounded-full font-semibold backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Scan a Website
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ──────────────────────────────────────────────────
            Layer 8: STATS CONTENT — fades in on scroll
            Desktop only: right half, vertically centered
            Mobile: completely hidden (focus on hero content)
        ────────────────────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 z-[10] flex flex-col justify-start pt-[46vh] md:pt-0 md:justify-center pointer-events-none transform-gpu hidden md:flex"
          style={{ opacity: statsOpacity, y: statsY }}
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 pb-0 md:pb-0">
            <div className="md:ml-auto md:max-w-[46%]">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm mb-3 md:mb-5 shadow-sm dark:shadow-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
                <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
                  Built to Protect
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-heading mb-2 md:mb-3 tracking-tight leading-[1.12]">
                Protection that{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                  never sleeps
                </span>
              </h2>

              <p className={`${poppins.className} text-copy/65 text-[13px] leading-relaxed mb-3 sm:hidden font-light`}>
                Millisecond threat detection powered by AI, always on, zero data stored.
              </p>

              <p className={`${poppins.className} hidden sm:block text-copy/80 text-[13px] md:text-base leading-relaxed mb-4 md:mb-6 font-light max-w-[320px] sm:max-w-sm md:max-w-none`}>
                SmartShield analyzes URLs, domain age, SSL certificates, and
                page content in milliseconds, giving you instant threat
                assessments with clear, human-readable explanations.
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 mb-4 md:mb-0">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 14, scale: 0.93 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, scale: 1.03 }}
                    className="group relative overflow-hidden px-2.5 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4 rounded-xl md:rounded-2xl cursor-default
                      dark:bg-[#0d0e1a]/60 bg-white/85 backdrop-blur-md
                      border border-[#545BFF]/20
                      shadow-[0_1px_10px_rgba(84,91,255,0.08),0_2px_6px_rgba(0,0,0,0.05)] dark:shadow-none
                      transition-[border-color,box-shadow] duration-300
                      hover:border-[#545BFF]/55
                      hover:shadow-[0_8px_32px_rgba(84,91,255,0.22),0_0_0_1px_rgba(84,91,255,0.18)]"
                  >
                    {/* Hover glow wash */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#545BFF]/0 to-[#b19eef]/0 group-hover:from-[#545BFF]/8 group-hover:to-[#b19eef]/5 transition-all duration-300 pointer-events-none rounded-xl md:rounded-2xl" />
                    {/* Top shimmer line */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/0 group-hover:via-[#545BFF]/50 to-transparent transition-all duration-300 pointer-events-none" />
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-[#545BFF] to-[#b19eef] opacity-60 group-hover:opacity-100 group-hover:shadow-[0_0_8px_rgba(84,91,255,0.7)] transition-all duration-300" />
                    <div className="relative text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-0.5 tracking-tight pl-1
                      text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]
                      group-hover:from-[#7c83ff] group-hover:to-[#c4b8f5] transition-all duration-300">
                      {stat.value}
                    </div>
                    <div className="relative text-faded text-[10px] sm:text-[11px] md:text-xs font-medium tracking-wide pl-1 group-hover:text-faded/80 transition-colors duration-300">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile scroll hint removed — prevented overlap with CTAs */}

        {/* ── Desktop scroll hint ── */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[11] hidden md:flex flex-col items-center gap-1.5 pointer-events-none"
          style={{ opacity: scrollHintOpacity }}
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-faded/50 text-[9px] tracking-[0.22em] uppercase">
              Scroll
            </span>
            <svg width="13" height="20" viewBox="0 0 13 20" fill="none" className="text-faded/40">
              <rect x="1" y="1" width="11" height="18" rx="5.5" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
            </svg>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}

