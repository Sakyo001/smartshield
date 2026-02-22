import Image from "next/image";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: "/images/freepik--Shield--inject-3.png",
      title: "Scan for Threats",
      description:
        "Our AI-powered engine instantly analyzes the URL for suspicious patterns, hidden traps, and known malicious signatures.",
    },
    {
      number: "02",
      icon: "/images/freepik--world--inject-1--inject-9.png",
      title: "Cross-Check Databases",
      description:
        "We verify the site against global threat intelligence networks and blacklists to ensure comprehensive coverage.",
    },
    {
      number: "03",
      icon: "/images/Group 36.png",
      title: "Instant Verdict",
      description:
        "Receive a clear, color-coded safety report in seconds: Safe, Warning, or Dangerous, empowering you to browse with confidence.",
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 bg-[#0a0a0f] relative overflow-hidden font-sans">
      {/* --- Ambient Background --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-60">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-[#6B73FF]/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* --- Section Header --- */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B73FF]/5 border border-[#6B73FF]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
            <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">
              Simple Process
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            How <span className="text-[#6B73FF]">SmartShield</span> Works
          </h2>
          <p className="text-gray-400 text-base md:text-xl leading-relaxed max-w-2xl mx-auto">
            Advanced security made simple. In just three steps, we transform
            uncertainty into clarity.
          </p>
        </div>

        {/* --- Process Steps --- */}
        <div className="relative">
          {/* Vertical Timeline (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#6B73FF]/20 via-[#6B73FF]/40 to-[#6B73FF]/20 transform -translate-x-1/2"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Timeline Dot */}
                <div className="hidden md:flex absolute left-1/2 top-20 w-5 h-5 rounded-full bg-[#0a0a0f] border-4 border-[#6B73FF] transform -translate-x-1/2 -translate-y-1/2 z-20 shadow-lg"></div>

                <div className="group relative bg-[#0f0f1e] rounded-2xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-3 border border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_rgba(107,115,255,0.2)] hover:border-[#6B73FF]/30 flex flex-col">
                  {/* Number Badge */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B73FF] to-[#8a9dff] text-white font-bold text-lg mb-6 shadow-lg group-hover:shadow-xl group-hover:shadow-[#6B73FF]/40 transition-all duration-300">
                    {step.number}
                  </div>

                  {/* Icon Container */}
                  <div className="relative mb-6 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6B73FF]/5 to-[#8a9dff]/5 rounded-2xl blur-xl group-hover:from-[#6B73FF]/10 group-hover:to-[#8a9dff]/10 transition-all duration-500"></div>
                    <Image
                      src={step.icon}
                      alt={step.title}
                      width={100}
                      height={100}
                      className="relative z-10 object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#6B73FF] transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                    {step.description}
                  </p>

                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6B73FF]/0 via-[#6B73FF] to-[#6B73FF]/0 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
