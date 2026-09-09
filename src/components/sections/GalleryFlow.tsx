/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import Lightbox, { type Shot } from "@/components/ui/Lightbox";

type GalleryShot = Shot & { ratio: string };

/*
 * All 37 photographs from the library, with dedicated aspect ratios so portrait
 * subjects sit in portrait frames and landscape in landscape/square frames.
 */
const SLOTS: GalleryShot[] = [
  { src: "/img/photos/IAP09789.webp", alt: "A singer between the flame jets", ratio: "4 / 3" },
  { src: "/img/photos/IAP06765.webp", alt: "A singer mid-phrase at the microphone", ratio: "3 / 4" },
  { src: "/img/photos/MNP-1424.webp", alt: "The crowd from the back of the field", ratio: "1 / 1" },
  { src: "/img/photos/IAP07837.webp", alt: "Two dancers in Kandyan costume mid-routine", ratio: "3 / 4" },
  { src: "/img/photos/IAP06752.webp", alt: "A duet in front of a wall of falling petals", ratio: "4 / 3" },
  { src: "/img/photos/MNP-1065.webp", alt: "Dancers in a row before the rock fortress backdrop", ratio: "4 / 3" },
  { src: "/img/photos/IAP09542.webp", alt: "A performer in the crossfire of white beams", ratio: "3 / 4" },
  { src: "/img/photos/IAP06937.webp", alt: "Two performers in a blue wash on the open stage", ratio: "1 / 1" },
  { src: "/img/photos/IAP07843.webp", alt: "A Kandyan dancer with an arm raised", ratio: "3 / 4" },
  { src: "/img/photos/MNP-1186.webp", alt: "Beams over the stage and a standing crowd", ratio: "4 / 3" },
  { src: "/img/photos/IAP06884.webp", alt: "A singer in the warm wash with the band behind her", ratio: "4 / 3" },
  { src: "/img/photos/IAP06459.webp", alt: "A singer in a white gown against a starfield wall", ratio: "3 / 4" },
  { src: "/img/photos/IAP09052.webp", alt: "A dance troupe in line across the stage", ratio: "1 / 1" },
  { src: "/img/photos/MNP-1133.webp", alt: "A guitarist singing through the haze", ratio: "3 / 4" },
  { src: "/img/photos/MNP-1073.webp", alt: "The full troupe before the temple backdrop", ratio: "4 / 3" },
  { src: "/img/photos/IAP09629.webp", alt: "A pair dancing between the teal panels", ratio: "4 / 3" },
  { src: "/img/photos/IAP09467.webp", alt: "A singer in a cap mid-verse at the microphone", ratio: "3 / 4" },
  { src: "/img/photos/MNP-1583.webp", alt: "Faces at the barrier, lit from the stage", ratio: "1 / 1" },
  { src: "/img/photos/IAP07460.webp", alt: "A singer against a swirl of pink light", ratio: "3 / 4" },
  { src: "/img/photos/MNP-1129.webp", alt: "A singer against a wall of lights", ratio: "4 / 3" },
  { src: "/img/photos/IAP07140.webp", alt: "A drama piece playing out on the open stage", ratio: "4 / 3" },
  { src: "/img/photos/IAP09212.webp", alt: "Two singers sharing the microphone line", ratio: "3 / 4" },
  { src: "/img/photos/MNP-1194.webp", alt: "The stage in full, one performer at the centre", ratio: "1 / 1" },
  { src: "/img/photos/MNP-1121.webp", alt: "Two hosts on stage with the running order", ratio: "3 / 4" },
  { src: "/img/photos/IAP08170.webp", alt: "A singer on the chevron-lit stage", ratio: "4 / 3" },
  { src: "/img/photos/MNP-1200.webp", alt: "A singer alone in the green light", ratio: "4 / 3" },
  { src: "/img/photos/IAP09701.webp", alt: "A dancer arched back in the haze", ratio: "3 / 4" },
  { src: "/img/photos/IAP06958.webp", alt: "A troupe in white spread across the stage", ratio: "1 / 1" },
  { src: "/img/photos/MNP-1023.webp", alt: "A host on stage with the running order", ratio: "3 / 4" },
  { src: "/img/photos/MNP-1174.webp", alt: "The room seated, one singer on the stage", ratio: "4 / 3" },
  { src: "/img/photos/MNP-1239.webp", alt: "A troupe in white across the stage", ratio: "4 / 3" },
  { src: "/img/photos/MNP-1151.webp", alt: "Two voices in the green wash", ratio: "3 / 4" },
  { src: "/img/photos/IAP06665.webp", alt: "A singer against a green stage wash", ratio: "1 / 1" },
  { src: "/img/photos/IAP07571.webp", alt: "A performer facing a full open-air crowd at dusk", ratio: "4 / 3" },
  { src: "/img/photos/MNP-1007.webp", alt: "A singer alone on the runway under the arena roof", ratio: "4 / 3" },
  { src: "/img/photos/IAP08596.webp", alt: "A singer on stage behind a curtain of sparks", ratio: "1 / 1" },
  { src: "/img/photos/IAP09433.webp", alt: "A speaker at the microphone in front of the stage wall", ratio: "4 / 3" },
];

