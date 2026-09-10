import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Easy Cards",
    short_name: "Easy Cards",
    description:
      "A comunidade de colecionadores de cards Pokémon: fichário, lista de desejo, leilões e mais.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf1df",
    theme_color: "#d9660b",
    lang: "pt-BR",
    categories: ["lifestyle", "shopping", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Meu fichário", url: "/fichario" },
      { name: "Lista de desejo", url: "/lista-de-desejos" },
      { name: "Galeria de cartas", url: "/cartas" },
    ],
  };
}
