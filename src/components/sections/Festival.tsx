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

/* ── Volumetric Sunbeam Light Rays Layer (Soft Spreading Light Cone) ───── */
function SunRaysLayer({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {/* 1. Soft Ambient Sun Corona in Top-Right Corner */}
      <div
        className="absolute -right-16 -top-16 h-64 w-64 rounded-full transition-all duration-700 ease-out"
        style={{
          background: active
            ? "radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.28) 0%, rgba(240, 242, 250, 0.12) 35%, rgba(220, 225, 240, 0.03) 65%, transparent 80%)"
            : "radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.14) 0%, rgba(240, 242, 250, 0.06) 35%, rgba(220, 225, 240, 0.01) 65%, transparent 80%)",
          filter: "blur(20px)",
          transform: active ? "scale(1.25)" : "scale(1)",
        }}
      />

      {/* 2. Soft Spread Volumetric Light Shafts (God Rays) */}
      <svg
        viewBox="0 0 400 500"
        fill="none"
        className="absolute -right-10 -top-10 h-[145%] w-[145%] origin-top-right transition-all duration-700 ease-out"
        style={{
          filter: active ? "blur(16px)" : "blur(14px)",
          transform: active ? "rotate(-4deg) scale(1.06)" : "rotate(0deg) scale(1)",
          opacity: active ? 0.95 : 0.65,
          mixBlendMode: "screen",
        }}
      >
        <defs>
          <linearGradient id="ray-grad-1" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={active ? "0.32" : "0.18"} />
            <stop offset="40%" stopColor="#ffffff" stopOpacity={active ? "0.16" : "0.08"} />
            <stop offset="75%" stopColor="#e8eaf0" stopOpacity={active ? "0.05" : "0.02"} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="ray-grad-2" x1="100%" y1="0%" x2="15%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={active ? "0.26" : "0.14"} />
            <stop offset="45%" stopColor="#f0f2f8" stopOpacity={active ? "0.12" : "0.06"} />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="ray-grad-wide" x1="100%" y1="0%" x2="0%" y2="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={active ? "0.20" : "0.10"} />
            <stop offset="50%" stopColor="#e2e5f0" stopOpacity={active ? "0.07" : "0.03"} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Wide Light Fan */}
        <polygon points="380,20 80,460 340,500" fill="url(#ray-grad-wide)" opacity="0.6" />

        {/* Distinct Volumetric Ray Shafts spreading outward */}
        <polygon points="380,20 30,280 80,400" fill="url(#ray-grad-1)" />
        <polygon points="380,20 110,440 180,490" fill="url(#ray-grad-1)" />
        <polygon points="380,20 210,480 270,500" fill="url(#ray-grad-2)" />
        <polygon points="380,20 70,180 130,260" fill="url(#ray-grad-2)" opacity="0.75" />
      </svg>

      {/* 3. Soft Atmospheric Light Gradient Sweep */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{
          background: active
            ? "radial-gradient(ellipse 100% 80% at 95% 5%, rgba(255, 255, 255, 0.12) 0%, rgba(240, 245, 255, 0.04) 40%, transparent 68%)"
            : "radial-gradient(ellipse 100% 80% at 95% 5%, rgba(255, 255, 255, 0.06) 0%, rgba(240, 245, 255, 0.02) 40%, transparent 68%)",
          opacity: active ? 1 : 0.7,
        }}
      />
    </div>
  );
}

const CARD_BASE =
  "linear-gradient(168deg, #15151B 0%, #0C0C10 52%, var(--ink) 100%)";

/**
 * The lit surface: subtle specular spotlight on active card.
 */
const CARD_LIT =
  "radial-gradient(120% 90% at 85% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 38%, transparent 70%), " +
  "linear-gradient(168deg, #1B1B24 0%, #0F0F16 52%, var(--ink) 100%)";

/** Faint technical ruling, drawn in the hairline's own colour at a third of
 *  its weight — the same off-white every rule on the site is drawn in. */
const GRID =
  "linear-gradient(to right, rgba(237,237,240,0.05) 1px, transparent 1px), " +
  "linear-gradient(to bottom, rgba(237,237,240,0.05) 1px, transparent 1px)";

const EASE = "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)";

