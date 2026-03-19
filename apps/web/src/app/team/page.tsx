"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const teamMembers = [
  {
    id: 1,
    name: "Prince Alvin Ezekhiel Arce",
    role: "Project Manager",
    expertise: "Project planning, team coordination, and milestone delivery across development tracks.",
    image: "/images/smartshield/arce.png"
  },
  {
    id: 2,
    name: "Kaye C. Batucal",
    role: "Technical Writer & Researcher",
    expertise: "Research synthesis, structured documentation, and clear technical communication for teams.",
    image: "/images/smartshield/batucal.png"
  },
  {
    id: 3,
    name: "France Andrei M. Cadorna",
    role: "Technical Writer",
    expertise: "SOP authoring, documentation standards, and product knowledge base maintenance.",
    image: "/images/smartshield/cadorna.png"
  },
  {
    id: 4,
    name: "Dominic R. Carreon",
    role: "Back-end Developer",
    expertise: "API development, server-side logic, and scalable backend implementation.",
    image: "/images/smartshield/carreon.png"
  },
  {
    id: 5,
    name: "Kizzie L. Cedeño",
    role: "Technical Writer & UI/UX Designer",
    expertise: "UX documentation, interface planning, and user-centered visual communication.",
    image: "/images/smartshield/cedeno.png"
  },
  {
    id: 6,
    name: "Jerico R. Francisco",
    role: "UI/UX & Frontend Developer",
    expertise: "Interaction design, responsive components, and polished frontend delivery.",
    image: "/images/smartshield/francisco.png"
  },
  {
    id: 7,
    name: "Gretchen B. Labine",
    role: "Technical Writer ",
    expertise: "Requirements documentation, technical summaries, and process reference writing.",
    image: "/images/smartshield/labine.png"
  },
  {
    id: 8,
    name: "Adrian Jake L. Licayan",
    role: "Frontend Developer & UI/UX ",
    expertise: "Frontend implementation, UI consistency, and user-focused interaction patterns.",
    image: "/images/smartshield/licayan.png"
  },
  {
    id: 9,
    name: "Panfilo Joseph C. Lumabi",
    role: "Frontend Developer & UI/UX",
    expertise: "Component architecture, design fidelity, and responsive visual optimization.",
    image: "/images/smartshield/lumabi.png"
  },
  {
    id: 10,
    name: "John Roel Masagnay",
    role: "Lead Developer",
    expertise: "Technical leadership, system integration, and end-to-end engineering quality.",
    image: "/images/smartshield/masagnay.png"
  },
  {
    id: 11,
    name: "Lea C. Naul",
    role: "Documentation Coordinator",
    expertise: "Documentation governance, content alignment, and quality assurance workflows.",
    image: "/images/smartshield/naul.png"
  },
  {
    id: 12,
    name: "John Cleanzy G. Roque",
    role: "Technical Writer",
    expertise: "Technical writing, process mapping, and structured product documentation.",
    image: "/images/smartshield/roque.png"
  },
  {
    id: 13,
    name: "Mica Mae Khhent Tamon",
    role: "Documentation Coordinator",
    expertise: "Content coordination, research briefs, and cross-team documentation support.",
    image: "/images/smartshield/tamon.png"
  }
];

function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const yReverse = useTransform(scrollY, [0, 500], [0, -120]);

  return (
    <section className="pt-32 md:pt-44 pb-16 md:pb-20 px-6 relative overflow-hidden">
      <motion.div style={{ y }} className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#545BFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <motion.div style={{ y: yReverse }} className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#b19eef]/10 rounded-full blur-[120px] pointer-events-none" />
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
            <span className="text-[#545BFF] text-xs font-bold tracking-widest uppercase">Meet Our Team</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-heading mb-6 leading-[0.95] tracking-tight"
        >
          Meet Our<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#545BFF] to-[#b19eef]">SmartShield</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base md:text-lg text-faded max-w-3xl mx-auto leading-relaxed"
        >
          The people turning SmartShield into a practical security platform through engineering, design, and documentation excellence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-[#545BFF]/20 bg-white/55 dark:bg-[#101528]/60 backdrop-blur-sm px-5 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-faded">Team Size</p>
            <p className="text-xl font-bold text-heading">{teamMembers.length} Members</p>
          </div>
          <div className="rounded-2xl border border-[#545BFF]/20 bg-white/55 dark:bg-[#101528]/60 backdrop-blur-sm px-5 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-faded">Focus</p>
            <p className="text-xl font-bold text-heading">Build + Design</p>
          </div>
          <div className="rounded-2xl border border-[#545BFF]/20 bg-white/55 dark:bg-[#101528]/60 backdrop-blur-sm px-5 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-faded">Mission</p>
            <p className="text-xl font-bold text-heading">Secure Web</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TeamGridSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="pb-24 md:pb-32 px-6 relative">
      <div className="absolute inset-x-0 top-10 h-60 bg-gradient-to-b from-[#545BFF]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 relative z-10">
          {teamMembers.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              whileHover={{ y: -5, transition: { duration: 0.22 } }}
              className="group relative h-full"
            >
              <div className="relative rounded-[22px] p-[1px] bg-gradient-to-br from-[#545BFF]/50 via-[#7a83ff]/20 to-transparent shadow-[0_14px_44px_rgba(84,91,255,0.16)] h-full">
                <div className="relative rounded-[21px] bg-white/82 dark:bg-[#0f1322]/84 border border-white/35 dark:border-[#8d95ff]/10 backdrop-blur-sm p-5 md:p-6 min-h-[252px] h-full transition-colors duration-300 flex flex-col">
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 md:h-[92px] md:w-[92px] shrink-0 overflow-hidden rounded-full border-2 border-[#545BFF]/35 shadow-[0_0_0_4px_rgba(84,91,255,0.08)]">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="96px"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-heading leading-tight mb-2 break-words">
                        {member.name}
                      </h3>
                      <p className="inline-flex max-w-full text-[11px] md:text-xs px-3 py-1 rounded-full bg-[#545BFF]/10 border border-[#545BFF]/20 text-[#4550e9] dark:text-[#a4acff] font-semibold leading-tight break-words">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#545BFF]/10 pt-4 flex-1">
                    <p className="text-sm text-faded leading-relaxed min-h-[66px] md:min-h-[72px]">
                      {member.expertise}
                    </p>
                  </div>

                  <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-[#545BFF]/25 rounded-tr-md" />
                  <div className="pointer-events-none absolute left-3 bottom-3 h-4 w-4 border-l border-b border-[#545BFF]/25 rounded-bl-md" />
                </div>

                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#545BFF]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-page text-copy">
      <Navbar />
      
      <HeroSection />
      <TeamGridSection />

      <Footer />
    </main>
  );
}
