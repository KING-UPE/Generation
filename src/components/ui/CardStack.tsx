"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import CutCard from "@/components/ui/CutCard";

type Card = { src: string; alt: string };

type Props = {
  cards: Card[];
  className?: string;
  /** Vertical drift across the scroll range, in px. */
  parallax?: number;
};

/** Where each card lands once the stack opens up. */
function fanTargets(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 1 : i / (count - 1);
    return {
      xPercent: gsap.utils.interpolate(-9, 9, t),
      yPercent: gsap.utils.interpolate(9, -7, t),
      rotation: gsap.utils.interpolate(-5, 4, t),
      scale: gsap.utils.interpolate(0.88, 1, t),
    };
  });
}

/**
 * Cards arrive as a single squared-up stack and fan out into an overlapping
 * spread. Pointer movement tilts the whole scene, with each card drifting by a
 * different amount so the layers separate in depth.
 */
export default function CardStack({ cards, className = "", parallax = 40 }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const scene = sceneRef.current;
      const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!root || !scene || !els.length) return;

      const targets = fanTargets(els.length);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* stacked → fanned */
      els.forEach((el, i) => {
        gsap.set(el, { xPercent: 0, yPercent: i * 1.5, rotation: 0, scale: 0.88, zIndex: i });
        gsap.to(el, {
          ...targets[i],
          duration: 1.35,
          ease: "gen",
          delay: 0.42 + i * 0.11,
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        });
      });

      if (reduced) return;

      gsap.to(scene, {
        y: -parallax,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 1 },
      });

      const cleanups: (() => void)[] = [];

      /**
       * Hover is resolved once on the stationary root and guarded on index
       * change, so a card can never retrigger its own enter/leave. Nothing here
       * alters a card's hit area — only the image inside the clip zooms — which
       * is what keeps the effect from oscillating at the edges.
       */
      let hovered = -1;
      const applyHover = (next: number) => {
        if (next === hovered) return;
        hovered = next;

        els.forEach((el, i) => {
          const on = next === i;
          gsap.to(el, {
            opacity: next === -1 || on ? 1 : 0.45,
            duration: 0.45,
            ease: "power2.out",
            overwrite: "auto",
          });
          gsap.set(el, { zIndex: on ? els.length : i });

          const img = el.querySelector<HTMLElement>("[data-zoom]");
          if (img) {
            gsap.to(img, {
              scale: on ? 1.07 : 1,
              duration: 0.7,
              ease: "power3.out",
              overwrite: "auto",
            });
          }
        });
      };

      const onOver = (e: PointerEvent) => {
        const card = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-card-index]");
        applyHover(card ? Number(card.dataset.cardIndex) : -1);
      };
      const onRootLeave = () => applyHover(-1);

      root.addEventListener("pointerover", onOver);
      root.addEventListener("pointerleave", onRootLeave);
      cleanups.push(() => {
        root.removeEventListener("pointerover", onOver);
        root.removeEventListener("pointerleave", onRootLeave);
      });

      /* pointer tilt — px offsets ride alongside the percent-based fan */
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const rotY = gsap.quickTo(scene, "rotationY", { duration: 0.9, ease: "power3" });
        const rotX = gsap.quickTo(scene, "rotationX", { duration: 0.9, ease: "power3" });
        const drift = els.map((el, i) => ({
          x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3" }),
          depth: 8 + i * 10,
        }));

        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          rotY(nx * 8);
          rotX(-ny * 6);
          drift.forEach((d) => {
            d.x(nx * d.depth);
            d.y(ny * d.depth);
          });
        };
        const onLeave = () => {
          rotY(0);
          rotX(0);
          drift.forEach((d) => {
            d.x(0);
            d.y(0);
          });
        };

        root.addEventListener("pointermove", onMove);
        root.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
        });
      }

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: rootRef, dependencies: [cards.length] },
  );

  return (
    <div
      ref={rootRef}
      /* Horizontal padding clears the fan: cards travel 9% of their width and
         the rotation adds ~2% more. Vertical padding stays tight so the column
         does not stretch the section taller than it needs to be. */
      className={"relative px-[11%] py-[6%] " + className}
      style={{ perspective: 1500 }}
    >
      {/* No preserve-3d: flattening the children keeps zIndex changes from
          forcing a 3D layer re-sort, which showed up as hover flicker. */}
      <div ref={sceneRef} className="relative aspect-[4/3] w-full">
        {cards.map((c, i) => (
          <div
            key={c.src}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            data-card-index={i}
            data-cursor="view"
            data-cursor-label="VIEW"
            /* pointer-events-none: the wrapper is full-scene sized and unclipped,
               so it must not capture — the clipped card inside does. */
            className="pointer-events-none absolute inset-0 will-change-transform"
          >
            <CutCard src={c.src} alt={c.alt} delay={0.42 + i * 0.11} />
          </div>
        ))}
      </div>
    </div>
  );
}
