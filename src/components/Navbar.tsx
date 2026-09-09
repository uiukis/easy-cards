"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { User } from "lucide-react";
import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import { WhatsAppIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";

const LINKS = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/evento", label: "Evento" },
  { href: "/#leiloes", label: "Leilões" },
  { href: "/#comunidade", label: "Comunidade" },
  { href: "/imprensa", label: "Na mídia" },
  { href: "/novidades", label: "Novidades" },
  { href: "/cartas", label: "Cartas" },
  { href: "/fichario", label: "Fichário", beta: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [shopOn, setShopOn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    createClient()
      .from("site_settings")
      .select("value")
      .eq("key", "shop_enabled")
      .maybeSingle()
      .then(({ data }) => setShopOn(data?.value === true));
  }, []);

  const links = shopOn ? [{ href: "/loja", label: "Loja" }, ...LINKS] : LINKS;

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? "bg-surface/90 backdrop-blur-md shadow-sm shadow-black/5" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
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
        </Link>

        <div className="hidden items-center gap-4 md:flex lg:gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-ink-muted transition-colors hover:text-ink lg:text-sm"
            >
              {link.label}
              {link.beta && (
                <Badge
                  variant="secondary"
                  className="translate-y-px font-comic text-[10px] leading-none tracking-wide"
                >
                  beta
                </Badge>
              )}
            </Link>
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
          <Link
            href="/portal"
            aria-label="Entrar na sua conta"
            title="Entrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink transition-colors hover:bg-surface-alt"
          >
            <User className="h-4 w-4" />
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
}
