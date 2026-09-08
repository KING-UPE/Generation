"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const IDLE = { width: 38, height: 38, borderColor: "rgba(237,237,240,0.35)", background: "transparent" };

/**
 * Two-body cursor: a hard dot that tracks tightly and a lagging ring that
 * morphs over anything carrying `data-cursor`. Uses difference blending so it
 * stays legible over both the black canvas and the red gradients.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const dot = dotRef.current;
    if (!dot) return;

    document.body.classList.add("has-custom-cursor");
    gsap.set(dot, { xPercent: -50, yPercent: -50, opacity: 0 });

    const dx = gsap.quickTo(dot, "x", { duration: 0.16, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.16, ease: "power3" });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to(dot, { opacity: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
    };

    let current: HTMLElement | null = null;
    const applyCursor = (t: HTMLElement | null) => {
      if (t === current) return;
      current = t;

      if (t) {
        gsap.to(dot, { scale: 1.6, duration: 0.25, ease: "power2.out" });
      } else {
        gsap.to(dot, { scale: 1, duration: 0.25, ease: "power2.out" });
      }
    };

    const onOver = (e: PointerEvent) =>
      applyCursor((e.target as HTMLElement | null)?.closest<HTMLElement>("a, button, [data-cursor], input, [role='button']") ?? null);

    const onLeave = () => {
      shown = false;
      applyCursor(null);
      gsap.to(dot, { opacity: 0, duration: 0.3 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100000] hidden md:block">
      <div
        ref={dotRef}
        className="absolute left-0 top-0 rounded-full bg-white"
        style={{ width: 8, height: 8, boxShadow: "0 0 10px #FF3B2F, 0 0 3px #FFFFFF" }}
      />
    </div>
  );
}
