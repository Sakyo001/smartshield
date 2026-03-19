"use client";

import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@lib/theme-context";
import { createClient } from "@lib/supabase";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Scan", href: "/#scan" },
  { label: "About", href: "/#about" },
  { label: "FAQ", href: "/#faq" },
] as const;

const DASHBOARD_NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "About", href: "/dashboard/about" },
  { label: "FAQ", href: "/dashboard/faq" },
] as const;

// ─── Small icon components ────────────────────────────────────────────────────

function SunIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const currentNavLinks = isDashboardRoute ? DASHBOARD_NAV_LINKS : NAV_LINKS;

  useEffect(() => { setMounted(true); }, []);

  // Derive the effective theme only after mount; pre-mount defaults match server
  const effectiveTheme = mounted ? theme : "dark";

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setIsAuthenticated(Boolean(session));
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  useEffect(() => {
    const sections = ["home", "scan", "about", "faq"];
    const sectionEls = sections
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    let ticking = false;
    let rafId: number | null = null;

    const updateState = () => {
      setIsScrolled(window.scrollY > 20);
      for (const el of sectionEls) {
        const { top } = el.getBoundingClientRect();
        if (top >= -100 && top <= 300) {
          setActiveSection(el.id);
          break;
        }
      }
      ticking = false;
      rafId = null;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(updateState);
    };

    updateState();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateState);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateState);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    // Check if it's a hash link (starts with # or contains #)
    if (href.includes("#")) {
      e.preventDefault();
      setMobileOpen(false);
      
      // Parse the hash
      const hashOnly = href.split("#")[1];
      const el = document.getElementById(hashOnly);
      
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(hashOnly);
        window.dispatchEvent(
          new CustomEvent("smartshield:tabchange", { detail: { tab: hashOnly } })
        );
      }
      return;
    }

    // For regular page navigation
    setMobileOpen(false);
    // Let the link navigate naturally
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/login");
    router.refresh();
  };

  const handleGoToDashboard = () => {
    setMobileOpen(false);
    router.push("/dashboard");
  };

  return (
    <>
      {/* ── Main navbar bar ─────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "py-2 bg-page/85 backdrop-blur-xl border-b border-[#545BFF]/15 shadow-[0_1px_32px_rgba(84,91,255,0.08)]"
            : "py-4 bg-transparent border-b border-transparent"
        }`}
      >
        {/* Gradient glow line at bottom edge — visible on scroll */}
        <div
          className={`absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/55 to-transparent pointer-events-none transition-opacity duration-500 ${
            isScrolled ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Subtle cyber dot grid — techy feel when scrolled */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isScrolled ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage: "radial-gradient(circle, rgba(84,91,255,0.09) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* HUD corner brackets — top-left & top-right */}
        <div className={`pointer-events-none absolute top-0 left-0 transition-opacity duration-500 ${isScrolled ? "opacity-100" : "opacity-0"}`}>
          <span className="block w-4 h-4 border-t-2 border-l-2 border-[#545BFF]/40 rounded-tl-sm" />
        </div>
        <div className={`pointer-events-none absolute top-0 right-0 transition-opacity duration-500 ${isScrolled ? "opacity-100" : "opacity-0"}`}>
          <span className="block w-4 h-4 border-t-2 border-r-2 border-[#545BFF]/40 rounded-tr-sm" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between relative">

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {/* Image area — all hover FX scoped here */}
            <div
              className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0
                transition-all duration-500
                group-hover:scale-105
                group-hover:drop-shadow-[0_0_22px_rgba(84,91,255,0.65)]"
            >
              {/* Always-rotating dashed orbit ring — fades in on hover */}
              <motion.div
                className="absolute inset-[-7px] rounded-full border border-dashed
                  border-[#545BFF]/0 group-hover:border-[#545BFF]/40
                  transition-colors duration-300 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              />

              {/* Solid pulse ring — expands on hover */}
              <div className="absolute inset-[-2px] rounded-full border border-[#545BFF]/0
                group-hover:border-[#545BFF]/20 scale-95 group-hover:scale-110
                transition-all duration-500 pointer-events-none" />

              {/* HUD corner brackets — slide outward on hover */}
              <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:-translate-x-1 group-hover:-translate-y-1
                transition-all duration-300 pointer-events-none" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:translate-x-1 group-hover:-translate-y-1
                transition-all duration-300 pointer-events-none" />
              <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:-translate-x-1 group-hover:translate-y-1
                transition-all duration-300 pointer-events-none" />
              <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2
                border-[#545BFF]/0 group-hover:border-[#545BFF]/90
                group-hover:translate-x-1 group-hover:translate-y-1
                transition-all duration-300 pointer-events-none" />

              {/* Logo image */}
              <Image
                src={effectiveTheme === "dark" ? "/images/light-logo.png" : "/images/dark-logo (1).png"}
                alt="SmartShield Logo"
                fill
                sizes="64px"
                className="object-contain"
                priority
              />

              {/* Status dot — Protection Active */}
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span
                  className="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-400 border-[1.5px] border-page"
                  style={{ boxShadow: "0 0 6px rgba(52,211,153,0.9)" }}
                />
              </span>
            </div>

            {/* Text block — subtle rightward nudge on hover */}
            <div className="flex flex-col justify-center transition-transform duration-300 group-hover:translate-x-0.5">
              <span className="text-heading text-lg sm:text-xl md:text-2xl tracking-wide font-bold leading-none">
                SmartShield
              </span>
              <span className={`${poppins.className} font-medium text-[#545BFF] dark:text-[#a89de8] tracking-wide text-[9px] sm:text-[10px] md:text-xs mt-0.5 transition-colors duration-300 group-hover:text-[#6B73FF] dark:group-hover:text-[#b19eef]`}>
                AI-Powered Phishing Detector
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links — centered ──────────────────────────────── */}
          <div className={`hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 ${poppins.className}`}>
            {currentNavLinks.map(({ label, href }) => {
              let isActive = false;
              if (isDashboardRoute) {
                isActive = pathname === href || pathname?.startsWith(href);
              } else {
                // Check if current page matches the href
                const isCurrentPath = pathname === href || (href === "/" && pathname === "/");
                const hashPart = href.split("#")[1];
                isActive = isCurrentPath || activeSection === hashPart;
              }
              return (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => handleSmoothScroll(e, href)}
                  className={`relative px-4 py-2 text-sm rounded-lg transition-all duration-300 font-medium ${
                    isActive
                      ? "text-[#545BFF] dark:text-[#a89de8]"
                      : "text-faded hover:text-heading"
                  }`}
                >
                  {/* Background pill on active */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-bg-pill"
                      className="absolute inset-0 rounded-lg bg-[#545BFF]/12 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="w-1.5 h-1.5 rounded-full bg-[#545BFF]"
                        style={{ boxShadow: "0 0 6px rgba(84,91,255,0.8)" }}
                      />
                    )}
                  </span>
                </a>
              );
            })}
          </div>

          {/* ── Right actions ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Theme toggle — futuristic pill (desktop) */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${effectiveTheme === "dark" ? "light" : "dark"} mode`}
              className="relative hidden md:flex items-center w-[82px] h-10 rounded-full overflow-hidden
                dark:bg-[#0a0d1f]/80 bg-white/85
                border border-[#545BFF]/25 hover:border-[#545BFF]/55
                backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]
                transition-all duration-300 hover:shadow-[0_0_24px_rgba(84,91,255,0.28)]"
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#545BFF]/12 via-transparent to-[#b19eef]/16" />
              <span className="pointer-events-none absolute inset-[3px] rounded-full border border-white/35 dark:border-[#a4acff]/12" />

              {/* Sun — left slot */}
              <span
                className={`relative z-10 flex-1 flex justify-center transition-colors duration-300 ${
                  effectiveTheme === "light" ? "text-[#f59e0b]" : "text-faded/45"
                }`}
              >
                <SunIcon size={14} />
              </span>

              {/* Moon — right slot */}
              <span
                className={`relative z-10 flex-1 flex justify-center transition-colors duration-300 ${
                  effectiveTheme === "dark" ? "text-[#b19eef]" : "text-faded/45"
                }`}
              >
                <MoonIcon size={14} />
              </span>

              {/* Sliding core knob */}
              <motion.span
                className="absolute top-[4px] h-[30px] w-[30px] rounded-full bg-gradient-to-br from-[#545BFF] to-[#8B5CF6] flex items-center justify-center text-white"
                style={{ boxShadow: "0 0 16px rgba(84,91,255,0.62), 0 0 6px rgba(139,92,246,0.35)" }}
                animate={{ x: effectiveTheme === "light" ? 5 : 47 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
              >
                {effectiveTheme === "light" ? <SunIcon size={13} /> : <MoonIcon size={13} />}
              </motion.span>
            </button>

            {/* CTA button — desktop */}
            {isAuthenticated ? (
              isDashboardRoute ? (
              <button
                type="button"
                onClick={handleLogout}
                className={`group relative hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full overflow-hidden
                  bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF]
                  text-white
                  shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_36px_rgba(84,91,255,0.62)]
                  hover:-translate-y-0.5 transition-all duration-300 ${poppins.className}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Logout
                  <ArrowIcon />
                </span>
                {/* Shimmer sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </button>
              ) : (
              <button
                type="button"
                onClick={handleGoToDashboard}
                className={`group relative hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full overflow-hidden
                  bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF]
                  text-white
                  shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_36px_rgba(84,91,255,0.62)]
                  hover:-translate-y-0.5 transition-all duration-300 ${poppins.className}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Dashboard
                  <ArrowIcon />
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </button>
              )
            ) : (
              <a
                href="/login"
                className={`group relative hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full overflow-hidden
                  bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF]
                  text-white
                  shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_36px_rgba(84,91,255,0.62)]
                  hover:-translate-y-0.5 transition-all duration-300 ${poppins.className}`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Sign Up
                  <ArrowIcon />
                </span>
                {/* Shimmer sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </a>
            )}

            {/* Theme toggle — futuristic icon button (mobile) */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden
                dark:bg-[#0a0d1f]/70 bg-white/80
                border border-[#545BFF]/25 hover:border-[#545BFF]/55
                transition-all duration-300 hover:shadow-[0_0_16px_rgba(84,91,255,0.32)]"
            >
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#545BFF]/14 to-[#b19eef]/14" />
              <span className="pointer-events-none absolute inset-[2px] rounded-[10px] border border-white/35 dark:border-[#a4acff]/12" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={effectiveTheme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                  className={`relative z-10 ${effectiveTheme === "dark" ? "text-[#b19eef]" : "text-[#545BFF]"}`}
                >
                  {effectiveTheme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Hamburger — mobile, animated icon swap */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-heading hover:bg-[#545BFF]/10 rounded-lg transition-colors overflow-hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.svg
                  key={mobileOpen ? "close" : "open"}
                  initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  {mobileOpen
                    ? <path d="M18 6L6 18M6 6l12 12" />
                    : <path d="M4 12h16M4 6h16M4 18h16" />
                  }
                </motion.svg>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-in drawer ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="mob-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 md:hidden flex flex-col
                dark:bg-[#0a0b14]/97 bg-white/97 backdrop-blur-2xl
                border-l border-[#545BFF]/20"
            >
              {/* HUD corner accents */}
              <span className="pointer-events-none absolute top-2 left-2 block w-3.5 h-3.5 border-t-2 border-l-2 border-[#545BFF]/45 rounded-tl-sm" />
              <span className="pointer-events-none absolute bottom-2 right-2 block w-3.5 h-3.5 border-b-2 border-r-2 border-[#545BFF]/45 rounded-br-sm" />

              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#545BFF]/12">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" style={{ boxShadow: "0 0 6px rgba(84,91,255,0.9)" }} />
                  <span className={`${poppins.className} text-heading font-semibold text-sm tracking-wide`}>
                    Navigation
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-faded hover:text-heading hover:bg-[#545BFF]/10 transition-colors"
                  aria-label="Close menu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col gap-1 px-3 py-5 flex-1">
                {currentNavLinks.map(({ label, href }, i) => {
                  let isActive = false;
                  if (isDashboardRoute) {
                    isActive = pathname === href || pathname?.startsWith(href);
                  } else {
                    const isCurrentPath = pathname === href || (href === "/" && pathname === "/");
                    const hashPart = href.split("#")[1];
                    isActive = isCurrentPath || activeSection === hashPart;
                  }
                  return (
                    <motion.a
                      key={label}
                      href={href}
                      onClick={(e) => handleSmoothScroll(e, href)}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.055 + 0.08, type: "spring", stiffness: 280, damping: 28 }}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all duration-200 ${poppins.className}
                        ${isActive
                          ? "text-[#545BFF] dark:text-[#a89de8] bg-[#545BFF]/10 font-semibold"
                          : "text-copy font-medium hover:text-[#545BFF] hover:bg-[#545BFF]/6"
                        }`}
                    >
                      {/* Left bar accent — active only */}
                      <span
                        className={`shrink-0 w-0.5 h-4 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-[#545BFF] shadow-[0_0_8px_rgba(84,91,255,0.8)]"
                            : "bg-transparent"
                        }`}
                      />
                      <span>{label}</span>
                      {isActive && (
                        <motion.span
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-[#545BFF]"
                          layoutId="mobile-nav-active"
                          style={{ boxShadow: "0 0 6px rgba(84,91,255,0.8)" }}
                        />
                      )}
                    </motion.a>
                  );
                })}
              </nav>

              {/* Drawer footer — CTA */}
              <div className="px-5 py-5 border-t border-[#545BFF]/12 space-y-2.5">
                {isAuthenticated ? (
                  isDashboardRoute ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`group relative flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold overflow-hidden
                      bg-gradient-to-r from-[#545BFF] to-[#6B73FF] text-white
                      shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_34px_rgba(84,91,255,0.58)]
                      hover:-translate-y-0.5 transition-all duration-300 ${poppins.className}`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Logout
                      <ArrowIcon />
                    </span>
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  </button>
                  ) : (
                  <button
                    type="button"
                    onClick={handleGoToDashboard}
                    className={`group relative flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold overflow-hidden
                      bg-gradient-to-r from-[#545BFF] to-[#6B73FF] text-white
                      shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_34px_rgba(84,91,255,0.58)]
                      hover:-translate-y-0.5 transition-all duration-300 ${poppins.className}`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Dashboard
                      <ArrowIcon />
                    </span>
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  </button>
                  )
                ) : (
                  <a
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold overflow-hidden
                      bg-gradient-to-r from-[#545BFF] to-[#6B73FF] text-white
                      shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_34px_rgba(84,91,255,0.58)]
                      hover:-translate-y-0.5 transition-all duration-300 ${poppins.className}`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Sign Up
                      <ArrowIcon />
                    </span>
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                  </a>
                )}

                {/* Version tag */}
                <p className={`${poppins.className} text-center text-[10px] text-faded/60 tracking-widest uppercase`}>
                  SmartShield — AI Security
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}