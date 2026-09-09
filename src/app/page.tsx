import { EventBanner } from "@/components/EventBanner";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { EventsSection } from "@/components/EventsSection";
import { AuctionsSection } from "@/components/AuctionsSection";
import { GradedShowcase } from "@/components/GradedShowcase";
import { SupportSection } from "@/components/SupportSection";
import { SupportersStrip } from "@/components/SupportersStrip";
import { Community } from "@/components/Community";
import { Founders } from "@/components/Founders";
import { Footer } from "@/components/Footer";
import { JoinModal } from "@/components/JoinModal";
import { PressSection } from "@/components/PressSection";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: pressMentions }, { data: supporters }] = await Promise.all([
    supabase
      .from("press_mentions")
      .select("*")
      .eq("active", true)
      .order("published_date", { ascending: false }),
    supabase
      .from("supporters")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

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
        <SupportersStrip supporters={supporters ?? []} />
        <Community />
        <Founders />
      </main>
      <Footer />
      <JoinModal />
    </>
  );
}
