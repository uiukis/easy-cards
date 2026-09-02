"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { SITE } from "@/lib/site";
import { WhatsAppIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#eventos", label: "Eventos" },
  { href: "#leiloes", label: "Leilões" },
  { href: "#comunidade", label: "Comunidade" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? "bg-surface/90 backdrop-blur-md shadow-sm shadow-black/5" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-center gap-2">
          <Image
            src="/brand/icon-square.png"
            alt="Easy Cards"
            width={38}
            height={38}
            className="rounded-full"
          />
          <span className="text-comic-shadow-sm font-display text-lg tracking-wide text-orange-deep sm:text-xl">
            EASY <span className="text-orange">CARDS</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={SITE.whatsappGroup}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-bold text-white shadow-lg shadow-teal/20 transition-transform hover:scale-105 active:scale-95"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Entrar no grupo</span>
            <span className="sm:hidden">Grupo</span>
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
}
