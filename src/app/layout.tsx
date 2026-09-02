import type { Metadata } from "next";
import { Luckiest_Guy, Bangers, Inter } from "next/font/google";
import "./globals.css";
import { themeInitScript } from "@/lib/theme-store";

const luckiestGuy = Luckiest_Guy({
  variable: "--font-luckiest",
  subsets: ["latin"],
  weight: "400",
});

const bangers = Bangers({
  variable: "--font-bangers",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Easy Cards — Compra, Venda e Troca de Cards Pokémon",
  description:
    "Easy Cards é a comunidade de colecionadores de cards Pokémon: compra, venda, troca, eventos, oficinas e leilões. Entre no grupo do WhatsApp e faça parte.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Easy Cards — Compra, Venda e Troca de Cards Pokémon",
    description:
      "A comunidade de colecionadores de cards Pokémon. Compra, venda, troca, eventos e leilões.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${luckiestGuy.variable} ${bangers.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
