"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import CutCard from "@/components/ui/CutCard";

const VISION_CARDS = [
  { src: "/img/stage.svg", alt: "Performer under stage lights" },
  { src: "/img/poster.svg", alt: "Generation 26 key art" },
];

const ABOUT_CARDS = [
  { src: "/img/lights.svg", alt: "Stage beams over the floor" },
  { src: "/img/crowd.svg", alt: "Crowd with hands raised" },
];

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

export default function VisionAbout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const flipDeckRef = useRef<HTMLDivElement>(null);
  const visionTextRef = useRef<HTMLDivElement>(null);
  const aboutTextRef = useRef<HTMLDivElement>(null);
  const visionCopyRef = useRef<HTMLParagraphElement>(null);
  const aboutCopyRef = useRef<HTMLParagraphElement>(null);

  const [frontHovered, setFrontHovered] = useState<number | null>(null);
  const [backHovered, setBackHovered] = useState<number | null>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      const stage = stageRef.current;
      const deck = deckRef.current;
      const tilt = tiltRef.current;
      const flipDeck = flipDeckRef.current;
      const visionText = visionTextRef.current;
      const aboutText = aboutTextRef.current;
      const visionCopy = visionCopyRef.current;
      const aboutCopy = aboutCopyRef.current;

      if (!container || !stage || !deck || !tilt || !flipDeck || !visionText || !aboutText) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      // Initial state
      gsap.set(aboutText, { opacity: 0, y: 30, pointerEvents: "none" });
      gsap.set(visionText, { opacity: 1, y: 0, pointerEvents: "auto" });
      gsap.set(flipDeck, { rotationY: 0, transformOrigin: "center center" });

      let visionSplit: SplitText | null = null;
      let aboutSplit: SplitText | null = null;

      try {
        if (visionCopy) {
          visionSplit = SplitText.create(visionCopy, {
            type: "words",
            wordsClass: "sc-word",
          });
          gsap.set(visionSplit.words, { color: "#9E9EAA" });
        }
        if (aboutCopy) {
          aboutSplit = SplitText.create(aboutCopy, {
            type: "words",
            wordsClass: "sc-word",
          });
          gsap.set(aboutSplit.words, { color: "#9E9EAA" });
        }
      } catch {
        // fallback to normal text color
        if (visionCopy) gsap.set(visionCopy, { color: "#FFFFFF" });
        if (aboutCopy) gsap.set(aboutCopy, { color: "#FFFFFF" });
      }

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

      // 0. Vision copy illuminates word-by-word with scroll
      if (visionSplit?.words) {
        tl.fromTo(
          visionSplit.words,
          { color: "#9E9EAA" },
          {
            color: "#FFFFFF",
            stagger: 0.02,
            ease: "none",
            duration: 0.22,
          },
          0.0,
        );
      }

      // 1. Fade out Vision text
      tl.to(
        visionText,
        {
          opacity: 0,
          y: -35,
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

      // 5. About copy illuminates word-by-word with scroll in the About phase!
      if (aboutSplit?.words) {
        tl.fromTo(
          aboutSplit.words,
          { color: "#9E9EAA" },
          {
            color: "#FFFFFF",
            stagger: 0.02,
            ease: "none",
            duration: 0.35,
          },
          0.60,
        );
      }

      // 6. Interactive 3D mouse parallax tilt on hover
      const cleanups: (() => void)[] = [];
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const tiltX = gsap.quickTo(tilt, "rotationX", { duration: 0.6, ease: "power3" });
        const tiltY = gsap.quickTo(tilt, "rotationY", { duration: 0.6, ease: "power3" });
        const driftX = gsap.quickTo(tilt, "x", { duration: 0.8, ease: "power3" });
        const driftY = gsap.quickTo(tilt, "y", { duration: 0.8, ease: "power3" });

        const onMove = (e: PointerEvent) => {
          const r = deck.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          tiltY(nx * 12);
          tiltX(-ny * 10);
          driftX(nx * 14);
          driftY(ny * 10);
        };

        const onLeave = () => {
          tiltY(0);
          tiltX(0);
          driftX(0);
          driftY(0);
        };

        deck.addEventListener("pointermove", onMove);
        deck.addEventListener("pointerleave", onLeave);

        cleanups.push(() => {
          deck.removeEventListener("pointermove", onMove);
          deck.removeEventListener("pointerleave", onLeave);
        });
      }

      return () => {
        cleanups.forEach((fn) => fn());
        visionSplit?.revert();
        aboutSplit?.revert();
      };
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
        className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden py-4 sm:py-6"
      >
        <div ref={stageRef} className="relative mx-auto w-full max-w-(--maxw) px-(--gutter)">
          {/* Main Grid: stacks vertically on mobile, 2-columns on desktop */}
          <div className="relative flex flex-col justify-center gap-6 sm:gap-8 lg:min-h-[480px] lg:grid lg:grid-cols-12 lg:items-center lg:gap-10">
            {/* ── MOBILE TEXT STACK CONTAINER / DESKTOP VISION COLUMN ── */}
            <div className="relative w-full min-h-[170px] sm:min-h-[190px] lg:contents">
              {/* ── Vision Text ── */}
              <div
                ref={visionTextRef}
                className="relative z-10 flex w-full flex-col gap-3 sm:gap-4 md:gap-6 lg:max-w-[500px] xl:max-w-[560px] lg:col-span-5 lg:col-start-1"
              >
                <div>
                  <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
                    Vision
                  </LitTitle>
                </div>

                <p
                  ref={visionCopyRef}
                  className="copy-justify text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone-muted lg:leading-[1.85]"
                >
                  One night where a generation shows up loud. We build the stage, the sound and the room around them, so the music is the only thing anyone leaves remembering.
                </p>
              </div>

              {/* ── About Text (Fades in on same top spot on mobile, right column on desktop) ── */}
              <div
                ref={aboutTextRef}
                className="pointer-events-none absolute inset-0 z-10 flex w-full flex-col gap-3 sm:gap-4 md:gap-6 lg:static lg:max-w-[500px] xl:max-w-[560px] lg:col-span-5 lg:col-start-8"
              >
                <div>
                  <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
                    About
                  </LitTitle>
                </div>

                <p
                  ref={aboutCopyRef}
                  className="copy-justify text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone-muted lg:leading-[1.85]"
                >
                  Generation is produced by ECheM. Live performance, design and sound engineering held to a single production standard, for an audience that still turns up in person.
                </p>
              </div>
            </div>

            {/* ── CARD STACK DECK: Flips in 3D across scroll ── */}
            <div
              ref={deckRef}
              className="relative z-20 mx-auto aspect-[4/3] w-full max-w-[270px] sm:max-w-[320px] lg:mx-0 lg:max-w-[420px] xl:max-w-[460px] lg:col-span-7 lg:col-start-6"
              style={{ perspective: 1800 }}
            >
              {/* Mouse Parallax Tilt Container */}
              <div ref={tiltRef} className="relative h-full w-full [transform-style:preserve-3d]">
                {/* Unified 3D Flip Container: Flips front and back decks seamlessly */}
                <div
                  ref={flipDeckRef}
                  className="relative h-full w-full [transform-style:preserve-3d] will-change-transform"
                >
                  {/* ── FRONT DECK (Vision: 2 Fanned Cards) ── */}
                  <div className="absolute inset-0 [backface-visibility:hidden]">
                    {VISION_CARDS.map((c, i) => {
                      const isHovered = frontHovered === i;
                      const isOtherHovered = frontHovered !== null && frontHovered !== i;

                      let transform =
                        i === 0
                          ? "translate(-5%, 6%) rotate(-3.5deg) scale(0.94)"
                          : "translate(5%, -4%) rotate(3deg) scale(1)";
                      let zIndex = i + 1;
                      let opacity = 1;
                      let filter = "none";

                      if (isHovered) {
                        zIndex = 20;
                        transform =
                          i === 0
                            ? "translate(-2%, -3%) rotate(-1deg) scale(1.05)"
                            : "translate(2%, -3%) rotate(1deg) scale(1.05)";
                        filter = "drop-shadow(0 16px 36px rgba(255, 59, 47, 0.45))";
                      } else if (isOtherHovered) {
                        zIndex = 1;
                        opacity = 0.45;
                        transform =
                          i === 0
                            ? "translate(-8%, 9%) rotate(-6deg) scale(0.9)"
                            : "translate(8%, 9%) rotate(6deg) scale(0.9)";
                      }

                      return (
                        <div
                          key={c.src}
                          onMouseEnter={() => setFrontHovered(i)}
                          onMouseLeave={() => setFrontHovered(null)}
                          className="absolute inset-0 cursor-pointer"
                          style={{
                            transform,
                            zIndex,
                            opacity,
                            filter,
                            transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <CutCard src={c.src} alt={c.alt} />
                        </div>
                      );
                    })}
                  </div>

                  {/* ── BACK DECK (About: 2 Fanned Cards, Pre-flipped 180deg) ── */}
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {ABOUT_CARDS.map((c, i) => {
                      const isHovered = backHovered === i;
                      const isOtherHovered = backHovered !== null && backHovered !== i;

                      let transform =
                        i === 0
                          ? "translate(5%, 6%) rotate(3.5deg) scale(0.94)"
                          : "translate(-5%, -4%) rotate(-3deg) scale(1)";
                      let zIndex = i + 1;
                      let opacity = 1;
                      let filter = "none";

                      if (isHovered) {
                        zIndex = 20;
                        transform =
                          i === 0
                            ? "translate(2%, -3%) rotate(1deg) scale(1.05)"
                            : "translate(-2%, -3%) rotate(-1deg) scale(1.05)";
                        filter = "drop-shadow(0 16px 36px rgba(255, 59, 47, 0.45))";
                      } else if (isOtherHovered) {
                        zIndex = 1;
                        opacity = 0.45;
                        transform =
                          i === 0
                            ? "translate(8%, 9%) rotate(6deg) scale(0.9)"
                            : "translate(-8%, 9%) rotate(-6deg) scale(0.9)";
                      }

                      return (
                        <div
                          key={c.src}
                          onMouseEnter={() => setBackHovered(i)}
                          onMouseLeave={() => setBackHovered(null)}
                          className="absolute inset-0 cursor-pointer"
                          style={{
                            transform,
                            zIndex,
                            opacity,
                            filter,
                            transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <CutCard src={c.src} alt={c.alt} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
