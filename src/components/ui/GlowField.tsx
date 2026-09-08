"use client";

import { useId, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { clamp } from "@/lib/scroll-state";

const TAU = Math.PI * 2;

/** Points sampled along each wave, and around the mass. */
const SAMPLES = 112;
const MASS_SAMPLES = 72;
/** How far past each edge the paths run, so the blur has material to work with. */
const BLEED = 0.12;

/**
 * The distortion riding on top of the crests.
 *
 * Two fast, incommensurable ripples per edge, at a fraction of the wave's own
 * amplitude — enough to make the band's edge unstable and its thickness
 * uneven, which is what reads as distorted rather than merely wavy. The top and
 * bottom of each ribbon get different phases, so the two edges never agree and
 * the band breathes as well as travels.
 *
 * Done in the path maths rather than with an SVG filter. The paths are rewritten
 * every frame regardless, so this is a handful of sine calls; feTurbulence and
 * feDisplacementMap over a field this size, under a 28px blur, is not.
 *
 * SAMPLES doubled to carry it. At 56 the ripple is faster than the sampling and
 * comes out as aliasing rather than distortion.
 *
 * The amplitude has to clear the blur or there is no point to it: at 0.03 of the
 * height the ripple was about 16px against a 28px radius, which the blur simply
 * removed. 0.062 puts it just past that, so what survives is a ragged edge
 * rather than a smooth one.
 */
const WARP = 0.062;
const WARP_FREQ = 23.7;
const WARP_FREQ2 = 47.3;
const WARP_SPEED = 1.7;

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
 * Built only from the middle of the ramp — --red-mid down to --red-deep. The
 * light end, --tint, is fine as a sliver in a gradient but pulls the whole
 * field towards its own hue once it is carrying an area this size.
 *
 * Fills are kept low. Bands at full strength flood the panel into an even red
 * and the crests stop reading at all.
 *
 * Speeds and amplitudes are set so the travel is actually visible. They used to
 * sit around 0.1 and 0.05, which moved the slowest crest less than a pixel a
 * second — real motion, and completely invisible under a 28px blur. The field
 * looked like a still image. These carry the crests tens of pixels a second,
 * which is a slow swell rather than a ripple, but one you can see happening.
 */
const WAVES: Wave[] = [
  {
    y: 0.08,
    thickness: 0.62,
    amp: 0.085,
    amp2: 0.042,
    freq: 0.9,
    freq2: 1.7,
    speed: 0.24,
    fill: "hsl(var(--red-mid-c) / 0.4)",
  },
  {
    y: 0.40,
    thickness: 0.46,
    amp: 0.07,
    amp2: 0.034,
    freq: 1.25,
    freq2: 2.3,
    speed: -0.3,
    fill: "hsl(var(--red-c) / 0.42)",
  },
  {
    y: 0.74,
    thickness: 0.58,
    amp: 0.08,
    amp2: 0.04,
    freq: 0.7,
    freq2: 1.9,
    speed: 0.2,
    fill: "hsl(calc(var(--brand-h) - 10) calc(var(--brand-s) - 5%) 43% / 0.48)",
  },
  {
    y: 0.98,
    thickness: 0.46,
    amp: 0.065,
    amp2: 0.03,
    freq: 1.5,
    freq2: 2.6,
    speed: -0.27,
    fill: "hsl(calc(var(--brand-h) - 10) calc(var(--brand-s) - 3%) 33% / 0.44)",
  },
];

type Mass = {
  /** Centre, as a share of the field. Sits outside it, so only a shoulder reads. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Two perturbations of the radius, so the outline is never an ellipse. */
  wobble: number;
  wobble2: number;
  speed: number;
};

/**
 * The dark, and where it goes.
 *
 * One mass in the centre is a hole. It lands exactly where the eye goes first
 * and reads as something missing from the field rather than as shading, and no
 * amount of shrinking it fixed that — a smaller hole is still a hole.
 *
 * Two masses centred just outside the left and right edges do the same job the
 * middle one was there for: a ground for the title on one side and the figures
 * on the other. What is left is a field lit through the middle and falling away
 * at the sides, which is the way round a vignette normally works.
 *
 * They wander on the same clock as the waves, in opposite directions, so the
 * edge where black meets red is never a fixed line and the two sides never
 * breathe in step.
 */
const MASSES: Mass[] = [
  { cx: -0.04, cy: 0.46, rx: 0.34, ry: 0.92, wobble: 0.13, wobble2: 0.06, speed: 0.09 },
  { cx: 1.04, cy: 0.54, rx: 0.32, ry: 0.9, wobble: 0.15, wobble2: 0.07, speed: -0.08 },
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
 * shape: the band under it brightens, and the wave itself bends into a bump
 * that follows the cursor. Both fall away when the
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
  const massRefs = useRef<(SVGPathElement | null)[]>([]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const svg = svgRef.current;
      const parent = root?.parentElement;
      if (!root || !svg || !parent) return;

      const paths = pathRefs.current.filter(Boolean) as SVGPathElement[];
      const masses = massRefs.current.filter(Boolean) as SVGPathElement[];
      if (paths.length !== WAVES.length || masses.length !== MASSES.length) return;

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

            /* Each edge warped on its own phase — see WARP. */
            const warp = (phase: number) =>
              (Math.sin(u * WARP_FREQ + time * WARP_SPEED + phase) * 0.62 +
                Math.sin(u * WARP_FREQ2 - time * WARP_SPEED * 0.8 + phase * 1.7) * 0.38) *
              WARP *
              h;

            top.push(`${x.toFixed(1)} ${(y - half + warp(i * 2.1)).toFixed(1)}`);
            bottom.push(`${x.toFixed(1)} ${(y + half + warp(i * 2.1 + 3.3)).toFixed(1)}`);
          }

          path.setAttribute("d", `M${top.join("L")}L${bottom.reverse().join("L")}Z`);

          const near = clamp(1 - Math.abs(state.py - wv.y) / FALLOFF, 0, 1);
          const eased = near * near * state.strength;
          path.style.opacity = (REST + (LIT - REST) * eased).toFixed(3);
        });
      };

      const drawMasses = (time: number, w: number, h: number) => {
        MASSES.forEach((m, i) => {
          const pts: string[] = [];
          for (let s = 0; s < MASS_SAMPLES; s++) {
            const a = (s / MASS_SAMPLES) * TAU;
            const r =
              1 +
              Math.sin(a * 3 + time * m.speed * TAU) * m.wobble +
              Math.sin(a * 5 - time * m.speed * TAU * 0.7) * m.wobble2;
            const x = m.cx * w + Math.cos(a) * m.rx * w * r;
            const y = m.cy * h + Math.sin(a) * m.ry * h * r;
            pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          masses[i].setAttribute("d", `M${pts.join("L")}Z`);
        });
      };

      const draw = (time: number) => {
        const { w, h } = size;
        if (!w || !h) return;
        drawWaves(time, w, h);
        drawMasses(time, w, h);
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      if (reduced) {
        draw(0);
        return () => ro.disconnect();
      }

      /*
       * Only pay for what someone is looking at — the blur is wide and every
       * path is rewritten each frame, and there is no reason to spend that
       * eight thousand pixels up the page.
       *
       * The check is a rect read on the ticker, not an IntersectionObserver.
       * An observer has to hand the work back when the panel returns, and every
       * redraw in here lives inside this tick — so if that one callback is slow,
       * throttled or dropped, the waves stay frozen on the frame they were
       * parked at and the pointer does nothing, because the handler only writes
       * to `state` and something else has to draw it. Measured mid-session: the
       * ticker detached with the panel on screen, one frame drawn, hover dead.
       * Reading the rect four times a second cannot miss the panel coming back,
       * and costs nothing beside the paint it is guarding.
       */
      let visible = true;
      let sinceCheck = 0;

      const tick = (time: number, delta: number) => {
        sinceCheck += delta;
        if (sinceCheck >= 250) {
          sinceCheck = 0;
          const r = parent.getBoundingClientRect();
          const margin = window.innerHeight * 0.2;
          visible = r.bottom > -margin && r.top < window.innerHeight + margin;
        }
        if (visible) draw(time);
      };
      gsap.ticker.add(tick);

      const teardown = () => {
        ro.disconnect();
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
            style={{ fill: wv.fill, opacity: REST }}
          />
        ))}

        <defs>
          {/*
            Solid at the core and gone by the rim. Filled flat, the mass reads
            as a hole punched in the field with a visible edge; carrying its own
            falloff, it reads as the field being deepest in the middle.
          */}
          <radialGradient id={heartId}>
            <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.96" />
            <stop offset="42%" stopColor="var(--ink)" stopOpacity="0.82" />
            <stop offset="76%" stopColor="var(--ink)" stopOpacity="0.36" />
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Last, so they deepen the crests rather than sit between them. */}
        {MASSES.map((_, i) => (
          <path
            key={i}
            ref={(el) => {
              massRefs.current[i] = el;
            }}
            fill={`url(#${heartId})`}
          />
        ))}
      </svg>
    </div>
  );
}
