"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { getServerTheme, getTheme, setTheme, subscribeTheme } from "@/lib/theme-store";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Alternar tema claro/escuro"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink transition-colors hover:bg-surface-alt"
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex"
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </motion.span>
    </button>
  );
}
