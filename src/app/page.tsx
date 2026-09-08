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
import { PressSection } from "@/components/PressSection";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: pressMentions } = await supabase
    .from("press_mentions")
    .select("*")
    .eq("active", true)
    .order("published_date", { ascending: false });

  return (
    <>
      <EventBanner />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <EventsSection />
        <PressSection mentions={pressMentions ?? []} />
        <AuctionsSection />
        <GradedShowcase />
        <SupportSection />
        <Community />
        <Founders />
      </main>
      <Footer />
      <JoinModal />
    </>
  );
}
