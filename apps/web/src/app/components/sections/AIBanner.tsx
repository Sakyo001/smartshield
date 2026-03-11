"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "motion/react";

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

  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} className="py-8 sm:py-12 md:py-14 px-4 sm:px-6 bg-page relative overflow-hidden">
      {/* Ambient section glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#545BFF]/8 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[5%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#b19eef]/6 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative bg-panel rounded-2xl md:rounded-3xl overflow-hidden border border-divider shadow-2xl dark:shadow-[0_8px_60px_rgba(84,91,255,0.08)] group"
        >
          {/* Ambient Background Glow Effects */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#545BFF]/8 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#b19eef]/8 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center relative z-10">
            {/* Left Content */}
            <div className="p-5 sm:p-7 md:p-8 lg:p-10">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm shadow-sm dark:shadow-none mb-4 sm:mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
                <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
                  Next-Gen Security
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] font-extrabold text-heading mb-4 sm:mb-5 leading-[1.1] tracking-tight"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                  Smarter
                </span>{" "}
                Protection
                <br />
                Powered by{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                  AI
                </span>
              </motion.h2>

              <motion.ul
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6"
              >
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 text-copy/80 transition-all duration-300 hover:text-heading hover:translate-x-2 group/item cursor-default"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full dark:bg-[#545BFF]/20 bg-[#545BFF]/15 group-hover/item:bg-[#545BFF] border dark:border-[#545BFF]/30 border-[#545BFF]/40 transition-colors duration-300 shrink-0">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-[#545BFF] group-hover/item:text-white transition-colors duration-300"
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
              </motion.ul>
            </div>

            {/* Right Image Area */}
            <div
              ref={imageRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative p-4 sm:p-6 md:p-6 lg:p-8 flex items-center justify-center h-auto md:h-full cursor-pointer"
              style={{
                perspective: "1000px",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#545BFF]/5 to-transparent rounded-full blur-3xl transform scale-75" />

              <div className="relative w-full max-w-[200px] sm:max-w-[260px] md:max-w-[300px] animate-[float_6s_ease-in-out_infinite]">
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
        </motion.div>
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
