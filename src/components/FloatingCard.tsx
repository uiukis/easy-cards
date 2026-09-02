"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { BallIcon } from "./icons";

const VARIANTS = {
  blue: "from-blue to-blue-dark",
  orange: "from-orange-light to-orange",
  teal: "from-teal to-blue-dark",
} as const;

export function FloatingCard({
  className = "",
  rotate = 0,
  variant = "blue",
  delay = 0,
  size = 96,
  imageUrl,
}: {
  className?: string;
  rotate?: number;
  variant?: keyof typeof VARIANTS;
  delay?: number;
  size?: number;
  imageUrl?: string;
}) {
  const [broken, setBroken] = useState(false);
  const showArt = Boolean(imageUrl) && !broken;

  return (
    // outer layer: entrance + idle bob, untouched by drag
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotate - 8 }}
      animate={{ opacity: 1, y: [0, -10, 0], rotate }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay },
        rotate: { duration: 0.6, delay },
      }}
      style={{ width: size, height: size * 1.4 }}
      className={className}
    >
      {/* inner layer: drag only, snaps back to origin on release */}
      <motion.div
        drag
        dragMomentum={false}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 60, bounceDamping: 22, restDelta: 0.5 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95, cursor: "grabbing" }}
        className="h-full w-full cursor-grab touch-none select-none"
      >
        {showArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Card Pokémon TCG"
            draggable={false}
            onError={() => setBroken(true)}
            className="h-full w-full rounded-lg object-contain drop-shadow-lg"
          />
        ) : (
          <div
            className={`h-full w-full rounded-xl bg-gradient-to-br ${VARIANTS[variant]} p-[3px] shadow-lg shadow-black/40`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-surface/90 backdrop-blur-sm">
              <BallIcon className="h-1/2 w-1/2 drop-shadow" />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
