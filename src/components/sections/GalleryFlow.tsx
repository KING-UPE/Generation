/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import Lightbox, { type Shot } from "@/components/ui/Lightbox";

/*
 * Ordered against RATIOS below, not by preference: the two cycle together, so
 * slot i always lands in the same frame shape. Thirty-three slots come out as
 * thirteen portrait frames, thirteen landscape and seven square — and the
 * library holds exactly thirteen portrait photographs and twenty landscape, so
 * every photograph sits in a frame of its own shape and nothing is cropped
 * across its subject.
 *
 * One photograph each, none repeated. The four the Vision and About decks
 * carry are the four that are not here.
 */
const SLOTS: Shot[] = [
  { src: "/img/photos/IAP09789.webp", alt: "A singer between the flame jets" },
  { src: "/img/photos/IAP06765.webp", alt: "A singer mid-phrase at the microphone" },
  { src: "/img/photos/MNP-1424.webp", alt: "The crowd from the back of the field" },
  { src: "/img/photos/IAP07837.webp", alt: "Two dancers in Kandyan costume mid-routine" },
  { src: "/img/photos/IAP06752.webp", alt: "A duet in front of a wall of falling petals" },
  { src: "/img/photos/MNP-1065.webp", alt: "Dancers in a row before the rock fortress backdrop" },
  { src: "/img/photos/IAP09542.webp", alt: "A performer in the crossfire of white beams" },
  { src: "/img/photos/IAP06937.webp", alt: "Two performers in a blue wash on the open stage" },
  { src: "/img/photos/IAP07843.webp", alt: "A Kandyan dancer with an arm raised" },
  { src: "/img/photos/MNP-1186.webp", alt: "Beams over the stage and a standing crowd" },
  { src: "/img/photos/IAP06884.webp", alt: "A singer in the warm wash with the band behind her" },
  { src: "/img/photos/IAP06459.webp", alt: "A singer in a white gown against a starfield wall" },
  { src: "/img/photos/IAP09052.webp", alt: "A dance troupe in line across the stage" },
  { src: "/img/photos/MNP-1133.webp", alt: "A guitarist singing through the haze" },
  { src: "/img/photos/MNP-1073.webp", alt: "The full troupe before the temple backdrop" },
  { src: "/img/photos/IAP09629.webp", alt: "A pair dancing between the teal panels" },
  { src: "/img/photos/IAP09467.webp", alt: "A singer in a cap mid-verse at the microphone" },
  { src: "/img/photos/MNP-1583.webp", alt: "Faces at the barrier, lit from the stage" },
  { src: "/img/photos/IAP07460.webp", alt: "A singer against a swirl of pink light" },
  { src: "/img/photos/MNP-1129.webp", alt: "A singer against a wall of lights" },
  { src: "/img/photos/IAP07140.webp", alt: "A drama piece playing out on the open stage" },
  { src: "/img/photos/IAP09212.webp", alt: "Two singers sharing the microphone line" },
  { src: "/img/photos/MNP-1194.webp", alt: "The stage in full, one performer at the centre" },
  { src: "/img/photos/MNP-1121.webp", alt: "Two hosts on stage with the running order" },
  { src: "/img/photos/IAP08170.webp", alt: "A singer on the chevron-lit stage" },
  { src: "/img/photos/MNP-1200.webp", alt: "A singer alone in the green light" },
  { src: "/img/photos/IAP09701.webp", alt: "A dancer arched back in the haze" },
  { src: "/img/photos/IAP06958.webp", alt: "A troupe in white spread across the stage" },
  { src: "/img/photos/MNP-1023.webp", alt: "A host on stage with the running order" },
  { src: "/img/photos/MNP-1174.webp", alt: "The room seated, one singer on the stage" },
  { src: "/img/photos/MNP-1239.webp", alt: "A troupe in white across the stage" },
  { src: "/img/photos/MNP-1151.webp", alt: "Two voices in the green wash" },
  { src: "/img/photos/IAP06665.webp", alt: "A singer against a green stage wash" },
];



