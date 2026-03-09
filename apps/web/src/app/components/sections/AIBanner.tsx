"use client";

import Image from "next/image";
import { useRef } from "react";

export default function AIBanner() {
  const imageRef = useRef<HTMLDivElement>(null);
  const rotateRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !rotateRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const rx = ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 15;
    const ry = -((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 15;
    rotateRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const handleMouseLeave = () => {
    if (rotateRef.current) rotateRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  const features = [
    "Machine Learning Detection",
    "Real-Time Monitoring",
    "Browser Integration",
    "Lightweight & Fast",
    "Privacy-First Design",
  ];

  return (
    // MODIFIED: Removed 'dark:bg-black' so background stays light
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-page">
      <div className="max-w-7xl mx-auto">
        {/* Main Card Container (Kept dark for contrast) */}
          <div className="relative bg-panel rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-divider shadow-2xl group">
          {/* Ambient Background Glow Effects */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#6B7FFF]/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center relative z-10">
            {/* Left Content */}
            <div className="p-5 sm:p-7 md:p-10 lg:p-16">
              <div className="inline-block px-3 py-1 mb-4 sm:mb-6 rounded-full bg-heading/5 border border-heading/10 backdrop-blur-sm">
                <span className="text-xs font-semibold text-[#6B7FFF] uppercase tracking-wider">
                  Next-Gen Security
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-heading mb-5 sm:mb-8 leading-[1.1] tracking-tight">
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

              <ul className="space-y-3 sm:space-y-5 mb-6 sm:mb-10">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 text-copy transition-all duration-300 hover:text-heading hover:translate-x-2 group/item cursor-default"
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
                    <span className="text-[13px] sm:text-base font-medium">{feature}</span>
                  </li>
                ))}
              </ul>


            </div>

            {/* Right Image Area */}
            <div
              ref={imageRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative p-5 sm:p-7 md:p-8 lg:p-12 flex items-center justify-center h-full cursor-pointer"
              style={{
                perspective: "1000px",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#6B7FFF]/5 to-transparent rounded-full blur-3xl transform scale-75"></div>

              <div className="relative w-full max-w-sm animate-[float_6s_ease-in-out_infinite]">
                <div
                  ref={rotateRef}
                  style={{
                    transform: "rotateX(0deg) rotateY(0deg)",
                    transition: "transform 0.1s ease-out",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <Image
                    src="/images/Smarter Protection.png"
                    alt="AI Protection Illustration"
                    width={650}
                    height={650}
                    className="w-full h-auto drop-shadow-2xl"
                    priority
                  />
                </div>
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