export default function Festival() {
  const rootRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

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

  // Only active when hovered on desktop; no card is permanently active by default
  const activeIndex = hovered;

  // Mobile carousel navigation
  const scrollToSlide = (index: number) => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const cards = container.children;
    if (cards[index]) {
      const card = cards[index] as HTMLElement;
      const targetLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({ left: targetLeft, behavior: "smooth" });
      setMobileIndex(index);
    }
  };

  const prevSlide = () => {
    const next = (mobileIndex - 1 + STALLS.length) % STALLS.length;
    scrollToSlide(next);
  };

  const nextSlide = () => {
    const next = (mobileIndex + 1) % STALLS.length;
    scrollToSlide(next);
  };

  const handleMobileScroll = () => {
    const container = mobileScrollRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < container.children.length; i++) {
      const el = container.children[i] as HTMLElement;
      const elCenter = el.offsetLeft + el.clientWidth / 2;
      const diff = Math.abs(center - elCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setMobileIndex(closestIdx);
  };

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

        {/* ── Desktop View: Asymmetrically Scattered & Rotated 3-Card Deck ────── */}
        <div
          ref={deckRef}
          className="mt-20 hidden w-full items-center justify-center md:flex md:pb-16"
        >
          <div className="flex items-center md:-space-x-8 lg:-space-x-12">
            {STALLS.map((stall, i) => {
              const active = activeIndex === i;
              return (
                <div
                  key={stall.title}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setHovered(i)}
                  className="group relative flex h-[410px] w-[320px] shrink-0 cursor-pointer flex-col items-center justify-between overflow-hidden rounded-[26px] p-8 text-center select-none"
                  style={{
                    background: active ? CARD_LIT : CARD_BASE,
                    boxShadow: active
                      ? "0 36px 85px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 28px rgba(255,255,255,0.06)"
                      : "0 18px 46px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08) inset",
                    transform: wide
                      ? `rotate(${active ? 0 : stall.rotate}deg) translateY(${
                          active ? stall.drop - 26 : stall.drop
                        }px) scale(${active ? 1.05 : 0.98})`
                      : "none",
                    zIndex: active ? 50 : stall.zIndex,
                    transition: EASE,
                  }}
                >
                  {/* Dynamic Volumetric Light Rays coming from top-right */}
                  <SunRaysLayer active={active} />

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
                    style={{ color: active ? "var(--bone-muted)" : "var(--dim)" }}
                  >
                    {stall.index}
                  </span>

                  {/* Upper wireframe geometric glyph */}
                  <div className="relative mt-2 flex h-24 w-24 items-center justify-center">
                    <span
                      aria-hidden
                      className="inline-flex h-18 w-18 items-center justify-center transition-all duration-500"
                      style={{
                        color: active ? "#FFFFFF" : "var(--muted)",
                        transform: active ? "scale(1.12)" : "scale(1)",
                        filter: active
                          ? "drop-shadow(0 0 14px rgba(255, 255, 255, 0.4))"
                          : "none",
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
                      style={{ color: active ? "var(--bone-muted)" : "var(--dim)" }}
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

        {/* ── Mobile View: Centered Carousel with Side Peek & Controls ────── */}
        <div className="mt-12 block w-full md:hidden">
          {/* Scroll snap track with peeking edges */}
          <div
            ref={mobileScrollRef}
            onScroll={handleMobileScroll}
            className="flex w-full snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[10vw] py-6 no-scrollbar"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {STALLS.map((stall, i) => {
              const isCurrent = mobileIndex === i;
              return (
                <div
                  key={stall.title}
                  onClick={() => scrollToSlide(i)}
                  className="relative flex h-[390px] w-[80vw] max-w-[320px] shrink-0 snap-center cursor-pointer flex-col items-center justify-between overflow-hidden rounded-[28px] p-7 text-center select-none transition-all duration-500"
                  style={{
                    background: isCurrent ? CARD_LIT : CARD_BASE,
                    boxShadow: isCurrent
                      ? "0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 22px rgba(255,255,255,0.06)"
                      : "0 14px 36px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset",
                    opacity: isCurrent ? 1 : 0.45,
                    transform: isCurrent ? "scale(1)" : "scale(0.95)",
                  }}
                >
                  {/* Dynamic Volumetric Light Rays coming from top-right */}
                  <SunRaysLayer active={isCurrent} />

                  {/* Faint technical grid interior */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: GRID,
                      backgroundSize: "32px 32px",
                      maskImage: "linear-gradient(to bottom, #000 0%, transparent 68%)",
                      WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 68%)",
                      opacity: isCurrent ? 0.9 : 0.3,
                    }}
                  />

                  {/* Index badge */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-6 top-6 font-mono-ui text-[11px] tracking-[0.24em]"
                    style={{ color: isCurrent ? "var(--bone-muted)" : "var(--dim)" }}
                  >
                    {stall.index}
                  </span>

                  {/* Upper icon glyph */}
                  <div className="relative mt-3 flex h-20 w-20 items-center justify-center">
                    <span
                      aria-hidden
                      className="inline-flex h-16 w-16 items-center justify-center transition-all duration-500"
                      style={{
                        color: isCurrent ? "#FFFFFF" : "var(--muted)",
                        transform: isCurrent ? "scale(1.1)" : "scale(1)",
                        filter: isCurrent
                          ? "drop-shadow(0 0 14px rgba(255, 255, 255, 0.4))"
                          : "none",
                      }}
                    >
                      {stall.icon}
                    </span>
                  </div>

                  {/* Lower Title & Copy block */}
                  <div className="relative flex flex-col items-center justify-center w-full">
                    <h3
                      className="font-display text-2xl leading-tight tracking-[-0.01em]"
                      style={{ color: isCurrent ? "var(--bone)" : "var(--bone-muted)" }}
                    >
                      {stall.title}
                    </h3>

                    <span
                      className="mt-1 font-mono-ui text-[10px] uppercase tracking-[0.16em]"
                      style={{ color: isCurrent ? "var(--bone-muted)" : "var(--dim)" }}
                    >
                      {stall.spec}
                    </span>

                    <p className="mt-3 max-w-[26ch] font-sans text-xs leading-relaxed text-muted">
                      {stall.line}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Controls: Circular navigation buttons (left) & Pagination index (right) */}
          <div className="mx-auto mt-4 flex w-full max-w-[340px] items-center justify-between px-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous card"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] text-white/80 transition-all active:scale-90 active:bg-white/10"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next card"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] text-white/80 transition-all active:scale-90 active:bg-white/10"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Pagination indicator matching screenshot (e.g. 1 / 3) */}
            <span className="font-mono-ui text-xs tracking-[0.24em] text-white/50">
              {mobileIndex + 1} / {STALLS.length}
            </span>
          </div>
        </div>

        <p className="eyebrow mt-12 text-center md:mt-16">
          Inside the same footprint <span className="text-white/40">·</span> as the stage
        </p>
      </div>
    </section>
  );
}
