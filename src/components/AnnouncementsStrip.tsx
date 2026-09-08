import { Megaphone } from "lucide-react";
import type { Announcement } from "@/lib/supabase/types";

export function AnnouncementsStrip({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;

  return (
    <div className="relative border-y-2 border-ink/10 bg-surface-alt/60 py-3">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 sm:px-8">
        {announcements.map((a) => (
          <span key={a.id} className="flex items-center gap-1.5 text-xs font-semibold text-ink sm:text-sm">
            <Megaphone className="h-3.5 w-3.5 shrink-0 text-orange-deep" />
            {a.message}
          </span>
        ))}
      </div>
    </div>
  );
}
