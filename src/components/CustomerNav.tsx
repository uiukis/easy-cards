"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Wallet, BookOpen, Home } from "lucide-react";
import { LogoutButton } from "@/app/admin/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/minhas-cartas", label: "Minhas cartas", icon: Wallet },
  { href: "/fichario", label: "Fichário", icon: BookOpen },
];

export function CustomerNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="mb-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
        <Image src="/brand/icon-square.png" alt="Easy Cards" width={32} height={32} className="rounded-full" />
        <span className="text-comic-shadow-sm font-display text-lg tracking-wide text-orange-deep">
          EASY <span className="text-orange">CARDS</span>
        </span>
      </Link>

      <nav className="hidden items-center gap-1 sm:flex">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive(link.href)
                ? "bg-orange-deep text-white shadow-sm shadow-orange-deep/25"
                : "text-ink-muted hover:bg-surface-alt hover:text-ink"
            }`}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
        <LogoutButton className="ml-1" />
        <ThemeToggle />
      </nav>

      <div className="flex items-center gap-2 sm:hidden">
        <ThemeToggle />
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink/15 bg-surface text-ink transition-transform active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm sm:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-halftone fixed inset-y-0 right-0 z-50 flex w-64 max-w-[80vw] flex-col border-l-2 border-ink/10 bg-surface px-4 py-5 shadow-2xl sm:hidden"
            >
              <div className="flex items-center justify-between px-1">
                <span className="font-display text-sm tracking-wide text-ink">MENU</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-transform active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="mt-4 flex-1 space-y-1">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive(link.href)
                        ? "bg-orange-deep text-white shadow-sm"
                        : "text-ink-muted hover:bg-surface-alt hover:text-ink"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="border-t-2 border-ink/10 pt-4">
                <LogoutButton className="w-full justify-start" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
