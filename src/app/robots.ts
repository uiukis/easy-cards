import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal", "/avisos", "/minhas-cartas", "/lista-de-desejos"],
    },
    sitemap: "https://easycardstcg.vercel.app/sitemap.xml",
  };
}
