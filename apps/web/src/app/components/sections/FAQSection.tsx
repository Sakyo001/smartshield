"use client";

import { useState } from "react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    },
    {
      question:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit consectetur?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    },
    {
      question:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit adipiscing elit consectetur?",
      answer:
        " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    },
    {
      question:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit  ipsum dolor sit amet,?",
      answer:
        " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    },
    {
      question:
        "Lorem ipsum dolor sit amet, consectetur adipiscing tempor incididunt ut labore et dolore magnelit?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    },
    {
      question:
        "Lorem ipsum dolor sit amet, consectetur adipiscing tempor incidelit?",
      answer:
        " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    },
    {
      question:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elitelit, sed do eiusmod ?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
    },
  ];

  return (
    // Added 'mb-24' here for margin bottom
    <section className="py-8 sm:py-12 px-4 sm:px-6 bg-white dark:bg-white transition-colors relative overflow-hidden mb-">
      {/* Subtle background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6B73FF]/5 to-transparent pointer-events-none"></div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-6px); }
          to   { opacity: 1; max-height: 500px; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .faq-answer  { animation: slideDown 0.3s ease-out forwards; }
        .faq-item    { animation: fadeInScale 0.4s ease-out backwards; }
        .faq-button  { position: relative; }
        .faq-button:hover { background-color: rgba(107, 115, 255, 0.08); }
        .faq-icon    { transition: transform 0.3s ease; }
        .question-text { transition: color 0.3s ease; }
        .faq-button:hover .question-text { color: #6B73FF; }
      `}</style>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B73FF]/5 border border-[#6B73FF]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
            <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">
              Common Questions
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-6 tracking-tight">
            Answers to Your <span className="text-[#6B73FF]">Questions</span>
          </h2>
          <p className="text-gray-500 text-[13px] sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="faq-item border border-gray-200 dark:border-gray-200 transition-all duration-300 rounded-lg hover:border-[#6B73FF]/30 hover:shadow-lg hover:shadow-[#6B73FF]/10"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="faq-button w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left transition-all duration-300"
              >
                <span className="question-text text-gray-900 dark:text-black font-medium pr-3 sm:pr-4 text-[13px] sm:text-base transition-colors flex-1">
                  {faq.question}
                </span>
                <div
                  className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#6B73FF] to-[#5A62E8] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-[#6B73FF]/40 faq-icon flex-shrink-0"
                  style={{
                    transform:
                      openIndex === index
                        ? "rotate(180deg) scale(1.1)"
                        : "rotate(0deg) scale(1)",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 2V10M2 6H10"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
              {openIndex === index && faq.answer && (
                <div className="faq-answer px-6 py-3 border-t border-gray-100 dark:border-gray-100 mt-2">
                  <p className="text-gray-600 dark:text-gray-600 text-base leading-relaxed transition-colors">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
