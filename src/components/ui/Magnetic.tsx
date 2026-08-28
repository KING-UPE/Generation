"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** How far the element is allowed to chase the pointer, in px. */
  strength?: number;
};

/**
 * Wraps any element so it drifts toward the pointer while hovered and springs
 * back on exit. Disabled on coarse pointers and under reduced-motion.
 */
export default function Magnetic({ children, className = "", strength = 26 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!fine || reduced) return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * strength * 2);
        yTo(((e.clientY - r.top) / r.height - 0.5) * strength * 2);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={"inline-block will-change-transform " + className}>
      {children}
    </div>
  );
}
