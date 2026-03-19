"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const contactEmail = "smartshield004@gmail.com";

function ContactHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 140]);
  const yReverse = useTransform(scrollY, [0, 500], [0, -100]);

  return (
    <section className="pt-32 md:pt-44 pb-14 md:pb-18 px-6 relative overflow-hidden">
      <motion.div style={{ y }} className="absolute top-0 right-0 w-[520px] h-[520px] bg-[#545BFF]/12 rounded-full blur-[130px] pointer-events-none" />
      <motion.div style={{ y: yReverse }} className="absolute bottom-0 left-0 w-[620px] h-[620px] bg-[#b19eef]/10 rounded-full blur-[130px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(84,91,255,0.14) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#545BFF]/10 border border-[#545BFF]/20">
            <span className="w-2 h-2 rounded-full bg-[#545BFF] animate-pulse" />
            <span className="text-[#545BFF] text-xs font-bold tracking-widest uppercase">Contact SmartShield</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-heading mb-6 leading-[0.95] tracking-tight"
        >
          Let&apos;s Connect
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base md:text-lg text-faded max-w-3xl mx-auto leading-relaxed"
        >
          Reach out for support, product inquiries, or collaboration opportunities. Our team is ready to help.
        </motion.p>
      </div>
    </section>
  );
}

function ContactFormSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const subject = encodeURIComponent(`New message from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <section ref={ref} className="pb-24 md:pb-28 px-6 relative">
      <div className="absolute inset-x-0 top-8 h-56 bg-gradient-to-b from-[#545BFF]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="group h-full"
          >
            <div className="relative rounded-[24px] p-[1px] bg-gradient-to-br from-[#545BFF]/50 via-[#7a83ff]/20 to-transparent shadow-[0_14px_44px_rgba(84,91,255,0.16)] h-full">
              <div className="relative rounded-[23px] bg-white/82 dark:bg-[#0f1322]/84 border border-white/35 dark:border-[#8d95ff]/10 backdrop-blur-sm p-6 md:p-7 h-full">
                <h2 className="text-2xl md:text-3xl font-bold text-heading mb-2">Leave Us a Message</h2>
                <p className="text-sm md:text-base text-faded mb-7">
                  Fill out the form below and we will get back to you through email.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-heading mb-2">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white/70 dark:bg-[#131a30]/80 border border-[#545BFF]/20 focus:border-[#545BFF]/60 focus:outline-none focus:ring-2 focus:ring-[#545BFF]/20 text-heading placeholder:text-faded/70 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-heading mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@example.com"
                      required
                      className="w-full h-12 px-4 rounded-xl bg-white/70 dark:bg-[#131a30]/80 border border-[#545BFF]/20 focus:border-[#545BFF]/60 focus:outline-none focus:ring-2 focus:ring-[#545BFF]/20 text-heading placeholder:text-faded/70 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-heading mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us how we can help you..."
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-[#131a30]/80 border border-[#545BFF]/20 focus:border-[#545BFF]/60 focus:outline-none focus:ring-2 focus:ring-[#545BFF]/20 text-heading placeholder:text-faded/70 transition-colors resize-y min-h-[150px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF] text-white text-sm font-semibold shadow-[0_0_24px_rgba(84,91,255,0.42)] hover:shadow-[0_0_36px_rgba(84,91,255,0.6)] transition-all duration-300"
                  >
                    Send Message
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </form>

                <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-[#545BFF]/25 rounded-tr-md" />
                <div className="pointer-events-none absolute left-3 bottom-3 h-4 w-4 border-l border-b border-[#545BFF]/25 rounded-bl-md" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="group h-full"
          >
            <div className="relative rounded-[24px] p-[1px] bg-gradient-to-br from-[#545BFF]/50 via-[#7a83ff]/20 to-transparent shadow-[0_14px_44px_rgba(84,91,255,0.16)] h-full">
              <div className="relative rounded-[23px] bg-white/82 dark:bg-[#0f1322]/84 border border-white/35 dark:border-[#8d95ff]/10 backdrop-blur-sm p-6 h-full flex flex-col">
                <h3 className="text-xl font-bold text-heading mb-2">Direct Contact</h3>
                <p className="text-sm text-faded mb-5">Prefer reaching us directly? Email us anytime.</p>

                <div className="rounded-xl border border-[#545BFF]/18 bg-[#545BFF]/5 px-4 py-3 mb-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-faded mb-1">Support Email</p>
                  <a href={`mailto:${contactEmail}`} className="text-sm md:text-base font-semibold text-heading break-all hover:text-[#545BFF] transition-colors">
                    {contactEmail}
                  </a>
                </div>

                <div className="rounded-xl border border-[#545BFF]/18 bg-[#545BFF]/5 px-4 py-3 mb-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-faded mb-1">Response Time</p>
                  <p className="text-sm font-semibold text-heading">Usually within 24-48 hours</p>
                </div>

                <p className="text-sm text-faded mt-auto">
                  SmartShield support covers scanning concerns, account help, collaboration inquiries, and product feedback.
                </p>

                <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-[#545BFF]/25 rounded-tr-md" />
                <div className="pointer-events-none absolute left-3 bottom-3 h-4 w-4 border-l border-b border-[#545BFF]/25 rounded-bl-md" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className="pb-24 px-6">
      <div className="max-w-5xl mx-auto rounded-3xl border border-[#545BFF]/16 bg-white/55 dark:bg-[#101528]/65 backdrop-blur-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-faded mb-2">Need More Info?</p>
            <h3 className="text-2xl md:text-3xl font-bold text-heading">Explore SmartShield Resources</h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/about"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[#545BFF]/35 hover:border-[#545BFF]/60 text-heading text-sm font-semibold bg-white/30 dark:bg-white/5 hover:bg-[#545BFF]/8 transition-all"
            >
              About SmartShield
            </Link>
            <Link
              href="/privacy-policy"
              className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[#545BFF]/35 hover:border-[#545BFF]/60 text-heading text-sm font-semibold bg-white/30 dark:bg-white/5 hover:bg-[#545BFF]/8 transition-all"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-page text-copy">
      <Navbar />
      <ContactHero />
      <ContactFormSection />
      <QuickLinks />
      <Footer />
    </main>
  );
}
