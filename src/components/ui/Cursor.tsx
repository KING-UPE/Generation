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
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    document.body.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 });

    const dx = gsap.quickTo(dot, "x", { duration: 0.16, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.16, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.62, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.62, ease: "power3" });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.4 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    /* Guarded on the element itself: moving between children of the same
       target is a no-op, so the ring never restarts its tween mid-flight. */
    let current: HTMLElement | null = null;
    const applyCursor = (t: HTMLElement | null) => {
      if (t === current) return;
      current = t;

      const mode = t?.dataset.cursor;

      if (mode === "view") {
        label.textContent = t?.dataset.cursorLabel || "VIEW";
        gsap.to(ring, { width: 116, height: 116, borderColor: "transparent", background: "var(--grad-red)", duration: 0.5 });
        gsap.to(dot, { scale: 0, duration: 0.3 });
        gsap.to(label, { opacity: 1, duration: 0.35, delay: 0.06 });
      } else if (mode === "link") {
        gsap.to(ring, { width: 66, height: 66, borderColor: "var(--red-hot)", background: "transparent", duration: 0.45 });
        gsap.to(dot, { scale: 0.4, duration: 0.3 });
        gsap.to(label, { opacity: 0, duration: 0.2 });
      } else {
        gsap.to(ring, { ...IDLE, duration: 0.45 });
        gsap.to(dot, { scale: 1, duration: 0.3 });
        gsap.to(label, { opacity: 0, duration: 0.2 });
      }
    };

    /* pointerover alone covers both entering and leaving a target: leaving one
       fires pointerover on whatever is underneath, which resolves to null. */
    const onOver = (e: PointerEvent) =>
      applyCursor((e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cursor]") ?? null);

    const onLeave = () => {
      shown = false;
      applyCursor(null);
      gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
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
        ref={ringRef}
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border"
        style={{ width: 38, height: 38, borderColor: "rgba(255,255,255,0.45)", boxShadow: "0 0 12px rgba(255,59,47,0.35)" }}
      >
        <span
          ref={labelRef}
          className="font-mono-ui text-[10px] font-medium tracking-[0.22em] text-white opacity-0"
        />
      </div>
      <div
        ref={dotRef}
        className="absolute left-0 top-0 rounded-full bg-white"
        style={{ width: 7, height: 7, boxShadow: "0 0 8px #FF3B2F, 0 0 2px #FFFFFF" }}
      />
    </div>
  );
}
