import type { Metadata } from "next";
import { ApoiadorContent } from "./ApoiadorContent";

export const metadata: Metadata = {
  title: "Seja um apoiador — Easy Cards",
  description:
    "Aproxime sua loja da comunidade Pokémon TCG. Veja como funciona ser apoiador da Easy Cards: eventos presenciais, leilões e divulgação pra quem já ama o hobby.",
};

export default function ApoiadorPage() {
  return <ApoiadorContent />;
}
