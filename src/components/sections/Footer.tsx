"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  IconWhatsApp,
  IconTelegram,
  IconArrowUpRight,
} from "@/components/ui/icons";

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic sweeping concentric contour line animation matching reference
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || 1200);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 380);

    const onResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener("resize", onResize);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep obsidian background fill
      ctx.fillStyle = "#09090C";
      ctx.fillRect(0, 0, width, height);

      // Center of concentric contour field on bottom-right
      const cx = width * 0.95;
      const cy = height * 1.05;
      const lineCount = 52;
      const spacing = 15;
      const startR = 30;

      ctx.lineWidth = 1.25;

      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        const baseR = startR + i * spacing;

        // Occasional faint red accent line
        if (i % 8 === 0) {
          ctx.strokeStyle = "rgba(255, 59, 47, 0.32)";
        } else {
          const alpha = 0.04 + (i / lineCount) * 0.14;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        }

        // Sweeping arc angles (pointing from bottom-left up to top-right)
        const startAngle = Math.PI * 1.04;
        const endAngle = -Math.PI * 0.54;
        const steps = 70;
        const step = (endAngle - startAngle) / steps;

        for (let j = 0; j <= steps; j++) {
          const theta = startAngle + j * step;
          // Harmonic wave perturbations that simulate fluid magnetic field lines
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

      if (!reduced) {
        offset += 0.005;
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", onResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <footer className="relative z-10 border-t border-hairline bg-ink-2 text-bone overflow-hidden">
      {/* Background Canvas: Flowing curved contour wireframe lines */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />

      {/* Gradient overlay so content is crisp and lines fade softly towards the left */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-2 via-ink-2/80 to-transparent pointer-events-none" />

      {/* Subtle ambient warm red glow on bottom-left */}
      <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-red-hot/15 blur-3xl pointer-events-none" />

      {/* Content wrapper with relative z-10 */}
      <div className="relative z-10 mx-auto w-full max-w-(--maxw) px-(--gutter) py-12 md:py-16">
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
            <ul className="space-y-3 font-medium text-xs sm:text-sm">
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>Talent Forms</span>
                  <IconArrowUpRight className="h-3.5 w-3.5 text-red-hot transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200"
                >
                  Singing & Dancing
                </Link>
              </li>
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200"
                >
                  Drama & Acting
                </Link>
              </li>
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200"
                >
                  Organizing Team
                </Link>
              </li>
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
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-dim uppercase tracking-wider mt-12 pt-6 border-t border-hairline/60 gap-4">
          <p className="text-center sm:text-left">
            © 2017 – 2026 Generation. All rights reserved.{" "}
            <span className="mx-2 hidden sm:inline text-hairline">/</span> Produced by ECheM
          </p>

          <p className="text-center sm:text-right">
            Developed by{" "}
            <a
              href="https://w3s.lk/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white hover:text-red-hot transition-colors duration-200 decoration-hairline hover:decoration-red-hot underline-offset-4"
            >
              W3S Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
