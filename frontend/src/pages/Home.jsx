import React from "react";

import "../home.css";

import HomeNavbar from "../components/HomeNavbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import FeaturesSection from "../components/FeaturesSection";
import HowItWorks from "../components/HowItWorks";
import RolesSection from "../components/RolesSection";
import StatsSection from "../components/StatsSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="home-page">
      <HomeNavbar />

      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorks />
        <RolesSection />
        <StatsSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

export default Home;