"use client";

import { useEffect, useRef, useState } from "react";
import { useReveal } from "@/lib/use-reveal";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

/* ── Wireframe 3D Geometric Glyphs ──────────────────────────────────── */

function GlyphOrbitalRings() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      <ellipse cx="27" cy="27" rx="22" ry="9" stroke="currentColor" strokeWidth="1.3" transform="rotate(-24 27 27)" opacity="0.45" />
      <ellipse cx="27" cy="27" rx="22" ry="9" stroke="currentColor" strokeWidth="1.3" transform="rotate(34 27 27)" opacity="0.85" />
      <ellipse cx="27" cy="27" rx="14" ry="6" stroke="currentColor" strokeWidth="1.2" transform="rotate(75 27 27)" opacity="0.6" />
      <circle cx="27" cy="27" r="3.5" fill="currentColor" opacity="0.9" />
      <circle cx="43" cy="18" r="1.8" fill="currentColor" />
      <circle cx="11" cy="36" r="1.8" fill="currentColor" />
    </svg>
  );
}

function GlyphGeodesicSphere() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      <circle cx="27" cy="27" r="20" stroke="currentColor" strokeWidth="1.3" opacity="0.85" />
      <ellipse cx="27" cy="27" rx="9.5" ry="20" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
      <ellipse cx="27" cy="27" rx="20" ry="9.5" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
      <line x1="27" y1="7" x2="27" y2="47" stroke="currentColor" strokeWidth="1.1" opacity="0.4" />
      <line x1="7" y1="27" x2="47" y2="27" stroke="currentColor" strokeWidth="1.1" opacity="0.4" />
      <circle cx="27" cy="7" r="2" fill="currentColor" />
      <circle cx="27" cy="47" r="2" fill="currentColor" />
      <circle cx="7" cy="27" r="2" fill="currentColor" />
      <circle cx="47" cy="27" r="2" fill="currentColor" />
    </svg>
  );
}

function GlyphTesseract() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      {/* Outer square */}
      <rect x="11" y="11" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.3" opacity="0.8" />
      {/* Inner square */}
      <rect x="20" y="20" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" opacity="0.95" />
      {/* Corner diagonal connectors */}
      <line x1="11" y1="11" x2="20" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="43" y1="11" x2="34" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="11" y1="43" x2="20" y2="34" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="43" y1="43" x2="34" y2="34" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="27" cy="27" r="2" fill="currentColor" />
    </svg>
  );
}

function GlyphMobiusKnot() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      <path
        d="M17 18 C11 23, 11 31, 17 36 C23 41, 31 41, 37 36 C43 31, 43 23, 37 18 C31 13, 23 13, 17 18 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.5"
      />
      <path
        d="M20 27 C15 20, 15 34, 27 27 C39 20, 39 34, 34 27"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.95"
      />
      <circle cx="17" cy="27" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <circle cx="37" cy="27" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
    </svg>
  );
}

function GlyphCoordinateStar() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      <path d="M27 7 L27 47 M7 27 L47 27" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
      <path d="M13 13 L41 41 M13 41 L41 13" stroke="currentColor" strokeWidth="1.1" opacity="0.4" />
      <circle cx="27" cy="7" r="2.5" fill="currentColor" />
      <circle cx="27" cy="47" r="2.5" fill="currentColor" />
      <circle cx="7" cy="27" r="2.5" fill="currentColor" />
      <circle cx="47" cy="27" r="2.5" fill="currentColor" />
      <rect x="23" y="23" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" transform="rotate(45 27 27)" opacity="0.9" />
    </svg>
  );
}

/* ── Ground Signals / Stalls ────────────────────────────────────────── */

const STALLS = [
  {
    index: "01",
    title: "Food Street",
    line: "Artisan kitchens along the walkway, from doors to encore.",
    icon: <GlyphOrbitalRings />,
    rotate: -4.8,
    drop: 18,
  },
  {
    index: "02",
    title: "Education",
    line: "Universities and youth programmes, face to face, all night.",
    icon: <GlyphGeodesicSphere />,
    rotate: -2.2,
    drop: 6,
  },
  {
    index: "03",
    title: "Gaming Arena",
    line: "Screens, sim-racing rigs, and open play between the sets.",
    icon: <GlyphTesseract />,
    rotate: 0.4,
    drop: 0,
  },
  {
    index: "04",
    title: "Creators",
    line: "Broadcast pods, creator meetups, and live streaming hubs.",
    icon: <GlyphMobiusKnot />,
    rotate: 2.8,
    drop: 8,
  },
  {
    index: "05",
    title: "Streetwear",
    line: "Exclusive festival merch, badges, and artist drops.",
    icon: <GlyphCoordinateStar />,
    rotate: 5.2,
    drop: 22,
  },
];

const CARD_BASE = "linear-gradient(168deg, #131317 0%, #0B0B0F 52%, #060608 100%)";

