"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

const stats = [
  { value: "600K+", label: "Training Datasets", sub: "URLs analyzed to build our models" },
  { value: "96.9%", label: "Detection Rate", sub: "Verified across test datasets" },
  { value: "<200ms", label: "Scan Speed", sub: "Real-time URL analysis" },
  { value: "3", label: "AI Models", sub: "Ensemble voting for accuracy" },
];

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    iconClass: "text-[#545BFF] bg-[#545BFF]/10 border border-[#545BFF]/20",
    title: "Ensemble ML Detection",
    desc: "Three machine learning models, Random Forest, Decision Tree, and Naive Bayes, vote collectively on every URL, reducing false positives and maximizing detection confidence.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    iconClass: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20",
    title: "WHOIS & DNS Intelligence",
    desc: "Every scan queries WHOIS records, DNS configurations, and SSL certificate validity to cross-reference domain age, registrar trust, and infrastructure patterns.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    iconClass: "text-[#b19eef] bg-[#b19eef]/10 border border-[#b19eef]/20",
    title: "Explainable AI (XAI)",
    desc: "SmartShield doesn't just give you a risk score, it explains which features triggered the verdict, using SHAP-based explanations so you understand exactly why a URL is flagged.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    iconClass: "text-amber-500 bg-amber-500/10 border border-amber-500/20",
    title: "Browser Extension",
    desc: "The SmartShield Chrome extension integrates silently into your browser, scanning URLs before you visit them and surfacing risk alerts without disrupting your workflow.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    iconClass: "text-sky-500 bg-sky-500/10 border border-sky-500/20",
    title: "Privacy-First Design",
    desc: "SmartShield never stores your browsing history. Only scans you explicitly request are processed. No tracking, no profiling, your data stays yours.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    iconClass: "text-rose-500 bg-rose-500/10 border border-rose-500/20",
    title: "Real-Time Risk Scoring",
    desc: "URL risk scores are computed in under 200ms, returning a confidence-weighted result with colour-coded threat levels, safe, suspicious, or phishing, instantly.",
  },
];

const models = [
  {
    name: "Random Forest",
    desc: "An ensemble of decision trees trained on URL lexical and structural features. High resistance to overfitting and noisy data.",
    badge: "Primary Classifier",
    badgeClass: "text-[#545BFF] dark:text-[#a89de8] bg-[#545BFF]/10 dark:bg-[#545BFF]/15 border border-[#545BFF]/25",
  },
  {
    name: "Decision Tree",
    desc: "A single-tree classifier that provides interpretable, rule-based decisions. Used to cross-validate the Random Forest output.",
    badge: "Cross-Validator",
    badgeClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
  },
  {
    name: "Naive Bayes",
    desc: "A probabilistic model that calculates phishing likelihood based on URL token frequency. Fast and effective on unseen domains.",
    badge: "Probabilistic Voter",
    badgeClass: "text-[#b19eef] bg-[#b19eef]/10 border border-[#b19eef]/25",
  },
];

