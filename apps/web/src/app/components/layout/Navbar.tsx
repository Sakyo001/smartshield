"use client";

import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Aurora from "../ui/Aurora";

// Configure Poppins
const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ["home", "scan", "about", "faq"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= -100 && rect.top <= 300) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setActiveSection(targetId);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ease-in-out border-b ${
          isScrolled
            ? "bg-[#0a0a0f]/80 backdrop-blur-xl shadow-lg border-white/5 py-2"
            : "bg-transparent border-transparent py-4"
        }`}
      >
        <div
          className={`absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-500 ease-in-out ${
            isScrolled ? "opacity-100" : "opacity-0"
          }`}
        >
          <Aurora
            colorStops={["#545BFF", "#b19eef", "#545BFF"]}
            amplitude={0.8}
            blend={0.5}
          />
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between relative z-10">
          {/* --- Logo Section --- */}
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
              <Image
                src="/images/light-logo.png"
                alt="SmartShield Logo"
                fill
                className="object-contain drop-shadow-md"
                priority
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="font-nico text-white text-xl md:text-2xl tracking-wide transition-colors duration-300 font-bold leading-none">
                SmartShield
              </span>
              {/* UPDATED: Removed 'uppercase' class */}
              <span className="font-medium text-[#5667FF] tracking-wide text-[10px] md:text-xs mt-1 transition-colors duration-300">
                AI-Powered Phishing Detector
              </span>
            </div>
          </Link>

          {/* --- Desktop Navigation --- */}
          <div
            className={`hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 ${poppins.className}`}
          >
            {["Home", "Scan", "About", "FAQ"].map((item) => {
              const href = `#${item.toLowerCase()}`;
              const isActive = activeSection === item.toLowerCase();

              return (
                <a
                  key={item}
                  href={href}
                  onClick={(e) => handleSmoothScroll(e, href)}
                  className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 group ${
                    isActive
                      ? "text-[#5667FF] bg-[#5667FF]/10 font-semibold"
                      : "text-gray-300 hover:text-[#5667FF]"
                  }`}
                >
                  {item}
                  {!isActive && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#5667FF] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  )}
                </a>
              );
            })}
          </div>

          {/* --- Right Actions --- */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className={`hidden md:flex px-8 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${poppins.className}
                bg-[#5667FF] text-white hover:bg-[#4349dd] 
                shadow-lg shadow-[#5667FF]/20 hover:shadow-[#5667FF]/40 hover:-translate-y-0.5 active:translate-y-0`}
            >
              Sign In
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 12h16M4 6h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu Overlay --- */}
      <div
        className={`fixed inset-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden flex flex-col items-center justify-center gap-8 ${
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {["Home", "Scan", "About", "FAQ"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            onClick={(e) => handleSmoothScroll(e, `#${item.toLowerCase()}`)}
            className="text-2xl font-bold text-white hover:text-[#5667FF] transition-colors"
          >
            {item}
          </a>
        ))}
        <Link
          href="/login"
          className="px-10 py-3.5 bg-[#5667FF] text-white text-lg font-medium rounded-full shadow-xl shadow-[#5667FF]/30 hover:bg-[#4a51e0] transition-transform active:scale-95"
        >
          Sign In
        </Link>
      </div>
    </>
  );
}
