import { Navbar, Footer } from "@/components/layout";
import { 
  HeroSection, 
  FeaturesSection, 
  HowItWorksSection, 
  CTASection 
} from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-hedera-50/50 dark:to-hedera-950/50">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
