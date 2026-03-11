import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative bg-page/85 backdrop-blur-xl border-t border-[#545BFF]/15 shadow-[0_-1px_32px_rgba(84,91,255,0.08)] pt-10 pb-8 px-6 overflow-hidden">
      {/* Gradient glow line at top edge */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/55 to-transparent pointer-events-none" />

      {/* Subtle cyber dot grid — matches Navbar */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(84,91,255,0.09) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* HUD corner brackets — bottom-left & bottom-right, mirrors Navbar top brackets */}
      <div className="pointer-events-none absolute bottom-0 left-0">
        <span className="block w-4 h-4 border-b-2 border-l-2 border-[#545BFF]/40 rounded-bl-sm" />
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0">
        <span className="block w-4 h-4 border-b-2 border-r-2 border-[#545BFF]/40 rounded-br-sm" />
      </div>

      {/* Footer Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">

          {/* Left: Logo + tagline */}
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <div className="flex items-center gap-3">
              {/* Dark mode logo (light-colored) */}
              <Image
                src="/images/light-logo.png"
                alt="SmartShield"
                width={32}
                height={32}
                className="object-contain hidden dark:block"
              />
              {/* Light mode logo (dark-colored) */}
              <Image
                src="/images/dark-logo (1).png"
                alt="SmartShield"
                width={32}
                height={32}
                className="object-contain block dark:hidden"
              />
              <span className="text-heading text-lg font-semibold tracking-tight">
                SmartShield
              </span>
            </div>
          </div>

          {/* Center / Right: Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/"
              className="text-faded hover:text-[#545BFF] transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/#scan"
              className="text-faded hover:text-[#545BFF] transition-colors duration-200"
            >
              Scan
            </Link>
            <Link
              href="/#about"
              className="text-faded hover:text-[#545BFF] transition-colors duration-200"
            >
              About
            </Link>
            <Link
              href="/privacy-policy"
              className="text-faded hover:text-[#545BFF] transition-colors duration-200"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-3 pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-faded/60">
          <span>© {new Date().getFullYear()} SmartShield. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse inline-block" />
            Protection always on
          </span>
        </div>
      </div>
    </footer>
  );
}

