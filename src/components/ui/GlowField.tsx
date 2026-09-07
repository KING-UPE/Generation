"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { clamp } from "@/lib/scroll-state";

const TAU = Math.PI * 2;

/** Points sampled across each wave. Past a blur this wide, nobody sees a chord. */
const SAMPLES = 56;
/** How far past each edge the paths run, so the blur has material to work with. */
const BLEED = 0.12;

type Wave = {
  /** Centre line, as a share of the field height. */
  y: number;
  /** Band thickness, as a share of the field height. */
  thickness: number;
  /** Two amplitudes and two wavelengths, so the crest never repeats cleanly. */
  amp: number;
  amp2: number;
  freq: number;
  freq2: number;
  /** Phase drift per second. Signs differ so the bands cross rather than march. */
  speed: number;
  fill: string;
};

/**
 * Four bands rather than four blobs.
 *
 * Each is a ribbon whose top and bottom edges are the same travelling wave, so
 * the light reads as a crest moving through the panel instead of a lamp sitting
 * in it. They overlap, and the dark the text sits in is the trough between them.
 *
 * Built only from the palette's reds — #FF2E2E, #E10600, #8B0212. The lightest
 * stop of `--grad-red` is #FF5A3C, which is fine as a sliver in a gradient but
 * swings the whole field orange once it is carrying an area this size.
 *
 * Fills are light: four bands at full strength flood the panel into an even red
 * and the crests stop reading.
 *
 * Two ride the top edge and two the bottom, both pairs centred mostly outside
 * the panel so only their shoulders show. That is deliberate — it leaves a
 * black channel roughly 130px deep across the middle, and the title and the
 * figures sit in it. The channel is the trough between crests rather than a
 * mask laid over them, so it breathes as they travel.
 */
const WAVES: Wave[] = [
  {
    y: 0.08,
    thickness: 0.4,
    amp: 0.07,
    amp2: 0.03,
    freq: 0.9,
    freq2: 1.7,
    speed: 0.09,
    fill: "rgba(255,46,46,0.34)",
  },
  {
    y: 0.28,
    thickness: 0.2,
    amp: 0.05,
    amp2: 0.022,
    freq: 1.25,
    freq2: 2.3,
    speed: -0.12,
    fill: "rgba(225,6,0,0.36)",
  },
  {
    y: 0.88,
    thickness: 0.34,
    amp: 0.055,
    amp2: 0.024,
    freq: 0.7,
    freq2: 1.9,
    speed: 0.07,
    fill: "rgba(214,6,28,0.44)",
  },
  {
    y: 1.06,
    thickness: 0.32,
    amp: 0.048,
    amp2: 0.02,
    freq: 1.5,
    freq2: 2.6,
    speed: -0.1,
    fill: "rgba(168,3,22,0.42)",
  },
];

/** Band opacity with the pointer nowhere near it, and directly on it. */
const REST = 0.62;
const LIT = 1;
/** Reach of the pointer's brightening, as a share of the field height. */
const FALLOFF = 0.55;

/**
 * The dent the pointer puts in a crest: how wide, as a share of the field width,
 * and how deep, as a share of its height. Wide enough to bend a whole crest
 * rather than nick it.
 */
const BUMP_WIDTH = 0.18;
const BUMP_LIFT = 0.16;

type Props = {
  /** Blur radius in px. */
  blur?: number;
  className?: string;
};

/**
 * A field of slow red waves on black — the panel's whole background.
 *
 * The crests travel on their own, and the pointer pulls the nearest one out of
 * shape: the band under it brightens, and the wave itself lifts into a bump
 * that follows the cursor across the panel. Both fall away when the pointer
 * leaves. Coarse pointers and reduced-motion get a single still frame, which is
 * a composition in its own right.
 *
 * Paths are rewritten on the GSAP ticker, so the waves share a clock with the
 * rest of the site rather than running a second animation loop. The ticker is
 * only attached while the panel is on screen — a blur this wide is not free,
 * and there is no reason to pay for it eight thousand pixels up the page.
 */
