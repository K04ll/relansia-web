import Hero from "@/components/marketing/Hero";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import Pricing from "@/components/marketing/Pricing";
import FinalCTA from "@/components/marketing/FinalCTA";
import FAQ from "@/components/marketing/FAQ";

export default function Page() {
  return (
    <main>
      <Hero />
      <FeatureGrid />
      <Pricing />
      <FinalCTA />
      <FAQ />
    </main>
  );
}
