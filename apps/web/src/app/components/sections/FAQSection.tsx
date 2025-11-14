"use client"

import { useState } from "react"

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(1)

  const faqs = [
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
      answer: ""
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit consectetur?",
      answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit adipiscing elit consectetur?",
      answer: ""
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elit  ipsum dolor sit amet,?",
      answer: ""
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing tempor incididunt ut labore et dolore magnelit?",
      answer: ""
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing tempor incidelit?",
      answer: ""
    },
    {
      question: "Lorem ipsum dolor sit amet, consectetur adipiscing elitelit, sed do eiusmod ?",
      answer: ""
    }
  ]

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Answers To<br />
            Common <span className="text-[#6B73FF]">Questions</span>
          </h2>
          <p className="text-gray-600 text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          </p>
        </div>

        <div className="space-y-1">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-gray-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-0 py-5 flex items-center justify-between text-left"
              >
                <span className="text-black font-normal pr-4 text-sm">{faq.question}</span>
                <div className="shrink-0 w-6 h-6 rounded-full bg-black flex items-center justify-center">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M6 2V10M2 6H10"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </button>
              {openIndex === index && faq.answer && (
                <div className="pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}