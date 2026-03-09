"use client";

import { useState } from "react";

export default function FAQTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is SmartShield and how does it work?",
      answer:
        "SmartShield is an AI-powered phishing detection system that analyzes URLs in real-time to identify potential threats. It uses machine learning algorithms, WHOIS data, DNS records, and SSL certificate analysis to determine if a website is safe, suspicious, or dangerous.",
    },
    {
      question: "Is SmartShield free to use?",
      answer:
        "Yes! SmartShield offers a free tier that allows you to scan URLs and access basic protection features. We believe everyone deserves to browse safely. Premium features with enhanced analytics and priority support are available for power users.",
    },
    {
      question: "How accurate is SmartShield's phishing detection?",
      answer:
        "SmartShield maintains a 99.9% accuracy rate in detecting phishing attempts. Our machine learning models are trained on millions of URLs and continuously updated with the latest threat intelligence from global security databases.",
    },
    {
      question: "Can I use SmartShield on mobile devices?",
      answer:
        "Absolutely! SmartShield is fully responsive and works seamlessly on all devices including smartphones and tablets. You can also install our browser extension on mobile browsers that support extensions.",
    },
    {
      question: "Does SmartShield store my browsing history?",
      answer:
        "No, we respect your privacy. SmartShield only stores scan results you explicitly request. We don't track your browsing history or collect personal information beyond what's necessary for authentication and security analysis.",
    },
    {
      question: "What happens if SmartShield detects a phishing site?",
      answer:
        "When a phishing site is detected, SmartShield immediately displays a warning with a detailed risk assessment. You'll see the threat level, risk factors, and recommendations. You can also report the site to help protect the community.",
    },
    {
      question: "Can I integrate SmartShield with my business?",
      answer:
        "Yes! We offer API access and enterprise solutions for businesses looking to integrate SmartShield's protection into their systems. Contact us for more information about enterprise pricing and custom integration options.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-6px); }
          to   { opacity: 1; max-height: 500px; transform: translateY(0); }
        }
        .faq-answer  { animation: slideDown 0.3s ease-out forwards; }
        .faq-button  { position: relative; }
        .faq-button:hover { background-color: rgba(107, 115, 255, 0.08); }
        .faq-icon    { transition: transform 0.3s ease; }
        .question-text { transition: color 0.3s ease; }
        .faq-button:hover .question-text { color: #6B73FF; }
      `}</style>

      <div className="mb-8 sm:mb-12 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-heading mb-3 sm:mb-4">
          Frequently Asked <span className="text-[#6B73FF]">Questions</span>
        </h2>
        <p className="text-faded text-[13px] sm:text-base md:text-lg">
          Find answers to common questions about SmartShield and how it protects you
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-panel border border-divider transition-all duration-300 rounded-xl hover:border-[#6B73FF]/30 hover:shadow-lg hover:shadow-[#6B73FF]/10"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="faq-button w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left transition-all duration-300"
            >
              <span className="question-text text-heading font-semibold pr-3 sm:pr-4 text-[13px] sm:text-base transition-colors flex-1">
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
              <div className="faq-answer px-4 sm:px-6 pb-3 sm:pb-4 pt-2 border-t border-divider">
                <p className="text-faded text-[13px] sm:text-base leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
