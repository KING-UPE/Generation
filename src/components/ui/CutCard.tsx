/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState, useEffect, useId } from "react";
import { gsap, useGSAP, DrawSVGPlugin } from "@/lib/gsap";
import { clamp } from "@/lib/scroll-state";

void DrawSVGPlugin;

type Props = {
  src: string;
  alt: string;
  /** Offsets the reveal so a stack of cards resolves in sequence. */
  delay?: number;
  className?: string;
};

/**
 * One card in the signature Genaration shape — a rectangle with a chamfered
 * top-left and bottom-right corner. Chamfer sizes are derived in JS from the
 * card's own width and fed to both the clip-path and the SVG outline that
 * traces it, so the two can never drift apart.
 */
export default function CutCard({ src, alt, delay = 0, className = "" }: Props) {
  const reactId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [box, setBox] = useState({ w: 0, h: 0, tl: 0, br: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const tl = Math.round(clamp(w * 0.075, 20, 62));
      const br = Math.round(clamp(w * 0.145, 34, 112));
      el.style.setProperty("--cut-tl", tl + "px");
      el.style.setProperty("--cut-br", br + "px");
      setBox((p) => (p.w === w && p.h === h ? p : { w, h, tl, br }));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h, tl, br } = box;
  const uid = "cc-" + reactId.replace(/:/g, "") + "-" + w + "x" + h;
  const outline =
    w && h
      ? "M " + tl + " 0.75 L " + (w - 0.75) + " 0.75 L " + (w - 0.75) + " " +
        (h - br) + " L " + (w - br) + " " + (h - 0.75) + " L 0.75 " +
        (h - 0.75) + " L 0.75 " + tl + " Z"
      : "";

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const intro = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 82%", once: true },
        delay,
      });

      intro
        .fromTo(wipeRef.current, { yPercent: 0 }, { yPercent: -101, duration: 1.15, ease: "genIO" })
        .fromTo(
          imgWrapRef.current,
          { scale: 1.22 },
          { scale: 1, duration: 1.5, ease: "gen" },
          0.05,
        );

      if (pathRef.current) {
        intro.fromTo(
          pathRef.current,
          { drawSVG: "0% 0%" },
          { drawSVG: "0% 100%", duration: 1.5, ease: "gen" },
          0.1,
        );
      }
    },
    { scope: rootRef, dependencies: [w, h] },
  );

  return (
    <div
      ref={rootRef}
      className={"cut-shape pointer-events-auto relative h-full w-full overflow-hidden bg-ink-2 " + className}
    >
      <div ref={imgWrapRef} className="absolute inset-0 will-change-transform">
        {/* Placeholder art — swap `src` for a real photo, layout is unchanged. */}
        <img
          data-zoom
          src={src}
          alt={alt}
          className="h-full w-full object-cover will-change-transform"
          loading="lazy"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

      {outline ? (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={"0 0 " + w + " " + h}
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF5A3C" />
              <stop offset="50%" stopColor="#FF2E2E" />
              <stop offset="100%" stopColor="#8B0212" />
            </linearGradient>
          </defs>
          <path ref={pathRef} d={outline} stroke={"url(#" + uid + ")"} strokeWidth={1.25} />
        </svg>
      ) : null}

      <div
        ref={wipeRef}
        className="pointer-events-none absolute inset-0 z-20"
        style={{ background: "var(--grad-red)" }}
      />
    </div>
  );
}
