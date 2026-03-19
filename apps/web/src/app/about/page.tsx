"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const mlModels = [
  {
    name: "CNN",
    desc: "Convolutional Neural Networks for pattern recognition in URL structures and HTML content.",
    features: ["Pattern detection", "Spatial features", "Deep learning"]
  },
  {
    name: "SVM",
    desc: "Support Vector Machines for non-linear classification with high dimensional feature spaces.",
    features: ["Non-linear separation", "Kernel methods", "High accuracy"]
  },
  {
    name: "XGBoost",
    desc: "Extreme Gradient Boosting for ensemble learning with robust feature importance ranking.",
    features: ["Gradient boosting", "Feature importance", "Fast training"]
  },
  {
    name: "Logistic Regression",
    desc: "Probabilistic classifier providing confidence scores and interpretable coefficients.",
    features: ["Probability scores", "Interpretability", "Real-time inference"]
  }
];

const featureCategories = [
  {
    name: "Web-Based Features",
    items: ["URL length & structure", "Character distribution", "HTML tags", "JavaScript patterns", "Form detection"]
  },
  {
    name: "Domain-Based Features",
    items: ["Domain age", "WHOIS information", "DNS records", "SSL certificates", "Domain reputation"]
  },
  {
    name: "Reputation-Based Features",
    items: ["URL blacklists", "Domain history", "IP reputation", "ASN data", "Geographic indicators"]
  }
];

const howItWorks = [
  {
    step: 1,
    title: "URL Input",
    desc: "User submits a URL through the web app or browser extension for analysis."
  },
  {
    step: 2,
    title: "Feature Extraction",
    desc: "System extracts 200+ features from web, domain, and reputation categories in real-time."
  },
  {
    step: 3,
    title: "Model Processing",
    desc: "Ensemble of 4 ML models processes features simultaneously and votes on risk level."
  },
  {
    step: 4,
    title: "Classification",
    desc: "Results aggregated into: Safe, Suspicious, or Phishing with confidence score."
  },
  {
    step: 5,
    title: "Explanation Output",
    desc: "LIME and SHAP analyze model decisions to explain exactly why a URL was flagged."
  }
];

const platforms = [
  {
    name: "Web Application",
    desc: "Dashboard for URL scanning, history, and detailed threat reports.",
    icon: "🌐",
    features: ["Instant scanning", "Detailed reports", "History tracking", "User dashboard"]
  },
  {
    name: "Browser Extension",
    desc: "Seamless Chrome integration for real-time URL scanning before you click.",
    icon: "🧩",
    features: ["Silent scanning", "Live alerts", "One-click reporting", "Auto-sync"]
  }
];

const stats = [
  { label: "Detection Rate", value: "96.9%", desc: "Verified accuracy on test datasets" },
  { label: "Scan Speed", value: "<200ms", desc: "Real-time analysis per URL" },
  { label: "Dataset Size", value: "600K+", desc: "Training samples analyzed" },
  { label: "Features", value: "200+", desc: "Input dimensions per URL" }
];

function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <section className="pt-32 md:pt-48 pb-24 px-6 relative overflow-hidden">
      <motion.div style={{ y }} className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#545BFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <motion.div style={{ y: useTransform(scrollY, [0, 500], [0, -100]) }} className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#b19eef]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#545BFF]/10 border border-[#545BFF]/20">
            <span className="w-2 h-2 rounded-full bg-[#545BFF] animate-pulse" />
            <span className="text-[#545BFF] text-xs font-bold tracking-widest uppercase">SmartShield Deep Dive</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-heading mb-6 leading-tight"
        >
          More About<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">SmartShield</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-faded max-w-3xl mx-auto leading-relaxed"
        >
          An AI-powered phishing detection system combining ensemble machine learning, real-time threat intelligence, and explainable AI to protect users from malicious URLs.
        </motion.p>
      </div>
    </section>
  );
}

function OverviewSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-heading mb-8">What is SmartShield?</h2>
          <div className="space-y-6 text-lg text-faded leading-relaxed">
            <p>
              SmartShield is a cutting-edge AI-powered phishing detection system designed to protect users from malicious URLs in real time. Leveraging ensemble machine learning and explainable AI (XAI), SmartShield analyzes URLs across multiple dimensions to identify threats before they cause harm.
            </p>
            <p>
              Unlike black-box security solutions, SmartShield prioritizes <strong className="text-heading">transparency</strong>. Every detection is accompanied by an explanation detailing which features triggered the alert, empowering users to understand WHY a URL was flagged, not just THAT it was flagged.
            </p>
            <p>
              Deployed both as a <strong className="text-heading">web application and browser extension</strong>, SmartShield integrates seamlessly into your workflow, scanning URLs in &lt;200ms with 96.9% accuracy while maintaining strict privacy compliance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { label: "Real-Time Detection", desc: "Instant threat analysis" },
              { label: "Ensemble ML", desc: "4 models voting together" },
              { label: "Explainable AI", desc: "LIME & SHAP explanations" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-[#545BFF]/15 backdrop-blur-sm"
              >
                <div className="font-bold text-heading mb-2">{item.label}</div>
                <div className="text-sm text-faded">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-gradient-to-b from-[#545BFF]/5 to-transparent">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-heading mb-12"
        >
          The Problem We Solve
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {[
            {
              title: "Rising Phishing Threats",
              points: ["Targeting banks and e-wallets", "Sophisticated social engineering", "Domain spoofing attacks", "Credential harvesting campaigns"]
            },
            {
              title: "Limitations of Current Systems",
              points: ["Black-box decision making", "Reactive, not proactive", "High false positive rates", "No transparency to users"]
            }
          ].map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-[#545BFF]/15 backdrop-blur-sm"
            >
              <h3 className="text-xl font-bold text-heading mb-6">{section.title}</h3>
              <ul className="space-y-3">
                {section.points.map((point, j) => (
                  <li key={j} className="flex items-center gap-3 text-faded">
                    <span className="w-2 h-2 rounded-full bg-[#545BFF] flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-8 rounded-2xl bg-gradient-to-r from-[#545BFF]/10 to-[#b19eef]/10 border border-[#545BFF]/20"
        >
          <p className="text-lg text-faded leading-relaxed">
            <strong className="text-heading">SmartShield bridges this gap</strong> by delivering proactive, transparent, and explainable threat detection. We empower users with <strong className="text-heading">intelligent protection and complete understanding</strong>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function TechnologySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-heading mb-4 text-center"
        >
          Our<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]"> Technology</span>
        </motion.h2>

        <p className="text-center text-lg text-faded max-w-2xl mx-auto mb-16">
          Built on a foundation of ensemble machine learning, feature engineering, and explainable AI
        </p>

        {/* ML Models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-heading mb-8">Ensemble Machine Learning</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mlModels.map((model, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                className="p-6 rounded-2xl bg-white/5 border border-[#545BFF]/15 hover:border-[#545BFF]/40 backdrop-blur-sm transition-all"
              >
                <h4 className="font-bold text-heading mb-3">{model.name}</h4>
                <p className="text-sm text-faded mb-4">{model.desc}</p>
                <div className="space-y-2">
                  {model.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-faded">
                      <span className="w-1 h-1 rounded-full bg-[#545BFF]" />
                      {feat}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-heading mb-8">Feature Analysis (200+ Dimensions)</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {featureCategories.map((category, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                className="p-6 rounded-2xl bg-white/5 border border-[#545BFF]/15 backdrop-blur-sm"
              >
                <h4 className="font-bold text-heading mb-4">{category.name}</h4>
                <ul className="space-y-2">
                  {category.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-faded">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b19eef]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* XAI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="p-8 rounded-2xl bg-gradient-to-r from-[#545BFF]/10 to-[#b19eef]/10 border border-[#545BFF]/20"
        >
          <h3 className="text-2xl font-bold text-heading mb-4">Explainable AI (XAI)</h3>
          <p className="text-faded leading-relaxed mb-6">
            SmartShield uses <strong className="text-heading">LIME (Local Interpretable Model-agnostic Explanations)</strong> and <strong className="text-heading">SHAP (SHapley Additive exPlanations)</strong> to break down model decisions. Every phishing detection includes a detailed analysis of which URL features contributed most to the verdict.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <strong className="text-heading">LIME</strong>
              <p className="text-sm text-faded mt-2">Approximates local model behavior to identify influential features for individual predictions.</p>
            </div>
            <div>
              <strong className="text-heading">SHAP</strong>
              <p className="text-sm text-faded mt-2">Uses Shapley values to assign importance scores to each feature contribution fairly.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-gradient-to-b from-transparent to-[#545BFF]/5">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-heading mb-16 text-center"
        >
          How It Works
        </motion.h2>

        <div className="space-y-8">
          {howItWorks.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="flex gap-6 md:gap-8"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#545BFF] to-[#b19eef] flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="w-0.5 h-16 bg-[#545BFF]/20 ml-7 mt-2" />
                )}
              </div>
              <div className="pt-2">
                <h3 className="text-xl font-bold text-heading mb-2">{item.title}</h3>
                <p className="text-faded leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-heading mb-4 text-center"
        >
          Available On<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]"> Multiple Platforms</span>
        </motion.h2>

        <p className="text-center text-lg text-faded max-w-2xl mx-auto mb-12">
          Access SmartShield wherever you browse
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {platforms.map((platform, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-[#545BFF]/15 hover:border-[#545BFF]/40 backdrop-blur-sm transition-all"
            >
              <div className="text-5xl mb-4">{platform.icon}</div>
              <h3 className="text-2xl font-bold text-heading mb-3">{platform.name}</h3>
              <p className="text-faded mb-6">{platform.desc}</p>
              <ul className="space-y-2">
                {platform.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-faded">
                    <span className="w-1 h-1 rounded-full bg-[#545BFF]" />
                    {feat}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-gradient-to-b from-[#545BFF]/5 to-transparent">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-heading mb-4 text-center">Privacy First</h2>
          <p className="text-center text-lg text-faded max-w-2xl mx-auto mb-12">
            Your data is your own. SmartShield operates with complete transparency and compliance
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                title: "No Personal Data Collection",
                desc: "SmartShield never collects usernames, email addresses, or browsing history. Each scan is processed anonymously."
              },
              {
                title: "No Tracking or Profiling",
                desc: "We don't track user behavior, create profiles, or sell data. Your privacy is inviolable."
              },
              {
                title: "Local Processing",
                desc: "Critical computations happen locally whenever possible, minimizing data transmission to our servers."
              },
              {
                title: "RA 10173 Compliance",
                desc: "SmartShield complies with the Data Privacy Act of 2012 (Philippines), ensuring legal protection of your information."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-white/5 border border-[#545BFF]/15 backdrop-blur-sm"
              >
                <h3 className="font-bold text-heading mb-3">{item.title}</h3>
                <p className="text-sm text-faded leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-8 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/20"
          >
            <p className="text-heading font-bold mb-2">Our Privacy Pledge</p>
            <p className="text-faded leading-relaxed">
              We believe security and privacy are not opposed—they're interdependent. SmartShield protects your security without compromising your privacy, proving that you don't have to sacrifice one for the other.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PerformanceSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-heading mb-4 text-center"
        >
          Performance<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]"> Metrics</span>
        </motion.h2>

        <p className="text-center text-lg text-faded max-w-2xl mx-auto mb-12">
          Trusted by thousands for speed, accuracy, and reliability
        </p>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-white/5 border border-[#545BFF]/15 backdrop-blur-sm text-center hover:border-[#545BFF]/40 transition-all"
            >
              <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef] mb-2">
                {stat.value}
              </div>
              <div className="font-bold text-heading mb-1">{stat.label}</div>
              <div className="text-xs text-faded">{stat.desc}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="p-8 rounded-2xl bg-gradient-to-r from-[#545BFF]/10 to-[#b19eef]/10 border border-[#545BFF]/20"
        >
          <p className="text-lg text-faded leading-relaxed">
            These metrics are continuously validated against real-world phishing datasets and updated as our models improve. We prioritize <strong className="text-heading">accuracy without sacrificing speed</strong>, ensuring you're protected in milliseconds.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function VisionSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 md:py-28 px-6 bg-gradient-to-b from-transparent to-[#545BFF]/5">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-heading mb-8 leading-tight">
            Our<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]"> Vision</span>
          </h2>
          <p className="text-lg md:text-xl text-faded leading-relaxed mb-8 italic">
            In a world where cyber threats evolve daily, SmartShield stands for one principle: security should be intelligent, transparent, and accessible to everyone. We envision a safer internet where users understand the threats they face and trust the tools protecting them.
          </p>
          <div className="text-sm text-heading font-semibold uppercase tracking-widest">
            Secure. Transparent. Trustworthy.
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">Ready to protect yourself?</h2>
          <p className="text-lg text-faded mb-10 max-w-2xl mx-auto">
            Start scanning URLs with SmartShield today. It's free, it's transparent, and it's always improving.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
            <Link
              href="https://chromewebstore.google.com/detail/smartshield/fggfmmhccdeaahhoihgohdjikfobmeeg"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-5 sm:px-7 h-10 sm:h-11 w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF] text-white text-[13px] sm:text-sm font-semibold rounded-full shadow-[0_0_24px_rgba(84,91,255,0.42)] hover:shadow-[0_0_40px_rgba(84,91,255,0.65)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get the Extension
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </Link>
            <Link
              href="/#scan"
              className="group relative px-5 sm:px-7 h-10 sm:h-11 w-full sm:w-auto flex items-center justify-center dark:text-heading text-[#263a5e] text-[13px] sm:text-sm border dark:border-divider/40 border-[#545BFF]/50 dark:hover:border-[#545BFF]/70 hover:border-[#545BFF]/80 dark:hover:bg-[#545BFF]/8 hover:bg-[#545BFF]/12 rounded-full font-semibold backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Scan a Website
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-page text-copy">
      <Navbar />
      
      <HeroSection />
      <OverviewSection />
      <ProblemSection />
      <TechnologySection />
      <HowItWorksSection />
      <PlatformSection />
      <PrivacySection />
      <PerformanceSection />
      <VisionSection />
      <CTASection />

      <Footer />
    </main>
  );
}