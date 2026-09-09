"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

type Marker = { id: string; index: string; label: string };

/** Where down the viewport a section counts as the one being read. */
const FOLD = 0.55;

/**
 * Fixed right-hand rail: a gradient progress thread plus the label of the
 * section currently under the fold line.
 */
export default function ScrollRail({ markers }: { markers: Marker[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      gsap.set(fillRef.current, { scaleY: 0, transformOrigin: "top" });

      /*
       * Which section is showing, as a function of where the page is.
       *
       * This used to be one ScrollTrigger per marker, each calling
       * setActive(i) from onToggle when it became active, and it was wrong
       * almost everywhere -- the top of the page read "09 Projections".
       *
       * Three things were the matter with it. onToggle only fires when a
       * trigger's own active state flips, so nothing at all decides the
       * answer while the page sits between two sections, and the label simply
       * keeps whatever it last happened to be told. The ranges overlap: the
       * hero and the tower timeline are both active over the first screen, so
       * which of them won came down to the order the toggles fired in, and
       * that order is not the same going up as coming down. And two of the
       * markers -- vision and about -- are one-pixel anchor divs, so their
       * ranges are a pixel tall and normal scrolling steps straight over them
       * without ever toggling; the rail said "Events" through both sections.
       *
       * Read as a pure function of scroll position instead. Each marker is a
       * boundary rather than a range, and the one showing is the last boundary
       * the fold line has passed. A one-pixel anchor is a perfectly good
       * boundary, there is no gap for the answer to be undefined in, and up
       * and down give the same reading at the same place because there is no
       * history involved.
       */
      let bounds: number[] = [];

      const measure = () => {
        /* A marker cannot take over while the section before it is still on
           the fold line. The hero is a full screen tall and the timeline's own
           top sits 40vh inside it, so by its own top alone the timeline took
           over at once and "03 Hero" was never once displayed. */
        let prevBottom = -Infinity;
        bounds = markers.map((m, i) => {
          const el = document.getElementById(m.id);
          if (!el) return Infinity; // nothing to point at: never selected
          const r = el.getBoundingClientRect();
          const top = r.top + window.scrollY;
          const start = i === 0 ? -Infinity : Math.max(top, prevBottom);
          prevBottom = r.bottom + window.scrollY;
          return start;
        });
      };

      const pick = () => {
        const line = window.scrollY + window.innerHeight * FOLD;
        let next = 0;
        for (let i = 0; i < bounds.length; i++) {
          if (bounds[i] <= line) next = i;
        }
        setActive((prev) => (prev === next ? prev : next));
      };

      const st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          gsap.set(fillRef.current, { scaleY: self.progress });
          pick();
        },
        /* Re-measured whenever the page is, which covers the refresh after the
           preloader hands over and every resize. */
        onRefresh: () => {
          measure();
          pick();
        },
      });

      measure();
      pick();

      gsap.fromTo(
        rootRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 1, delay: 1.6, ease: "gen" },
      );

      return () => {
        st.kill();
      };
    },
    { dependencies: [markers] },
  );

  const current = markers[active];

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed right-[max(1rem,2.2vw)] top-1/2 z-40 hidden -translate-y-1/2 lg:flex lg:flex-col lg:items-center lg:gap-5"
    >
      <span className="font-mono-ui text-[11px] tracking-[0.26em] text-bone/80">
        {current?.index}
      </span>

      <div className="relative h-40 w-px bg-hairline">
        <div
          ref={fillRef}
          className="absolute inset-x-0 top-0 h-full origin-top"
          style={{ background: "var(--grad-red)" }}
        />
      </div>

      <span
        className="font-mono-ui text-[11px] tracking-[0.26em] text-dim"
        style={{ writingMode: "vertical-rl" }}
      >
        {current?.label}
      </span>
    </div>
  );
}
