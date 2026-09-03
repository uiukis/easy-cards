"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, PartyPopper } from "lucide-react";
import { NEXT_EVENT } from "@/lib/site";

const STORAGE_KEY = "easycards:event-banner-dismissed";

export function EventBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== "1") {
        queueMicrotask(() => setVisible(true));
      }
    } catch {
      queueMicrotask(() => setVisible(true));
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="overflow-hidden bg-orange-deep text-white"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center text-xs font-semibold sm:text-sm">
            <PartyPopper className="hidden h-4 w-4 shrink-0 sm:block" />
            <span>
              Primeiro evento presencial da Easy Cards — {NEXT_EVENT.date}{" "}
              no {NEXT_EVENT.place}
            </span>
            <Link
              href="/evento"
              className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-bold transition-colors hover:bg-white/25"
            >
              Saiba mais
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={dismiss}
              aria-label="Fechar aviso"
              className="ml-1 shrink-0 text-white/70 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
