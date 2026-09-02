import Image from "next/image";
import { SITE } from "@/lib/site";
import { GitHubIcon, InstagramIcon, WhatsAppIcon, ArrowUpRight } from "./icons";

export function Footer() {
  return (
    <footer className="relative border-t-2 border-ink/10 bg-surface-alt">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <Image src="/brand/icon-square.png" alt="Easy Cards" width={30} height={30} className="rounded-full" />
              <span className="font-display text-lg text-ink">
                EASY <span className="text-orange-deep">CARDS</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Comunidade de colecionadores de cards Pokémon. Compra, venda,
              troca, eventos e leilões direto com a galera.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                Comunidade
              </h4>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <a
                  href={SITE.whatsappGroup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-ink/80 transition-colors hover:text-teal"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Grupo <ArrowUpRight className="h-3 w-3" />
                </a>
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-ink/80 transition-colors hover:text-orange-deep"
                >
                  <InstagramIcon className="h-4 w-4" /> Instagram <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t-2 border-ink/10 pt-6 text-xs text-ink-muted sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Easy Cards. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1.5">
            Criado por
            <a
              href={SITE.creator.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-ink/80 transition-colors hover:text-ink"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              {SITE.creator.name}
            </a>
            <span className="text-ink/20">·</span>
            <a
              href={SITE.creator.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-ink/80 transition-colors hover:text-ink"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
              @_uiukis
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
