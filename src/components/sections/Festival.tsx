"use client";

import { useEffect, useRef, useState } from "react";
import { useReveal } from "@/lib/use-reveal";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

/* ── Wireframe 3D Geometric Glyphs ──────────────────────────────────── */

/** Food Stalls: Gourmet Plate with Crossed Fork & Chef's Knife */
function GlyphFood() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      {/* Gourmet Plate Rims */}
      <circle cx="27" cy="27" r="21" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2.5" opacity="0.35" />
      <circle cx="27" cy="27" r="16" stroke="currentColor" strokeWidth="1.3" opacity="0.65" />
      <circle cx="27" cy="27" r="8.5" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />

      {/* Fork (Left) */}
      <g opacity="0.95">
        <path d="M19.5 13 v7 c0 2 2.5 2 2.5 0 v-7 M20.7 13 v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M20.7 21.5 v17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20.7" cy="39.5" r="1.2" fill="currentColor" />
      </g>

      {/* Chef Knife (Right) */}
      <g opacity="0.95">
        <path d="M33.5 13 v11 c0 2.2 -2.5 2.2 -2.5 0 v-11 c1.4 0 2.5 0 2.5 0 Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.16" strokeLinejoin="round" />
        <path d="M32.2 25.5 v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="32.2" cy="39.5" r="1.2" fill="currentColor" />
      </g>

      {/* Culinary Sparkle / Aroma Node */}
      <circle cx="27" cy="27" r="2.2" fill="currentColor" opacity="0.9" />
      <path d="M27 8 v-3 M25 6.5 h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
      <circle cx="13" cy="27" r="1.4" fill="currentColor" opacity="0.4" />
      <circle cx="41" cy="27" r="1.4" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Education Stalls: Graduation Mortarboard Cap + Open Knowledge Book */
function GlyphEducation() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      {/* Graduation Mortarboard (Top) */}
      <polygon points="27,9 45,16 27,23 9,16" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round" opacity="0.95" />
      {/* Cap Skull */}
      <path d="M16 19 v6 c0 3.5 22 3.5 22 0 v-6" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      {/* Hanging Tassel & Bead on Left */}
      <path d="M27 16 L9 20 v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
      <circle cx="9" cy="29" r="1.6" fill="currentColor" />

      {/* Open Knowledge Book (Bottom) */}
      {/* Left Page */}
      <path d="M27 34 C21 31, 13 31, 7 33 L7 44 C13 42, 21 42, 27 45 Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.08" strokeLinejoin="round" opacity="0.9" />
      {/* Right Page */}
      <path d="M27 34 C33 31, 41 31, 47 33 L47 44 C41 42, 33 42, 27 45 Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.08" strokeLinejoin="round" opacity="0.9" />
      {/* Book Spine */}
      <line x1="27" y1="34" x2="27" y2="45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
      {/* Subtle Ruled Page Lines */}
      <line x1="12" y1="36.5" x2="22" y2="35.5" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line x1="12" y1="40" x2="22" y2="39" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line x1="32" y1="35.5" x2="42" y2="36.5" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line x1="32" y1="39" x2="42" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

/** Gaming Stalls: Precision Gamepad Controller */
function GlyphGaming() {
  return (
    <svg viewBox="0 0 54 54" fill="none" className="h-full w-full">
      {/* Ergonomic Gamepad Body */}
      <path
        d="M15 16 C10 16, 7 21, 8 27 L11 41 C12 45, 17 45, 19 41 L23 34 H31 L35 41 C37 45, 42 45, 43 41 L46 27 C47 21, 44 16, 39 16 C34 16, 32 19, 27 19 C22 19, 20 16, 15 16 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="currentColor"
        fillOpacity="0.08"
        strokeLinejoin="round"
        opacity="0.95"
      />

      {/* Shoulder Bumpers L1 & R1 */}
      <path d="M12 13 C12 10.5, 18 10.5, 19 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M35 13 C36 10.5, 42 10.5, 42 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

      {/* Directional D-Pad (Left) */}
      <g opacity="0.95">
        <path
          d="M17 22 v2.5 h-2.5 v2 h2.5 v2.5 h2 v-2.5 h2.5 v-2 h-2.5 v-2.5 Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="currentColor"
          fillOpacity="0.35"
          strokeLinejoin="round"
        />
      </g>

      {/* Action Buttons: 4 diamond dots (Right) */}
      <g opacity="0.95">
        <circle cx="37" cy="22.5" r="1.3" fill="currentColor" />
        <circle cx="37" cy="28.5" r="1.3" fill="currentColor" />
        <circle cx="34" cy="25.5" r="1.3" fill="currentColor" />
        <circle cx="40" cy="25.5" r="1.3" fill="currentColor" />
      </g>

      {/* Dual Analog Thumbsticks (Center Bottom) */}
      <g opacity="0.85">
        <circle cx="21.5" cy="32.5" r="3.2" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="21.5" cy="32.5" r="1.2" fill="currentColor" />
        <circle cx="32.5" cy="32.5" r="3.2" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="32.5" cy="32.5" r="1.2" fill="currentColor" />
      </g>

      {/* Central LED Status Bar */}
      <line x1="25" y1="23" x2="29" y2="23" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
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
    icon: <GlyphFood />,
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
    icon: <GlyphEducation />,
    rotate: 4.4,
    drop: -10,
    zIndex: 20,
  },
  {
    index: "03",
    title: "Gaming Stalls",
    line: "Interactive gaming zones, esports challenges, and open play stations between stage sets on the festival grounds.",
    spec: "Dedicated Power · Experiential Screens",
    icon: <GlyphGaming />,
    rotate: -2.8,
    drop: 18,
    zIndex: 15,
  },
];

