export type SiteNavLink = { href: string; label: string; beta?: boolean };

// Homepage top nav (desktop bar + mobile drawer). Order matters here.
// Any of these can be hidden from Painel → Página inicial → "Menu do site";
// the hidden hrefs are stored in site_settings.nav_hidden.
export const SITE_NAV: SiteNavLink[] = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/evento", label: "Evento" },
  { href: "/leiloes", label: "Leilões" },
  { href: "/#comunidade", label: "Comunidade" },
  { href: "/imprensa", label: "Na mídia" },
  { href: "/novidades", label: "Novidades" },
  { href: "/cartas", label: "Cartas" },
  { href: "/fichario", label: "Fichário", beta: true },
];