const RATIOS = ["4 / 3", "3 / 4", "1 / 1", "3 / 4", "4 / 3"];

/** How many full passes of the field the fly-through covers. */
const CYCLES = 1.05;
/*
 * The section is 280vh, down from 400. One pass of the field was being spread
 * across four screens of scrolling — the single largest block on a page that
 * already runs to fifteen, and unlike the tower there is no frame rate riding
 * on it: these are CSS transforms, so a shorter runway makes the prints travel
 * faster and costs nothing else.
 */
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
const SPREAD_X_NARROW = 0.86;
/* Flatter than the horizontal, because a phone opens the field sideways --
   see `nx`/`ny` where the directions are laid out. */
const SPREAD_Y_NARROW = 0.52;
const NARROW = 768;

/**
 * Roughly how many prints a phone carries at once.
 *
 * The narrow depth range makes every print large, so the whole set on screen
 * together is a wall rather than a field. Prints are dropped to a stride to get
 * back to about this many, and the stride is derived from COUNT so adding
 * photographs never quietly crowds a small screen.
 */
const NARROW_ON_SCREEN = 8;

/**
 * The section runs in three phases.
 *
 * `FLOW_END` ends the travel. Between there and `DRAIN_END` the field drains:
 * z keeps advancing by one more turn so every print finishes the pass it is
 * mid-way through and then does not respawn. Only once the field is genuinely
 * empty does the close begin.
 */
const FLOW_END = 0.65;
const DRAIN_END = 0.85;

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

/**
 * One print per photograph: the field is however large the library is.
 *
 * It was fifteen, tuned by measuring nearest-neighbour gaps across the whole
 * scroll — a ~44px median gap with 17% of prints touching on a 1280px frame.
 * Every print is somewhere in the tunnel at any moment, evenly spread in depth,
 * so the whole library on screen is a denser field than that was: showing all
 * of the photographs and keeping that gap are not both available without
 * staggering arrivals across more than one pass. The spacing is still even —
 * the golden angle keeps prints that arrive together on opposite sides — there
 * is simply more of it. The radius floor stays: near 0.58 it flung them to the
 * edges, near 0.32 it put 71% of them on top of each other.
 */
