import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InstallClient } from "./InstallClient";

export const metadata: Metadata = {
  title: "Instalar o app — Easy Cards",
  description:
    "Instala a Easy Cards na tela inicial do seu celular: abre rápido, funciona offline e avisa quando sua carta aparece.",
};

export default function InstalarPage() {
  return (
    <>
      <Navbar />
      <main className="bg-halftone min-h-screen flex-1 bg-bg">
        <InstallClient />
      </main>
      <Footer />
    </>
  );
}
