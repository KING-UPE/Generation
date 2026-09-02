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
const TAGLINE = "Talents by ECheM";

const MARK_SIZE =
  "text-[clamp(2.75rem,13.2vw,13rem)] leading-[0.85] tracking-[-0.01em]";

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
        yPercent: -22,
        opacity: 0.25,
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
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      <Spotlight size={980} opacity={0.42} />

      <header className="relative z-10 mx-auto flex w-full max-w-(--maxw) items-center justify-between px-(--gutter) pt-8 md:pt-10">
        <span className="eyebrow font-bold tracking-[0.28em] text-bone">
          {TAGLINE}
        </span>
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-ping rounded-full bg-red-hot" />
          <span className="eyebrow font-semibold text-red-hot">
            OCTOBER 2026 · COLOMBO
          </span>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-(--maxw) flex-1 flex-col justify-center px-(--gutter) py-16 md:py-20">
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
                    "radial-gradient(circle 250px at var(--mx, 50%) var(--my, 50%), #FF5A3C 0%, #FF2E2E 32%, #E10600 52%, transparent 72%)",
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
              className="ml-[0.4em] mt-[0.16em] text-[clamp(2rem,6.2vw,6rem)]"
            />
          </div>
        </div>

        {/* Event Key Information & Quick Actions */}
        <div className="mt-8 flex flex-col gap-6 md:mt-12 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-red-hot/40 bg-red-black/40 px-3.5 py-1 font-mono-ui text-xs font-bold text-red-hot">
                ✦ LIVE CONCERT
              </span>
              <span className="font-mono-ui text-xs font-semibold tracking-wider text-muted">
                NELUM KULUNA · COLOMBO
              </span>
            </div>
            <p className="max-w-[48ch] text-base font-medium leading-relaxed text-bone md:text-lg">
              One night of uncompromising live sound and stage architecture.
              Produced by ECheM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Magnetic strength={16}>
              <a
                href="#vision"
                data-cursor="link"
                className="cut-shape-sm group inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-tight text-white shadow-[0_8px_24px_rgba(225,6,0,0.3)] transition-all duration-300 hover:shadow-[0_12px_36px_rgba(255,59,47,0.45)]"
                style={{ background: "var(--grad-red)" }}
              >
                Explore Vision
                <span className="transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </Magnetic>

            <Magnetic strength={12}>
              <a
                href="#stats"
                data-cursor="link"
                className="cut-shape-sm group inline-flex items-center gap-2 border border-hairline bg-ink-2/80 px-6 py-4 text-sm font-semibold text-bone backdrop-blur-md transition-colors duration-300 hover:border-red-hot hover:text-white"
              >
                Event Details
              </a>
            </Magnetic>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-10 right-(--gutter) z-10 hidden flex-col items-center gap-3 lg:flex">
        <span
          ref={cueRef}
          className="block h-14 w-px origin-top"
          style={{ background: "var(--grad-red)" }}
        />
      </div>
    </section>
  );
}
