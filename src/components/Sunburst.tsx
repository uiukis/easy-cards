"use client";

import { motion } from "motion/react";

/** Fills its parent; wrap in a positioned/sized element. */
export function Sunburst() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      className="bg-sunburst h-full w-full"
    />
  );
}
