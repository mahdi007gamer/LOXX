import React from "react";
import { HeroSection } from "../components/landing/HeroSection";
import { FeatureSection } from "../components/landing/FeatureSection";
import { GamerShowcase } from "../components/landing/GamerShowcase";
import { Footer } from "../components/landing/Footer";
import { ScrollFlameEffect } from "../components/landing/ScrollFlameEffect";

export const LandingPage = () => {
  return (
    <div className="flex flex-col">
      <ScrollFlameEffect />
      <HeroSection />
      <div className="relative z-10 space-y-12">
        <FeatureSection />
        <GamerShowcase />
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
