"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { brandColor } from "@/lib/brand";
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
    let accent = brandColor("--red-hot", 0.32);
    const reReadBrand = () => {
      accent = brandColor("--red-hot", 0.32);
    };
    window.addEventListener("brand:change", reReadBrand);

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

        /* Centre sits outside the panel, so only the shoulder of the field
           reaches into it. */
        const cx = width * 0.95;
        const cy = height * 1.05;
        const lineCount = 52;
        const spacing = 15;
        const startR = 30;

        ctx.lineWidth = 1.25;

        for (let i = 0; i < lineCount; i++) {
          ctx.beginPath();
          const baseR = startR + i * spacing;

          if (i % 8 === 0) {
            ctx.strokeStyle = accent;
          } else {
            ctx.strokeStyle = `rgba(255,255,255,${(0.04 + (i / lineCount) * 0.14).toFixed(3)})`;
          }

          const startAngle = Math.PI * 1.04;
          const endAngle = -Math.PI * 0.54;
          const steps = 70;
          const step = (endAngle - startAngle) / steps;

          for (let j = 0; j <= steps; j++) {
            const theta = startAngle + j * step;
            const wave =
              Math.sin(theta * 3.5 + offset + i * 0.1) * 18 +
              Math.cos(theta * 2.2 - offset * 0.7) * 12 +
              Math.sin(baseR * 0.015 + offset * 0.4) * 8;

            const rx = (baseR + wave) * 1.45;
            const ry = (baseR + wave) * 0.88;
            const x = cx + rx * Math.cos(theta);
            const y = cy + ry * Math.sin(theta);

            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        if (!reduced) offset += 0.005;
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("brand:change", reReadBrand);
    };
  }, []);

  return (
    <footer className="relative z-10 overflow-hidden border-t border-hairline bg-ink-2 text-bone">
      {/* The contour field. Behind everything, and clipped by the footer. */}
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Reads the lines down towards the left, so the type never sits on them. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-2 via-ink-2/85 to-transparent" />

      {/* Subtle ambient warm red glow on bottom-left */}
      <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-red-hot/10 blur-3xl pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 mx-auto w-full max-w-(--maxw) px-(--gutter) pt-10 pb-8 md:pt-14 md:pb-10">
        {/* Main Grid: Brand summary + Quick Columns */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Identity */}
          <div className="flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-block group">
                <span className="font-display text-2xl font-bold tracking-tight text-bone group-hover:text-red-hot transition-colors duration-200">
                  GENERATION <span className="text-red-hot">26</span>
                </span>
              </Link>
              <p className="mt-3 text-xs font-mono text-dim leading-relaxed max-w-xs">
                Live Stage & Arena Experience at Lotus Tower, Colombo. Produced by ECheM.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-dim">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-hot animate-pulse" />
              <span>COLOMBO · LOTUS TOWER ARENA</span>
            </div>
          </div>

          {/* Column 1: Auditions */}
          <div>
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
              <li>Produced by ECheM</li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution & Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-dim uppercase tracking-wider mt-10 pt-6 border-t border-hairline/60 gap-4">
          <p className="text-center sm:text-left">
            © 2023 – 2026 Generation. All rights reserved.{" "}
            <span className="mx-2 hidden sm:inline text-hairline">/</span> Produced by ECheM
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
