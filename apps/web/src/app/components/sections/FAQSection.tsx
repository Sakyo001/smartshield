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
    <section className="py-12 px-6 bg-white dark:bg-white transition-colors relative overflow-hidden mb-">
      {/* Subtle background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6B73FF]/5 to-transparent pointer-events-none"></div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
            overflow: hidden;
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
            overflow: visible;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
            overflow: hidden;
          }
          to {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
            overflow: hidden;
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(107, 115, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(107, 115, 255, 0);
          }
        }

        .faq-answer {
          animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .faq-closing {
          animation: slideUp 0.3s ease-in forwards;
        }

        .faq-button {
          position: relative;
          overflow: hidden;
        }

        .faq-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(107, 115, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .faq-button:hover::before {
          left: 100%;
        }

        .faq-button:hover {
          background-color: rgba(107, 115, 255, 0.08);
        }

        .faq-icon {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .faq-item {
          animation: fadeInScale 0.5s ease-out backwards;
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .question-text {
          transition: color 0.3s ease, letter-spacing 0.3s ease;
        }

        .faq-button:hover .question-text {
          color: #6B73FF;
          letter-spacing: 0.3px;
        }
      `}</style>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B73FF]/5 border border-[#6B73FF]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#6B73FF] animate-pulse"></span>
            <span className="text-[#6B73FF] font-bold tracking-wide text-xs uppercase">
              Common Questions
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Answers to Your <span className="text-[#6B73FF]">Questions</span>
          </h2>
          <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
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
                className="faq-button w-full px-6 py-3 flex items-center justify-between text-left transition-all duration-300"
              >
                <span className="question-text text-gray-900 dark:text-black font-medium pr-4 text-base transition-colors flex-1">
                  {faq.question}
                </span>
                <div
                  className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#6B73FF] to-[#5A62E8] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-[#6B73FF]/40 faq-icon flex-shrink-0"
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