export default function GlowField({ blur = 28, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const svg = svgRef.current;
      const parent = root?.parentElement;
      if (!root || !svg || !parent) return;

      const paths = pathRefs.current.filter(Boolean) as SVGPathElement[];
      if (paths.length !== WAVES.length) return;

      const size = { w: 0, h: 0 };
      const measure = () => {
        const r = parent.getBoundingClientRect();
        size.w = r.width;
        size.h = r.height;
        svg.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(parent);

      /** Pointer position in field space, and how much of it is being applied. */
      const state = { px: 0.5, py: 0.5, strength: 0 };

      const draw = (time: number) => {
        const { w, h } = size;
        if (!w || !h) return;

        const x0 = -BLEED * w;
        const span = w * (1 + 2 * BLEED);

        WAVES.forEach((wv, i) => {
          const path = paths[i];
          const half = (wv.thickness * h) / 2;
          const top: string[] = [];
          const bottom: string[] = [];

          for (let s = 0; s <= SAMPLES; s++) {
            const u = s / SAMPLES;
            const x = x0 + u * span;

            let y =
              wv.y * h +
              Math.sin(u * wv.freq * TAU + time * wv.speed * TAU) * wv.amp * h +
              Math.sin(u * wv.freq2 * TAU - time * wv.speed * TAU * 0.7) * wv.amp2 * h;

            /* The dent: a gaussian in x centred on the pointer, so the crest
               bends around it and settles back either side. */
            if (state.strength > 0.001) {
              const d = (x / w - state.px) / BUMP_WIDTH;
              y -= Math.exp(-d * d) * BUMP_LIFT * h * state.strength;
            }

            top.push(`${x.toFixed(1)} ${(y - half).toFixed(1)}`);
            bottom.push(`${x.toFixed(1)} ${(y + half).toFixed(1)}`);
          }

          path.setAttribute("d", `M${top.join("L")}L${bottom.reverse().join("L")}Z`);

          const near = clamp(1 - Math.abs(state.py - wv.y) / FALLOFF, 0, 1);
          const eased = near * near * state.strength;
          path.style.opacity = (REST + (LIT - REST) * eased).toFixed(3);
        });
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      if (reduced) {
        draw(0);
        return () => ro.disconnect();
      }

      /*
       * Only animate what someone is looking at — but start running and let the
       * observer park it, never the other way round. Gated the other way, a
       * callback that is slow or never arrives leaves the waves frozen on their
       * first frame, and a background optimisation has quietly become a bug.
       */
      let running = true;
      const tick = (time: number) => draw(time);
      gsap.ticker.add(tick);

      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry || entry.isIntersecting === running) return;
          running = entry.isIntersecting;
          if (running) gsap.ticker.add(tick);
          else gsap.ticker.remove(tick);
        },
        { rootMargin: "20% 0px" },
      );
      io.observe(parent);

      const teardown = () => {
        ro.disconnect();
        io.disconnect();
        gsap.ticker.remove(tick);
      };

      if (!fine) return teardown;

      const onMove = (e: PointerEvent) => {
        const r = parent.getBoundingClientRect();
        if (!r.width || !r.height) return;
        state.px = (e.clientX - r.left) / r.width;
        state.py = (e.clientY - r.top) / r.height;
        gsap.to(state, { strength: 1, duration: 0.5, ease: "power2.out", overwrite: "auto" });
      };
      const onLeave = () => {
        gsap.to(state, { strength: 0, duration: 0.9, ease: "power2.out", overwrite: "auto" });
      };

      parent.addEventListener("pointermove", onMove);
      parent.addEventListener("pointerleave", onLeave);
      return () => {
        teardown();
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
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        style={{ filter: `blur(${blur}px)` }}
      >
        {WAVES.map((wv, i) => (
          <path
            key={i}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            fill={wv.fill}
            style={{ opacity: REST }}
          />
        ))}
      </svg>
    </div>
  );
}
