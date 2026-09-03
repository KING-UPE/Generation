"use client";

import React, { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useTorch } from "@/lib/use-torch";

type Props = {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  className?: string;
  /** Radius of the lit pool, in px. */
  radius?: number;
  /** Stroke weight, in px. */
  weight?: number;
  start?: gsap.plugins.ScrollTriggerInstanceVars["start"];
  /** Read the scroll position off this element instead of the title itself. */
  trigger?: React.RefObject<HTMLElement | null>;
};

/**
 * A hollow display title — outline only, no fill — with a red light that
 * travels through the stroke. On scroll-in the light sweeps across once, then
 * the pointer takes over. Both layers are unfilled, so the letters stay open.
 */
export default function LitTitle({
  children,
  as: Tag = "h2",
  className = "",
  radius = 260,
  weight = 1.6,
  start = "top 84%",
  trigger,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const [torchActive, setTorchActive] = useState(false);

  useTorch(glowRef, torchActive);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const glow = glowRef.current;
      if (!wrap || !glow) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const w = glow.offsetWidth || 600;
      const h = glow.offsetHeight || 120;

      /* Park the light off the left edge, vertically centred. */
      gsap.set(glow, { "--mx": -0.3 * w + "px", "--my": h / 2 + "px" });

      if (reduced) {
        gsap.set(wrap, { opacity: 1, y: 0 });
        setTorchActive(true);
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: trigger?.current ?? wrap, start, once: true },
        onComplete: () => setTorchActive(true),
      });

      tl.fromTo(
        wrap,
        { opacity: 0, y: 44 },
        { opacity: 1, y: 0, duration: 1.15, ease: "gen" },
      ).fromTo(
        glow,
        { "--mx": -0.3 * w + "px" },
        { "--mx": 1.3 * w + "px", duration: 2.1, ease: "power2.inOut" },
        0.25,
      );
    },
    { scope: wrapRef, dependencies: [children, start] },
  );

  return (
    <div ref={wrapRef} className="relative inline-block m-0 p-0">
      {React.createElement(
        Tag,
        {
          className: "font-display lit-base block select-none m-0 p-0 " + className,
          style: { ["--lit-w" as string]: weight + "px" },
        },
        children
      )}

      {/* the lit copy, revealed through a radial mask */}
      <span
        ref={glowRef}
        aria-hidden
        className={"font-display lit-glow pointer-events-none absolute inset-0 block select-none m-0 p-0 " + className}
        style={{ ["--lit-w" as string]: weight + "px", ["--lit-r" as string]: radius + "px" }}
      >
        {children}
      </span>
    </div>
  );
}
