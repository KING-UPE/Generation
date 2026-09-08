"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Publishes the pointer position on an element as `--mx` / `--my` (px,
 * element-relative) so CSS gradients and masks can be lit by the cursor.
 * Writes are batched onto the GSAP ticker and skipped when nothing moved.
 */
export function useTorch(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const setX = gsap.quickSetter(el, "--mx", "px");
    const setY = gsap.quickSetter(el, "--my", "px");
    let clientX = 0;
    let clientY = 0;
    let dirty = false;

    const onMove = (e: PointerEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;
      dirty = true;
    };

    const tick = () => {
      if (!dirty) return;
      const r = el.getBoundingClientRect();
      setX(clientX - r.left);
      setY(clientY - r.top);
      dirty = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
    };
  }, [ref, enabled]);
}