/**
 * Gallery flow configuration:
 * - Desktop: High density (~37 photos in the field simultaneously, like old).
 * - Mobile: ~8 photos in view at any moment, staggered so they arrive in turn.
 */
const COUNT = SLOTS.length;

// Desktop: full field density with recycling fly-through (like old)
const CYCLES_DESKTOP = 1.15;
const FLOW_END_DESKTOP = 0.70;

/*
 * Mobile: staggered depth arrivals, about eight prints in the frame at once.
 *
 * How many are on screen together is one division: a print is visible over one
 * unit of depth, so it is that unit divided by the gap between arrivals. Only
 * every other print is shown on a phone, so the gap is twice SPACING_MOBILE.
 * 0.18 measured five prints across the flight; 0.12 measured eight, which
 * overshot. 0.13 is the half-again this is meant to be -- measured at seven to
 * eight, against five before.
 *
 * Note it is not the count of photographs that sets the density -- that is the
 * spacing alone. Halving the gap puts more of the same nineteen on screen
 * together rather than bringing the other eighteen back, which is deliberate:
 * a phone decodes every distinct print it shows, and this section already had
 * to be made lighter, not heavier.
 */
const INITIAL_IN_VIEW_MOBILE = 9;
const SPACING_MOBILE = 0.065;
const TOTAL_Z_MOBILE = Number(((COUNT - 1 - INITIAL_IN_VIEW_MOBILE) * SPACING_MOBILE + 1.05).toFixed(3));

// Shared drain & outro boundary
const DRAIN_END = 0.85;

const getZDesktop = (prog: number) => {
  if (prog <= FLOW_END_DESKTOP) {
    return (prog / FLOW_END_DESKTOP) * CYCLES_DESKTOP;
  }
  if (prog <= DRAIN_END) {
    return CYCLES_DESKTOP + ((prog - FLOW_END_DESKTOP) / (DRAIN_END - FLOW_END_DESKTOP)) * 1.0;
  }
  return CYCLES_DESKTOP + 1.05;
};

const getZMobile = (prog: number) => {
  if (prog <= DRAIN_END) {
    return (prog / DRAIN_END) * TOTAL_Z_MOBILE;
  }
  return TOTAL_Z_MOBILE;
};

/**
 * Scale at the far end of the tunnel, and at the near end as it passes you.
 *
 * The 20x range reads as real depth on a wide screen. On a phone it does not
 * survive: a print at the far end lands around 40px regardless of how large its
 * base width is, so most of the field is unreadable. Narrow screens compress
 * the range instead — shallower depth, but every print is legible.
 */
const FAR = 0.05;
/* 0.45 left a hole. A print's distance from the centre is its radius times
   its scale, and the radius has a 0.44 floor, so starting at 0.45 scale meant
   nothing ever came closer than about 60px to the middle of a 375px screen --
   the field arrived already fanned out, with an empty core. 0.22 lets prints
   emerge from the centre the way they do on a desktop while still reaching the
   viewer at a readable size. */
const FAR_NARROW = 0.22;
const NEAR = 1;
/**
 * How far off centre a print drifts as it comes forward. Narrow screens get a
 * wider spread: prints are scaled up a lot there (see `--gs`), so without this
 * they would arrive on top of one another in the middle of the frame.
 */
const SPREAD_X = 0.62;
const SPREAD_Y = 0.62;
const SPREAD_X_NARROW = 0.82;
const SPREAD_Y_NARROW = 0.74;
const NARROW = 768;

