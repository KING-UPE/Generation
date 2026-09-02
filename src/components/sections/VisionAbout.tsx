"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import CutCard from "@/components/ui/CutCard";

const VISION_CARDS = [
  { src: "/img/stage.svg", alt: "Performer under stage lights" },
  { src: "/img/poster.svg", alt: "Generation 26 key art" },
];

const ABOUT_CARDS = [
  { src: "/img/lights.svg", alt: "Stage beams over the floor" },
  { src: "/img/crowd.svg", alt: "Crowd with hands raised" },
];

const TITLE_SIZE = "text-[clamp(4.2rem,10.5vw,9.5rem)] leading-[0.9] tracking-[-0.025em]";

export default function VisionAbout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const flipDeckRef = useRef<HTMLDivElement>(null);
  const visionTextRef = useRef<HTMLDivElement>(null);
  const aboutTextRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const stage = stageRef.current;
      const deck = deckRef.current;
      const flipDeck = flipDeckRef.current;
      const visionText = visionTextRef.current;
      const aboutText = aboutTextRef.current;

      if (!container || !stage || !deck || !flipDeck || !visionText || !aboutText) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      // Initial state
      gsap.set(aboutText, { opacity: 0, y: 30, pointerEvents: "none" });
      gsap.set(visionText, { opacity: 1, y: 0, pointerEvents: "auto" });
      gsap.set(flipDeck, { rotationY: 0, transformOrigin: "center center" });

      if (reduced) return;

      // Calculate travel distance from right column to left column on desktop
      const travelDist = () => {
        if (!isDesktop) return 0;
        const stageWidth = stage.offsetWidth;
        const deckWidth = deck.offsetWidth;
        return -(stageWidth - deckWidth);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // 1. Fade out Vision text
      tl.to(
        visionText,
        {
          opacity: 0,
          y: -40,
          ease: "power2.inOut",
          duration: 0.35,
          onComplete: () => {
            if (visionText) visionText.style.pointerEvents = "none";
          },
          onReverseComplete: () => {
            if (visionText) visionText.style.pointerEvents = "auto";
          },
        },
        0.12,
      );

      // 2. Flight of the deck across screen to left side on Desktop
      if (isDesktop) {
        tl.to(
          deck,
          {
            x: () => travelDist(),
            ease: "power2.inOut",
            duration: 0.6,
          },
          0.18,
        );
      }

      // 3. Smooth Unified 3D Deck Flip (Rotates entire 2-card deck with 0 plane clipping)
      tl.to(
        flipDeck,
        {
          rotationY: 180,
          scale: 1.04,
          ease: "power2.inOut",
          duration: 0.55,
        },
        0.2,
      ).to(
        flipDeck,
        {
          scale: 1,
          ease: "power2.out",
          duration: 0.2,
        },
        0.75,
      );

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
    <div id="vision-about" ref={containerRef} className="relative h-[220svh]">
      {/* Target anchor triggers for scroll navigation */}
      <div id="vision" className="absolute top-0 h-1 w-full" />
      <div id="about" className="absolute top-[52%] h-1 w-full" />

      {/* Sticky Fullscreen Stage */}
      <div
        ref={stickyRef}
        className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden py-6"
      >
        <div ref={stageRef} className="relative mx-auto w-full max-w-(--maxw) px-(--gutter)">
          <div className="relative flex flex-col justify-between gap-10 lg:min-h-[480px] lg:flex-row lg:items-center">
            {/* ── LEFT COLUMN: Vision Text (Fades out) ────────────────── */}
            <div
              ref={visionTextRef}
              className="relative z-10 flex w-full flex-col gap-7 md:gap-9 lg:max-w-[500px] xl:max-w-[560px]"
            >
              <div>
                <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
                  Vision
                </LitTitle>
              </div>

              <ScrollCopy className="text-[clamp(0.95rem,1.15vw,1.15rem)] font-medium leading-[1.85] text-bone">
                One night where a generation shows up loud. We build the stage, the sound and the room around them, so the music is the only thing anyone leaves remembering.
              </ScrollCopy>
            </div>

            {/* ── CARD STACK DECK: Flips & travels in 3D across scroll ── */}
            <div
              ref={deckRef}
              className="relative z-20 mx-auto aspect-[4/3] w-full max-w-[340px] sm:max-w-[380px] lg:mx-0 lg:max-w-[420px] xl:max-w-[460px]"
              style={{ perspective: 1800 }}
            >
              {/* Unified 3D Flip Container: Flips front and back decks seamlessly */}
              <div
                ref={flipDeckRef}
                className="relative h-full w-full [transform-style:preserve-3d] will-change-transform"
              >
                {/* ── FRONT DECK (Vision: 2 Fanned Cards) ── */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  {VISION_CARDS.map((c, i) => (
                    <div
                      key={c.src}
                      className="absolute inset-0"
                      style={{
                        transform:
                          i === 0
                            ? "translate(-5%, 6%) rotate(-3.5deg) scale(0.94)"
                            : "translate(5%, -4%) rotate(3deg) scale(1)",
                        zIndex: i,
                      }}
                    >
                      <CutCard src={c.src} alt={c.alt} />
                    </div>
                  ))}
                </div>

                {/* ── BACK DECK (About: 2 Fanned Cards, Pre-flipped 180deg) ── */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  {ABOUT_CARDS.map((c, i) => (
                    <div
                      key={c.src}
                      className="absolute inset-0"
                      style={{
                        transform:
                          i === 0
                            ? "translate(5%, 6%) rotate(3.5deg) scale(0.94)"
                            : "translate(-5%, -4%) rotate(-3deg) scale(1)",
                        zIndex: i,
                      }}
                    >
                      <CutCard src={c.src} alt={c.alt} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: About Text (Fades in) ────────────────── */}
            <div
              ref={aboutTextRef}
              className="pointer-events-none absolute right-0 top-1/2 z-10 flex w-full -translate-y-1/2 flex-col gap-7 md:gap-9 px-(--gutter) lg:max-w-[500px] lg:px-0 xl:max-w-[560px]"
            >
              <div>
                <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
                  About
                </LitTitle>
              </div>

              <ScrollCopy className="text-[clamp(0.95rem,1.15vw,1.15rem)] font-medium leading-[1.85] text-bone">
                Generation is produced by ECheM. Live performance, design and sound engineering held to a single production standard, for an audience that still turns up in person.
              </ScrollCopy>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
