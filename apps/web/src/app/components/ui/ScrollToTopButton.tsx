"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { useTheme } from "@lib/theme-context";

/** Tiny HUD L-bracket corners — mirrors the hero HudCorners aesthetic */
function HudBrackets() {
  const c = "absolute w-[10px] h-[10px] border-[#545BFF]/70";
  return (
    <>
      <span className={`${c} top-[5px] left-[5px] border-t border-l`} />
      <span className={`${c} top-[5px] right-[5px] border-t border-r`} />
      <span className={`${c} bottom-[5px] left-[5px] border-b border-l`} />
      <span className={`${c} bottom-[5px] right-[5px] border-b border-r`} />
    </>
  );
}

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const arrowControls = useAnimationControls();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Idle bounce — stops while hovered so hover scale isn't fighting it
  useEffect(() => {
    if (visible && !hovered) {
      arrowControls.start({
        y: [0, -5, 0],
        transition: { repeat: Infinity, duration: 1.9, ease: "easeInOut" },
      });
    } else {
      arrowControls.stop();
      arrowControls.set({ y: 0 });
    }
  }, [visible, hovered, arrowControls]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          onClick={scrollToTop}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          aria-label="Scroll to top"
          initial={{ opacity: 0, scale: 0.4, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.4, y: 32 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.86 }}
          /* rounded-xl matches the stat-card shape */
          className="fixed bottom-7 right-7 z-[100] w-[52px] h-[52px] rounded-xl flex items-center justify-center cursor-pointer overflow-visible"
          style={{
            background: isDark
              ? "linear-gradient(145deg, rgba(13,14,26,0.94) 0%, rgba(22,20,48,0.90) 100%)"
              : "linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(232,236,242,0.92) 100%)",
            border: isDark
              ? "1px solid rgba(84,91,255,0.60)"
              : "1px solid rgba(84,91,255,0.45)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow: isDark
              ? "0 0 0 1px rgba(84,91,255,0.15), 0 0 28px rgba(84,91,255,0.50), 0 0 70px rgba(84,91,255,0.18), 0 10px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.09)"
              : "0 0 0 1px rgba(84,91,255,0.12), 0 0 22px rgba(84,91,255,0.30), 0 4px 20px rgba(84,91,255,0.12), 0 8px 30px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.80)",
          }}
        >
          {/* ── Pulse ring 1 — synced with hero scan rings ── */}
          <motion.span
            className="absolute rounded-xl pointer-events-none"
            style={{ inset: -7, border: "1px solid rgba(84,91,255,0.55)" }}
            animate={{ opacity: [0.75, 0, 0.75], scale: [1, 1.22, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          />

          {/* ── Pulse ring 2 — offset phase, purple tint ── */}
          <motion.span
            className="absolute rounded-xl pointer-events-none"
            style={{ inset: -4, border: "1px solid rgba(177,158,239,0.38)" }}
            animate={{ opacity: [0, 0.65, 0], scale: [1.06, 1.24, 1.06] }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: "easeInOut",
              delay: 0.9,
            }}
          />

          {/* ── HUD corner brackets ── */}
          <HudBrackets />

          {/* ── Hover inner glow ── */}
          <motion.span
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.22 }}
            style={{
              background:
                "radial-gradient(circle at 50% 65%, rgba(84,91,255,0.32) 0%, transparent 68%)",
            }}
          />

          {/* ── Gradient top-edge shimmer line ── */}
          <span
            className="absolute top-0 left-3 right-3 h-px rounded-full pointer-events-none"
            style={{
              background: isDark
                ? "linear-gradient(90deg, transparent, rgba(177,158,239,0.55), transparent)"
                : "linear-gradient(90deg, transparent, rgba(84,91,255,0.40), transparent)",
            }}
          />

          {/* ── Arrow (double chevron — matches hero's double-line details) ── */}
          <motion.div animate={arrowControls} className="relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              width={22}
              height={22}
              aria-hidden
            >
              <defs>
                <linearGradient id="sctt-arrow" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#b19eef" />
                  <stop offset="100%" stopColor="#6B73FF" />
                </linearGradient>
              </defs>
              {/* Primary chevron */}
              <polyline
                points="17 14 12 9 7 14"
                stroke="url(#sctt-arrow)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Echo chevron — faded, gives depth */}
              <polyline
                points="17 18.5 12 13.5 7 18.5"
                stroke="url(#sctt-arrow)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
              />
            </svg>
          </motion.div>

          {/* ── "Back to top" tooltip — slides out to the left on hover ── */}
          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, x: 8, scale: 0.88 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.88 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute right-[calc(100%+10px)] whitespace-nowrap text-[10px] font-bold tracking-[0.14em] uppercase pointer-events-none px-3 py-1.5 rounded-lg"
                style={{
                  color: isDark ? "#b19eef" : "#545BFF",
                  background: isDark ? "rgba(13,14,26,0.92)" : "rgba(255,255,255,0.92)",
                  border: isDark
                    ? "1px solid rgba(84,91,255,0.38)"
                    : "1px solid rgba(84,91,255,0.30)",
                  backdropFilter: "blur(12px)",
                  boxShadow: isDark
                    ? "0 0 14px rgba(84,91,255,0.25)"
                    : "0 0 14px rgba(84,91,255,0.15), 0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                Back to top
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
