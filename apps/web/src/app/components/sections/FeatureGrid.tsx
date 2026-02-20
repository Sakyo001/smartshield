"use client";

import Image from "next/image";

interface Feature {
  number: number;
  color: string;
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="group relative bg-white rounded-3xl border border-gray-100 hover:border-[#6B73FF]/30 transition-all duration-500 hover:shadow-2xl hover:shadow-[#6B73FF]/10 overflow-hidden min-h-80 flex-shrink-0 w-full sm:w-[440px]">
      {/* Hover Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`}
      ></div>

      <div className="relative z-10 p-10 flex flex-col h-full">
        {/* Number Indicator */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#6B73FF] to-[#8a9dff] flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#6B73FF]/50 transition-all duration-300">
          <span className="text-xs font-bold text-white">{feature.number}</span>
        </div>

        {/* Icon Container */}
        <div className="mb-8 relative w-16 h-16">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 rounded-2xl blur-lg group-hover:opacity-30 transition-opacity duration-500`}
          ></div>
          <div className="relative w-full h-full bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
            <Image
              src={feature.icon}
              alt={feature.title}
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#6B73FF] transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-gray-500 text-base leading-relaxed group-hover:text-gray-600 transition-colors duration-300">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export default function FeatureGrid() {
  const features = [
    {
      number: 1,
      color: "from-indigo-500 to-blue-500",
      icon: "/images/Artificial Intelligence.png",
      title: "AI Threat Detection",
      description:
        "Advanced machine learning algorithms that proactively identify and neutralize emerging threats before they can execute.",
    },
    {
      number: 2,
      color: "from-emerald-400 to-green-500",
      icon: "/images/Geography.png",
      title: "Real-Time Defense",
      description:
        "Continuous 24/7 monitoring ensures your digital environment is protected against attacks as they happen, globally.",
    },
    {
      number: 3,
      color: "from-orange-400 to-amber-500",
      icon: "/images/Layers.png",
      title: "Multi-Layer Security",
      description:
        "A robust defense-in-depth strategy combining network, application, and endpoint security layers for maximum coverage.",
    },
    {
      number: 4,
      color: "from-purple-500 to-violet-600",
      icon: "/images/Search More.png",
      title: "Deep Link Analysis",
      description:
        "We dissect complex URL structures and redirects to uncover hidden malicious payloads that traditional scanners miss.",
    },
    {
      number: 5,
      color: "from-blue-400 to-cyan-500",
      icon: "/images/Security Lock.png",
      title: "SSL & Domain Verification",
      description:
        "Instantly validates SSL certificates and domain ownership to ensure you are connecting to authentic, secure websites.",
    },
    {
      number: 6,
      color: "from-red-500 to-rose-600",
      icon: "/images/Protect.png",
      title: "Zero-Day Protection",
      description:
        "Stay ahead of the curve with predictive analysis that blocks never-before-seen exploits and zero-day vulnerabilities.",
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-gray-50 relative overflow-hidden font-sans">
      {/* --- Ambient Background Glow --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-60">
        <div className="absolute top-[10%] right-[5%] w-96 h-96 bg-[#6B73FF]/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* --- Section Header --- */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B73FF]/5 border border-[#6B73FF]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
            <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">
              Core Capabilities
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Six Ways <span className="text-[#6B73FF]">SmartShield</span> Keeps
            You Safe
          </h2>

          <p className="text-gray-500 text-base md:text-xl leading-relaxed max-w-2xl mx-auto">
            We combine cutting-edge technology with proactive defense mechanisms
            to create an impenetrable barrier for your browsing experience.
          </p>
        </div>

        {/* --- Feature Carousel --- */}
        <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden">
          {/* Sliding carousel container with infinite loop */}
          <div
            className="flex gap-12 animate-scroll"
            style={{
              animation: "scroll 60s linear infinite",
            }}
          >
            {/* First set of cards */}
            {features.map((feature, index) => (
              <div key={`first-${index}`} className="flex-shrink-0 w-[440px]">
                <FeatureCard feature={feature} />
              </div>
            ))}
            {/* Duplicate set for infinite loop */}
            {features.map((feature, index) => (
              <div key={`second-${index}`} className="flex-shrink-0 w-[440px]">
                <FeatureCard feature={feature} />
              </div>
            ))}
          </div>

          <style>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(calc(-${features.length} * (440px + 48px)));
              }
            }
          `}</style>
        </div>
      </div>

      {/* --- BOTTOM SEPARATOR --- */}
      {/* This creates a clean visual break before the next section */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full"></div>
      </div>
    </section>
  );
}
