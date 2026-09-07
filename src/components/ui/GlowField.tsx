"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { clamp } from "@/lib/scroll-state";

type Blob = {
  /** Centre, as a percentage of the field. */
  x: number;
  y: number;
  /** Diameter, as a percentage of the field's longer side. */
  size: number;
  core: string;
  edge: string;
  /** The two blob outlines it drifts between. */
  from: string;
  to: string;
  /** Seconds for one leg of the drift, so no two blobs breathe in step. */
  cycle: number;
};

/**
 * Four of them: enough to light the corners and leave a dark middle for text,
 * few enough that the field never resolves into an even wash. Sizes overlap so
 * the seams between them stay soft once blurred.
 */
const BLOBS: Blob[] = [
  {
    x: 15,
    y: 30,
    size: 54,
    core: "rgba(255,104,74,0.95)",
    edge: "rgba(225,6,0,0.35)",
    from: "62% 38% 46% 54% / 54% 44% 56% 46%",
    to: "44% 56% 63% 37% / 42% 58% 42% 58%",
    cycle: 11,
  },
  {
    x: 33,
    y: 92,
    size: 46,
    core: "rgba(225,6,0,0.85)",
    edge: "rgba(139,2,18,0.30)",
    from: "48% 52% 36% 64% / 62% 38% 62% 38%",
    to: "63% 37% 55% 45% / 38% 62% 38% 62%",
    cycle: 14,
  },
  {
    x: 74,
    y: 24,
    size: 42,
    core: "rgba(255,46,46,0.82)",
    edge: "rgba(139,2,18,0.30)",
    from: "56% 44% 62% 38% / 44% 56% 44% 56%",
    to: "38% 62% 42% 58% / 58% 40% 60% 42%",
    cycle: 9,
  },
  {
    x: 96,
    y: 82,
    size: 36,
    core: "rgba(198,10,30,0.85)",
    edge: "rgba(60,2,12,0.34)",
    from: "50% 50% 58% 42% / 46% 58% 42% 54%",
    to: "64% 36% 44% 56% / 60% 40% 56% 44%",
    cycle: 12,
  },
];

/** Blob opacity with the pointer nowhere near it, and at its centre. */
const REST = 0.66;
const LIT = 1;
/** How far the pointer's influence reaches, as a share of the field diagonal. */
const FALLOFF = 0.62;

type Props = {
  /** Blur radius in px. Larger fields want more, or the outlines show. */
  blur?: number;
  className?: string;
};

/**
 * A field of soft, irregular glows on black — the panel's whole background.
 *
 * Each blob keeps its own slow drift between two outlines so the field is never
 * still, and the pointer lifts whichever one it is nearest: brighter, a little
 * larger, and turned a few degrees, which reads as the shape flexing rather
 * than simply fading up. Coarse pointers and reduced-motion get the resting
 * field, which is a composition in its own right.
 *
 * Listens on its parent rather than itself, since it must not take events from
 * the content sitting above it.
 */
export default function GlowField({ blur = 54, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const skinRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const parent = root?.parentElement;
      if (!root || !parent) return;

      const wraps = wrapRefs.current.filter(Boolean) as HTMLSpanElement[];
      const skins = skinRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (wraps.length !== BLOBS.length) return;

      gsap.set(wraps, { xPercent: -50, yPercent: -50, opacity: REST });

      /*
       * Blob diameters come off the field's longer side, published as `--field`.
       *
       * Sized as a percentage of width they collapse on a phone, where the panel
       * turns from a 1264x521 letterbox into a 335x846 column: the same 54% goes
       * from 682px to 181px and the field reads as a smudge in one corner with
       * black everywhere else. There is no CSS length for "the larger of my
       * parent's two sides", so it is measured.
       */
      const sizeField = () => {
        const r = parent.getBoundingClientRect();
        root.style.setProperty("--field", Math.max(r.width, r.height) + "px");
      };
      sizeField();
      const ro = new ResizeObserver(sizeField);
      ro.observe(parent);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return () => ro.disconnect();

      /* The drift, which runs whether or not there is a pointer in the room. */
      skins.forEach((skin, i) => {
        const b = BLOBS[i];
        gsap.to(skin, {
          borderRadius: b.to,
          rotation: i % 2 ? 14 : -14,
          duration: b.cycle,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (!fine) return () => ro.disconnect();

      const opacityTo = wraps.map((w) =>
        gsap.quickTo(w, "opacity", { duration: 0.65, ease: "power2.out" }),
      );
      const scaleTo = wraps.map((w) =>
        gsap.quickTo(w, "scale", { duration: 0.8, ease: "power2.out" }),
      );
      const rotateTo = wraps.map((w) =>
        gsap.quickTo(w, "rotation", { duration: 1.1, ease: "power2.out" }),
      );

      const onMove = (e: PointerEvent) => {
        const r = parent.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;

        BLOBS.forEach((b, i) => {
          /* Distance in field space, so a wide panel does not make the
             horizontal reach feel shorter than the vertical one. */
          const dx = px - b.x / 100;
          const dy = (py - b.y / 100) * (r.height / r.width);
          const near = clamp(1 - Math.hypot(dx, dy) / FALLOFF, 0, 1);
          const eased = near * near;

          opacityTo[i](REST + (LIT - REST) * eased);
          scaleTo[i](1 + 0.16 * eased);
          rotateTo[i]((i % 2 ? 1 : -1) * 10 * eased);
        });
      };

      const onLeave = () => {
        BLOBS.forEach((_, i) => {
          opacityTo[i](REST);
          scaleTo[i](1);
          rotateTo[i](0);
        });
      };

      parent.addEventListener("pointermove", onMove);
      parent.addEventListener("pointerleave", onLeave);
      return () => {
        ro.disconnect();
        parent.removeEventListener("pointermove", onMove);
        parent.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={"pointer-events-none absolute inset-0 overflow-hidden bg-ink " + className}
    >
      {BLOBS.map((b, i) => (
        <span
          key={i}
          ref={(el) => {
            wrapRefs.current[i] = el;
          }}
          className="absolute block will-change-transform"
          style={{
            left: b.x + "%",
            top: b.y + "%",
            width: `calc(var(--field, 100%) * ${b.size / 100})`,
            aspectRatio: "1",
          }}
        >
          <span
            ref={(el) => {
              skinRefs.current[i] = el;
            }}
            className="block h-full w-full will-change-transform"
            style={{
              borderRadius: b.from,
              background: `radial-gradient(closest-side, ${b.core} 0%, ${b.edge} 58%, transparent 82%)`,
              filter: `blur(${blur}px)`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