/** The lift: a soft light off the top-left corner, only on the card in hand. */
const CARD_LIT =
  "radial-gradient(125% 95% at 28% 0%, rgba(255,255,255,0.13) 0%, rgba(255,59,47,0.07) 36%, transparent 68%), " +
  "linear-gradient(168deg, #1A1A22 0%, #0E0E14 52%, #07070B 100%)";

/**
 * The faint technical ruling inside each card, masked out before it reaches the copy.
 */
const GRID =
  "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), " +
  "linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)";

const EASE = "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)";

export default function Festival() {
  const rootRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  /**
   * Tilt is desktop only. On a phone cards are swipeable with flat orientation.
   */
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useReveal(deckRef, { children: true, stagger: 0.1 });

  // Default to center card (03 Gaming Arena) when idle so the deck is naturally presented
  const activeIndex = hovered !== null ? hovered : 2;

  return (
    <section
      id="festival"
      ref={rootRef as React.RefObject<HTMLElement>}
      className="relative flex min-h-[100svh] w-full items-center py-24 md:py-32 overflow-hidden"
    >
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <span className="badge-pill">On the grounds</span>

        <div className="mt-6">
          <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
            Festival
          </LitTitle>
        </div>

        <ScrollCopy className="mt-5 max-w-[40ch] text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone">
          The show is one part of the night. The grounds are the rest.
        </ScrollCopy>

        {/* ── Scattered Fanned-Out Card Deck ─────────────────────── */}
        <div
          ref={deckRef}
          className="mt-14 flex w-full items-center justify-start overflow-x-auto pb-8 pt-6 no-scrollbar md:mt-20 md:justify-center md:overflow-visible md:pb-12"
        >
          <div className="flex items-center px-4 md:px-0 md:-space-x-8 lg:-space-x-12">
            {STALLS.map((stall, i) => {
              const active = activeIndex === i;
              return (
                <div
                  key={stall.title}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setHovered(i)}
                  className="group relative flex h-[330px] w-[250px] shrink-0 cursor-pointer flex-col items-center justify-between overflow-hidden rounded-[28px] p-6 text-center select-none md:h-[350px] md:w-[270px] md:p-7"
                  style={{
                    background: active ? CARD_LIT : CARD_BASE,
                    boxShadow: active
                      ? "0 34px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.16) inset, 0 0 28px rgba(255,59,47,0.15)"
                      : "0 18px 46px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06) inset",
                    transform: wide
                      ? `rotate(${active ? stall.rotate * 0.2 : stall.rotate}deg) translateY(${
                          active ? stall.drop - 20 : stall.drop
                        }px) scale(${active ? 1.04 : 0.98})`
                      : active
                      ? "scale(1.02)"
                      : "scale(0.97)",
                    zIndex: active ? 40 : 10 + i,
                    transition: EASE,
                  }}
                >
                  {/* Faint technical grid interior */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: GRID,
                      backgroundSize: "36px 36px",
                      maskImage: "linear-gradient(to bottom, #000 0%, transparent 66%)",
                      WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 66%)",
                      opacity: active ? 1 : 0.5,
                      transition: EASE,
                    }}
                  />

                  {/* Index badge */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-5 top-5 font-mono-ui text-[11px] tracking-[0.24em] transition-colors"
                    style={{ color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)" }}
                  >
                    {stall.index}
                  </span>

                  {/* Upper icon glyph */}
                  <div className="relative mt-2 flex h-20 w-20 items-center justify-center">
                    <span
                      aria-hidden
                      className="inline-flex h-14 w-14 items-center justify-center transition-all duration-500"
                      style={{
                        color: active ? "#FF3B2F" : "rgba(255,255,255,0.78)",
                        transform: active ? "scale(1.12)" : "scale(1)",
                        filter: active ? "drop-shadow(0 0 14px rgba(255,59,47,0.45))" : "none",
                      }}
                    >
                      {stall.icon}
                    </span>
                  </div>

                  {/* Lower Title & Reveal Copy block */}
                  <div className="relative flex flex-col items-center justify-center">
                    <h3
                      className="font-display leading-tight tracking-[-0.01em] transition-colors duration-300"
                      style={{
                        fontSize: "clamp(1.4rem, 2.4vw, 1.85rem)",
                        color: active ? "#FFFFFF" : "#D4D4D8",
                      }}
                    >
                      {stall.title}
                    </h3>

                    {/* Description copy - revealed smoothly on the active card */}
                    <div className="mt-2 min-h-[44px]">
                      <p
                        className="max-w-[22ch] font-sans text-xs leading-relaxed text-white/60 transition-all duration-500"
                        style={{
                          opacity: active ? 1 : 0,
                          transform: active ? "translateY(0)" : "translateY(8px)",
                        }}
                      >
                        {stall.line}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="eyebrow mt-10 text-center md:mt-14">
          Inside the same footprint <span className="text-red-hot">·</span> as the stage
        </p>
      </div>
    </section>
  );
}
