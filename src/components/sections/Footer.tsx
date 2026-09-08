"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconWhatsApp,
  IconTelegram,
  IconArrowUpRight,
  IconCheck,
} from "@/components/ui/icons";

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Vertical flowing S-curve wave pattern animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || 500);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 420);

    const onResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener("resize", onResize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#09090C";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.4;

      const lineCount = 38;
      const spacing = 12;
      const startX = width * 0.38;

      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        const xBase = startX + i * spacing;

        // Occasional faint red accent line
        if (i % 9 === 0) {
          ctx.strokeStyle = "rgba(255, 59, 47, 0.22)";
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
        }

        for (let y = 0; y <= height; y += 6) {
          const distortion = Math.sin(y * 0.005 + offset + i * 0.1) * 36;
          const x = xBase + distortion + Math.pow(y / height, 2) * 120;

          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (!reduced) {
        offset += 0.004;
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", onResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <footer className="relative z-10 border-t border-hairline bg-ink-2 text-bone">
      <div className="grid xl:grid-cols-[42%_58%] lg:grid-cols-[45%_55%] grid-cols-1 relative">
        {/* ── LEFT: Newsletter Section with Wave Canvas ─────────── */}
        <section
          id="newsletter"
          className="relative flex flex-col justify-between p-7 sm:p-9 md:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-hairline w-full overflow-hidden"
        >
          {/* Background Canvas: Flowing S-curve lines */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full pointer-events-none"
          />

          {/* Gradient overlay to fade lines into the background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090C] via-[#09090C]/80 to-transparent pointer-events-none" />

          {/* Bottom-left glowing red corner accent */}
          <div className="absolute bottom-0 left-0 w-[42px] h-[42px] bg-red-hot rounded-tr-[42px] opacity-75 blur-[2px] pointer-events-none" />

          <div className="relative z-10 max-w-md">
            <h4 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-bone mb-3">
              Want to stay in touch?
            </h4>

            <p className="text-xs sm:text-sm text-dim leading-relaxed font-mono font-light mb-6">
              Join our newsletter to get the latest news, updates and special offers.
            </p>

            <form onSubmit={handleSubmit} className="relative z-10 mt-2 w-full">
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR E-MAIL"
                  className="w-full rounded-full bg-white/[0.06] border border-hairline py-3.5 pl-5 pr-32 font-mono text-xs uppercase tracking-wider text-bone placeholder:text-dim/60 focus:outline-none focus:border-red-hot focus:ring-1 focus:ring-red-hot/40 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 w-[112px] rounded-full bg-[#4A4A4A] hover:bg-red-hot text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all duration-300 flex items-center justify-center gap-1.5 overflow-hidden"
                >
                  {submitted ? (
                    <>
                      <IconCheck className="h-3.5 w-3.5 text-white" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>

              {submitted && (
                <p className="mt-2.5 text-[11px] font-mono text-red-hot flex items-center gap-1.5">
                  ✦ You&apos;re subscribed. Thank you for staying in touch.
                </p>
              )}
            </form>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-hairline/50 flex items-center justify-between text-[11px] font-mono text-dim">
            <span>COLOMBO, SRI LANKA</span>
            <span className="text-red-hot font-medium tracking-wider">LOTUS TOWER ARENA</span>
          </div>
        </section>

        {/* ── RIGHT: Clean, Simple Links & Attribution ─────────── */}
        <div className="flex flex-col justify-between p-7 sm:p-9 md:p-10 lg:p-12">
          {/* Simple Columns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 w-full text-xs sm:text-sm">
            {/* Column 1: Auditions */}
            <div>
              <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
                Auditions
              </span>
              <ul className="space-y-3 font-medium">
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
                  <Link href="/auditions" className="hover:text-red-hot transition-colors duration-200">
                    Singing & Dancing
                  </Link>
                </li>
                <li>
                  <Link href="/auditions" className="hover:text-red-hot transition-colors duration-200">
                    Drama & Acting
                  </Link>
                </li>
                <li>
                  <Link href="/auditions" className="hover:text-red-hot transition-colors duration-200">
                    Organizing Team
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Social Channels (Only Telegram and WhatsApp) */}
            <div>
              <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
                Channels
              </span>
              <ul className="space-y-3 font-medium">
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
            <div className="col-span-2 sm:col-span-1">
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

          {/* Copyright & W3S Solutions Attribution Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-dim uppercase tracking-wider mt-10 pt-6 border-t border-hairline/60 gap-4">
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
      </div>
    </footer>
  );
}
