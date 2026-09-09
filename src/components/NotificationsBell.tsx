"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificationsBell({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    createClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null)
      .then(({ count }) => {
        if (active) setCount(count ?? 0);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  const here = pathname === "/avisos";

  return (
    <Link
      href="/avisos"
      aria-label={count > 0 ? `${count} avisos não lidos` : "Avisos"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink transition-colors hover:bg-surface-alt ${
        here ? "border-orange-deep text-orange-deep" : ""
      } ${className}`}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-deep px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
