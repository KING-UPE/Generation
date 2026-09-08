"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import CutCard from "@/components/ui/CutCard";

/* The deck is aspect-[4/3], so these are the landscape frames. Vision carries
   the two that show the size of the room; About carries the two that show what
   happens in it. */
const VISION_CARDS = [
  { src: "/img/photos/IAP07571.webp", alt: "A performer facing a full open-air crowd at dusk" },
  { src: "/img/photos/IAP08008.webp", alt: "The floor lit end to end by phone torches" },
];

const ABOUT_CARDS = [
  { src: "/img/photos/IAP08596.webp", alt: "A singer on stage behind a curtain of sparks" },
  { src: "/img/photos/IAP09052.webp", alt: "A dance troupe in line across the stage" },
];

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

export default function VisionAbout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const flipDeckRef = useRef<HTMLDivElement>(null);
  const frontDeckRef = useRef<HTMLDivElement>(null);
  const backDeckRef = useRef<HTMLDivElement>(null);
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
   * Memoized with useCallback so their function references remain completely
   * stable across card hover re-renders, preventing LitTitle and ScrollCopy
   * from unmounting or restarting their entrance animations.
   */
  const revealAboutStart = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    return el.offsetTop + (el.offsetHeight - window.innerHeight) * (0.5 / 0.95);
  }, []);

  const revealAboutCopyStart = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    return el.offsetTop + (el.offsetHeight - window.innerHeight) * (0.55 / 0.95);
  }, []);

  const revealAboutCopyEnd = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    return el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.95;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const onFrontPointerOver = (e: React.PointerEvent) => {
    const card = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-card-index]");
    if (!card) return;
    const index = Number(card.dataset.cardIndex);
    setFrontHovered((prev) => (prev === index ? prev : index));
  };

  const onFrontPointerLeave = () => {
    setFrontHovered(null);
  };

  const onBackPointerOver = (e: React.PointerEvent) => {
    const card = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-card-index]");
    if (!card) return;
    const index = Number(card.dataset.cardIndex);
    setBackHovered((prev) => (prev === index ? prev : index));
  };

  const onBackPointerLeave = () => {
    setBackHovered(null);
  };

  useGSAP(
    () => {
      const container = containerRef.current;
      const stage = stageRef.current;
      const deck = deckRef.current;
      const tilt = tiltRef.current;
      const flipDeck = flipDeckRef.current;
      const frontDeck = frontDeckRef.current;
      const backDeck = backDeckRef.current;
      const visionText = visionTextRef.current;
      const aboutText = aboutTextRef.current;

      if (!container || !stage || !deck || !tilt || !flipDeck || !frontDeck || !backDeck || !visionText || !aboutText) return;

      if (isDesktop === null) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Initial state
      gsap.set(aboutText, { opacity: 0, y: 30, pointerEvents: "none" });
      gsap.set(visionText, { opacity: 1, y: 0, pointerEvents: "auto" });
      gsap.set(flipDeck, { rotationY: 0, transformOrigin: "center center" });
      gsap.set(frontDeck, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(backDeck, { visibility: "hidden", pointerEvents: "none" });

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

      /*
       * Matched to the hero's scrub, and for the same reason.
       *
       * At 1.2 the deck took another 1.2s to reach a scroll position Lenis had
       * already spent 1.15s easing towards. The two lags run in series, so the
       * flight across the stage was still crawling more than two seconds after
       * the page had stopped moving — which does not read as a slow animation,
       * it reads as a dropped frame rate. 0.25 absorbs the jitter between
       * scroll events without being seen as the section failing to settle.
       */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.25,
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

      // At the 90-degree midpoint (0.475), cleanly isolate Front Deck and Back Deck
      tl.set(frontDeck, { visibility: "hidden", pointerEvents: "none" }, 0.475);
      tl.set(backDeck, { visibility: "visible", pointerEvents: "auto" }, 0.475);
      tl.call(
        () => {
          setFrontHovered(null);
          setBackHovered(null);
        },
        undefined,
        0.475,
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
        const tiltX = gsap.quickTo(tilt, "rotationX", { duration: 0.4, ease: "power2" });
        const tiltY = gsap.quickTo(tilt, "rotationY", { duration: 0.4, ease: "power2" });
        const driftX = gsap.quickTo(tilt, "x", { duration: 0.4, ease: "power2" });
        const driftY = gsap.quickTo(tilt, "y", { duration: 0.4, ease: "power2" });

        const onMove = (e: PointerEvent) => {
          const r = deck.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          tiltY(nx * 10);
          tiltX(-ny * 8);
          driftX(nx * 10);
          driftY(ny * 8);
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
            <div className="relative w-full min-h-[180px] sm:min-h-[200px] lg:contents">
              {/* ── Vision Text ── */}
              <div
                ref={visionTextRef}
                className="relative z-10 flex w-full flex-col gap-3 sm:gap-4 md:gap-6 lg:max-w-[500px] xl:max-w-[560px] lg:col-span-5 lg:col-start-1 lg:row-start-1"
              >
                <div>
                  <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
                    Vision
                  </LitTitle>
                </div>

                <ScrollCopy className="text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone lg:leading-[1.85]">
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
                    start={revealAboutStart}
                    className={TITLE_SIZE}
                    radius={340}
                    weight={1.9}
                  >
                    About
                  </LitTitle>
                </div>

                <ScrollCopy
                  trigger={containerRef}
                  start={revealAboutCopyStart}
                  end={revealAboutCopyEnd}
                  className="text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone lg:leading-[1.85]"
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
                  <div
                    ref={frontDeckRef}
                    onPointerOver={onFrontPointerOver}
                    onPointerLeave={onFrontPointerLeave}
                    className="absolute inset-0 [backface-visibility:hidden]"
                  >
                    {VISION_CARDS.map((c, i) => {
                      const isHovered = frontHovered === i;
                      const isOtherHovered = frontHovered !== null && frontHovered !== i;

                      /* The resting place, and it never moves: this is the
                         box the pointer gets tested against.

                         Opened up from the 5%/6% it used to fan by. At that
                         spread the front card covered all but a 33px strip of
                         the one behind it, which reads as one card with a
                         strange edge rather than two photographs. */
                      const rest =
                        i === 0
                          ? "translate(-16%, 12%) rotate(-7deg) scale(0.86)"
                          : "translate(10%, -7%) rotate(4deg) scale(1)";

                      /* Everything hover does, stated relative to that. Composed
                         with `rest` on the parent it lands where it belongs. */
                      let lift = "none";
                      let zIndex = i + 1;
                      let filter = "none";

                      if (isHovered) {
                        zIndex = 20;
                        lift =
                          i === 0
                            ? "translate(12%, -14%) rotate(5deg) scale(1.163)"
                            : "translate(-4%, -3%) rotate(-2deg) scale(1.06)";
                        filter = "drop-shadow(0 16px 36px rgba(255, 59, 47, 0.45))";
                      } else if (isOtherHovered) {
                        zIndex = 1;
                        /* Dimmed, not faded. Dropping the opacity made the card
                           see-through, so wherever it overlapped its neighbour
                           you looked straight through one photograph into the
                           other. Brightness recedes it and keeps it solid. */
                        filter = "brightness(0.45) saturate(0.75)";
                        lift =
                          i === 0
                            ? "translate(-7%, 5%) rotate(-3deg) scale(0.93)"
                            : "translate(6%, 5%) rotate(3deg) scale(0.9)";
                      }

                      return (
                        <div
                          key={c.src}
                          className="pointer-events-none absolute inset-0"
                          style={{ transform: rest, zIndex }}
                        >
                          <div
                            data-card-index={i}
                            className="pointer-events-auto h-full w-full cursor-pointer"
                            style={{
                              transform: lift,
                              filter,
                              transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          >
                            <CutCard src={c.src} alt={c.alt} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── BACK DECK (About: 2 Fanned Cards, Pre-flipped 180deg) ── */}
                  <div
                    ref={backDeckRef}
                    onPointerOver={onBackPointerOver}
                    onPointerLeave={onBackPointerLeave}
                    className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                    style={{ visibility: "hidden", pointerEvents: "none" }}
                  >
                    {ABOUT_CARDS.map((c, i) => {
                      const isHovered = backHovered === i;
                      const isOtherHovered = backHovered !== null && backHovered !== i;

                      /* Same split and the same spread as the front deck,
                         mirrored. See the notes there. */
                      const rest =
                        i === 0
                          ? "translate(16%, 12%) rotate(7deg) scale(0.86)"
                          : "translate(-10%, -7%) rotate(-4deg) scale(1)";

                      let lift = "none";
                      let zIndex = i + 1;
                      let filter = "none";

                      if (isHovered) {
                        zIndex = 20;
                        lift =
                          i === 0
                            ? "translate(-12%, -14%) rotate(-5deg) scale(1.163)"
                            : "translate(4%, -3%) rotate(2deg) scale(1.06)";
                        filter = "drop-shadow(0 16px 36px rgba(255, 59, 47, 0.45))";
                      } else if (isOtherHovered) {
                        zIndex = 1;
                        filter = "brightness(0.45) saturate(0.75)";
                        lift =
                          i === 0
                            ? "translate(7%, 5%) rotate(3deg) scale(0.93)"
                            : "translate(-6%, 5%) rotate(-3deg) scale(0.9)";
                      }

                      return (
                        <div
                          key={c.src}
                          className="pointer-events-none absolute inset-0"
                          style={{ transform: rest, zIndex }}
                        >
                          <div
                            data-card-index={i}
                            className="pointer-events-auto h-full w-full cursor-pointer"
                            style={{
                              transform: lift,
                              filter,
                              transition: "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                          >
                            <CutCard src={c.src} alt={c.alt} />
                          </div>
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