const COUNT = SLOTS.length;
const NARROW_STRIDE = Math.max(1, Math.round(COUNT / NARROW_ON_SCREEN));
const ITEMS = Array.from({ length: COUNT }, (_, i) => {
  const angle = i * GOLDEN_ANGLE;
  /* A floor on the radius keeps a print clear of the middle once it is big. */
  const radius = 0.44 + ((i * PHI) % 1) * 0.42;
  return {
    ...SLOTS[i % SLOTS.length],
    ratio: RATIOS[i % RATIOS.length],
    bx: Math.cos(angle) * radius,
    by: Math.sin(angle) * radius,

    /* Where a print goes on a phone, which is not where it goes on a desktop.
     *
     * The golden angle sends prints out in every direction, and that reads as
     * a field on a wide screen. On a tall narrow one it mostly sends them off
     * the top and the bottom -- and the ones pointing straight up or down have
     * almost no sideways travel at all, so they sit in the middle and grow.
     *
     * A phone gets a left-right fan instead: every print leaves the centre
     * towards one edge or the other, alternating, with the vertical only
     * scattering them off each other's path rather than deciding where they
     * go. Same emergence from the middle, opening out across the screen.
     *
     * The sideways push runs down to almost nothing on purpose. A floor of 0.5
     * gave two columns of prints with a hole down the middle of the screen
     * between them -- every print was being pushed off centre, so none was ever
     * on it. The desktop layout has a floor for the opposite reason, to keep a
     * large print clear of the middle, but there the direction is radial and
     * the ones aimed up and down cross the centre anyway. Here nothing else
     * would.
     */
    /* Which side, taken from the golden-angle direction rather than from the
       parity of i. Parity looked equivalent and was not: a phone keeps one
       print in every NARROW_STRIDE, the stride is even, and every index it
       kept was therefore even too -- so the whole field flew off to the left.
       The golden angle is irrational in turns, so its sign lines up with no
       stride at all, and it keeps each print on the side the wide layout
       already sends it. */
    nx: (Math.cos(angle) >= 0 ? 1 : -1) * (0.06 + ((i * PHI) % 1) * 0.88),
    ny: (((i * 0.5698402909) % 1) - 0.5) * 0.85,
    w: 13 + ((i * 0.7548776662) % 1) * 8,  // vw at full size
    d: i / COUNT,                           // evenly spaced arrivals
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
      if (!section || !field || !black || !card || !soon || !rule || !brand || !els.length) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let targetZ = 0, z = 0;
      let targetP = 0, p = 0;
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

      /* Out of sight and out of reach. See the note where alpha is set. */
      const hide = (el: HTMLElement) => {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
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

        for (let i = 0; i < els.length; i++) {
          /* Compressing the depth range makes every print large, so a phone
             would show the whole set at once. Keep one in every NARROW_STRIDE
             — the survivors are still evenly spaced in depth, so arrivals stay
             regular. */
          if (narrow && i % NARROW_STRIDE !== 0) {
            hide(els[i]);
            continue;
          }
          const it = ITEMS[i];

          /* `u` is unwrapped travel. Once a print has begun a pass beyond its
             last allowed one it has retired, and stays gone. */
          const u = z + it.d;
          const pass = Math.floor(u);
          const retired = pass > Math.floor(CYCLES + it.d);
          if (retired) {
            hide(els[i]);
            continue;
          }

          /* 0 = far away at the centre, 1 = large and passing the viewer */
          const t = u - pass;

          /* Exponential growth is what makes constant scrolling feel like
             constant forward speed — linear scaling reads as slowing down. */
          const scale = far * Math.pow(NEAR / far, t);

          const x = (narrow ? it.nx : it.bx) * scale * w * sx + mouse.x * (10 + t * 26);
          const y = (narrow ? it.ny : it.by) * scale * h * sy + mouse.y * (10 + t * 26);

          const fadeIn = Math.min(1, t / 0.10);
          const fadeOut = t > 0.92 ? Math.max(0, (1 - t) / 0.08) : 1;

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
             opacity when the black goes up over them -- and this cannot be
             answered on the field instead, because pointer-events:none on an
             ancestor still lets a descendant set to auto take the event. */
          el.style.pointerEvents = alpha > 0.02 && dark < 0.02 ? "auto" : "none";
          el.style.zIndex = String(Math.round(t * 100));
        }

        /* --- the close: only after the field has drained --- */

        /* Prints fade themselves as they retire, so the field is never dimmed
           as a block — that is what cut them off mid-pass before. */
        if (chrome) chrome.style.opacity = String(1 - clamp01((p - FLOW_END) / 0.14));
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
          /* The travel finishes at FLOW_END and holds, leaving the rest of the
             section for the close. */
          targetZ =
            self.progress <= FLOW_END
              ? (self.progress / FLOW_END) * CYCLES
              : CYCLES +
                clamp01((self.progress - FLOW_END) / (DRAIN_END - FLOW_END));
          if (reduced) {
            p = targetP;
            z = targetZ;
            render();
          }
        },
      });

      if (reduced) {
        render();
        return () => st.kill();
      }

      const tick = () => {
        z += (targetZ - z) * 0.07;
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
      /* 300vh, up from 280. The extra 20 all lands in the hold at the end,
         since the travel and the drain are fractions of the whole. */
      className="relative h-[300vh]"
    >
      {/* Where the closing card starts to assemble, for the scroll rail.
          76% of the box rather than the 0.868 of progress the beats begin at:
          the stage is pinned, so progress runs over the box less one screen,
          and the rail compares a document position against a line 55% down
          the viewport. Those two together turn 0.868 into 0.762 -- and since
          the height is stated in vh, a screen is always a third of the box and
          the fraction holds at any viewport. */}
      <div id="soon" aria-hidden className="absolute h-1 w-full" style={{ top: "76%" }} />

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
