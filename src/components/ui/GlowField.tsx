"use client";

import { useId, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { clamp } from "@/lib/scroll-state";

const TAU = Math.PI * 2;

/** Points sampled along each wave, and around the mass. */
const SAMPLES = 56;
const MASS_SAMPLES = 72;
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
 * Four bands: two riding the top edge, two the bottom, each centred outside the
 * panel so only its shoulder reaches in. They are ribbons whose top and bottom
 * edges are the same travelling wave, so the light reads as a crest moving
 * through the panel rather than a lamp sitting in it.
 *
 * Built only from the palette's reds — #FF2E2E, #E10600, #8B0212. The lightest
 * stop of `--grad-red` is #FF5A3C, which is fine as a sliver in a gradient but
 * swings the whole field orange once it is carrying an area this size.
 *
 * Fills are kept low. Bands at full strength flood the panel into an even red
 * and the crests stop reading at all.
 */
const WAVES: Wave[] = [
  {
    y: 0.10,
    thickness: 0.56,
    amp: 0.06,
    amp2: 0.026,
    freq: 0.9,
    freq2: 1.7,
    speed: 0.09,
    fill: "rgba(255,46,46,0.4)",
  },
  {
    y: 0.34,
    thickness: 0.34,
    amp: 0.045,
    amp2: 0.02,
    freq: 1.25,
    freq2: 2.3,
    speed: -0.12,
    fill: "rgba(225,6,0,0.42)",
  },
  {
    y: 0.84,
    thickness: 0.5,
    amp: 0.055,
    amp2: 0.024,
    freq: 0.7,
    freq2: 1.9,
    speed: 0.07,
    fill: "rgba(214,6,28,0.48)",
  },
  {
    y: 1.04,
    thickness: 0.38,
    amp: 0.045,
    amp2: 0.02,
    freq: 1.5,
    freq2: 2.6,
    speed: -0.1,
    fill: "rgba(168,3,22,0.44)",
  },
];

/**
 * The dark the panel is really built around.
 *
 * Holding the waves apart leaves a channel between them, and a channel is a
 * stripe — it reads as a gap in a pattern rather than as a field with a dark
 * heart. This is a shape in its own right: a soft mass of the page's own black,
 * painted over the waves, tall enough to run the full height of the panel and
 * wide enough that the red only survives down the sides and along the bottom.
 * The title and the figures are read against it.
 *
 * Radii are shares of the field. It wanders on the same clock as the waves, so
 * the edge where black meets red is never a fixed line.
 */
const MASS = {
  cx: 0.54,
  cy: 0.48,
  rx: 0.26,
  ry: 0.44,
  /** Two perturbations of the radius, so the outline is never an ellipse. */
  wobble: 0.1,
  wobble2: 0.055,
  speed: 0.05,
};

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
 * shape: the band under it brightens, and the wave itself bends into a bump
 * that follows the cursor. The bend goes away from the centre, so the pointer
 * opens the dark middle rather than crowding it. Both fall away when the
 * pointer leaves. Coarse pointers and reduced-motion get a single still frame,
 * which is a composition in its own right.
 *
 * Paths are rewritten on the GSAP ticker, so the waves share a clock with the
 * rest of the site rather than running a second animation loop. The ticker is
 * only attached while the panel is on screen — a blur this wide is not free,
 * and there is no reason to pay for it eight thousand pixels up the page.
 */
export default function GlowField({ blur = 28, className = "" }: Props) {
  const heartId = "glow-heart-" + useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const massRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const svg = svgRef.current;
      const mass = massRef.current;
      const parent = root?.parentElement;
      if (!root || !svg || !mass || !parent) return;

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

      const drawWaves = (time: number, w: number, h: number) => {
        const x0 = -BLEED * w;
        const span = w * (1 + 2 * BLEED);

        WAVES.forEach((wv, i) => {
          const path = paths[i];
          const half = (wv.thickness * h) / 2;
          /* Which way is away from the middle for this band. */
          const outward = wv.y < 0.5 ? -1 : 1;
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
              y += outward * Math.exp(-d * d) * BUMP_LIFT * h * state.strength;
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

      const drawMass = (time: number, w: number, h: number) => {
        const pts: string[] = [];
        for (let s = 0; s < MASS_SAMPLES; s++) {
          const a = (s / MASS_SAMPLES) * TAU;
          const r =
            1 +
            Math.sin(a * 3 + time * MASS.speed * TAU) * MASS.wobble +
            Math.sin(a * 5 - time * MASS.speed * TAU * 0.7) * MASS.wobble2;
          const x = MASS.cx * w + Math.cos(a) * MASS.rx * w * r;
          const y = MASS.cy * h + Math.sin(a) * MASS.ry * h * r;
          pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        mass.setAttribute("d", `M${pts.join("L")}Z`);
      };

      const draw = (time: number) => {
        const { w, h } = size;
        if (!w || !h) return;
        drawWaves(time, w, h);
        drawMass(time, w, h);
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

        <defs>
          {/*
            Solid at the core and gone by the rim. Filled flat, the mass reads
            as a hole punched in the field with a visible edge; carrying its own
            falloff, it reads as the field being deepest in the middle.
          */}
          <radialGradient id={heartId}>
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="1" />
            <stop offset="46%" stopColor="var(--ink)" stopOpacity="0.94" />
            <stop offset="78%" stopColor="var(--ink)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Last, so it deepens the crests rather than sitting between them. */}
        <path ref={massRef} fill={`url(#${heartId})`} />
      </svg>
    </div>
  );
}
