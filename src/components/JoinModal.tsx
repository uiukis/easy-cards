"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "./icons";

const STORAGE_KEY = "easycards:join-modal-seen";
const SHOW_DELAY_MS = 5000;

export function JoinModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // ignore storage access issues (e.g. private mode)
    }
    if (seen) return;

    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border-2 border-ink/10 bg-surface p-7 text-center shadow-2xl"
          >
            <button
              onClick={close}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
            >
              ✕
            </button>

            <Image
              src="/brand/icon-square.png"
              alt="Easy Cards"
              width={68}
              height={68}
              className="mx-auto rounded-full"
            />

            <h3 className="mt-4 font-display text-2xl tracking-wide text-ink">
              BORA PRA COMUNIDADE?
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Entra no grupo do WhatsApp pra comprar, vender, trocar e
              participar dos leilões com a galera da Easy Cards — e segue
              no Instagram pra não perder eventos e novidades.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={SITE.whatsappGroup}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Entrar no grupo
              </a>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="flex items-center justify-center gap-2 rounded-full border-2 border-ink/15 px-6 py-3 text-sm font-bold text-ink transition-transform hover:scale-105 hover:bg-surface-alt active:scale-95"
              >
                <InstagramIcon className="h-5 w-5" />
                Seguir no Instagram
              </a>
            </div>

            <button
              onClick={close}
              className="mt-4 text-xs font-medium text-ink-muted underline-offset-2 hover:underline"
            >
              Agora não
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
