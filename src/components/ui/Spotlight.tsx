"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = {
  /** Diameter of the glow in px. */
  size?: number;
  className?: string;
  opacity?: number;
};

/**
 * A soft red bloom that trails the pointer across its nearest positioned
 * ancestor. Sits behind content and never intercepts events.
 */
export default function Spotlight({ size = 900, className = "", opacity = 0.5 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      const parent = el?.parentElement;
      if (!el || !parent) return;

      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!fine || reduced) {
        gsap.set(el, { opacity: opacity * 0.6, xPercent: -50, yPercent: -50, left: "60%", top: "35%" });
        return;
      }

      gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0 });

      const xTo = gsap.quickTo(el, "x", { duration: 1.1, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 1.1, ease: "power3" });

      let shown = false;
      const onMove = (e: PointerEvent) => {
        const r = parent.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= window.innerHeight) {
          if (shown) {
            shown = false;
            gsap.to(el, { opacity: 0, duration: 0.3 });
          }
          return;
        }

        xTo(e.clientX - r.left);
        yTo(e.clientY - r.top);
        if (!shown) {
          shown = true;
          gsap.to(el, { opacity, duration: 0.9 });
        }
      };
      const onLeave = () => {
        shown = false;
        gsap.to(el, { opacity: 0, duration: 0.7 });
      };

      const onScroll = () => {
        const r = parent.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= window.innerHeight) {
          if (shown) {
            shown = false;
            gsap.to(el, { opacity: 0, duration: 0.4 });
          }
        }
      };

      parent.addEventListener("pointermove", onMove);
      parent.addEventListener("pointerleave", onLeave);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        parent.removeEventListener("pointermove", onMove);
        parent.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("scroll", onScroll);
      };
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden
      className={"pointer-events-none absolute left-0 top-0 z-0 rounded-full " + className}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, hsl(var(--red-mid-c) / 0.30) 0%, hsl(var(--red-c) / 0.14) 32%, hsl(var(--red-deep-c) / 0.05) 55%, transparent 70%)",
        filter: "blur(28px)",
      }}
    />
  );
}