/**
 * The field is laid out by construction rather than randomly.
 *
 * Random angles clump: several prints land close together, arrive at the same
 * depth and pile on top of each other. The golden angle spaces each successive
 * print ~137.5° from the last, so prints that arrive at the same moment are
 * always on opposite sides of the frame. Radius and width come off
 * low-discrepancy sequences for the same reason — even coverage, no banding,
 * and identical on server and client with no PRNG involved.
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const PHI = 0.6180339887;

const ITEMS = Array.from({ length: COUNT }, (_, i) => {
  const angle = i * GOLDEN_ANGLE;
  /* A floor on the radius keeps a print clear of the middle once it is big. */
  const radius = 0.44 + ((i * PHI) % 1) * 0.42;
  return {
    ...SLOTS[i],
    bx: Math.cos(angle) * radius,
    by: Math.sin(angle) * radius,
    w: 13 + ((i * 0.7548776662) % 1) * 8, // vw at full size
    d: i / COUNT, // desktop: evenly spaced arrivals across full pass (like old)
    arriveZ: (i - INITIAL_IN_VIEW_MOBILE) * SPACING_MOBILE, // mobile: staggered depth arrival
  };
});

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function GalleryFlow() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const soonRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const brandRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const field = fieldRef.current;
      const chrome = chromeRef.current;
      const black = blackRef.current;
      const card = cardRef.current;
      const soon = soonRef.current;
      const rule = ruleRef.current;
      const brand = brandRef.current;
      const els = itemRefs.current.filter(Boolean) as HTMLDivElement[];
      /* The button inside each print, which is the thing that can be clicked.
         Reaching for it every frame would be a query per print per frame. */
      const btns = els.map((el) => el.firstElementChild as HTMLElement | null);
      if (!section || !field || !black || !card || !soon || !rule || !brand || !els.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let targetP = 0, p = 0;
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

      /* Out of sight and out of reach. See the note where alpha is set. */
      const hide = (i: number) => {
        els[i].style.opacity = "0";
        const b = btns[i];
        if (b) b.style.pointerEvents = "none";
      };

      const render = () => {
        const w = field.clientWidth || window.innerWidth;
        const h = field.clientHeight || window.innerHeight;
        const narrow = w < NARROW;

        /* Worked out before the prints rather than after them, because whether
           a print can be clicked depends on it. */
        const outro = clamp01((p - DRAIN_END) / (1 - DRAIN_END));
        const dark = clamp01(outro / 0.30);
        const sx = narrow ? SPREAD_X_NARROW : SPREAD_X;
        const sy = narrow ? SPREAD_Y_NARROW : SPREAD_Y;
        const far = narrow ? FAR_NARROW : FAR;
        const currZ = narrow ? getZMobile(p) : getZDesktop(p);

        for (let i = 0; i < els.length; i++) {
          /* Compressing the depth range makes every print large, so a phone
             would show all at once. Every other one is dropped on narrow
             screens -- which halves how many distinct photographs a phone has
             to decode. How many are in the frame together is set by the
             arrival spacing, not by this. */
          if (narrow && i % 2 === 1) {
            hide(i);
            continue;
          }
          const it = ITEMS[i];

          let t = 0;
          if (narrow) {
            // Mobile: staggered linear arrival -- see SPACING_MOBILE for the density
            t = currZ - it.arriveZ;
            if (t < 0 || t > 1.0) {
              hide(i);
              continue;
            }
          } else {
            // Desktop: Full field density (~37 photos in view simultaneously, like old)
            const u = currZ + it.d;
            const pass = Math.floor(u);
            const retired = pass > Math.floor(CYCLES_DESKTOP + it.d);
            if (retired) {
              hide(i);
              continue;
            }
            t = u - pass;
          }

          /* Exponential growth is what makes constant scrolling feel like
             constant forward speed — linear scaling reads as slowing down. */
          const scale = far * Math.pow(NEAR / far, t);

          const x = it.bx * scale * w * sx + mouse.x * (10 + t * 26);
          const y = it.by * scale * h * sy + mouse.y * (10 + t * 26);

          const fadeIn = Math.min(1, t / 0.12);
          const fadeOut = t > 0.88 ? Math.max(0, (1 - t) / 0.12) : 1;

          const el = els[i];
          const alpha = fadeIn * fadeOut;
          el.style.transform =
            `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${scale.toFixed(4)})`;
          el.style.opacity = String(alpha);
          /* A print that cannot be seen cannot be clicked either. Every one
             of these is a button, and opacity leaves them exactly where they
             are: they were lying over the closing card, invisible, and a tap
             near the middle of it opened a photograph.

             The blackout counts as not being seen. A print retires a pass
             after its own arrival offset, so the last few are still at full
             opacity when the black goes up over them.

             Set on the button rather than on this wrapper, and that is the
             whole of it: pointer-events:none on an ancestor does not stop a
             descendant taking the event, because auto is the initial value and
             the button has it. Turning the wrapper off -- or the field above it
             -- looked like it worked and changed nothing at all. */
          const b = btns[i];
          if (b) b.style.pointerEvents = alpha > 0.02 && dark < 0.02 ? "auto" : "none";
          el.style.zIndex = String(Math.round(t * 100));
        }

        /* --- the close: only after the field has drained --- */

        /* Prints fade themselves as they retire, so the field is never dimmed
           as a block — that is what cut them off mid-pass before. */
        if (chrome) chrome.style.opacity = String(1 - clamp01((p - 0.72) / 0.14));
        black.style.opacity = String(dark);


        /* The card arrives in three beats — headline, rule, then the edition —
           so the closing line lands after you have read the one above it.

           All three finish by outro 0.52, and the rest of the section is a
           hold. They used to run to 0.86, which is 98% of the way through: the
           card assembled itself and the footer arrived on top of it, so there
           was no moment where the finished thing simply stood there. */
        const reveal = clamp01((outro - 0.12) / 0.22);
        const ruled = clamp01((outro - 0.26) / 0.14);
        const branded = clamp01((outro - 0.34) / 0.18);

        card.style.transform = `scale(${(0.95 + reveal * 0.05).toFixed(4)})`;
        soon.style.opacity = String(reveal);
        soon.style.transform = `translateY(${((1 - reveal) * 20).toFixed(1)}px)`;
        rule.style.opacity = String(ruled);
        rule.style.transform = `scaleX(${ruled.toFixed(3)})`;
        brand.style.opacity = String(branded);
        brand.style.transform = `translateY(${((1 - branded) * 16).toFixed(1)}px)`;
      };

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          targetP = self.progress;
          if (reduced) {
            p = targetP;
            render();
          }
        },
      });

      if (reduced) {
        render();
        return () => st.kill();
      }

      const tick = () => {
        p += (targetP - p) * 0.07;
        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;
        render();
      };

      const onMove = (e: PointerEvent) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      };

      render();
      gsap.ticker.add(tick);
      window.addEventListener("pointermove", onMove, { passive: true });
      const ro = new ResizeObserver(() => {
        render();
      });
      ro.observe(field);

      // Refresh ScrollTrigger so all downstream offsets align with upstream sections
      ScrollTrigger.refresh();

      return () => {
        st.kill();
        ro.disconnect();
        gsap.ticker.remove(tick);
        window.removeEventListener("pointermove", onMove);
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="flow"
      ref={sectionRef as React.RefObject<HTMLElement>}
      /* Extended runway (480vh) so each photo has generous show time across the scroll. */
      className="relative h-[480vh]"
    >
      {/* Where the closing card starts to assemble, aligned for the scroll rail. */}
      <div id="soon" aria-hidden className="absolute h-1 w-full" style={{ top: "79%" }} />

      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* `--gs` scales every print together: at 13-21vw a print is barely
            50px on a phone, so narrow screens need a large multiple. */}
        <div
          ref={fieldRef}
          className="absolute inset-0 gallery-field"
        >
          {ITEMS.map((it, i) => (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              data-cursor="view"
              data-cursor-label="VIEW"
              className="absolute left-1/2 top-1/2 will-change-transform"
              style={{ width: `calc(var(--gs, 1) * ${it.w}vw)`, opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={`View: ${it.alt}`}
                className="cut-shape-sm relative block w-full overflow-hidden bg-ink-2 backdrop-blur-sm"
                style={{
                  aspectRatio: it.ratio,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 20px hsl(var(--red-hot-c) / 0.15)",
                }}
              >
                <img src={it.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 border border-hairline/60" />
              </button>
            </div>
          ))}
        </div>

        <Lightbox
          shots={ITEMS}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndex={setOpenIndex}
        />

        <header
          ref={chromeRef}
          className="pointer-events-none absolute inset-x-0 top-0 z-[200] mx-auto flex w-full max-w-(--maxw) items-center justify-between px-(--gutter) pt-8 md:pt-10"
        >
          <span className="badge-pill whitespace-nowrap">Archive · Gallery</span>
          <span className="badge-pill whitespace-nowrap">Past Events</span>
        </header>

        {/* the field hands over to black */}
        <div
          ref={blackRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[300] bg-black opacity-0"
        />

        <div
          ref={cardRef}
          className="pointer-events-none absolute inset-0 z-[400] flex flex-col items-center justify-center gap-7 px-(--gutter)"
        >
          <span
            ref={soonRef}
            className="font-display select-none text-center text-[clamp(2.75rem,12vw,11rem)] leading-[0.9] tracking-[-0.02em] text-white opacity-0"
          >
            Coming soon
          </span>

          <span
            ref={ruleRef}
            aria-hidden
            className="block h-px w-24 origin-center opacity-0"
            style={{ background: "var(--grad-red)" }}
          />

          <span
            ref={brandRef}
            className="font-display select-none text-center text-[clamp(1.1rem,4vw,3.25rem)] leading-none tracking-[-0.01em] text-white opacity-0"
          >
            Generation <span className="text-red-hot">26</span>
          </span>
        </div>
      </div>
    </section>
  );
}
