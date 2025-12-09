import Image from "next/image";
import Link from "next/link";

export default function AIBanner() {
  const features = [
    "Machine Learning Detection",
    "Real-Time Monitoring",
    "Browser Integration",
    "Lightweight & Fast",
    "Privacy-First Design",
  ];

  return (
    // MODIFIED: Removed 'dark:bg-black' so background stays light
    <section className="py-24 px-6 bg-gray-50 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Main Card Container (Kept dark for contrast) */}
        <div className="relative bg-[#0a0a0f] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
          {/* Ambient Background Glow Effects */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#6B7FFF]/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Content */}
            <div className="p-10 md:p-16">
              <div className="inline-block px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="text-xs font-semibold text-[#6B7FFF] uppercase tracking-wider">
                  Next-Gen Security
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-[1.1] tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6B7FFF] to-[#b19eef]">
                  Smarter
                </span>{" "}
                Protection
                <br />
                Powered by{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6B7FFF] to-[#b19eef]">
                  AI
                </span>
              </h2>

              <ul className="space-y-5 mb-10">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 text-gray-300 transition-all duration-300 hover:text-white hover:translate-x-2 group/item cursor-default"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#6B7FFF]/20 group-hover/item:bg-[#6B7FFF] transition-colors duration-300">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-[#6B7FFF] group-hover/item:text-white transition-colors duration-300"
                      >
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-base font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-3.5 flex items-center justify-center bg-[#6B7FFF] text-white rounded-full hover:bg-[#5A6BE8] hover:shadow-[0_0_20px_rgba(107,127,255,0.4)] transition-all duration-300 font-semibold text-sm transform hover:-translate-y-0.5"
                >
                  Get the Extension
                </Link>

                <button className="w-full sm:w-auto px-8 py-3.5 flex items-center justify-center text-white border border-white/20 rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-300 font-semibold text-sm">
                  Scan Website
                </button>
              </div>
            </div>

            {/* Right Image Area */}
            <div className="relative p-10 md:p-16 flex items-center justify-center h-full">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#6B7FFF]/5 to-transparent rounded-full blur-3xl transform scale-75"></div>

              <div className="relative w-full max-w-md animate-[float_6s_ease-in-out_infinite]">
                <Image
                  src="/images/Typing-bro 1.png"
                  alt="AI Protection Illustration"
                  width={600}
                  height={600}
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </section>
  );
}
