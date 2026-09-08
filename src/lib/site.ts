export const SITE = {
  name: "Easy Cards",
  tagline: "Compra · Venda · Troca",
  whatsappGroup: "https://chat.whatsapp.com/HTsXTpTuDHJ7WOBfAcWAxk",
  instagram: "https://www.instagram.com/easycards.tcg/",
  instagramHandle: "@easycards.tcg",
  creator: {
    name: "uiukis",
    github: "https://github.com/uiukis",
    instagram: "https://www.instagram.com/_uiukis/",
  },
} as const;

export const NEXT_EVENT = {
  title: "Oficina Pokémon TCG",
  date: "19 de setembro",
  place: "Shopping RioMar Kennedy",
  tag: "Educativo, não competitivo",
} as const;

export const LARA_INSTAGRAM = "https://www.instagram.com/larita.tcg/";

export const EVENT_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfF8F_p1OM5NWIbFaAcpmvPoOKHKVNHUxhT5S2QeyRBY9lwWQ/viewform";

const TEAM_PHOTO_BASE =
  "https://fraxsrwhpbcwikghzcpe.supabase.co/storage/v1/object/public/team";

export const FOUNDERS = [
  {
    name: "Bão Santos",
    role: "CEO",
    instagram: "https://www.instagram.com/baosantoss/",
    image: `${TEAM_PHOTO_BASE}/bao-santos.jpg`,
  },
  {
    name: "Emanoel Sátiro",
    role: "CEO",
    instagram: "https://www.instagram.com/emanoelsatiro_/",
    image: `${TEAM_PHOTO_BASE}/emanoel-satiro.jpg`,
  },
  {
    name: "Victoria Silva",
    role: "COO",
    instagram: "https://www.instagram.com/torywins_/",
    image: `${TEAM_PHOTO_BASE}/tory-silva.jpg`,
  },
  {
    name: "Wilker Quirino",
    role: "CTO",
    instagram: "https://www.instagram.com/_uiukis/",
    image: `${TEAM_PHOTO_BASE}/wilker-quirino.jpg`,
  },
  {
    name: "Amanda Souza",
    role: "Coordenadora e Assessoria",
    instagram: "https://www.instagram.com/amanda.sm.br/",
    image: `${TEAM_PHOTO_BASE}/amanda-souza.jpg`,
  },
  {
    name: "Lara Lima",
    role: "Host e Influenciadora",
    instagram: "https://www.instagram.com/larita.tcg/",
    image: `${TEAM_PHOTO_BASE}/lara-lima.jpg`,
  },
  {
    name: "Beatriz Giffoni",
    role: "Mídias",
    instagram: "https://www.instagram.com/sbia.jpg/",
    image: `${TEAM_PHOTO_BASE}/beatriz-giffoni.jpg`,
  },
] as const;
