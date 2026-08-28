/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";

/**
 * Hand-placed so the scatter is deterministic — random positions generated at
 * render would differ between server and client and break hydration.
 *
 * `x`/`y` are percentages of the pile, `w` a percentage of its width, `rot` the
 * angle each print was dropped at. Laid out in three overlapping bands rather
 * than a ring, so the middle of the heap is covered instead of hollow.
 *
 * The slots in `public/img/photos` are numbered blanks. Swap each `src` for a
 * real photograph and set `ratio` to match it; nothing else needs to change.
 */
const PHOTOS = [
  { src: "/img/photos/01.svg", x: 27, y: 24, w: 20, rot: -7, ratio: "4 / 3" },
  { src: "/img/photos/02.svg", x: 45, y: 20, w: 19, rot: 5, ratio: "3 / 4" },
  { src: "/img/photos/03.svg", x: 62, y: 24, w: 20, rot: -4, ratio: "4 / 3" },
  { src: "/img/photos/04.svg", x: 78, y: 38, w: 18, rot: 8, ratio: "3 / 4" },
  { src: "/img/photos/05.svg", x: 17, y: 45, w: 16, rot: 6, ratio: "3 / 4" },
  { src: "/img/photos/06.svg", x: 36, y: 48, w: 19, rot: -5, ratio: "4 / 3" },
  { src: "/img/photos/07.svg", x: 56, y: 48, w: 19, rot: 7, ratio: "1 / 1" },
  { src: "/img/photos/08.svg", x: 73, y: 56, w: 18, rot: -8, ratio: "4 / 3" },
  { src: "/img/photos/09.svg", x: 27, y: 72, w: 17, rot: 9, ratio: "3 / 4" },
  { src: "/img/photos/10.svg", x: 46, y: 76, w: 20, rot: -6, ratio: "4 / 3" },
  { src: "/img/photos/11.svg", x: 70, y: 74, w: 18, rot: 4, ratio: "3 / 4" },
];

export default function Archive() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pileRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const pile = pileRef.current;
      const wraps = wrapRefs.current.filter(Boolean) as HTMLDivElement[];
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!pile || !wraps.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* Everything is dealt from the middle of the pile, so each print starts
         offset by its own distance from centre and travels back to zero. */
      const box = pile.getBoundingClientRect();
      const bw = box.width || 800;
      const bh = box.height || 500;
      const deal = PHOTOS.map((p) => ({
        dx: ((50 - p.x) / 100) * bw,
        dy: ((50 - p.y) / 100) * bh,
      }));

      wraps.forEach((el, i) => gsap.set(el, { xPercent: -50, yPercent: -50, zIndex: i }));

      if (reduced) {
        wraps.forEach((el, i) => gsap.set(el, { rotation: PHOTOS[i].rot }));
        return;
      }

      wraps.forEach((el, i) => {
        gsap.fromTo(
          el,
          { x: deal[i].dx, y: deal[i].dy, rotation: 0, scale: 0.84, opacity: 0 },
          {
            x: 0,
            y: 0,
            rotation: PHOTOS[i].rot,
            scale: 1,
            opacity: 1,
            duration: 1.15,
            ease: "gen",
            delay: i * 0.06,
            scrollTrigger: { trigger: pile, start: "top 80%", once: true },
          },
        );
      });

      const cleanups: (() => void)[] = [];

      /**
       * Hover is read off the stationary pile and guarded on index change, and
       * every visual change lands on the inner card — the wrapper that owns the
       * hit area is never touched. A print therefore cannot resize itself out
       * from under the cursor and start flickering.
       */
      let hovered = -1;
      const applyHover = (next: number) => {
        if (next === hovered) return;
        hovered = next;

        wraps.forEach((el, i) => {
          const on = next === i;
          gsap.set(el, { zIndex: on ? PHOTOS.length + 1 : i });
          gsap.to(el, {
            opacity: next === -1 || on ? 1 : 0.4,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        });

        cards.forEach((card, i) => {
          const on = next === i;
          gsap.to(card, {
            scale: on ? 1.07 : 1,
            y: on ? -12 : 0,
            boxShadow: on ? "0 34px 76px rgba(0,0,0,0.8)" : "0 10px 30px rgba(0,0,0,0.45)",
            duration: 0.5,
            ease: "power3.out",
            overwrite: "auto",
          });
          const edge = card.querySelector<HTMLElement>("[data-edge]");
          if (edge) gsap.to(edge, { opacity: on ? 1 : 0, duration: 0.4, overwrite: "auto" });
        });
      };

      const onOver = (e: PointerEvent) => {
        const hit = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-photo]");
        applyHover(hit ? Number(hit.dataset.photo) : -1);
      };
      const onLeave = () => applyHover(-1);

      pile.addEventListener("pointerover", onOver);
      pile.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        pile.removeEventListener("pointerover", onOver);
        pile.removeEventListener("pointerleave", onLeave);
      });

      /* the whole table leans with the pointer, nearer prints further */
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const lean = wraps.map((el, i) => ({
          x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3" }),
          depth: 6 + (i % 4) * 7,
        }));

        const onMove = (e: PointerEvent) => {
          const r = pile.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          lean.forEach((l) => {
            l.x(nx * l.depth);
            l.y(ny * l.depth);
          });
        };
        const onOut = () =>
          lean.forEach((l) => {
            l.x(0);
            l.y(0);
          });

        pile.addEventListener("pointermove", onMove);
        pile.addEventListener("pointerleave", onOut);
        cleanups.push(() => {
          pile.removeEventListener("pointermove", onMove);
          pile.removeEventListener("pointerleave", onOut);
        });
      }

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: rootRef },
  );

  return (
    <section id="archive" className="relative py-20 md:py-28">
      <div ref={rootRef} className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <LitTitle
          className="text-[clamp(4rem,15vw,13rem)] leading-[0.9] tracking-[-0.02em]"
          radius={300}
          weight={1.8}
        >
          Archive
        </LitTitle>

        <div
          ref={pileRef}
          className="relative mt-8 h-[clamp(24rem,68vh,40rem)] w-full [--ps:1.9] md:[--ps:1.35] lg:[--ps:1]"
        >
          {PHOTOS.map((p, i) => (
            <div
              key={p.src}
              ref={(el) => {
                wrapRefs.current[i] = el;
              }}
              data-photo={i}
              data-cursor="view"
              data-cursor-label="VIEW"
              className="absolute will-change-transform"
              style={{
                left: p.x + "%",
                top: p.y + "%",
                width: `calc(var(--ps) * ${p.w}%)`,
              }}
            >
              {/* inner card carries every hover change; the wrapper's hit area never moves */}
              <div
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="relative overflow-hidden bg-ink-2 will-change-transform"
                style={{ aspectRatio: p.ratio, boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}
              >
                <img
                  src={p.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 border border-hairline" />
                <div
                  data-edge
                  className="pointer-events-none absolute inset-0 opacity-0"
                  style={{ border: "1px solid var(--red-hot)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
