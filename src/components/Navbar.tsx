"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { User, Menu, X } from "lucide-react";
import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import { WhatsAppIcon, InstagramIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { Badge } from "@/components/ui/badge";

const LINKS = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/evento", label: "Evento" },
  { href: "/leiloes", label: "Leilões" },
  { href: "/#comunidade", label: "Comunidade" },
  { href: "/imprensa", label: "Na mídia" },
  { href: "/novidades", label: "Novidades" },
  { href: "/cartas", label: "Cartas" },
  { href: "/fichario", label: "Fichário", beta: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [shopOn, setShopOn] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink transition-colors hover:bg-surface-alt sm:flex"
          >
            <User className="h-4 w-4" />
          </Link>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-surface text-ink transition-colors hover:bg-surface-alt md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm md:hidden"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-halftone fixed inset-y-0 right-0 z-[61] flex w-72 max-w-[82vw] flex-col overflow-y-auto border-l-2 border-ink/10 bg-surface px-5 py-5 shadow-2xl md:hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm tracking-wide text-ink">MENU</span>
                    <button
                      onClick={() => setOpen(false)}
                      aria-label="Fechar menu"
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/10 text-ink transition-transform active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <nav className="mt-5 flex flex-1 flex-col gap-1">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
                      >
                        {link.label}
                        {link.beta && (
                          <Badge variant="secondary" className="font-comic text-[10px] tracking-wide">
                            beta
                          </Badge>
                        )}
                      </Link>
                    ))}
                    <Link
                      href="/portal"
                      onClick={() => setOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
                    >
                      <User className="h-4 w-4" />
                      Minha conta
                    </Link>
                  </nav>

                  <div className="mt-4 border-t-2 border-ink/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-muted">Tema</span>
                      <ThemeToggle />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={SITE.whatsappGroup}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-teal px-3 py-2 text-xs font-bold text-white"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        Grupo
                      </a>
                      <a
                        href={SITE.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-full border-2 border-ink/15 px-3 py-2 text-xs font-bold text-ink"
                      >
                        <InstagramIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.header>
  );
}
