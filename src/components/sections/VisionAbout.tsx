"use client";

import dynamic from "next/dynamic";
import CardStack from "@/components/ui/CardStack";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import RevealText from "@/components/ui/RevealText";

const LotusScene = dynamic(() => import("@/components/ui/LotusScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-hairline bg-ink-2/60 md:h-[540px]">
      <span className="eyebrow animate-pulse text-red-hot">Initializing 3D Stage Arena...</span>
    </div>
  ),
});

const VISION_CARDS = [
  { src: "/img/stage.svg", alt: "Performer under stage lights" },
  { src: "/img/poster.svg", alt: "Generation 26 key art" },
];

const ABOUT_CARDS = [
  { src: "/img/lights.svg", alt: "Stage beams over the floor" },
  { src: "/img/crowd.svg", alt: "Crowd with hands raised" },
];

const VISION_PILLARS = [
  {
    num: "01",
    title: "ACOUSTIC IMMERSION",
    desc: "Custom 360° point-source line arrays calibrated for visceral sub-bass and high-frequency precision.",
  },
  {
    num: "02",
    title: "VISUAL ARCHITECTURE",
    desc: "Monolithic stage trussing, 4K volumetric beam lasers, and reactive lighting mapped to live frequencies.",
  },
  {
    num: "03",
    title: "CURATED SOUND",
    desc: "Uncompromising showcase of live electronic producers, instrumentalists, and international talent.",
  },
];

const PRODUCTION_SPECS = [
  { label: "VENUE", value: "Lotus Tower Arena, Colombo 10" },
  { label: "SOUND STANDARD", value: "120 kW PK Sound Custom Rig" },
  { label: "STAGE TECH", value: "Volumetric 4K Beam Array" },
  { label: "ATTENDEE CAPACITY", value: "Strict 3,500 Cap" },
];

const TITLE_SIZE = "text-[clamp(4rem,15vw,13rem)] leading-[0.9] tracking-[-0.02em]";

export default function VisionAbout() {
  return (
    <div className="relative flex flex-col">
      {/* ── PANEL 1: VISION (04) ─────────────────────────────────── */}
      <section
        id="vision"
        className="relative mx-auto w-full max-w-(--maxw) scroll-mt-24 px-(--gutter) py-20 md:py-28"
      >
        <div>
          <RevealText as="p" className="eyebrow mb-3 text-red-hot font-bold" start="top 90%">
            04 — THE MANIFEST
          </RevealText>
          <LitTitle className={TITLE_SIZE} radius={320} weight={1.9}>
            Vision
          </LitTitle>
        </div>

        <div className="mt-8 grid gap-8 md:mt-12 lg:grid-cols-12 lg:gap-12">
          <div className="pull-into-title lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:self-start">
            <CardStack cards={VISION_CARDS} parallax={46} />
          </div>

          <div className="pull-into-title-half flex flex-col gap-6 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:self-center">
            <ScrollCopy className="text-[clamp(1.15rem,1.4vw,1.45rem)] font-semibold leading-[1.8] text-bone">
              One night where a generation shows up loud. We engineer the stage, the spatial sound arrays, and the physical room around them, so the music is the only thing anyone leaves remembering.
            </ScrollCopy>

            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot font-bold">
                ✦ COLOMBO EXCLUSIVE
              </span>
              <span className="badge-pill border-hairline-bold text-bone">
                LIVE INSTRUMENTATION & BASS
              </span>
            </div>
          </div>
        </div>

        {/* Vision Pillars 3-Grid */}
        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {VISION_PILLARS.map((p) => (
            <div
              key={p.num}
              className="card-interactive cut-shape-sm flex flex-col justify-between p-6 md:p-8"
            >
              <div>
                <span className="font-mono-ui text-sm font-bold text-red-hot">
                  {p.num} // PILLAR
                </span>
                <h4 className="font-display mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {p.title}
                </h4>
                <p className="mt-3 text-sm font-medium leading-relaxed text-bone-muted md:text-base">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3D INTERACTIVE MONUMENT CENTERPIECE ────────────────── */}
      <section className="relative mx-auto w-full max-w-(--maxw) px-(--gutter) py-12 md:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-hairline-bold bg-gradient-to-b from-ink-2 via-ink to-ink-2 p-6 md:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.85)]">
          {/* Header Info */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="badge-pill border-red-hot/40 text-red-hot font-bold mb-3">
                ✦ LANDMARK STAGE ARCHITECTURE
              </div>
              <h3 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                LOTUS TOWER ARENA · COLOMBO
              </h3>
            </div>
            <p className="max-w-[44ch] font-mono-ui text-xs font-medium text-bone-muted md:text-sm">
              Real-time interactive 3D stage rendering. Drag to orbit or inspect the architectural venue hosting Generation 26.
            </p>
          </div>

          {/* 3D Canvas Stage */}
          <div className="relative mt-8 h-[400px] w-full overflow-hidden rounded-2xl md:h-[540px] lg:h-[600px]">
            <LotusScene />
          </div>
        </div>
      </section>

      {/* ── PANEL 2: ABOUT (05) ──────────────────────────────────── */}
      <section
        id="about"
        className="relative mx-auto w-full max-w-(--maxw) scroll-mt-24 px-(--gutter) py-20 md:py-28"
      >
        <div className="lg:text-right">
          <RevealText as="p" className="eyebrow mb-3 text-red-hot font-bold" start="top 90%">
            05 — THE PRODUCTION HOUSE
          </RevealText>
          <LitTitle className={TITLE_SIZE} radius={320} weight={1.9}>
            About
          </LitTitle>
        </div>

        <div className="mt-8 grid gap-8 md:mt-12 lg:grid-cols-12 lg:gap-12">
          <div className="pull-into-title lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:self-start">
            <CardStack cards={ABOUT_CARDS} parallax={34} />
          </div>

          <div className="pull-into-title-half flex flex-col gap-6 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-center">
            <ScrollCopy className="text-[clamp(1.15rem,1.4vw,1.45rem)] font-semibold leading-[1.8] text-bone">
              Generation is produced by ECheM. Live performance, structural design, and acoustic engineering held to a single uncompromised production standard, for an audience that still turns up in person.
            </ScrollCopy>

            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot font-bold">
                ✦ PRODUCED BY ECHEM
              </span>
              <span className="badge-pill border-hairline-bold text-bone">
                360° HYBRID AUDIO STANDARD
              </span>
            </div>
          </div>
        </div>

        {/* About Production Specs 4-Grid */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          {PRODUCTION_SPECS.map((s, i) => (
            <div
              key={i}
              className="card-interactive cut-shape-sm flex flex-col justify-between p-5 md:p-6"
            >
              <span className="font-mono-ui text-xs font-bold tracking-widest text-red-hot">
                {s.label}
              </span>
              <h5 className="mt-3 font-display text-xl font-bold tracking-tight text-white md:text-2xl">
                {s.value}
              </h5>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
