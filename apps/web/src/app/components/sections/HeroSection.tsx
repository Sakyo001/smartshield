"use client"

import Image from "next/image"
import Link from "next/link"
import Aurora from "../ui/Aurora"

export default function HeroSection() {

  return (
    <section className="relative w-screen h-screen bg-[#0a0a0f] overflow-hidden" suppressHydrationWarning>
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
        <div className="max-w-7xl mx-auto px-6 md:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                Your <span className="text-[#b19eef] drop-shadow-lg">AI Shield</span><br />
                Against <span className="text-[#b19eef] drop-shadow-lg">Suspicious</span><br />
                Websites
              </h1>
              <p className="text-gray-300 text-lg mb-10 leading-relaxed max-w-xl font-light">
                Our intelligent machine learning engine works around the clock to scan every link you visit, detecting suspicious behavior, fake pages, and phishing attempts before they can cause harm.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="bg-[#545BFF] text-white px-8 py-3.5 rounded-lg hover:bg-[#4349dd] transition-all duration-300 font-semibold shadow-xl shadow-[#545BFF]/40 hover:shadow-2xl hover:-translate-y-0.5 transform"
                >
                  Get the Extension
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-white border-2 border-gray-500 px-8 py-3.5 rounded-lg hover:border-white hover:bg-white/5 transition-all duration-300 font-semibold backdrop-blur-sm"
                >
                  Scan Website
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-b from-[#545BFF]/10 to-transparent rounded-3xl blur-2xl"></div>
              <Image
                src="/images/laptop.png"
                alt="SmartShield Protection"
                width={600}
                height={400}
                priority
                className="w-full h-auto relative z-10 drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}