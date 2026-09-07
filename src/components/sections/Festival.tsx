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
      <rect x="11" y="11" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.3" opacity="0.8" />
      <rect x="20" y="20" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" opacity="0.95" />
      <line x1="11" y1="11" x2="20" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="43" y1="11" x2="34" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="11" y1="43" x2="20" y2="34" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <line x1="43" y1="43" x2="34" y2="34" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="27" cy="27" r="2" fill="currentColor" />
    </svg>
  );
}

/* ── Festival Stall Cards (from Sponsorship Proposal) ─────────────── */

const STALLS = [
  {
    index: "01",
    title: "Food Stalls",
    line: "Artisan food kitchens and beverage stalls along the main walkway, serving 13,500+ attendees from doors open to encore.",
    spec: "High-Traffic Footprint · Power Equipped",
    icon: <GlyphOrbitalRings />,
    // Asymmetric scattered rotation and drop values
    rotate: -5.6,
    drop: 22,
    zIndex: 10,
  },
  {
    index: "02",
    title: "Education Stalls",
    line: "University faculties, campuses, and youth programmes with direct face-to-face student engagement all night.",
    spec: "Direct Student Reach · Interactive Setup",
    icon: <GlyphGeodesicSphere />,
    rotate: 4.4,
    drop: -10,
    zIndex: 20,
  },
  {
    index: "03",
    title: "Gaming Stalls",
    line: "Interactive gaming zones, esports challenges, and open play stations between stage sets on the festival grounds.",
    spec: "Dedicated Power · Experiential Screens",
    icon: <GlyphTesseract />,
    rotate: -2.8,
    drop: 18,
    zIndex: 15,
  },
];

const CARD_BASE = "linear-gradient(168deg, #131317 0%, #0B0B0F 52%, #060608 100%)";

/** The lift: a soft specular spotlight on the active card */
const CARD_LIT =
  "radial-gradient(125% 95% at 28% 0%, rgba(255,255,255,0.14) 0%, rgba(255,59,47,0.08) 36%, transparent 68%), " +
  "linear-gradient(168deg, #1A1A22 0%, #0E0E14 52%, #07070B 100%)";

/** Faint technical grid ruling */
const GRID =
  "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), " +
  "linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)";

const EASE = "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)";

export default function Festival() {
  const rootRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  /**
   * Scattered tilt is applied on desktop viewports.
   */
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useReveal(deckRef, { children: true, stagger: 0.12 });

  // Default active card is the center card (02 Education Stalls) so one card is naturally highlighted on load
  const activeIndex = hovered !== null ? hovered : 1;

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

        {/* ── Asymmetrically Scattered & Rotated 3-Card Deck ────── */}
        <div
          ref={deckRef}
          className="mt-14 flex w-full items-center justify-start overflow-x-auto pb-10 pt-8 no-scrollbar md:mt-24 md:justify-center md:overflow-visible md:pb-16"
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
                  className="group relative flex h-[360px] w-[270px] shrink-0 cursor-pointer flex-col items-center justify-between overflow-hidden rounded-[28px] p-6 text-center select-none sm:h-[390px] sm:w-[300px] md:h-[410px] md:w-[320px] md:p-8"
                  style={{
                    background: active ? CARD_LIT : CARD_BASE,
                    boxShadow: active
                      ? "0 36px 85px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 32px rgba(255,59,47,0.18)"
                      : "0 18px 46px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06) inset",
                    transform: wide
                      ? `rotate(${active ? 0 : stall.rotate}deg) translateY(${
                          active ? stall.drop - 26 : stall.drop
                        }px) scale(${active ? 1.05 : 0.98})`
                      : active
                      ? "scale(1.02)"
                      : "scale(0.98)",
                    zIndex: active ? 50 : stall.zIndex,
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
                      maskImage: "linear-gradient(to bottom, #000 0%, transparent 68%)",
                      WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 68%)",
                      opacity: active ? 1 : 0.45,
                      transition: EASE,
                    }}
                  />

                  {/* Index badge in mono */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-6 top-6 font-mono-ui text-[11px] tracking-[0.26em] transition-colors duration-300"
                    style={{ color: active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)" }}
                  >
                    {stall.index}
                  </span>

                  {/* Upper wireframe geometric glyph */}
                  <div className="relative mt-2 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                    <span
                      aria-hidden
                      className="inline-flex h-16 w-16 items-center justify-center transition-all duration-500 sm:h-18 sm:w-18"
                      style={{
                        color: active ? "#FF3B2F" : "rgba(255,255,255,0.78)",
                        transform: active ? "scale(1.12)" : "scale(1)",
                        filter: active ? "drop-shadow(0 0 16px rgba(255,59,47,0.5))" : "none",
                      }}
                    >
                      {stall.icon}
                    </span>
                  </div>

                  {/* Lower Title & Reveal Copy block */}
                  <div className="relative flex flex-col items-center justify-center w-full">
                    <h3
                      className="font-display leading-tight tracking-[-0.01em] transition-colors duration-300"
                      style={{
                        fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)",
                        color: active ? "#FFFFFF" : "#D4D4D8",
                      }}
                    >
                      {stall.title}
                    </h3>

                    {/* Telemetry badge / spec from proposal presentation */}
                    <span
                      className="mt-1 font-mono-ui text-[10px] uppercase tracking-[0.18em] transition-all duration-300"
                      style={{
                        color: active ? "rgba(255,90,74,0.9)" : "rgba(255,255,255,0.28)",
                      }}
                    >
                      {stall.spec}
                    </span>

                    {/* Description copy - revealed smoothly on the active card */}
                    <div className="mt-2.5 min-h-[52px]">
                      <p
                        className="max-w-[24ch] font-sans text-xs leading-relaxed text-white/60 transition-all duration-500 sm:text-[13px]"
                        style={{
                          opacity: active ? 1 : 0,
                          transform: active ? "translateY(0)" : "translateY(10px)",
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

        <p className="eyebrow mt-12 text-center md:mt-16">
          Inside the same footprint <span className="text-red-hot">·</span> as the stage
        </p>
      </div>
    </section>
  );
}
