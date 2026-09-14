"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Download,
  Share,
  SquarePlus,
  CheckCircle2,
  Wifi,
  Zap,
  Bell,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EnablePushButton } from "@/components/EnablePushButton";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "prompt" | "ios-safari" | "ios-other" | "unsupported";

function detectPlatform(deferred: boolean): Platform {
  if (deferred) return "prompt";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (!isIOS) return "unsupported";
  const isOtherIOSBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|mercury/.test(ua);
  return isOtherIOSBrowser ? "ios-other" : "ios-safari";
}

const BENEFITS = [
  { icon: Zap, text: "Abre na hora, sem esperar o navegador carregar" },
  { icon: Wifi, text: "Funciona até sem internet (com o que já carregou)" },
  { icon: Bell, text: "Avisa quando sua carta da lista de desejo aparece" },
  { icon: Smartphone, text: "Fica na tela inicial, do lado dos outros apps" },
];

export function InstallClient({ loggedIn }: { loggedIn: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    queueMicrotask(() => {
      setInstalled(standalone);
      setReady(true);
    });

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
    } finally {
      setInstalling(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.origin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const platform = ready ? detectPlatform(!!deferredPrompt) : "unsupported";

  return (
    <div className="mx-auto max-w-md px-5 py-14 text-center sm:py-20">
      <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-[1.75rem] border-2 border-ink/10 shadow-lg shadow-orange-deep/10">
        <Image src="/icon-512.png" alt="" fill sizes="96px" className="object-cover" />
      </div>

      <h1 className="mt-6 font-display text-4xl leading-[1.02] text-ink text-comic-shadow-sm sm:text-5xl">
        EASY CARDS
        <br />
        <span className="text-orange-deep">NO SEU CELULAR</span>
      </h1>
      <p className="mt-4 text-sm text-ink-muted">
        Instala o app — de graça, sem loja, sem ocupar espaço à toa. É o mesmo site, só que mais
        rápido e sem barra de navegador.
      </p>

      <div className="mt-8">
        {!ready ? (
          <div className="h-14 animate-pulse rounded-full bg-surface-alt" />
        ) : installed ? (
          <div className="flex items-center justify-center gap-2 rounded-full border-2 border-teal/40 bg-teal/10 px-6 py-3.5 font-bold text-teal">
            <CheckCircle2 className="h-5 w-5" />
            Já instalado nesse aparelho 🎉
          </div>
        ) : platform === "prompt" ? (
          <Button
            onClick={handleInstall}
            disabled={installing}
            className="h-auto w-full gap-2 rounded-full py-3.5 text-base shadow-lg shadow-orange-deep/25"
          >
            <Download className="h-5 w-5" />
            {installing ? "Abrindo…" : "Instalar agora"}
          </Button>
        ) : platform === "ios-safari" ? (
          <div className="space-y-3 rounded-[1.75rem] border-2 border-ink/10 bg-surface p-5 text-left">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-orange-deep">
              No iPhone, é pelo Safari — 3 toques
            </p>
            <ol className="space-y-3 text-sm text-ink">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-deep/10 font-display text-sm text-orange-deep">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Toca no ícone de compartilhar
                  <Share className="h-4 w-4 shrink-0 text-ink-muted" />
                  na barra de baixo
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-deep/10 font-display text-sm text-orange-deep">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Desce e toca em
                  <SquarePlus className="h-4 w-4 shrink-0 text-ink-muted" />
                  <strong>&quot;Adicionar à Tela de Início&quot;</strong>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-deep/10 font-display text-sm text-orange-deep">
                  3
                </span>
                <span>Toca em <strong>&quot;Adicionar&quot;</strong> — pronto</span>
              </li>
            </ol>
          </div>
        ) : platform === "ios-other" ? (
          <div className="space-y-3 rounded-[1.75rem] border-2 border-orange-deep/30 bg-orange-deep/5 p-5 text-left">
            <p className="text-sm text-ink">
              No iPhone, instalar só funciona pelo <strong>Safari</strong> — é regra da Apple, não é
              limitação nossa. Esse link tá aberto em outro navegador.
            </p>
            <p className="text-sm text-ink-muted">
              Copia o link, abre o Safari e cola lá. Depois é só seguir o passo a passo.
            </p>
            <Button
              onClick={copyLink}
              variant="outline"
              className="h-auto w-full gap-2 rounded-full py-3"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link copiado!" : "Copiar link do site"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-[1.75rem] border-2 border-ink/10 bg-surface p-5 text-sm text-ink-muted">
            <p>
              Seu navegador não abriu a instalação automática. Procura por{" "}
              <strong className="text-ink">&quot;Instalar app&quot;</strong> ou{" "}
              <strong className="text-ink">&quot;Adicionar à tela inicial&quot;</strong> no menu dele
              (geralmente nos três pontinhos, ⋮).
            </p>
          </div>
        )}
      </div>

      <ul className="mt-10 space-y-3 text-left">
        {BENEFITS.map((b) => (
          <li key={b.text} className="flex items-center gap-3 text-sm text-ink">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
              <b.icon className="h-4 w-4" />
            </span>
            {b.text}
          </li>
        ))}
      </ul>

      <div className="mt-8 border-t-2 border-dashed border-ink/10 pt-8">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Quer o aviso na hora?
        </p>
        {loggedIn ? (
          <div className="mt-3">
            <EnablePushButton />
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">
            <Link href="/login?next=/instalar" className="font-bold text-orange-deep">
              Entra na sua conta
            </Link>{" "}
            pra ativar notificação de carta da lista de desejo.
          </p>
        )}
      </div>
    </div>
  );
}
