"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";

const STATS = [
  {
    num: "26",
    label: "EDITION 26",
    sub: "The next evolution in live electronic & alternative sound performance.",
    tag: "ANNUAL ARENA",
  },
  {
    num: "01",
    label: "ONE NIGHT ONLY",
    sub: "October 24, 2026. Colombo transforms for an exclusive gathering.",
    tag: "COLOMBO, LK",
  },
  {
    num: "15+",
    label: "LIVE TALENTS",
    sub: "Curated underground vocalists, instrumentalists, and electronic producers.",
    tag: "ALL LIVE SETS",
  },
  {
    num: "3.5K",
    label: "AUDIENCE CAP",
    sub: "Intimate, high-density concert arena with 360° stage sightlines.",
    tag: "LIMITED TICKETS",
  },
  {
    num: "120KW",
    label: "AUDIO POWER",
    sub: "Custom engineered PK Sound spatial acoustic sub arrays built by ECheM.",
    tag: "SPATIAL SOUND",
  },
  {
    num: "100%",
    label: "ORIGINAL SHOW",
    sub: "Custom stage architecture, kinetic lighting, and zero latency live feed.",
    tag: "ECHEM STANDARD",
  },
];

const DETAILS = [
  { label: "VENUE", val: "Lotus Tower Arena", detail: "Colombo 10, Sri Lanka" },
  { label: "SCHEDULE", val: "October 24, 2026", detail: "Doors Open 18:00 · Till Late" },
  { label: "EXPERIENCE", val: "Live Concert & Sound", detail: "Stage Architecture by ECheM" },
  { label: "ADMISSION", val: "Strictly Limited Pass", detail: "Generation 26 Official" },
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
      <div className="flex flex-col gap-4">
        <div className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot font-bold w-fit">
          ✦ EVENT TELEMETRY & METRICS
        </div>
        <LitTitle
          className="text-[clamp(3.5rem,11.5vw,10rem)] leading-[0.9] tracking-[-0.02em]"
          radius={290}
          weight={1.8}
        >
          Event Stats
        </LitTitle>
        <p className="mt-2 max-w-[58ch] text-lead text-bone">
          Generation 26 is engineered for pure sonic impact. Everything from the structural acoustic envelope to the live stage telemetry is calibrated to a single benchmark.
        </p>
      </div>

      {/* Quick Event Details Bar */}
      <div className="mt-12 grid grid-cols-1 gap-4 border-y border-hairline-bold py-8 sm:grid-cols-2 lg:grid-cols-4">
        {DETAILS.map((d, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 border-l-2 border-hairline-bold pl-5 transition-all duration-300 hover:border-red-hot"
          >
            <span className="font-mono-ui text-xs font-bold uppercase tracking-wider text-red-hot">{d.label}</span>
            <span className="text-lg font-bold tracking-tight text-white md:text-xl">
              {d.val}
            </span>
            <span className="font-mono-ui text-xs font-medium text-bone-muted">{d.detail}</span>
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
            className="card-interactive cut-shape-sm group relative flex flex-col justify-between p-8"
          >
            {/* Top Bar with Monospace Tag */}
            <div className="flex items-center justify-between">
              <span className="badge-pill py-1 px-3 text-[10px] text-bone group-hover:border-red-hot">
                {s.tag}
              </span>
              <span className="font-mono-ui text-xs font-bold text-red-hot">
                0{i + 1}
              </span>
            </div>

            {/* Giant Bold Metric */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-[clamp(3.5rem,6vw,5.5rem)] leading-none tracking-tight text-white transition-colors duration-300 group-hover:text-red-hot">
                {s.num}
              </span>
            </div>

            {/* Label & Description */}
            <div className="mt-4 flex flex-col gap-2">
              <h3 className="font-mono-ui text-sm font-bold uppercase tracking-[0.16em] text-red-hot">
                {s.label}
              </h3>
              <p className="text-sm font-medium leading-relaxed text-bone-muted transition-colors duration-300 group-hover:text-white">
                {s.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Callout */}
      <div className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-hairline-bold bg-gradient-to-r from-ink-2 via-ink-3 to-ink-2 p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        <div className="flex flex-col gap-2">
          <span className="font-mono-ui text-xs font-bold tracking-widest text-red-hot">ACCESS RESERVATION</span>
          <h4 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Experience Generation 26 live at Lotus Tower
          </h4>
          <p className="text-sm font-medium text-bone-muted md:text-base">
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
