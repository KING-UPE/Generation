"use client";

import { useRef } from "react";
import { useReveal } from "@/lib/use-reveal";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import { IconFood, IconEducation, IconGaming } from "@/components/ui/icons";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

/**
 * What runs on the grounds beside the stage.
 *
 * Built as the Scale deck is built, and from the same palette: mark, name, then
 * the line on its own dark ground. The gradients run bright to deep across the
 * three so the row reads as one sweep rather than three cards that happen to be
 * red — the same rule the deck follows.
 */
const STALLS = [
  {
    index: "01",
    title: "Food",
    line: "Kitchens along the walkway, from doors to encore.",
    icon: <IconFood />,
    from: "#FF3B2F",
    to: "#8B0212",
  },
  {
    index: "02",
    title: "Education",
    line: "Campuses and programmes, face to face, all night.",
    icon: <IconEducation />,
    from: "#E10600",
    to: "#4A0210",
  },
  {
    index: "03",
    title: "Gaming",
    line: "Screens and open play between the sets.",
    icon: <IconGaming />,
    from: "#A0041A",
    to: "#26040A",
  },
];

export default function Festival() {
  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useReveal(gridRef, { children: true, stagger: 0.12 });

  return (
    <section
      id="festival"
      ref={rootRef as React.RefObject<HTMLElement>}
      className="relative flex min-h-[100svh] w-full items-center py-24 md:py-32"
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

        <div
          ref={gridRef}
          className="mt-14 grid gap-5 md:mt-20 md:grid-cols-3 md:gap-7"
        >
          {STALLS.map((stall) => (
            <div
              key={stall.title}
              className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[26px] p-6 md:p-7"
              style={{
                background: `linear-gradient(158deg, ${stall.from} 0%, ${stall.to} 58%, #0B0509 100%)`,
                boxShadow:
                  "0 18px 44px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.10) inset",
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  aria-hidden
                  className="inline-flex h-12 w-12 items-center justify-center text-white/90"
                >
                  {stall.icon}
                </span>
                <span className="font-mono-ui text-[11px] tracking-[0.26em] text-white/45">
                  {stall.index}
                </span>
              </div>

              <div>
                <h3
                  className="font-display leading-none tracking-[-0.01em] text-white/95"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
                >
                  {stall.title}
                </h3>

                <p className="mt-3 rounded-2xl bg-black/45 px-4 py-3.5 text-sm leading-relaxed text-white/75 backdrop-blur-sm">
                  {stall.line}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="eyebrow mt-12 md:mt-16">
          Inside the same footprint <span className="text-red-hot">·</span> as the stage
        </p>
      </div>
    </section>
  );
}
