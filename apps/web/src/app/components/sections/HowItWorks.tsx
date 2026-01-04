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
    <section className="py-24 md:py-32 px-6 bg-gray-50 relative overflow-hidden font-sans">
      {/* --- Ambient Background --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-60">
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-[#6B73FF]/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* --- Section Header --- */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B73FF]/5 border border-[#6B73FF]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
            <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">
              Simple Process
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            How <span className="text-[#6B73FF]">SmartShield</span> Works
          </h2>
          <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Advanced security made simple. In just three steps, we transform
            uncertainty into clarity.
          </p>
        </div>

        {/* --- Process Steps --- */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Connector Line (Desktop Only) */}
          <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 -z-10 dashed-line"></div>

          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 md:p-10 transition-all duration-500 hover:-translate-y-2 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(107,115,255,0.15)] flex flex-col items-center text-center"
            >
              {/* Number Watermark (Background) */}
              <div className="absolute top-4 right-6 text-7xl font-black text-[#6B73FF]/10 select-none transition-all duration-500 group-hover:text-[#6B73FF]/20 group-hover:scale-110 z-0">
                {step.number}
              </div>

              {/* Icon Container */}
              <div className="relative z-10 mb-8">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 relative overflow-hidden group-hover:border-[#6B73FF]/30 transition-colors duration-500">
                  {/* Icon Glow Background */}
                  <div className="absolute inset-0 bg-[#6B73FF]/0 group-hover:bg-[#6B73FF]/5 transition-colors duration-500"></div>

                  <Image
                    src={step.icon}
                    alt={step.title}
                    width={56}
                    height={56}
                    className="w-12 h-12 object-contain transition-transform duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(84,91,255,0.5)]"
                  />
                </div>
                {/* Connecting Dot (Desktop) */}
                <div className="hidden md:block absolute top-1/2 -left-6 w-3 h-3 rounded-full bg-white border-2 border-gray-200 -translate-y-1/2 -translate-x-1/2 group-hover:border-[#6B73FF] transition-colors duration-300"></div>
                <div className="hidden md:block absolute top-1/2 -right-6 w-3 h-3 rounded-full bg-white border-2 border-gray-200 -translate-y-1/2 translate-x-1/2 group-hover:border-[#6B73FF] transition-colors duration-300"></div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#6B73FF] transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Hover Bottom Bar */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-[#6B73FF] rounded-full transition-all duration-500 group-hover:w-1/2 opacity-0 group-hover:opacity-100"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
