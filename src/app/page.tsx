import { EventBanner } from "@/components/EventBanner";
import { AnnouncementsStrip } from "@/components/AnnouncementsStrip";
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
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: eventSettings }, { data: announcements }] = await Promise.all([
    supabase.from("event_settings").select("banner_enabled, banner_message").single(),
    supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <EventBanner
        enabled={eventSettings?.banner_enabled ?? true}
        message={eventSettings?.banner_message}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AnnouncementsStrip announcements={announcements ?? []} />
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
    </>
  );
}
