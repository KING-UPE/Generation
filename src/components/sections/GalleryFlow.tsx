/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import Lightbox, { type Shot } from "@/components/ui/Lightbox";

/*
 * Ordered against RATIOS below, not by preference: the two cycle together, so
 * slot i always lands in the same frame shape. The four portrait frames get the
 * four portrait photographs; where there are more portrait frames than portrait
 * photographs, the landscape ones chosen for them have a centred subject, which
 * is all that survives an object-cover crop to 3/4.
 *
 * Fifteen frames against fourteen photographs, so one repeats. It is a wide
 * venue shot placed nine slots from its twin, which is most of a pass of the
 * tunnel — far enough apart not to read as the same picture twice.
 */
const SLOTS: Shot[] = [
  { src: "/img/photos/IAP07571.jpg", alt: "A performer facing a full open-air crowd at dusk" },
  { src: "/img/photos/IAP07479.jpg", alt: "A singer with one arm out against a lit backdrop" },
  { src: "/img/photos/IAP08180.jpg", alt: "The full stage under the LED wall" },
  { src: "/img/photos/IAP07837.jpg", alt: "Two dancers in Kandyan costume mid-routine" },
  { src: "/img/photos/IAP08008.jpg", alt: "The floor lit end to end by phone torches" },
  { src: "/img/photos/IAP07942.jpg", alt: "Beams fanning down over the venue" },
  { src: "/img/photos/IAP06765.jpg", alt: "A singer mid-phrase at the microphone" },
  { src: "/img/photos/IAP06905.jpg", alt: "The crowd, shoulders up, one phone raised" },
  { src: "/img/photos/IAP07843.jpg", alt: "A Kandyan dancer with an arm raised" },
  { src: "/img/photos/IAP08596.jpg", alt: "Sparks falling behind a singer on stage" },
  { src: "/img/photos/IAP09052.jpg", alt: "A dance troupe in line across the stage" },
  { src: "/img/photos/IAP06665.jpg", alt: "A singer against a green stage wash" },
  { src: "/img/photos/IAP07600.jpg", alt: "The stage and the crowd along its edge" },
  { src: "/img/photos/IAP07586.jpg", alt: "A performer in silhouette through the haze" },
  { src: "/img/photos/IAP07942.jpg", alt: "Beams fanning down over the venue" },
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
const FAR_NARROW = 0.45;
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
 * Tuned by measuring nearest-neighbour gaps across the whole scroll: this lands
 * at a ~44px median gap with 17% of prints touching on a 1280px frame — close
 * enough to read as a field, open enough that nothing is buried. A radius floor
 * near 0.58 flung them to the edges; near 0.32 put 71% of them on top of
 * each other.
 */
const COUNT = 15;
const ITEMS = Array.from({ length: COUNT }, (_, i) => {
  const angle = i * GOLDEN_ANGLE;
  /* A floor on the radius keeps a print clear of the middle once it is big. */
  const radius = 0.44 + ((i * PHI) % 1) * 0.42;
  return {
    ...SLOTS[i % SLOTS.length],
    ratio: RATIOS[i % RATIOS.length],
    bx: Math.cos(angle) * radius,
    by: Math.sin(angle) * radius,
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

      const render = () => {
        const w = field.clientWidth || window.innerWidth;
        const h = field.clientHeight || window.innerHeight;
        const narrow = w < NARROW;
        const sx = narrow ? SPREAD_X_NARROW : SPREAD_X;
        const sy = narrow ? SPREAD_Y_NARROW : SPREAD_Y;
        const far = narrow ? FAR_NARROW : FAR;

        for (let i = 0; i < els.length; i++) {
          /* Compressing the depth range makes every print large, so a phone
             would show all 15 at once. Drop every other one — the survivors are
             still evenly spaced in depth, so arrivals stay regular. */
          if (narrow && i % 2 === 1) {
            els[i].style.opacity = "0";
            continue;
          }
          const it = ITEMS[i];

          /* `u` is unwrapped travel. Once a print has begun a pass beyond its
             last allowed one it has retired, and stays gone. */
          const u = z + it.d;
          const pass = Math.floor(u);
          const retired = pass > Math.floor(CYCLES + it.d);
          if (retired) {
            els[i].style.opacity = "0";
            continue;
          }

          /* 0 = far away at the centre, 1 = large and passing the viewer */
          const t = u - pass;

          /* Exponential growth is what makes constant scrolling feel like
             constant forward speed — linear scaling reads as slowing down. */
          const scale = far * Math.pow(NEAR / far, t);

          const x = it.bx * scale * w * sx + mouse.x * (10 + t * 26);
          const y = it.by * scale * h * sy + mouse.y * (10 + t * 26);

          const fadeIn = Math.min(1, t / 0.10);
          const fadeOut = t > 0.92 ? Math.max(0, (1 - t) / 0.08) : 1;

          const el = els[i];
          el.style.transform =
            `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${scale.toFixed(4)})`;
          el.style.opacity = String(fadeIn * fadeOut);
          el.style.zIndex = String(Math.round(t * 100));
        }

        /* --- the close: only after the field has drained --- */
        const outro = clamp01((p - DRAIN_END) / (1 - DRAIN_END));
        const dark = clamp01(outro / 0.30);

        /* Prints fade themselves as they retire, so the field is never dimmed
           as a block — that is what cut them off mid-pass before. */
        if (chrome) chrome.style.opacity = String(1 - clamp01((p - FLOW_END) / 0.14));
        black.style.opacity = String(dark);

        /* The card arrives in three beats — headline, rule, then the edition —
           so the closing line lands after you have read the one above it. */
        const reveal = clamp01((outro - 0.26) / 0.32);
        const ruled = clamp01((outro - 0.44) / 0.20);
        const branded = clamp01((outro - 0.54) / 0.32);

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
      className="relative h-[280vh]"
    >
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
