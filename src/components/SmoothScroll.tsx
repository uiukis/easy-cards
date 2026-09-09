"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

// Buttery inertia scroll — but only on the public/marketing pages. The admin
// panel, fichário editor and account screens keep native scroll (sticky bars,
// modals, drag gestures don't play well with a hijacked scroll).
const NATIVE_PREFIXES = [
  "/admin",
  "/portal",
  "/login",
  "/cadastro",
  "/minhas-cartas",
  "/lista-de-desejos",
  "/fichario/", // list page is fine, the editor isn't
];

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const native = NATIVE_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === "/fichario";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (native || reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
