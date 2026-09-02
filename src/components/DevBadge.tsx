"use client";

import { motion } from "motion/react";

export function DevBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="fixed bottom-5 right-5 z-40 rounded-full border border-yellow bg-surface/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-orange-deep shadow-lg backdrop-blur-sm"
    >
      Em desenvolvimento
    </motion.div>
  );
}
