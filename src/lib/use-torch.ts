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
    const pos = { x: 0, y: 0 };
    let dirty = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pos.x = e.clientX - r.left;
      pos.y = e.clientY - r.top;
      dirty = true;
    };

    const tick = () => {
      if (!dirty) return;
      setX(pos.x);
      setY(pos.y);
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
