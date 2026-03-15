"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@lib/theme-context";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          initial={{ opacity: 0, scale: 0.92, y: 20, x: "-50%" }}
          animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, scale: 0.92, y: 20, x: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          whileHover={{ y: -1, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="fixed left-1/2 bottom-4 sm:bottom-5 z-[90] h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center cursor-pointer overflow-visible"
          style={{
            background: isDark
              ? "linear-gradient(160deg, rgba(9,12,26,0.88) 0%, rgba(17,24,46,0.86) 100%)"
              : "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(244,248,255,0.94) 100%)",
            border: isDark
              ? "1px solid rgba(122,130,255,0.38)"
              : "1px solid rgba(84,91,255,0.28)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: isDark
              ? "0 10px 26px rgba(0,0,0,0.36), 0 0 18px rgba(98,110,255,0.24), inset 0 1px 0 rgba(255,255,255,0.12)"
              : "0 8px 20px rgba(24,32,64,0.14), 0 0 14px rgba(98,110,255,0.14), inset 0 1px 0 rgba(255,255,255,0.82)",
          }}
        >
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: isDark
                ? "radial-gradient(circle at 50% 15%, rgba(120,129,255,0.20), transparent 62%)"
                : "radial-gradient(circle at 50% 15%, rgba(120,129,255,0.14), transparent 62%)",
            }}
          />

          <span className="absolute inset-[1px] rounded-full pointer-events-none border border-white/10" />

          <span className="relative z-10 inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#545BFF]/12 border border-[#7f87ff]/25">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              width={14}
              height={14}
              aria-hidden
            >
              <polyline
                points="17 14 12 9 7 14"
                stroke="#a2a8ff"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide pointer-events-none"
                style={{
                  color: isDark ? "#d7dcff" : "#3b438f",
                  background: isDark ? "rgba(8,10,20,0.9)" : "rgba(255,255,255,0.94)",
                  border: isDark
                    ? "1px solid rgba(127,135,255,0.28)"
                    : "1px solid rgba(84,91,255,0.22)",
                  boxShadow: isDark
                    ? "0 6px 20px rgba(0,0,0,0.35)"
                    : "0 6px 16px rgba(42,54,102,0.14)",
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
