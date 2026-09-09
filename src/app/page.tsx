import { EventBanner } from "@/components/EventBanner";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { EventsSection } from "@/components/EventsSection";
import { AuctionsSection } from "@/components/AuctionsSection";
import { ToolsSection } from "@/components/ToolsSection";
import { CardOfWeekSection, type CardOfWeek } from "@/components/CardOfWeekSection";
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
  const [{ data: pressMentions }, { data: supporters }, { data: founders }, { data: featuredAuction }] =
    await Promise.all([
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
    supabase
      .from("founders")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("auctions").select("*").eq("featured", true).maybeSingle(),
  ]);

  const [{ data: cardOfWeek }, { data: statsData }] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "card_of_week").maybeSingle(),
    supabase.rpc("community_stats"),
  ]);
  const stats = (statsData ?? {
    binders: 0,
    cardsInBinders: 0,
    wishlistCards: 0,
    auctions: 0,
  }) as { binders: number; cardsInBinders: number; wishlistCards: number; auctions: number };

  return (
    <>
      <EventBanner />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <ToolsSection />
        <CardOfWeekSection
          card={(cardOfWeek?.value ?? null) as CardOfWeek | null}
          stats={stats}
        />
        <EventsSection />
        <PressSection mentions={pressMentions ?? []} />
        <AuctionsSection featured={featuredAuction ?? null} />
        <GradedShowcase />
        <SupportSection />
        <SupportersStrip supporters={supporters ?? []} />
        <Community />
        <Founders founders={founders ?? []} />
      </main>
      <Footer />
      <JoinModal />
    </>
  );
}
