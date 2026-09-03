"use client";

import { useEffect, useRef, useState } from "react";
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

const TITLE_SIZE = "text-[clamp(4.8rem,16vw,11.5rem)] leading-[0.82] tracking-[-0.03em]";

export default function VisionAbout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const flipDeckRef = useRef<HTMLDivElement>(null);
  const visionTextRef = useRef<HTMLDivElement>(null);
  const aboutTextRef = useRef<HTMLDivElement>(null);

  const [frontHovered, setFrontHovered] = useState<number | null>(null);
  const [backHovered, setBackHovered] = useState<number | null>(null);

  /**
   * Which layout we are in, as state rather than a one-off read.
   *
   * The deck's flight across the stage is the desktop half of this animation,
   * and it was gated on a `matchMedia` evaluated once while the effect built
   * the timeline. Cross 1024px afterwards — rotate a tablet, drag a window
   * wider, or simply have the effect run before the layout had settled — and
   * the tween was never added at all. Nothing threw and everything else still
   * ran, so the deck just sat there while the text swapped around it.
   *
   * Held in state and listed as a dependency, so useGSAP tears the timeline
   * down and rebuilds it for the layout actually on screen. `null` until the
   * first read, so nothing is built against a guessed breakpoint.
   */
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  /**
   * Scroll positions where the About block is actually on screen.
   *
   * Its copy and title used to trigger off their own position like any other
   * text, which is wrong here: the block sits at the top of a pinned section
   * from the moment that section arrives, but is held at opacity 0 until the
   * deck flips more than halfway through. Measured, the word-by-word
   * illumination ran 4853-5104 while the reveal did not begin until 5761 —
   * finished 657px before anyone could see a word of it.
   *
   * Read off the container at refresh time rather than hard-coded, so the
   * fractions stay tied to the timeline positions above (the About fade sits
   * at 0.55-0.90 of a 0.95-long timeline) and survive a change of section
   * height.
   */
  const revealAt = (fraction: number) => () => {
    const el = containerRef.current;
    if (!el) return 0;
    return el.offsetTop + (el.offsetHeight - window.innerHeight) * fraction;
  };

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useGSAP(
    () => {
      const container = containerRef.current;
      const stage = stageRef.current;
      const deck = deckRef.current;
      const tilt = tiltRef.current;
      const flipDeck = flipDeckRef.current;
      const visionText = visionTextRef.current;
      const aboutText = aboutTextRef.current;

      if (!container || !stage || !deck || !tilt || !flipDeck || !visionText || !aboutText) return;

      if (isDesktop === null) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Initial state
      gsap.set(aboutText, { opacity: 0, y: 30, pointerEvents: "none" });
      gsap.set(visionText, { opacity: 1, y: 0, pointerEvents: "auto" });
      gsap.set(flipDeck, { rotationY: 0, transformOrigin: "center center" });

      if (reduced) return;

      /**
       * How far the deck slides to reach the left column.
       *
       * It has to be the deck's own offset inside the grid — the distance from
       * where it sits to the grid's left edge, which is exactly where the
       * Vision copy starts. The old reading was the stage's width minus the
       * deck's, which is a different and much larger number: it carried the
       * deck past the left edge entirely and a third of the card ended up off
       * the side of the screen.
       *
       * Measured off the live boxes at refresh, with any x already applied
       * subtracted back out, so re-running at a new width re-measures rather
       * than compounding.
       */
      const travelDist = () => {
        if (!isDesktop) return 0;
        const grid = deck.parentElement;
        if (!grid) return 0;
        const applied = (gsap.getProperty(deck, "x") as number) || 0;
        return -(deck.getBoundingClientRect().left - applied - grid.getBoundingClientRect().left);
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

      // 5. Interactive 3D mouse parallax tilt on hover
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

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: containerRef, dependencies: [isDesktop] },
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
          <div className="relative flex flex-col justify-center gap-8 sm:gap-10 lg:min-h-[480px] lg:grid lg:grid-cols-12 lg:items-center lg:gap-10">
            {/* ── MOBILE TEXT STACK CONTAINER / DESKTOP VISION COLUMN ── */}
            <div className="relative w-full min-h-[230px] sm:min-h-[260px] lg:contents">
              {/* ── Vision Text ── */}
              <div
                ref={visionTextRef}
                className="relative z-10 flex w-full flex-col gap-3 sm:gap-4 md:gap-6 lg:max-w-[500px] xl:max-w-[560px] lg:col-span-5 lg:col-start-1 lg:row-start-1"
              >
                <div>
                  <LitTitle className={TITLE_SIZE} radius={380} weight={2.6}>
                    Vision
                  </LitTitle>
                </div>

                <ScrollCopy className="text-[clamp(1.05rem,1.4vw,1.35rem)] font-medium leading-[1.65] text-bone lg:leading-[1.85]">
                  One night where a generation shows up loud. We build the stage, the sound and the room around them, so the music is the only thing anyone leaves remembering.
                </ScrollCopy>
              </div>

              {/* ── About Text (Fades in on same top spot on mobile, right column on desktop) ── */}
              <div
                ref={aboutTextRef}
                className="pointer-events-none absolute inset-0 z-10 flex w-full flex-col gap-3 sm:gap-4 md:gap-6 lg:static lg:max-w-[500px] xl:max-w-[560px] lg:col-span-5 lg:col-start-8 lg:row-start-1"
              >
                <div>
                  <LitTitle
                    trigger={containerRef}
                    start={revealAt(0.5 / 0.95)}
                    className={TITLE_SIZE}
                    radius={380}
                    weight={2.6}
                  >
                    About
                  </LitTitle>
                </div>

                <ScrollCopy
                  trigger={containerRef}
                  start={revealAt(0.55 / 0.95)}
                  end={revealAt(0.95)}
                  className="text-[clamp(1.05rem,1.4vw,1.35rem)] font-medium leading-[1.65] text-bone lg:leading-[1.85]"
                >
                  Generation is produced by ECheM. Live performance, design and sound engineering held to a single production standard, for an audience that still turns up in person.
                </ScrollCopy>
              </div>
            </div>

            {/* ── CARD STACK DECK: Flips in 3D across scroll ── */}
            <div
              ref={deckRef}
              className="relative z-20 mx-auto aspect-[4/3] w-full max-w-[270px] sm:max-w-[320px] mt-4 sm:mt-6 lg:mt-0 lg:ml-auto lg:mr-0 lg:max-w-[420px] xl:max-w-[460px] lg:col-span-7 lg:col-start-6 lg:row-start-1"
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