/*
 * The resting surface is the ink scale — --ink-3 to --ink-2 to --ink — rather
 * than the greys it was built with. Off-token it sat a shade lighter than every
 * other dark surface on the page, which reads as a different black beside the
 * starfield.
 *
 * The lit surface below is the only place a literal survives: it is those two
 * tokens raised a step to read as picked up, and there is no token for that.
 */
const CARD_BASE =
  "linear-gradient(168deg, var(--ink-3) 0%, var(--ink-2) 52%, var(--ink) 100%)";

/**
 * The lift: a soft specular spotlight on the active card. The warm stop is
 * --red-hot at 8%; it was #FF5A3C, which is the lightest stop of --grad-red and
 * a hair orange on its own.
 */
const CARD_LIT =
  "radial-gradient(125% 95% at 28% 0%, rgba(237,237,240,0.14) 0%, rgba(255,59,47,0.08) 36%, transparent 68%), " +
  "linear-gradient(168deg, #17171E 0%, #0D0D12 52%, var(--ink) 100%)";

/** Faint technical ruling, drawn in the hairline's own colour at a third of
 *  its weight — the same off-white every rule on the site is drawn in. */
const GRID =
  "linear-gradient(to right, rgba(237,237,240,0.05) 1px, transparent 1px), " +
  "linear-gradient(to bottom, rgba(237,237,240,0.05) 1px, transparent 1px)";

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

  // Only active when hovered; no card is permanently active by default
  const activeIndex = hovered;

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
                  className="group relative flex h-[360px] w-[270px] shrink-0 cursor-pointer flex-col items-center justify-between overflow-hidden rounded-[26px] p-6 text-center select-none sm:h-[390px] sm:w-[300px] md:h-[410px] md:w-[320px] md:p-8"
                  style={{
                    background: active ? CARD_LIT : CARD_BASE,
                    boxShadow: active
                      ? "0 36px 85px rgba(0,0,0,0.85), 0 0 0 1px rgba(237,237,240,0.18) inset, 0 0 32px rgba(255,59,47,0.18)"
                      : "0 18px 46px rgba(0,0,0,0.65), 0 0 0 1px rgba(237,237,240,0.08) inset",
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
                    style={{ color: active ? "var(--muted)" : "var(--dim)" }}
                  >
                    {stall.index}
                  </span>

                  {/* Upper wireframe geometric glyph */}
                  <div className="relative mt-2 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                    <span
                      aria-hidden
                      className="inline-flex h-16 w-16 items-center justify-center transition-all duration-500 sm:h-18 sm:w-18"
                      style={{
                        color: active ? "var(--red-hot)" : "var(--muted)",
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
                        color: active ? "var(--bone)" : "var(--bone-muted)",
                      }}
                    >
                      {stall.title}
                    </h3>

                    {/* Telemetry badge / spec from proposal presentation */}
                    <span
                      className="mt-1 font-mono-ui text-[11px] uppercase tracking-[0.18em] transition-all duration-300"
                      style={{ color: active ? "var(--red-hot)" : "var(--dim)" }}
                    >
                      {stall.spec}
                    </span>

                    {/* Description copy - revealed smoothly on the active card */}
                    <div className="mt-2.5 min-h-[52px]">
                      <p
                        className="max-w-[24ch] font-sans text-xs leading-relaxed text-muted transition-all duration-500 sm:text-[13px]"
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
