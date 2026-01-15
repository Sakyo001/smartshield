"use client";

import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Aurora from "../ui/Aurora";

const poppins = Poppins({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  display: "swap",
});

export default function HeroSection() {
  return (
    <section
      // CHANGED: w-screen -> w-full to prevent horizontal scrollbar
      className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden"
      suppressHydrationWarning
    >
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 20px rgba(84, 91, 255, 0.3));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 40px rgba(84, 91, 255, 0.6));
          }
        }
        .floating-image {
          animation: pulseGlow 5s ease-in-out infinite;
        }
      `}</style>
      {/* Aurora Background */}
      <div className="absolute inset-0 w-full h-full">
        <Aurora
          colorStops={["#545BFF", "#b19eef", "#545BFF"]}
          amplitude={1.5}
          blend={0.6}
        />
      </div>

      {/* Overlay for content */}
      <div className="absolute inset-0 bg-[#0a0a0f]/40"></div>

      <div className="h-full w-full flex items-center justify-center relative z-10">
        {/* CHANGED: Added mt-24 (96px) to push content down from the top */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 w-full mt-20">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
                Your{" "}
                <span className="text-[#b19eef] drop-shadow-lg">AI Shield</span>
                <br />
                Against{" "}
                <span className="text-[#b19eef] drop-shadow-lg">
                  Suspicious
                </span>
                <br />
                Websites
              </h1>

              {/* 3. Applied poppins.className here */}
              <p
                className={`${poppins.className} text-gray-300 text-lg mb-10 leading-relaxed max-w-xl font-light`}
              >
                Our intelligent machine learning engine works around the clock
                to scan every link you visit, detecting suspicious behavior,
                fake pages, and phishing attempts before they can cause harm.
              </p>

              <div className="flex items-center gap-4">
                {/* Button 1: Get the Extension */}
                <Link
                  href="/login"
                  style={{ width: "180px", height: "35px" }}
                  className="flex items-center justify-center bg-[#545BFF] hover:bg-[#4349dd] text-white rounded-full transition-all duration-300 font-semibold shadow-[0_0_15px_rgba(84,91,255,0.4)] hover:shadow-2xl hover:-translate-y-0.5 transform"
                >
                  Get the Extension
                </Link>

                {/* Button 2: Scan Website */}
                <Link
                  href="/dashboard"
                  style={{ width: "180px", height: "35px" }}
                  className="flex items-center justify-center text-white border border-gray-500 hover:border-white hover:bg-white/5 rounded-full transition-all duration-300 font-semibold backdrop-blur-sm"
                >
                  Scan Website
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-b from-[#545BFF]/10 to-transparent rounded-3xl blur-2xl"></div>
              <Image
                src="/images/LP Body Logo.png"
                alt="SmartShield Protection"
                width={500}
                height={300}
                priority
                className="w-full h-auto relative z-10 drop-shadow-2xl floating-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
