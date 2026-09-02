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
  const headerRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const torchRef = useRef<HTMLSpanElement>(null);
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

      /* Cinematic scroll transition from the hero into the timeline.
         `scrub: 0.8` meant the wordmark took another 0.8s to catch up to a
         scroll position Lenis had already spent a second easing — the two lags
         run in series, so the hero was still drifting well after the page had
         stopped. 0.25 is enough to absorb jitter between scroll events without
         being seen as the section failing to settle. */
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 0.25,
        },
      });

      heroTl
        .to(headerRef.current, { opacity: 0, y: -25, ease: "power2.inOut", duration: 0.3 }, 0)
        .to(footerRef.current, { opacity: 0, y: 30, ease: "power2.inOut", duration: 0.35 }, 0)
        .to(cueRef.current, { opacity: 0, scaleY: 0, ease: "power2.inOut", duration: 0.2 }, 0)
        .to(
          markRef.current,
          {
            y: -70,
            opacity: 0,
            scale: 1.04,
            filter: "blur(8px)",
            ease: "power2.inOut",
            duration: 0.6,
          },
          0.05,
        );

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

      <header
        ref={headerRef}
        className="relative z-10 mx-auto flex w-full max-w-(--maxw) items-center justify-between px-(--gutter) pt-8 md:pt-10 will-change-transform"
      >
        <span className="badge-pill">{TAGLINE}</span>
        <span className="badge-pill">Colombo · 2026</span>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-(--maxw) flex-1 flex-col justify-start pt-8 sm:pt-14 md:justify-center md:pt-0 md:py-20 px-(--gutter)">
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

        <div
          ref={footerRef}
          className="mt-6 flex items-center justify-between gap-8 md:mt-14 will-change-transform"
        >
          <RevealText as="p" delay={0.95} start="top 100%" className="eyebrow">
            The 2026 edition
          </RevealText>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-10 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
        <span
          ref={cueRef}
          className="block h-14 w-px origin-top"
          style={{ background: "var(--grad-red)" }}
        />
      </div>
    </section>
  );
}
