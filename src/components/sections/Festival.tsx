"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

/** What runs on the grounds beside the stage. */
const STALLS = [
  { index: "01", title: "Food", line: "Kitchens along the walkway, from doors to encore." },
  { index: "02", title: "Education", line: "Campuses and programmes, face to face, all night." },
  { index: "03", title: "Gaming", line: "Screens and open play between the sets." },
];

export default function Festival() {
  const rootRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const cards = gsap.utils.toArray<HTMLElement>(grid.children);

      /*
       * Watched rather than scroll-triggered, which is why this one section
       * does not look like the rest of the file.
       *
       * The page is not at its final height when these effects run: the tower
       * and the film hold pins whose spacers only reach full size once their
       * footage resolves, and measured on load the document is about 6700px
       * against a settled 13100. A ScrollTrigger built in that window computes
       * a start the page has already passed, fires immediately, and with
       * `once: true` kills itself — spending the reveal while the section is
       * thousands of pixels below the fold. A `from` tween is then rewound to
       * its hidden state by the next refresh with nothing left alive to play it
       * forward, which is how these three cards came to render as an empty band
       * on the page. An observer has no cached geometry to go stale.
       *
       * The hidden state is armed inside the observer rather than before it, so
       * that hiding and revealing cannot come apart: if the callback never runs
       * at all, nothing was ever hidden and the cards render as themselves. The
       * cost is that a reader who lands on the section directly gets the cards
       * without the reveal, which is the right way round for a flourish.
       */
      let armed = false;

      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;

          if (!entry.isIntersecting) {
            if (!armed) {
              armed = true;
              gsap.set(cards, { y: 46, opacity: 0 });
            }
            return;
          }

          io.disconnect();
          if (!armed) return;

          gsap.to(cards, {
            y: 0,
            opacity: 1,
            duration: 1.05,
            ease: "gen",
            stagger: 0.12,
          });
        },
        { rootMargin: "0px 0px -12% 0px" },
      );

      io.observe(grid);
      return () => io.disconnect();
    },
    { scope: rootRef },
  );

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
          {STALLS.map((s) => (
            <div key={s.title} className="cut-card flex flex-col gap-4 p-7 md:p-9">
              <span
                className="font-display leading-none text-red-hot"
                style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
              >
                {s.index}
              </span>
              <h3
                className="font-display leading-none tracking-[-0.01em] text-bone"
                style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)" }}
              >
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{s.line}</p>
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
