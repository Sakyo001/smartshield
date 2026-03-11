"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";

const faqs = [
  {
    question: "What is SmartShield and how does it work?",
    answer:
      "SmartShield is an AI-powered phishing detection system that analyzes URLs in real-time to identify potential threats. It uses an ensemble of three machine learning models, Random Forest, Decision Tree, and Naive Bayes, combined with WHOIS data, DNS records, and SSL certificate verification to determine if a website is safe, suspicious, or dangerous.",
  },
  {
    question: "Is SmartShield free to use?",
    answer:
      "Yes! SmartShield is completely free. You can scan URLs directly on the web app or install the Chrome extension for automatic real-time protection as you browse. No account required to get started.",
  },
  {
    question: "How accurate is SmartShield's phishing detection?",
    answer:
      "SmartShield achieves a 96.9% detection rate in identifying phishing attempts. Our three machine learning models are trained on over 600,000 URL samples and use a majority-vote ensemble strategy to maximize accuracy while minimizing false positives.",
  },
  {
    question: "Can I use SmartShield on my phone?",
    answer:
      "The SmartShield web app is fully responsive and works on any device with a browser, smartphones and tablets included. Simply visit the site and use the URL scanner directly. The Chrome extension is designed for desktop Chrome browsers.",
  },
  {
    question: "Does SmartShield store my browsing history?",
    answer:
      "No. SmartShield is privacy-first by design. We only process URLs you explicitly submit for scanning, your browsing history is never tracked or stored. Scans are stateless, and nothing is retained beyond what's needed to return your result.",
  },
  {
    question: "What does SmartShield show when it detects a phishing site?",
    answer:
      "When a threat is detected, SmartShield returns a colour-coded verdict, Safe, Suspicious, or Phishing, along with a detailed risk breakdown. Using Explainable AI (XAI), it highlights the specific URL features that triggered the alert, so you understand exactly what made it dangerous.",
  },
  {
    question: "What technologies power SmartShield?",
    answer:
      "SmartShield runs on a Python Flask backend with three ML classifiers (Random Forest, Decision Tree, Naive Bayes). Feature extraction covers lexical URL analysis, WHOIS domain lookups, DNS record inspection, and SSL certificate validation. The frontend is built with Next.js 15, paired with a Chrome extension for seamless browser integration.",
  },
];

export default function FAQTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} id="faq" className="py-16 md:py-24 px-4 sm:px-6 bg-page relative overflow-hidden scroll-mt-20">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[5%] left-[8%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#545BFF]/8 blur-[100px]" />
        <div className="absolute bottom-[5%] right-[8%] w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#b19eef]/6 blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#545BFF]/3 blur-[140px]" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm shadow-sm dark:shadow-none mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
            <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">
              Common Questions
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[1.7rem] sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1] mb-4"
          >
            Frequently{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
              Asked
            </span>{" "}
            Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-copy/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            Everything you need to know about SmartShield, how it works, what it detects, and how your privacy is protected.
          </motion.p>
        </div>

        {/* FAQ items */}
        <div className="space-y-3 mb-10 md:mb-12">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.3 + index * 0.07 }}
                className={`group border rounded-xl backdrop-blur-md transition-all duration-300
                  dark:bg-[#0d0e1a]/60 bg-white/80
                  shadow-[0_1px_6px_rgba(84,91,255,0.06)] dark:shadow-none
                  ${isOpen
                    ? "border-[#545BFF]/40 dark:border-[#545BFF]/30"
                    : "border-[#545BFF]/15 hover:border-[#545BFF]/35"
                  }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left transition-all duration-200 rounded-xl"
                  aria-expanded={isOpen}
                >
                  <span className={`font-semibold pr-4 text-sm sm:text-base transition-colors duration-300 flex-1 leading-snug ${isOpen ? "text-[#545BFF] dark:text-[#7c83ff]" : "text-heading group-hover:text-[#545BFF] dark:group-hover:text-[#7c83ff]"}`}>
                    {faq.question}
                  </span>
                  <div
                    className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300
                      bg-gradient-to-br from-[#545BFF] to-[#6B73FF]
                      ${isOpen
                        ? "shadow-[0_0_20px_rgba(84,91,255,0.55)] rotate-45 scale-110"
                        : "shadow-[0_0_12px_rgba(84,91,255,0.35)] rotate-0"
                      }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2V10M2 6H10" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-4 sm:pb-5 pt-1 border-t border-[#545BFF]/12">
                        <p className="text-copy/80 text-sm sm:text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
