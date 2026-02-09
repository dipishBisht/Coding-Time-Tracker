import CTA from "@/components/home/cta";
import Features from "@/components/home/features";
import Hero from "@/components/home/hero";
import StatsPreview from "@/components/home/stats-preview";
import HowItWorks from "@/components/how-it-works";

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <HowItWorks />
      <StatsPreview />
      <CTA />
    </div>
  );
}
