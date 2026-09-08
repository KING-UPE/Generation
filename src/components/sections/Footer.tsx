"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconInstagram,
  IconTikTok,
  IconYouTube,
  IconFacebook,
  IconWhatsApp,
  IconTelegram,
  IconArrowUpRight,
  IconCheck,
} from "@/components/ui/icons";

export default function Footer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Subtle ambient dot grid animation on the newsletter canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || 450);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 500);

    const onResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener("resize", onResize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const spacing = 28;
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);

      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const posX = x * spacing + 14;
          const posY = y * spacing + 14;

          // Gentle undulating wave factor
          const wave = reduced
            ? 0.3
            : Math.sin(x * 0.2 + y * 0.2 + tick * 0.02) * 0.5 + 0.5;

          const alpha = 0.08 + wave * 0.18;
          ctx.fillStyle = `rgba(237, 237, 240, ${alpha})`;

          // Occasional warm ember accent dot
          if ((x + y * 3) % 17 === 0) {
            ctx.fillStyle = `rgba(255, 59, 47, ${alpha * 1.5})`;
          }

          ctx.beginPath();
          ctx.arc(posX, posY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduced) {
        tick++;
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <footer className="relative z-10 border-t border-hairline bg-ink-2/95 text-bone">
      <div className="grid xl:grid-cols-[34%_66%] md:grid-cols-[45%_55%] grid-cols-1 relative">
        {/* ── LEFT: Newsletter Section ──────────────────────────── */}
        <section
          id="newsletter"
          className="relative flex flex-col justify-between p-7 sm:p-10 md:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-hairline w-full overflow-hidden"
        >
          {/* Animated Matrix Canvas Background */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="w-full h-full">
              <canvas ref={canvasRef} className="w-full h-full opacity-60" />
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-black/40 to-ink-2 pointer-events-none" />
            {/* Ambient warm glow */}
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-red-hot/15 blur-3xl pointer-events-none" />
          </div>

          <div className="relative z-10">
            <div className="badge-pill border-red-hot/30 bg-red-black/40 text-red-hot mb-4 w-fit text-[10px]">
              ✦ STAY CONNECTED
            </div>

            <h4 className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.01em] text-bone mb-3">
              Want to stay in touch?
            </h4>

            <p className="text-xs sm:text-sm text-dim leading-relaxed max-w-md font-mono font-light mb-6">
              Join our newsletter to get the latest announcements, lineup reveals, and early-bird ticket access.
            </p>

            <form onSubmit={handleSubmit} className="relative z-10 mt-2 max-w-md">
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your e-mail"
                  className="w-full rounded-full bg-white/[0.07] border border-hairline py-3.5 pl-5 pr-32 font-mono text-xs uppercase tracking-wider text-bone placeholder:text-dim/70 focus:outline-none focus:border-red-hot focus:ring-1 focus:ring-red-hot/50 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 w-[116px] rounded-full bg-red-hot hover:bg-red-mid text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all duration-300 hover:shadow-[0_0_18px_rgba(255,59,47,0.5)] flex items-center justify-center gap-1.5 overflow-hidden"
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
                <p className="mt-2.5 text-[11px] font-mono text-red-hot">
                  ✦ You&apos;re subscribed. We will notify you when tickets drop.
                </p>
              )}
            </form>
          </div>

          {/* Bottom badge on newsletter column */}
          <div className="relative z-10 mt-8 pt-6 border-t border-hairline/60 flex items-center justify-between text-[11px] font-mono text-dim">
            <span>COLOMBO, SRI LANKA</span>
            <span className="text-red-hot font-medium">LOTUS TOWER ARENA</span>
          </div>
        </section>

        {/* ── RIGHT: Navigation Links & Credits ─────────────────── */}
        <div className="flex flex-col justify-between p-7 sm:p-10 md:p-10 lg:p-12">
          {/* 4-column Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-6 w-full text-xs sm:text-sm">
            {/* Column 1: Event */}
            <div>
              <span className="font-mono uppercase text-dim tracking-[0.16em] text-[11px] mb-5 block">
                Event
              </span>
              <ul className="space-y-3 font-medium">
                <li>
                  <a href="/#hero" className="hover:text-red-hot transition-colors duration-200">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="/#timeline" className="hover:text-red-hot transition-colors duration-200">
                    Events
                  </a>
                </li>
                <li>
                  <a href="/#vision" className="hover:text-red-hot transition-colors duration-200">
                    Vision
                  </a>
                </li>
                <li>
                  <a href="/#about" className="hover:text-red-hot transition-colors duration-200">
                    About
                  </a>
                </li>
                <li>
                  <a href="/#film" className="hover:text-red-hot transition-colors duration-200">
                    After Movie
                  </a>
                </li>
                <li>
                  <a href="/#flow" className="hover:text-red-hot transition-colors duration-200">
                    Gallery
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Production */}
            <div>
              <span className="font-mono uppercase text-dim tracking-[0.16em] text-[11px] mb-5 block">
                Production
              </span>
              <ul className="space-y-3 font-medium">
                <li>
                  <a href="/#scale" className="hover:text-red-hot transition-colors duration-200">
                    Built at Scale
                  </a>
                </li>
                <li>
                  <a href="/#projection" className="hover:text-red-hot transition-colors duration-200">
                    Projections
                  </a>
                </li>
                <li>
                  <a href="/#festival" className="hover:text-red-hot transition-colors duration-200">
                    Festival Lineup
                  </a>
                </li>
                <li>
                  <span className="text-dim">10,000 Capacity</span>
                </li>
                <li>
                  <span className="text-dim">Custom Stage</span>
                </li>
              </ul>
            </div>

            {/* Column 3: Auditions */}
            <div>
              <span className="font-mono uppercase text-dim tracking-[0.16em] text-[11px] mb-5 block">
                Auditions
              </span>
              <ul className="space-y-3 font-medium">
                <li>
                  <Link href="/auditions" className="hover:text-red-hot transition-colors duration-200 flex items-center gap-1 group">
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

            {/* Column 4: Socials */}
            <div>
              <span className="font-mono uppercase text-dim tracking-[0.16em] text-[11px] mb-5 block">
                Socials
              </span>
              <ul className="space-y-3 font-medium">
                <li>
                  <a
                    href="https://t.me/Generation_26"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <IconTelegram className="h-3.5 w-3.5 text-red-hot/80 group-hover:text-red-hot transition-colors" />
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
                    <IconWhatsApp className="h-3.5 w-3.5 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                    <span>WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://tiktok.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <IconTikTok className="h-3.5 w-3.5 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                    <span>TikTok</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <IconYouTube className="h-3.5 w-3.5 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                    <span>YouTube</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <IconFacebook className="h-3.5 w-3.5 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                    <span>Facebook</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <IconInstagram className="h-3.5 w-3.5 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                    <span>Instagram</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright & Attribution Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between text-xs font-mono text-dim uppercase tracking-wider mt-10 pt-6 border-t border-hairline/60 gap-4">
            <p className="text-center lg:text-left">
              © 2017 – 2026 Generation. All rights reserved.{" "}
              <span className="mx-2 hidden sm:inline text-hairline">/</span> Produced by ECheM
            </p>

            <p className="text-center lg:text-right">
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
