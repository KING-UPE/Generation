"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useTorch } from "@/lib/use-torch";
import Spotlight from "@/components/ui/Spotlight";
import Magnetic from "@/components/ui/Magnetic";
import RevealText from "@/components/ui/RevealText";
import EditionMark from "@/components/ui/EditionMark";

/* Brand marks. */
const WORDMARK = "GENERATION";
const EDITION = "26";
const PREV_EDITION = "25";
const TAGLINE = "TALENTS BY ECHEM";

const MARK_SIZE =
  "text-[clamp(2.75rem,13.2vw,13rem)] leading-[0.85] tracking-[-0.01em]";

const HERO_STATS = [
  { value: "3,500+", label: "ATTENDEE CAPACITY", detail: "Strict single-night cap" },
  { value: "120 kW", label: "PK SOUND SYSTEM", detail: "Custom tuned sub arrays" },
  { value: "14+", label: "LIVE ACTS & PRODUCERS", detail: "Curated electronic & live" },
  { value: "8 HRS", label: "NON-STOP LIVE SHOW", detail: "4K volumetric laser stage" },
];

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const torchRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLSpanElement>(null);
  const [torchActive, setTorchActive] = useState(false);

  useTorch(torchRef, torchActive);

  useGSAP(
    () => {
      const root = rootRef.current;
      const torch = torchRef.current;
      if (!root) return;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (torch) {
        gsap.set(torch, { "--mx": "50%", "--my": "50%" });
        gsap.to(torch, {
          opacity: 1,
          duration: 1.2,
          delay: 1.3,
          ease: "gen",
          onComplete: () => setTorchActive(true),
        });
      }

      if (reduced) return;

      gsap.to(markRef.current, {
        yPercent: -18,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      gsap.to(cueRef.current, {
        scaleY: 0.15,
        transformOrigin: "top",
        duration: 1.4,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      id="hero"
      ref={rootRef as React.RefObject<HTMLElement>}
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pb-12 pt-6"
    >
      <Spotlight size={980} opacity={0.48} />

      {/* Top HUD Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-(--maxw) flex-wrap items-center justify-between gap-4 px-(--gutter) pt-4 md:pt-6">
        <div className="flex items-center gap-3">
          <span className="badge-pill bg-black/60 font-mono-ui font-bold text-bone">
            {TAGLINE}
          </span>
          <span className="hidden font-mono-ui text-xs font-semibold tracking-wider text-muted sm:inline-block">
            COLOMBO // 2026
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-hot" />
            <span className="font-bold tracking-widest">OCTOBER 24, 2026 · LIVE ARENA</span>
          </div>
        </div>
      </header>

      {/* Main Title Centerpiece */}
      <div className="relative z-10 mx-auto flex w-full max-w-(--maxw) flex-1 flex-col justify-center px-(--gutter) py-10 md:py-16">
        <div ref={markRef} className="relative will-change-transform">
          <div className="inline-flex items-start">
            <div className="relative">
              <RevealText
                as="h1"
                type="chars"
                stagger={0.042}
                delay={0.5}
                start="top 100%"
                y={104}
                className={"font-display select-none text-bone " + MARK_SIZE}
              >
                {WORDMARK}
              </RevealText>

              {/* pointer-lit duplicate sitting exactly on top */}
              <span
                ref={torchRef}
                aria-hidden
                className={
                  "font-display pointer-events-none absolute inset-0 select-none opacity-0 " +
                  MARK_SIZE
                }
                style={{
                  backgroundImage:
                    "radial-gradient(circle 260px at var(--mx, 50%) var(--my, 50%), #FF5A3C 0%, #FF2E2E 32%, #E10600 52%, transparent 72%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {WORDMARK}
              </span>
            </div>

            <EditionMark
              from={PREV_EDITION}
              to={EDITION}
              className="ml-[0.4em] mt-[0.16em] text-[clamp(2rem,6.2vw,6rem)] font-bold text-red-hot"
            />
          </div>
        </div>

        {/* Lead description & Action Bar */}
        <div className="mt-8 flex flex-col gap-6 md:mt-10 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-[54ch] flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono-ui text-xs font-bold tracking-widest text-red-hot">
                ✦ EDITION 26 EXPERIENCE
              </span>
              <span className="text-dim">/</span>
              <span className="font-mono-ui text-xs font-semibold text-muted">
                LOTUS TOWER ARENA
              </span>
            </div>
            <p className="text-lead">
              One night where sound engineering and live performance collide. Held to an uncompromising production standard in Colombo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Magnetic strength={16}>
              <a
                href="#vision"
                data-cursor="link"
                className="cut-shape-sm group inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-tight text-white shadow-[0_10px_30px_rgba(225,6,0,0.35)] transition-all duration-300 hover:shadow-[0_14px_42px_rgba(255,59,47,0.55)]"
                style={{ background: "var(--grad-red)" }}
              >
                Explore 3D Stage
                <span className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </Magnetic>

            <Magnetic strength={12}>
              <a
                href="#film"
                data-cursor="link"
                className="cut-shape-sm group inline-flex items-center gap-2 border border-hairline-bold bg-ink-2/90 px-6 py-4 text-sm font-bold text-bone backdrop-blur-md transition-colors duration-300 hover:border-red-hot hover:text-white"
              >
                Watch Trailer
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      {/* 4 Big Bold Event Stat Cards */}
      <div className="relative z-10 mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {HERO_STATS.map((s, i) => (
            <div
              key={i}
              className="card-interactive cut-shape-sm flex flex-col justify-between p-4 sm:p-5"
            >
              <span className="stat-number text-bone transition-colors duration-300 group-hover:text-red-hot">
                {s.value}
              </span>
              <div className="mt-2">
                <p className="font-mono-ui text-xs font-bold tracking-wider text-bone">
                  {s.label}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted">
                  {s.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
