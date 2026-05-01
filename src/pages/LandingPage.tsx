import React from "react";
import { motion } from "motion/react";
import { HeroSection } from "../components/landing/HeroSection";
import { FeatureSection } from "../components/landing/FeatureSection";
import { GamerShowcase } from "../components/landing/GamerShowcase";
import { LobbiesPreview } from "../components/landing/LobbiesPreview";
import { PlatformStats } from "../components/landing/PlatformStats";
import { LiveActivity } from "../components/landing/LiveActivity";
import { Footer } from "../components/landing/Footer";
import { ScrollFlameEffect } from "../components/landing/ScrollFlameEffect";

const SectionReveal = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="relative z-1"
  >
    {children}
  </motion.div>
);

export const LandingPage = () => {
  return (
    <div className="flex flex-col relative min-h-screen bg-dark-bg selection:bg-neon-pink selection:text-white">
      <ScrollFlameEffect />
      <HeroSection />

      <div className="relative">
        <SectionReveal>
          <PlatformStats />
        </SectionReveal>

        <SectionReveal>
          <FeatureSection />
        </SectionReveal>

        <div className="container mx-auto max-w-6xl px-4 py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
             <div className="lg:col-span-2">
                <SectionReveal>
                  <LobbiesPreview />
                </SectionReveal>
             </div>
             <div className="lg:col-span-1">
                <SectionReveal>
                   <div className="sticky top-24">
                      <LiveActivity />
                   </div>
                </SectionReveal>
             </div>
          </div>
        </div>

        <SectionReveal>
          <GamerShowcase />
        </SectionReveal>

        <Footer />
      </div>

      {/* Global Background Glows */}
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] bg-neon-blue/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-neon-pink/5 rounded-full blur-[150px]" />
      </div>
    </div>
  );
};
