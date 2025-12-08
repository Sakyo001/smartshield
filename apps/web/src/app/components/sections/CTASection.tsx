import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const shieldRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.5,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (shieldRef.current) {
      observer.observe(shieldRef.current);
    }

    return () => {
      if (shieldRef.current) {
        observer.unobserve(shieldRef.current);
      }
    };
  }, []);

  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-[#0a0a0f] relative overflow-hidden transition-colors">
      {/* Background glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-[#545BFF]/10 dark:bg-[#141414]/20 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 transition-colors">
          Browse Safe.
          <br />
          Stay Smart.
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            style={{ width: "194.39px", height: "41px" }}
            className="flex items-center justify-center bg-[#545BFF] hover:bg-[#4349CC] text-white rounded-full transition-all duration-300 font-medium shadow-[0_0_15px_rgba(84,91,255,0.4)]"
          >
            Get the Extension
          </Link>

          <button
            style={{ width: "194.39px", height: "41px" }}
            className="flex items-center justify-center text-gray-700 dark:text-white border border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all duration-300 font-medium"
          >
            Scan Website
          </button>
        </div>

        {/* Shield illustration with VERY Slow (5s) Fade-in & Floating Hover */}
        <div
          ref={shieldRef}
          className={`relative inline-block transition-all duration-[5000ms] ease-[cubic-bezier(0.22,1,0.36,1)] 
            cursor-pointer hover:-translate-y-4 hover:scale-105 hover:drop-shadow-[0_0_90px_rgba(84,91,255,0.8)] 
            ${
              isVisible
                ? "opacity-100 translate-y-0 scale-100 blur-0 drop-shadow-[0_0_60px_rgba(84,91,255,0.6)]" // End State
                : "opacity-0 translate-y-32 scale-50 blur-xl drop-shadow-none" // Start State
            }`}
        >
          <Image
            src="/images/logo 1 (1).png"
            alt="Protected"
            width={500}
            height={500}
            priority
          />
        </div>
      </div>
    </section>
  );
}
