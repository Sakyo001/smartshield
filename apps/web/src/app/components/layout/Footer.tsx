"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "URL Scanner", href: "/#scan" },
        { label: "Browser Extension", href: "https://chromewebstore.google.com/detail/smartshield/fggfmmhccdeaahhoihgohdjikfobmeeg" },
        { label: "Features", href: "/about" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Team", href: "/team" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms of Service", href: "/terms-of-service" },
        { label: "Cookie Policy", href: "/cookie-policy" },
      ],
    },
  ];

  return (
    <footer className="relative bg-page/85 backdrop-blur-xl border-t border-[#545BFF]/15 shadow-[0_-1px_32px_rgba(84,91,255,0.08)] pt-16 pb-8 px-6 overflow-hidden">
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

      {/* HUD corner brackets — bottom-left & bottom-right */}
      <div className="pointer-events-none absolute bottom-0 left-0">
        <span className="block w-4 h-4 border-b-2 border-l-2 border-[#545BFF]/40 rounded-bl-sm" />
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0">
        <span className="block w-4 h-4 border-b-2 border-r-2 border-[#545BFF]/40 rounded-br-sm" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8 mb-16">
          
          {/* Brand Column (Spans 2 on large screens) */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
               {/* Dark mode logo (light-colored) */}
              <Image
                src="/images/light-logo.png"
                alt="SmartShield"
                width={36}
                height={36}
                className="object-contain hidden dark:block group-hover:drop-shadow-[0_0_8px_rgba(84,91,255,0.5)] transition-all"
              />
              {/* Light mode logo (dark-colored) */}
              <Image
                src="/images/dark-logo (1).png"
                alt="SmartShield"
                width={36}
                height={36}
                className="object-contain block dark:hidden group-hover:drop-shadow-[0_0_8px_rgba(84,91,255,0.5)] transition-all"
              />
              <span className="text-heading text-xl font-bold tracking-tight">SmartShield</span>
            </Link>
            
            <p className="text-faded text-sm leading-relaxed max-w-sm">
              An AI-powered phishing detection platform that analyzes URLs like a human analyst, providing detailed insights and real-time protection for everyone.
            </p>
            
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h4 className="font-semibold text-heading mb-4 sm:mb-6">{section.title}</h4>
              <ul className="space-y-3 sm:space-y-3.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href}
                      className="text-sm text-faded hover:text-[#545BFF] hover:translate-x-1 transition-all duration-200 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
        </div>

        {/* Bottom Bar: Divider + Copyright */}
        <div className="pt-8 border-t border-[#545BFF]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-faded/60">
          <p>© {new Date().getFullYear()} SmartShield. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
             {!isDashboardRoute && (
                <Link href="/" className="hover:text-heading transition-colors">Home</Link>
             )}
             <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#545BFF]/5 border border-[#545BFF]/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#545BFF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#545BFF]"></span>
                </span>
                <span className="font-medium text-[#545BFF]">System Operational</span>
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

