"use client";

import { useEffect, useRef } from "react";

/**
 * Drop inside any `position: relative` card container to give it a holo/foil
 * glare that follows the pointer. No layout impact — it's a `pointer-events:none`
 * overlay that only listens on its parent. `kind` tunes the look.
 */
export function HoloShine({
  kind = "holo",
  className = "",
}: {
  kind?: "holo" | "reverse" | "special";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    // Pointer-driven glare only makes sense with a real hovering pointer;
    // on touch it would fight with drag/tap gestures.
    if (!window.matchMedia("(hover: hover)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        parent.style.setProperty("--holo-x", `${x}%`);
        parent.style.setProperty("--holo-y", `${y}%`);
        parent.style.setProperty("--holo-a", "1");
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      parent.style.setProperty("--holo-a", "0");
      parent.style.setProperty("--holo-x", "50%");
      parent.style.setProperty("--holo-y", "50%");
    };

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      data-kind={kind}
      className={`holo-shine pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
