"use client";

import { useRef } from "react";
import ScrollCopy from "@/components/ui/ScrollCopy";
import CountFigure from "@/components/ui/CountFigure";
import GlowField from "@/components/ui/GlowField";
import { useReveal } from "@/lib/use-reveal";
import {
  IconReach,
  IconRoom,
  IconLivestream,
  IconSocial,
  IconElsewhere,
} from "@/components/ui/icons";

/** The 26 outlook, broken out of the headline figure. */
const SPLIT = [
  { value: 13500, label: "In the room", icon: <IconRoom /> },
  { value: 240000, label: "Livestream", icon: <IconLivestream /> },
  { value: 300000, label: "Social", icon: <IconSocial /> },
  { value: 200000, label: "Elsewhere", icon: <IconElsewhere /> },
];

const TITLE_SIZE = "text-[clamp(2.4rem,5.6vw,6rem)] leading-[0.9] tracking-[-0.025em]";

export default function Projection() {
  const panelRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  useReveal(headRef, { children: true, y: 34, stagger: 0.1 });

  return (
    <section
      id="projection"
      className="relative flex min-h-[100svh] w-full items-center py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <div
          ref={panelRef}
          className="cut-shape relative isolate overflow-hidden px-7 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20"
        >
          <GlowField />

          <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Filled rather than the outline title the other sections use —
                a hollow face on this much crimson has nothing to read against. */}
            <div ref={headRef}>
              <span className="badge-pill">Generation 26</span>

              <h2 className={"font-display mt-6 select-none text-bone " + TITLE_SIZE}>
                Projection
              </h2>

              <ScrollCopy className="mt-5 max-w-[30ch] text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone">
                Once in the room. Everywhere else after.
              </ScrollCopy>
            </div>

            <div>
              <CountFigure
                value={650000}
                icon={<IconReach />}
                iconSize="clamp(3rem, 5vw, 4.25rem)"
                label="Total reach and engagement"
                size="clamp(2.75rem, 6.4vw, 5.5rem)"
              />

              <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 md:mt-12">
                {SPLIT.map((s) => (
                  <CountFigure
                    key={s.label}
                    value={s.value}
                    icon={s.icon}
                    iconSize="clamp(2.5rem, 3.2vw, 2.75rem)"
                    size="clamp(2rem, 2.8vw, 2.4rem)"
                    label={s.label}
                    className="border-t border-white/15 pt-5"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
