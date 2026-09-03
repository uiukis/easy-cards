import { EventBanner } from "@/components/EventBanner";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { EventsSection } from "@/components/EventsSection";
import { AuctionsSection } from "@/components/AuctionsSection";
import { GradedShowcase } from "@/components/GradedShowcase";
import { SupportSection } from "@/components/SupportSection";
import { Community } from "@/components/Community";
import { Founders } from "@/components/Founders";
import { Footer } from "@/components/Footer";
import { JoinModal } from "@/components/JoinModal";
import { DevBadge } from "@/components/DevBadge";

export default function Home() {
  return (
    <>
      <EventBanner />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <EventsSection />
        <AuctionsSection />
        <GradedShowcase />
        <SupportSection />
        <Community />
        <Founders />
      </main>
      <Footer />
      <JoinModal />
      <DevBadge />
    </>
  );
}
