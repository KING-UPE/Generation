"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  IconWhatsApp,
  IconTelegram,
  IconArrowUpRight,
} from "@/components/ui/icons";

/** The three most-asked-for forms. The rest live on /auditions. */
const FORMS = [
  { title: "Singing", href: "https://forms.gle/Rn31tLkLLpUdeTWx6" },
  { title: "Dancing", href: "https://forms.gle/UjFWe64ufTXyCmYx6" },
  { title: "Organizing Team", href: "https://forms.gle/G1RGdgCAx7HNsK7F8" },
];

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /*
   * The sweeping contour field behind the footer.
   *
   * Concentric arcs centred just off the bottom-right corner, each perturbed by
   * a couple of harmonics so the set reads as a field being drawn rather than a
   * stack of ellipses.
   *
   * Three things differ from the first pass. It paints no background of its
   * own -- the footer's --ink-2 shows through, so the panel stays on the ink
   * scale instead of a hardcoded near-black beside it. The accent line asks the
   * palette for its colour rather than naming a red, so it follows the theme
   * selector, and it asks again when the hue changes. And it skips the draw
   * while the footer is off screen, checked from the element's own rect inside
   * the tick rather than by parking the loop on an observer -- an observer that
   * parks a ticker is how the glow field ended up frozen.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let offset = 0;
    let width = 0;
    let height = 0;
    const measure = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = host.offsetWidth;
      height = host.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(host);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      const box = host.getBoundingClientRect();
      const onScreen = box.bottom > 0 && box.top < window.innerHeight;

      if (onScreen && width > 0) {
        ctx.clearRect(0, 0, width, height);

        /*
         * Flow lines running the full width, not arcs around a corner.
         *
         * The reference this is modelled on is a tall panel, where a radial
         * field from one corner fills the frame. A footer is wide and short:
         * swept from a corner, most of every arc lands outside it and only a
         * patch near one edge survives. These run edge to edge instead, and
         * are displaced by a field that grows towards the right, so they still
         * fan out from that side.
         */
        const steps = 90;
        const spread = height * 1.7;
        const top = -height * 0.35;

        /* Spacing first, count second. A fixed 150 lines packed a short footer
           to roughly 4px apart, which reads as hatching rather than as a
           surface -- the reference has air between its curves. Holding the
           average gap at 14px and deriving the count keeps that air whatever
           the panel's height. */
        const lines = Math.max(28, Math.min(120, Math.round(spread / 14)));

        /* Spacing is modulated rather than constant -- lines drawing together
           into bands and opening out again is what reads as silk instead of
           ruling. The weights are normalised, so the set always fills the
           band however the pattern drifts. */
        const weights: number[] = [];
        let weightSum = 0;
        for (let i = 0; i < lines; i++) {
          const band =
            Math.sin(i * 0.15 + offset * 0.9) * 0.5 + Math.sin(i * 0.037 - offset * 0.35) * 0.5;
          const w = 0.3 + (band * 0.5 + 0.5);
          weights.push(w);
          weightSum += w;
        }

        let acc = 0;
        for (let i = 0; i < lines; i++) {
          acc += weights[i];
          const y0 = top + (acc / weightSum) * spread;
          if (y0 < -40 || y0 > height + 40) continue;

          /* Tight bands read brighter, which is what gives the sheen. */
          const sheen = Math.max(0, 1 - (weights[i] - 0.3) / 1.0);
          const alpha = 0.05 + 0.5 * sheen * sheen;

          ctx.lineWidth = 0.7 + sheen * 0.8;

          /* Drawn a segment at a time so the field can fade across the panel.
             An overlay laid on top instead put a visible edge where it thinned
             enough for the lines to show through -- a gradient is smooth, but
             a line appearing out of nothing is not. Fading the strokes
             themselves has no boundary to see. */
          let px = 0;
          let py = 0;

          for (let j = 0; j <= steps; j++) {
            const u = j / steps;
            const x = -30 + (width + 60) * u;

            /* Three harmonics: the slow one bends the whole run, the faster
               two ripple along it. Keyed to y0 as well as x so neighbouring
               lines drift apart instead of moving as one ribbon. */
            const disp =
              Math.sin(u * 3.1 + offset * 0.8 + y0 * 0.006) * 34 +
              Math.sin(u * 6.7 - offset * 0.5 + y0 * 0.011) * 14 +
              Math.cos(u * 1.4 + offset * 0.3 + y0 * 0.003) * 22;

            /* The fan: displacement is slight at the left edge and full at the
               right, so the field opens towards the corner. */
            const y = y0 + disp * (0.25 + u * u * 1.35);

            if (j > 0) {
              /* Smoothstep across the width: nothing at the left edge, full
                 strength by the right. */
              const t = Math.min(1, Math.max(0, (u - 0.06) / 0.72));
              const ramp = t * t * (3 - 2 * t);
              ctx.strokeStyle = `rgba(255,255,255,${(alpha * ramp).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(x, y);
              ctx.stroke();
            }
            px = x;
            py = y;
          }
        }

        if (!reduced) offset += 0.004;
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <footer className="relative z-10 overflow-hidden border-t border-hairline bg-ink-2 text-bone">
      {/* The contour field. Behind everything, and clipped by the footer. */}
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Subtle ambient warm red glow on bottom-left */}
      <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-red-hot/10 blur-3xl pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 mx-auto w-full max-w-(--maxw) px-(--gutter) pt-10 pb-8 md:pt-14 md:pb-10">
        {/* Main Grid: Brand summary + Quick Columns */}
        {/* Two up on a phone. Stacked one per row the four blocks ran the
            whole screen; paired, the footer is a little over half that. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:gap-10 lg:grid-cols-4 lg:gap-12">
          {/* Brand Identity */}
          <div className="col-span-2 flex flex-col justify-between lg:col-span-1">
            <div>
              <Link href="/" className="inline-block group">
                <span className="font-display text-2xl font-bold tracking-tight text-white md:text-bone group-hover:text-red-hot transition-colors duration-200">
                  GENERATION <span className="text-red-hot">26</span>
                </span>
              </Link>
              <p className="mt-3 text-xs font-mono text-dim leading-relaxed max-w-xs">
                Live Stage & Arena Experience at Lotus Tower, Colombo. Produced by Echem.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-dim">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-hot animate-pulse" />
              <span>COLOMBO · LOTUS TOWER ARENA</span>
            </div>
          </div>

          {/* Column 1: Auditions.
              Two rows tall on a phone, so Channels and Event stack beside it
              in the second column instead of pushing a third row. */}
          <div className="row-span-2 lg:row-span-1">
            <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
              Auditions
            </span>
            {/* Four entries, four destinations. They all pointed at /auditions
                before, which reads as a list of choices and behaves as one
                link; the named ones now open the form they name. */}
            <ul className="space-y-3 font-medium text-xs sm:text-sm">
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>All Talent Forms</span>
                  <IconArrowUpRight className="h-3.5 w-3.5 text-red-hot transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
              {FORMS.map((f) => (
                <li key={f.href}>
                  <a
                    href={f.href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-red-hot transition-colors duration-200"
                  >
                    {f.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Official Channels */}
          <div>
            <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
              Channels
            </span>
            <ul className="space-y-3 font-medium text-xs sm:text-sm">
              <li>
                <a
                  href="https://t.me/Generation_26"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                >
                  <IconTelegram className="h-4 w-4 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                  <span>Telegram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://whatsapp.com/channel/0029Vb41Gqw1iUxZyLIiYX0M"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                >
                  <IconWhatsApp className="h-4 w-4 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                  <span>WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Event Info */}
          <div>
            <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
              Event
            </span>
            <ul className="space-y-2 text-xs font-mono text-dim">
              <li className="text-bone font-medium">Generation 26</li>
              <li>Lotus Tower Open Arena</li>
              <li>Colombo, Sri Lanka</li>
              <li className="text-red-hot font-medium pt-1">Saturday, Dec 12, 2026</li>
              <li>Produced by Echem</li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution & Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-dim uppercase tracking-wider mt-10 pt-6 border-t border-hairline/60 gap-4">
          <p className="text-center sm:text-left">
            © 2023 – 2026 Generation. All rights reserved.{" "}
            <span className="mx-2 hidden sm:inline text-hairline">/</span> Produced by{" "}
            <span className="brand-name">Echem</span>
          </p>

          <p className="text-center sm:text-right">
            Developed by{" "}
            <a
              href="https://w3s.lk/"
              target="_blank"
              rel="noreferrer"
              className="underline text-bone hover:text-red-hot transition-colors duration-200 decoration-hairline hover:decoration-red-hot underline-offset-4"
            >
              W3S Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
