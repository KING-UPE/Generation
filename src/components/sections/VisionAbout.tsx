"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import CutCard from "@/components/ui/CutCard";

const VISION_CARDS = [
  { src: "/img/stage.svg", alt: "Performer under stage lights" },
  { src: "/img/poster.svg", alt: "Generation 26 key art" },
  { src: "/img/lights.svg", alt: "Volumetric beam lasers" },
];

const ABOUT_CARDS = [
  { src: "/img/crowd.svg", alt: "Crowd with hands raised" },
  { src: "/img/stage.svg", alt: "Live concert performance" },
  { src: "/img/poster.svg", alt: "ECheM structural design" },
];

const TITLE_SIZE = "text-[clamp(3.5rem,12vw,11rem)] leading-[0.9] tracking-[-0.02em]";

export default function VisionAbout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const visionTextRef = useRef<HTMLDivElement>(null);
  const aboutTextRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const deck = deckRef.current;
      const visionText = visionTextRef.current;
      const aboutText = aboutTextRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

      if (!container || !deck || !visionText || !aboutText || !cards.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      // Initial positions
      gsap.set(aboutText, { opacity: 0, y: 40, pointerEvents: "none" });
      gsap.set(visionText, { opacity: 1, y: 0, pointerEvents: "auto" });

      // Initial card fan for Vision (right side)
      const visionFan = [
        { xPercent: -12, yPercent: 10, rotation: -6, scale: 0.9 },
        { xPercent: 0, yPercent: 2, rotation: 0, scale: 0.95 },
        { xPercent: 12, yPercent: -8, rotation: 6, scale: 1 },
      ];

      // Final card fan for About (left side mirrored)
      const aboutFan = [
        { xPercent: 12, yPercent: 10, rotation: 6, scale: 0.9 },
        { xPercent: 0, yPercent: 2, rotation: 0, scale: 0.95 },
        { xPercent: -12, yPercent: -8, rotation: -6, scale: 1 },
      ];

      cards.forEach((card, i) => {
        gsap.set(card, {
          xPercent: visionFan[i]?.xPercent || 0,
          yPercent: visionFan[i]?.yPercent || 0,
          rotation: visionFan[i]?.rotation || 0,
          scale: visionFan[i]?.scale || 1,
          rotationY: 0,
          zIndex: i,
        });
      });

      if (reduced) return;

      // Main scrubbed scroll timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // ── Phase 1 to Phase 2 Transition (Vision -> About) ──

      // 1. Fade out Vision text
      tl.to(
        visionText,
        {
          opacity: 0,
          y: -50,
          ease: "power2.inOut",
          duration: 0.35,
          onComplete: () => {
            if (visionText) visionText.style.pointerEvents = "none";
          },
          onReverseComplete: () => {
            if (visionText) visionText.style.pointerEvents = "auto";
          },
        },
        0.15,
      );

      // 2. Flight of the deck across the screen on Desktop (from Col 6 to Col 1)
      if (isDesktop) {
        tl.to(
          deck,
          {
            xPercent: -95,
            ease: "power2.inOut",
            duration: 0.6,
          },
          0.2,
        );
      } else {
        tl.to(
          deck,
          {
            yPercent: 10,
            ease: "power2.inOut",
            duration: 0.6,
          },
          0.2,
        );
      }

      // 3. Staggered 3D Card Flip & Mid-Animation Rotation
      cards.forEach((card, i) => {
        tl.to(
          card,
          {
            rotationY: 180,
            xPercent: aboutFan[i]?.xPercent || 0,
            yPercent: aboutFan[i]?.yPercent || 0,
            rotation: aboutFan[i]?.rotation || 0,
            scale: aboutFan[i]?.scale || 1,
            ease: "power2.inOut",
            duration: 0.55,
          },
          0.22 + i * 0.06,
        );
      });

      // 4. Fade in About text
      tl.to(
        aboutText,
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          duration: 0.35,
          onStart: () => {
            if (aboutText) aboutText.style.pointerEvents = "auto";
          },
          onReverseComplete: () => {
            if (aboutText) aboutText.style.pointerEvents = "none";
          },
        },
        0.55,
      );
    },
    { scope: containerRef },
  );

  return (
    <div id="vision-about" ref={containerRef} className="relative h-[250svh]">
      {/* Target anchor triggers for scroll navigation */}
      <div id="vision" className="absolute top-0 h-1 w-full" />
      <div id="about" className="absolute top-[55%] h-1 w-full" />

      {/* Sticky Fullscreen Stage */}
      <div
        ref={stickyRef}
        className="sticky top-0 flex h-[100svh] w-full items-center overflow-hidden"
      >
        <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* ── LEFT COLUMN: Vision Text (Fades out) ────────────────── */}
            <div
              ref={visionTextRef}
              className="relative z-10 flex flex-col gap-6 lg:col-span-5 lg:col-start-1"
            >
              <div>
                <span className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot mb-3 w-fit">
                  05 — THE MANIFEST
                </span>
                <LitTitle className={TITLE_SIZE} radius={320} weight={1.9}>
                  Vision
                </LitTitle>
              </div>

              <ScrollCopy className="max-w-[44ch] text-[clamp(1rem,1.25vw,1.35rem)] font-medium leading-[1.8] text-bone">
                One night where a generation shows up loud. We build the stage, the sound and the room around them, so the music is the only thing anyone leaves remembering.
              </ScrollCopy>

              <div className="flex flex-wrap items-center gap-3">
                <span className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot font-bold">
                  ✦ COLOMBO EXCLUSIVE
                </span>
                <span className="badge-pill border-hairline-bold text-bone">
                  LIVE INSTRUMENTATION & BASS
                </span>
              </div>
            </div>

            {/* ── CARD STACK DECK: Flips & travels in 3D across scroll ── */}
            <div
              ref={deckRef}
              className="relative z-20 mx-auto aspect-[4/3] w-full max-w-[420px] sm:max-w-[480px] lg:col-span-7 lg:col-start-6 lg:max-w-none"
              style={{ perspective: 1800 }}
            >
              <div className="relative h-full w-full [transform-style:preserve-3d]">
                {VISION_CARDS.map((vCard, i) => {
                  const aCard = ABOUT_CARDS[i] || ABOUT_CARDS[0];
                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        cardRefs.current[i] = el;
                      }}
                      className="absolute inset-0 will-change-transform [transform-style:preserve-3d]"
                    >
                      {/* ── Front Face: Vision Card ── */}
                      <div className="absolute inset-0 [backface-visibility:hidden]">
                        <CutCard src={vCard.src} alt={vCard.alt} />
                      </div>

                      {/* ── Back Face: About Card (Pre-flipped 180deg) ── */}
                      <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <CutCard src={aCard.src} alt={aCard.alt} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT COLUMN: About Text (Fades in) ────────────────── */}
            <div
              ref={aboutTextRef}
              className="pointer-events-none absolute inset-y-0 right-0 z-10 flex flex-col justify-center gap-6 px-(--gutter) lg:static lg:col-span-5 lg:col-start-8 lg:px-0"
            >
              <div>
                <span className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot mb-3 w-fit">
                  06 — THE PRODUCTION HOUSE
                </span>
                <LitTitle className={TITLE_SIZE} radius={320} weight={1.9}>
                  About
                </LitTitle>
              </div>

              <ScrollCopy className="max-w-[44ch] text-[clamp(1rem,1.25vw,1.35rem)] font-medium leading-[1.8] text-bone">
                Generation is produced by ECheM. Live performance, design and sound engineering held to a single production standard, for an audience that still turns up in person.
              </ScrollCopy>

              <div className="flex flex-wrap items-center gap-3">
                <span className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot font-bold">
                  ✦ PRODUCED BY ECHEM
                </span>
                <span className="badge-pill border-hairline-bold text-bone">
                  360° HYBRID AUDIO STANDARD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
