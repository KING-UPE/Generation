"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";

const STATS = [
  {
    num: "26",
    label: "EDITION",
    sub: "The next evolution in live electronic & alternative performance.",
    tag: "ANNUAL STAGE",
  },
  {
    num: "01",
    label: "NIGHT ONLY",
    sub: "October 2026. Colombo transforms for an exclusive gathering.",
    tag: "COLOMBO, LK",
  },
  {
    num: "15+",
    label: "LIVE TALENTS",
    sub: "Curated underground vocalists, instrumentalists, and producers.",
    tag: "ALL LIVE SETS",
  },
  {
    num: "3K+",
    label: "AUDIENCE CAP",
    sub: "Intimate, high-density concert arena with 360° stage sightlines.",
    tag: "LIMITED ACCESS",
  },
  {
    num: "120KW",
    label: "AUDIO POWER",
    sub: "Custom engineered spatial acoustic arrays built by ECheM.",
    tag: "SPATIAL SOUND",
  },
  {
    num: "100%",
    label: "PRODUCTION",
    sub: "Custom stage architecture, kinetic lighting, and zero latency live feed.",
    tag: "ECHELON STANDARD",
  },
];

const DETAILS = [
  { label: "VENUE", val: "Nelum Kuluna (Lotus Tower)", detail: "Colombo, Sri Lanka" },
  { label: "SCHEDULE", val: "October 2026", detail: "Doors Open 18:00 · Till Late" },
  { label: "EXPERIENCE", val: "Live Concert & Spatial Sound", detail: "Stage Architecture by ECheM" },
  { label: "ADMISSION", val: "Tiered Registration", detail: "Generation 26 Official Pass" },
];

export default function EventStats() {
  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!root || !cards.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      gsap.from(cards, {
        y: 48,
        opacity: 0,
        duration: 0.95,
        stagger: 0.08,
        ease: "gen",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      id="stats"
      ref={rootRef as React.RefObject<HTMLElement>}
      className="relative mx-auto w-full max-w-(--maxw) scroll-mt-24 px-(--gutter) py-24 md:py-32"
    >
      {/* Header */}
      <div className="flex flex-col gap-3">
        <RevealText as="p" className="eyebrow text-red-hot" start="top 88%">
          05 — Event Telemetry & Key Details
        </RevealText>
        <LitTitle
          className="text-[clamp(3.5rem,11.5vw,10rem)] leading-[0.9] tracking-[-0.02em]"
          radius={290}
          weight={1.8}
        >
          Event Stats
        </LitTitle>
        <p className="mt-3 max-w-[56ch] text-base font-normal leading-relaxed text-bone md:text-lg">
          Generation 26 is engineered for pure sonic impact. Everything from the
          structural acoustic envelope to the live stage telemetry is calibrated
          to a single benchmark.
        </p>
      </div>

      {/* Quick Event Details Bar */}
      <div className="mt-12 grid grid-cols-1 gap-4 border-y border-hairline py-8 sm:grid-cols-2 lg:grid-cols-4">
        {DETAILS.map((d, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 border-l border-hairline/60 pl-5 transition-colors duration-300 hover:border-red-hot"
          >
            <span className="eyebrow text-[11px] text-muted">{d.label}</span>
            <span className="text-base font-bold tracking-tight text-bone md:text-lg">
              {d.val}
            </span>
            <span className="font-mono-ui text-xs text-dim">{d.detail}</span>
          </div>
        ))}
      </div>

      {/* 6-Card High-Impact Metric Grid */}
      <div
        ref={gridRef}
        className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            data-cursor="view"
            data-cursor-label="STATS"
            className="group relative overflow-hidden rounded-xl border border-hairline bg-ink-2/90 p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-red-hot/60 hover:shadow-[0_20px_48px_rgba(225,6,0,0.18)]"
          >
            {/* Ambient Background Gradient on Hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-hot/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Top Bar with Monospace Tag */}
            <div className="flex items-center justify-between">
              <span className="eyebrow text-[10px] text-dim group-hover:text-red-hot">
                {s.tag}
              </span>
              <span className="font-mono-ui text-xs font-semibold text-hairline group-hover:text-red-hot/80">
                0{i + 1}
              </span>
            </div>

            {/* Giant Bold Metric */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-[clamp(3.5rem,6vw,5.5rem)] leading-none tracking-tight text-bone transition-colors duration-300 group-hover:text-white">
                {s.num}
              </span>
            </div>

            {/* Label & Description */}
            <div className="mt-4 flex flex-col gap-2">
              <h3 className="font-mono-ui text-sm font-bold uppercase tracking-[0.16em] text-red-hot">
                {s.label}
              </h3>
              <p className="text-sm font-medium leading-relaxed text-muted transition-colors duration-300 group-hover:text-bone">
                {s.sub}
              </p>
            </div>

            {/* Bottom Glow Line */}
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-red-hot to-red transition-all duration-500 group-hover:w-full" />
          </div>
        ))}
      </div>

      {/* Bottom CTA Callout */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-hairline bg-gradient-to-r from-ink-2 via-ink-3 to-ink-2 p-8 md:p-10">
        <div className="flex flex-col gap-2">
          <span className="eyebrow text-red-hot">ACCESS RESERVATION</span>
          <h4 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Experience Generation 26 live at Nelum Kuluna
          </h4>
          <p className="text-sm text-muted md:text-base">
            Tickets and production passes are issued in strictly allocated waves.
          </p>
        </div>

        <Magnetic strength={18}>
          <a
            href="#film"
            data-cursor="link"
            className="cut-shape-sm group inline-flex items-center gap-3 px-8 py-4 text-base font-bold tracking-tight text-white shadow-[0_12px_32px_rgba(225,6,0,0.32)] transition-all duration-300 hover:shadow-[0_16px_44px_rgba(255,59,47,0.5)]"
            style={{ background: "var(--grad-red)" }}
          >
            Watch The Film
            <span className="transition-transform duration-500 group-hover:translate-x-1.5">
              →
            </span>
          </a>
        </Magnetic>
      </div>
    </section>
  );
}
