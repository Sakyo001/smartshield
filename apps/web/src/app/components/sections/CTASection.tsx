"use client";

import { motion, useInView } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import DotGridCanvas from "../ui/DotGridCanvas";

/* â”€â”€ Pulsing scan rings â”€â”€ */
function ScanRings() {
  const rings = [
    { size: 240, delay: 0 },
    { size: 370, delay: 1.4 },
    { size: 510, delay: 2.8 },
    { size: 660, delay: 0.7 },
  ];
  return (
    <>
      <div
        className="absolute rounded-full border border-[#545BFF]/28"
        style={{ width: 175, height: 175, top: -87, left: -87 }}
      />
      {rings.map(({ size, delay }, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-[#545BFF]/14"
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

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });
  const shieldInView = useInView(shieldRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 bg-page overflow-hidden"
    >
      {/* â”€â”€ Dot-grid canvas â”€â”€ */}
      <div className="absolute inset-0 z-[1]">
        <DotGridCanvas maxNodes={22} />
      </div>

      {/* â”€â”€ Gradient vignette overlays â”€â”€ */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-page/50 via-transparent to-page/50" />
        <div className="absolute inset-0 dark:hidden opacity-25 bg-[radial-gradient(circle_at_50%_60%,rgba(67,73,205,0.09),transparent_65%)]" />
      </div>

      {/* â”€â”€ Ambient glows â”€â”€ */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-[650px] h-[650px] rounded-full dark:bg-[#545BFF]/11 bg-[#545BFF]/8 blur-[145px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-1/4 left-[15%] z-[2] w-[260px] h-[260px] rounded-full dark:bg-[#b19eef]/6 bg-[#b19eef]/4 blur-[95px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute bottom-1/4 right-[15%] z-[2] w-[220px] h-[220px] rounded-full dark:bg-[#545BFF]/7 bg-[#545BFF]/5 blur-[85px] pointer-events-none"
      />

      {/* â”€â”€ Section accent lines â”€â”€ */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/40 to-transparent z-[3]" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/30 to-transparent z-[3]" />

      {/* â”€â”€ Content â”€â”€ */}
      <div className="relative z-[10] max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
            dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border
            backdrop-blur-sm shadow-sm dark:shadow-none mb-4 sm:mb-5"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#545BFF]" />
          </span>
          <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
            Start Browsing Safely
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-heading tracking-tight leading-[1.08] mb-4 sm:mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Browse{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
            Safe.
          </span>
          <br />
          Stay{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b19eef] to-[#545BFF]">
            Smart.
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          className="text-copy/68 dark:text-copy/62 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-7 sm:mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          Install SmartShield and let AI protect you against phishing, malware,
          and suspicious websites in real time, every scan under 200ms.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.33 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 sm:mb-16 md:mb-20"
        >
          <Link
            href="https://chromewebstore.google.com/detail/smartshield/fggfmmhccdeaahhoihgohdjikfobmeeg"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full sm:w-auto px-7 sm:px-9 h-11 sm:h-12 flex items-center justify-center
              bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF]
              text-white text-sm sm:text-base font-semibold rounded-full
              shadow-[0_0_28px_rgba(84,91,255,0.45)] hover:shadow-[0_0_50px_rgba(84,91,255,0.72)]
              hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get the Extension
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:translate-x-0.5 transition-transform duration-200"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </Link>
          <a
            href="#scan"
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 h-11 sm:h-12
              dark:text-heading text-[#263a5e] text-sm font-semibold
              border dark:border-divider/40 border-[#545BFF]/40
              dark:hover:border-[#545BFF]/70 hover:border-[#545BFF]/80
              dark:hover:bg-[#545BFF]/8 hover:bg-[#545BFF]/10
              rounded-full backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            Scan a Website
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-0.5 transition-transform duration-200"
              aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>

        {/* â”€â”€ Shield area â”€â”€ */}
        <div
          ref={shieldRef}
          className="relative inline-flex items-center justify-center"
        >
          {/* Bloom glow */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full dark:bg-[#545BFF]/22 bg-[#545BFF]/13 blur-[105px] pointer-events-none"
          />

          {/* Scan rings */}
          <div className="absolute top-1/2 left-1/2 z-[5] pointer-events-none">
            <ScanRings />
          </div>

          {/* HUD corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#545BFF]/45 pointer-events-none z-[10]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#545BFF]/45 pointer-events-none z-[10]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#545BFF]/45 pointer-events-none z-[10]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#545BFF]/45 pointer-events-none z-[10]" />

          {/* HUD status strip */}
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-[8] flex items-center gap-2.5 pointer-events-none whitespace-nowrap">
            <div className="h-px w-10 sm:w-14 bg-gradient-to-l from-[#545BFF]/50 to-transparent" />
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-white/90 dark:bg-[#07080f]/95 border border-[#545BFF]/28 dark:border-[#545BFF]/18
              backdrop-blur-md shadow-sm dark:shadow-none"
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.18em] text-[#4349cd] dark:text-[#7c83ff] uppercase font-semibold">
                Shield Active
              </span>
              <span className="hidden sm:inline font-mono text-[8px] text-[#22c55e] dark:text-[#4ade80] font-bold ml-0.5">
                Scanning
              </span>
            </div>
            <div className="h-px w-10 sm:w-14 bg-gradient-to-r from-[#545BFF]/50 to-transparent" />
          </div>

          {/*  Floating stat badges sm+ only  */}

          {/* Top-left: 600K+ URLs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={
              shieldInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
            }
            transition={{ duration: 0.65, delay: 1.2 }}
            className="hidden sm:flex flex-col absolute top-[13%] sm:-left-[72px] md:-left-24 lg:-left-28 z-[9]
              min-w-[88px] px-3 sm:px-3.5 py-2.5 rounded-xl
              dark:bg-[#0d0e1a]/88 bg-white/96 backdrop-blur-md
              border border-[#545BFF]/20
              shadow-[0_2px_18px_rgba(84,91,255,0.13),0_0_0_1px_rgba(84,91,255,0.05)] dark:shadow-none"
          >
            <div className="font-mono text-[#545BFF] dark:text-[#7c83ff] font-bold text-[15px] leading-none mb-0.5">
              600K+
            </div>
            <div className="text-faded text-[8px] font-medium tracking-[0.1em] uppercase">
              URLs Analyzed
            </div>
          </motion.div>

          {/* Top-right: 96.9% Detection Rate */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={
              shieldInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
            }
            transition={{ duration: 0.65, delay: 1.4 }}
            className="hidden sm:flex flex-col absolute top-[13%] sm:-right-[72px] md:-right-24 lg:-right-28 z-[9]
              min-w-[94px] px-3 sm:px-3.5 py-2.5 rounded-xl
              dark:bg-[#0d0e1a]/88 bg-white/96 backdrop-blur-md
              border border-[#545BFF]/20
              shadow-[0_2px_18px_rgba(84,91,255,0.13),0_0_0_1px_rgba(84,91,255,0.05)] dark:shadow-none"
          >
            <div className="font-mono text-[#545BFF] dark:text-[#7c83ff] font-bold text-[15px] leading-none mb-0.5">
              96.9%
            </div>
            <div className="text-faded text-[8px] font-medium tracking-[0.1em] uppercase mb-1.5">
              Detection Rate
            </div>
            {/* Mini progress bar */}
            <div className="w-full h-[2px] rounded-full bg-[#545BFF]/12 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#545BFF] to-[#b19eef] rounded-full"
                initial={{ width: "0%" }}
                animate={shieldInView ? { width: "96.9%" } : { width: "0%" }}
                transition={{ duration: 1.4, delay: 1.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Bottom-left: <10s Scan Speed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={
              shieldInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
            }
            transition={{ duration: 0.65, delay: 1.6 }}
            className="hidden sm:flex flex-col absolute bottom-[13%] sm:-left-[72px] md:-left-24 lg:-left-28 z-[9]
              min-w-[88px] px-3 sm:px-3.5 py-2.5 rounded-xl
              dark:bg-[#0d0e1a]/88 bg-white/96 backdrop-blur-md
              border border-[#545BFF]/20
              shadow-[0_2px_18px_rgba(84,91,255,0.13),0_0_0_1px_rgba(84,91,255,0.05)] dark:shadow-none"
          >
            <div className="font-mono text-[#545BFF] dark:text-[#7c83ff] font-bold text-[15px] leading-none mb-0.5">
              &lt;200ms
            </div>
            <div className="text-faded text-[8px] font-medium tracking-[0.1em] uppercase">
              Scan Speed
            </div>
          </motion.div>

          {/* Bottom-right: 3 AI Models */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={
              shieldInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
            }
            transition={{ duration: 0.65, delay: 1.8 }}
            className="hidden sm:flex flex-col absolute bottom-[13%] sm:-right-[72px] md:-right-24 lg:-right-28 z-[9]
              min-w-[88px] px-3 sm:px-3.5 py-2.5 rounded-xl
              dark:bg-[#0d0e1a]/88 bg-white/96 backdrop-blur-md
              border border-[#545BFF]/20
              shadow-[0_2px_18px_rgba(84,91,255,0.13),0_0_0_1px_rgba(84,91,255,0.05)] dark:shadow-none"
          >
            <div className="font-mono text-[#545BFF] dark:text-[#7c83ff] font-bold text-[15px] leading-none mb-1">
              3 AI
            </div>
            <div className="text-faded text-[8px] font-medium tracking-[0.1em] uppercase mb-1.5">
              ML Models
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#545BFF]"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    delay: i * 0.45,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Shield image â€” slow zoom-in entry + continuous gentle float */}
          <motion.div
            initial={{ opacity: 0, scale: 0.65 }}
            animate={
              shieldInView
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.65 }
            }
            transition={{ duration: 2.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={shieldInView ? { y: [0, -11, 0] } : {}}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.6,
              }}
              className="relative z-[6] cursor-pointer
                drop-shadow-[0_0_55px_rgba(84,91,255,0.50)]
                hover:drop-shadow-[0_0_95px_rgba(84,91,255,0.82)]
                hover:-translate-y-3 hover:scale-[1.04]
                transition-[transform,filter] duration-500"
            >
              <Image
                src="/images/3D Logo.png"
                alt="SmartShield Protection"
                width={500}
                height={500}
                style={{ width: "auto", height: "auto" }}
                className="max-w-[230px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[460px]"
                priority
              />
            </motion.div>
          </motion.div>
        </div>

        {/* â”€â”€ Mobile stats 2Ã—2 grid â€” xs only â”€â”€ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={shieldInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.55, delay: 0.7 }}
          className="sm:hidden mt-7 grid grid-cols-2 gap-2.5 max-w-[280px] mx-auto"
        >
          {[
            { value: "600K+", label: "URLs Analyzed" },
            { value: "96.9%", label: "Detection Rate" },
            { value: "<10s", label: "Scan Speed" },
            { value: "3 AI", label: "ML Models" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center py-3 px-2 rounded-xl
                dark:bg-[#0d0e1a]/70 bg-white/88 backdrop-blur-md
                border border-[#545BFF]/18
                shadow-[0_1px_10px_rgba(84,91,255,0.07)] dark:shadow-none"
            >
              <div className="font-mono text-[#545BFF] dark:text-[#7c83ff] font-bold text-[17px] leading-none mb-0.5">
                {value}
              </div>
              <div className="text-faded text-[8px] font-medium tracking-[0.1em] uppercase">
                {label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trust line */}
        <motion.p
          className="mt-8 sm:mt-10 text-faded/50 text-[11px] sm:text-xs tracking-wide"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Free forever · No account required · Zero data stored
        </motion.p>
      </div>
    </section>
  );
}
