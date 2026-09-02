"use client";

import dynamic from "next/dynamic";
import CardStack from "@/components/ui/CardStack";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import RevealText from "@/components/ui/RevealText";

const Scene3D = dynamic(() => import("@/components/3d/Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] w-full items-center justify-center rounded-2xl border border-hairline bg-ink-2/60">
      <span className="eyebrow animate-pulse text-red-hot">Loading 3D Stage Architecture...</span>
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

const TITLE_SIZE = "text-[clamp(4rem,15vw,13rem)] leading-[0.9] tracking-[-0.02em]";

export default function VisionAbout() {
  return (
    <div className="relative flex flex-col">
      {/* ── PANEL 1: VISION ─────────────────────────────────────── */}
      <section
        id="vision"
        className="relative mx-auto w-full max-w-(--maxw) scroll-mt-24 px-(--gutter) py-20 md:py-28"
      >
        <div>
          <RevealText as="p" className="eyebrow mb-3 text-red-hot" start="top 90%">
            04 — The Manifest
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
            <ScrollCopy className="text-[clamp(1.1rem,1.35vw,1.4rem)] font-medium leading-[1.8] text-bone">
              One night where a generation shows up loud. We engineer the stage,
              the spatial sound arrays, and the physical room around them, so the
              music is the only thing anyone leaves remembering.
            </ScrollCopy>

            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-full border border-red-hot/40 bg-red-black/50 px-4 py-1.5 font-mono-ui text-xs font-semibold text-red-hot">
                ✦ COLOMBO EXCLUSIVE
              </span>
              <span className="rounded-full border border-hairline bg-ink-2 px-4 py-1.5 font-mono-ui text-xs text-muted">
                LIVE INSTRUMENTATION
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3D INTERACTIVE MONUMENT CENTERPIECE ────────────────── */}
      <section className="relative mx-auto w-full max-w-(--maxw) px-(--gutter) py-16 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-hairline/80 bg-gradient-to-b from-ink-2 via-ink to-ink-2 p-6 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
          {/* Header Info */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="eyebrow text-red-hot">LANDMARK STAGE ARCHITECTURE</span>
              <h3 className="font-display mt-2 text-3xl font-bold tracking-tight text-white md:text-5xl">
                NELUM KULUNA · COLOMBO
              </h3>
            </div>
            <p className="max-w-[42ch] font-mono-ui text-xs text-muted md:text-sm">
              The iconic Lotus Tower illuminated in real-time 3D. Inspect the
              venue structure hosting Generation 26.
            </p>
          </div>

          {/* 3D Canvas Stage */}
          <div className="relative mt-8 h-[420px] w-full overflow-hidden rounded-2xl md:h-[580px] lg:h-[640px]">
            <Scene3D />
          </div>
        </div>
      </section>

      {/* ── PANEL 2: ABOUT ──────────────────────────────────────── */}
      <section
        id="about"
        className="relative mx-auto w-full max-w-(--maxw) scroll-mt-24 px-(--gutter) py-20 md:py-28"
      >
        <div className="lg:text-right">
          <RevealText as="p" className="eyebrow mb-3 text-red-hot" start="top 90%">
            04B — The Production House
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
            <ScrollCopy className="text-[clamp(1.1rem,1.35vw,1.4rem)] font-medium leading-[1.8] text-bone">
              Generation is produced by ECheM. Live performance, structural design,
              and acoustic engineering held to a single uncompromised production
              standard, for an audience that still turns up in person.
            </ScrollCopy>

            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-full border border-red-hot/40 bg-red-black/50 px-4 py-1.5 font-mono-ui text-xs font-semibold text-red-hot">
                ✦ PRODUCED BY ECHEM
              </span>
              <span className="rounded-full border border-hairline bg-ink-2 px-4 py-1.5 font-mono-ui text-xs text-muted">
                360° HYBRID AUDIO
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
