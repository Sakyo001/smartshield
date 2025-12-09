import Image from "next/image";

export default function FeatureGrid() {
  const features = [
    {
      icon: "/images/Artificial Intelligence.png",
      title: "AI Threat Detection",
      description:
        "Advanced machine learning algorithms that proactively identify and neutralize emerging threats before they can execute.",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: "/images/geography.png",
      title: "Real-Time Defense",
      description:
        "Continuous 24/7 monitoring ensures your digital environment is protected against attacks as they happen, globally.",
      color: "from-emerald-400 to-green-500",
    },
    {
      icon: "/images/Layers.png",
      title: "Multi-Layer Security",
      description:
        "A robust defense-in-depth strategy combining network, application, and endpoint security layers for maximum coverage.",
      color: "from-orange-400 to-amber-500",
    },
    {
      icon: "/images/Search More.png",
      title: "Deep Link Analysis",
      description:
        "We dissect complex URL structures and redirects to uncover hidden malicious payloads that traditional scanners miss.",
      color: "from-purple-500 to-violet-600",
    },
    {
      icon: "/images/Security Lock.png",
      title: "SSL & Domain Verification",
      description:
        "Instantly validates SSL certificates and domain ownership to ensure you are connecting to authentic, secure websites.",
      color: "from-blue-400 to-cyan-500",
    },
    {
      icon: "/images/Protect.png",
      title: "Zero-Day Protection",
      description:
        "Stay ahead of the curve with predictive analysis that blocks never-before-seen exploits and zero-day vulnerabilities.",
      color: "from-red-500 to-rose-600",
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
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B73FF]/5 border border-[#6B73FF]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
            <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">
              Core Capabilities
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Six Ways <span className="text-[#6B73FF]">SmartShield</span> Keeps
            You Safe
          </h2>

          <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            We combine cutting-edge technology with proactive defense mechanisms
            to create an impenetrable barrier for your browsing experience.
          </p>
        </div>

        {/* --- Feature Grid --- */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-[#6B73FF]/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#6B73FF]/10 overflow-hidden"
            >
              {/* Hover Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`}
              ></div>

              <div className="relative z-10">
                {/* Icon Container */}
                <div className="mb-6 relative w-14 h-14">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 rounded-2xl blur-lg group-hover:opacity-30 transition-opacity duration-500`}
                  ></div>
                  <div className="relative w-full h-full bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    <Image
                      src={feature.icon}
                      alt={feature.title}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#6B73FF] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-600 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
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