export default function AboutTab() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section ref={sectionRef} id="about" className="py-16 md:py-24 px-4 md:px-6 bg-page relative overflow-hidden scroll-mt-20">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[8%] right-[3%] w-80 h-80 md:w-[500px] md:h-[500px] rounded-full bg-[#545BFF]/7 blur-[120px]" />
        <div className="absolute bottom-[8%] left-[3%] w-80 h-80 md:w-[500px] md:h-[500px] rounded-full bg-[#b19eef]/5 blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#545BFF]/3 blur-[140px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="text-center mb-14 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/12 dark:border-[#545BFF]/20 border-[#545BFF]/30 border backdrop-blur-sm shadow-sm dark:shadow-none mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
            <span className="text-[#545BFF] dark:text-[#a89de8] text-[11px] font-semibold tracking-widest uppercase">About SmartShield</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[1.7rem] sm:text-3xl md:text-[2.75rem] font-extrabold text-heading tracking-tight leading-[1.1] mb-4"
          >
            Built to Stop{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
              Phishing
            </span>{" "}
            Before It Starts
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-copy/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            SmartShield is an AI-powered phishing detection system that combines machine learning, WHOIS/DNS intelligence, and explainable AI to protect users from malicious URLs in real time.
          </motion.p>
        </div>

        {/* ── Mission card ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#545BFF]/20 dark:bg-[#0d0e1a]/60 bg-white/80 backdrop-blur-md hover:border-[#545BFF]/40 transition-all duration-300 shadow-[0_2px_20px_rgba(84,91,255,0.08),0_1px_6px_rgba(0,0,0,0.04)] dark:shadow-none p-6 sm:p-8 md:p-10 mb-8 md:mb-10"
        >
          {/* inner glow */}
          <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-[#545BFF]/5 rounded-full blur-[90px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-8 relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#545BFF] to-[#6B73FF] flex items-center justify-center flex-shrink-0 shadow-[0_0_28px_rgba(84,91,255,0.45)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-heading tracking-tight mb-3">Our Mission</h3>
              <p className="text-copy/80 leading-relaxed text-sm sm:text-base md:text-[17px]">
                Phishing attacks have grown more sophisticated and widespread, targeting everyday users who deserve protection without complexity.
                SmartShield was built to democratize cybersecurity, providing enterprise-grade AI phishing detection that anyone can use, for free,
                directly in their browser. We believe a safer internet is one where intelligent tools work quietly in the background, 
                letting you focus on what matters.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 md:mb-10"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.35 + i * 0.07 }}
              className="relative overflow-hidden rounded-2xl border border-[#545BFF]/15 dark:bg-[#0d0e1a]/50 bg-white/75 backdrop-blur-md shadow-[0_1px_8px_rgba(84,91,255,0.07)] dark:shadow-none p-4 sm:p-5 text-center group hover:border-[#545BFF]/35 transition-all duration-300"
            >
              {/* accent bar top */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#545BFF]/50 to-transparent" />
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef] mb-1">
                {s.value}
              </div>
              <div className="text-heading text-xs sm:text-sm font-semibold mb-1">{s.label}</div>
              <div className="text-faded text-[10px] sm:text-xs leading-tight hidden sm:block">{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Feature cards grid ─────────────────────────────────────── */}
        <div className="mb-10 md:mb-14">
          <motion.h3
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl font-extrabold text-heading tracking-tight mb-6 md:mb-8"
          >
            What SmartShield{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">Delivers</span>
          </motion.h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-[#545BFF]/12 dark:bg-[#0d0e1a]/55 bg-white/80 backdrop-blur-md hover:border-[#545BFF]/38 dark:hover:bg-[#545BFF]/5 hover:bg-[#545BFF]/4 transition-all duration-300 shadow-[0_1px_8px_rgba(84,91,255,0.06),0_2px_4px_rgba(0,0,0,0.04)] dark:shadow-none p-5 sm:p-6 hover:-translate-y-1"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.iconClass}`}>
                  {f.icon}
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-heading tracking-tight mb-2 dark:group-hover:text-[#7c83ff] group-hover:text-[#545BFF] transition-colors duration-300">
                  {f.title}
                </h4>
                <p className="text-copy/75 leading-relaxed text-xs sm:text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── ML Model breakdown ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#545BFF]/20 dark:bg-[#0d0e1a]/60 bg-white/80 backdrop-blur-md shadow-[0_2px_20px_rgba(84,91,255,0.08),0_1px_6px_rgba(0,0,0,0.04)] dark:shadow-none p-6 sm:p-8 md:p-10"
        >
          {/* corner glow */}
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#b19eef]/6 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start relative z-10">
            {/* Left: model list */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark:bg-[#545BFF]/10 bg-[#545BFF]/10 border border-[#545BFF]/25 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#545BFF] animate-pulse" />
                <span className="text-[#545BFF] dark:text-[#a89de8] text-[10px] font-semibold tracking-widest uppercase">ML Pipeline</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-heading tracking-tight mb-2">
                Three Models,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                  One Verdict
                </span>
              </h3>
              <p className="text-copy/75 text-sm sm:text-base leading-relaxed mb-7">
                Every URL is evaluated by all three classifiers. The majority vote, weighted by each model&apos;s confidence, determines the final risk score.
              </p>

              <div className="space-y-4">
                {models.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-xl border border-[#545BFF]/10 dark:bg-[#545BFF]/3 bg-[#545BFF]/3 hover:border-[#545BFF]/25 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#545BFF] to-[#6B73FF] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(84,91,255,0.35)] mt-0.5">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-extrabold text-heading text-sm">{m.name}</h4>
                        <span className={`text-[9px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full ${m.badgeClass}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-copy/70 text-xs sm:text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: how it works steps */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark:bg-[#b19eef]/10 bg-[#b19eef]/10 border border-[#b19eef]/25 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b19eef] animate-pulse" />
                <span className="text-[#b19eef] text-[10px] font-semibold tracking-widest uppercase">Detection Flow</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-heading tracking-tight mb-2">
                How a Scan{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">
                  Works
                </span>
              </h3>
              <p className="text-copy/75 text-sm sm:text-base leading-relaxed mb-7">
                From URL input to risk verdict in under 200ms, here&apos;s what happens behind the scenes.
              </p>

              <div className="space-y-3">
                {[
                  {
                    step: "01",
                    title: "URL Submitted",
                    desc: "You enter a URL manually or the Chrome extension captures it automatically before page load.",
                    color: "from-[#545BFF] to-[#6B73FF]",
                    glow: "rgba(84,91,255,0.35)",
                  },
                  {
                    step: "02",
                    title: "Feature Extraction",
                    desc: "Lexical, structural, WHOIS, DNS, and SSL features are extracted and normalised for model input.",
                    color: "from-[#6B73FF] to-[#9b8dff]",
                    glow: "rgba(107,115,255,0.30)",
                  },
                  {
                    step: "03",
                    title: "3-Model Ensemble Vote",
                    desc: "Random Forest, Decision Tree, and Naive Bayes each cast a confidence-weighted vote.",
                    color: "from-[#9b8dff] to-[#b19eef]",
                    glow: "rgba(177,158,239,0.30)",
                  },
                  {
                    step: "04",
                    title: "Risk Score Returned",
                    desc: "A colour-coded verdict (Safe / Suspicious / Phishing) with XAI feature importance is displayed.",
                    color: "from-[#b19eef] to-[#e0d5ff]",
                    glow: "rgba(177,158,239,0.25)",
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4 group/step">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 text-white text-[11px] font-extrabold tracking-wider`}
                      style={{ boxShadow: `0 0 14px ${step.glow}` }}
                    >
                      {step.step}
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-extrabold text-heading text-sm mb-0.5 group-hover/step:text-[#545BFF] dark:group-hover/step:text-[#7c83ff] transition-colors duration-200">{step.title}</h4>
                      <p className="text-copy/70 text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

