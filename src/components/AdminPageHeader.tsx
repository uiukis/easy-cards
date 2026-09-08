"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

/** Shared header band for the admin sub-pages, mirroring the dashboard's
 *  halftone bleed so the whole panel reads as one piece. Bleeds to the
 *  edges of <main> in app/admin/layout.tsx. */
export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-halftone -mx-4 -mt-6 rounded-b-[2rem] px-4 pb-6 pt-2 sm:-mx-6 sm:-mt-8 sm:px-6 sm:pt-4 md:-mx-10 md:-mt-8 md:px-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="font-comic text-sm text-primary">{eyebrow}</p>}
          <h1 className="flex items-center gap-2 font-display text-2xl text-ink text-comic-shadow-sm sm:text-3xl">
            {Icon && <Icon className="h-6 w-6 shrink-0 text-primary" />}
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}
