"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

/**
 * The seek-optimised build, not the original.
 *
 * The source has exactly one keyframe in 300 frames, so every seek decodes from
 * the top of the file — that was the scrubbing lag. This build is all-intra:
 * 300 of 300 keyframes, so a seek costs a single frame. Measured seek latency
 * went from a ~534ms median to 3.3ms.
 *
 * 1600x900, 2.6MB — smaller than the 5MB source despite being all-intra,
 * because mostly-black footage compresses better as stills than as motion.
 *
 * Named `.seek` rather than `.scrub`: HeroVideo.scrub.mp4 was twice replaced by
 * a normally-encoded file (26 of 300 keyframes), which silently reinstated the
 * lag. Re-cut after any change to the footage — a standard export will do the
 * same thing:
 *
 *   ffmpeg -i HeroVideo.mp4 -an -vf "scale=1600:-2,fps=30" -c:v libx264 -g 1 -crf 26 -preset slow -movflags +faststart HeroVideo.seek.mp4
 */
const SRC = "/HeroVideo.seek.mp4";

/**
 * The hero framing: pulled in off the viewport edges and pushed down, so the
 * tower rises from the bottom rather than sitting dead centre. As the hero
 * scrolls away this eases to full-bleed, so the timeline runs fullscreen.
 */
const FRAME_SCALE = 0.85;
const FRAME_SHIFT = 10; // % of viewport height

/** How far below its resting place the tower starts on first load, in % of
 *  viewport height. It rises into frame with the rest of the hero. */
const INTRO_RISE = 40;

/**
 * Where the tower's centre sits across the footage, as a % of frame width.
 * Measured off the video by taking the brightness-weighted centroid of each
 * frame: it holds at centre while the crown is on screen, then slides left and
 * settles once the shaft takes over.
 */
const TOWER_TRACK: ReadonlyArray<readonly [number, number]> = [
  [0, 49.6], [1, 49.6], [2, 38.0], [2.5, 28.9], [2.8, 26.6], [3.5, 25.7], [10, 25.8],
];

/**
 * Below this width, `object-cover` on 16:9 footage crops so hard that the
 * visible window is the middle quarter of the frame — and the tower, at ~26%,
 * falls outside it entirely. Narrow screens pan to keep it in view.
 */
const NARROW = 768;
/** Where the tower should land on a narrow screen, as a fraction of the frame. */
const NARROW_TARGET = 0.5;

/**
 * On a phone the footage shrinks to a band across the upper screen, leaving the
 * lower half to the cards.
 *
 * The box gets shorter but keeps `object-cover`, so it still crops in around
 * the tower — the frame is mostly empty black, and showing all of it just makes
 * the tower a stamp in the corner. Full frame height is visible at any box
 * height under cover, which is what keeps the vertical "GENERATION 23" whole.
 *
 * (An earlier attempt faded the bottom of the footage out with a gradient mask.
 * That erased the lower half of the tower — which is exactly where the start of
 * the vertical word sits, hence the clipped "…RATION 23".)
 */
const BAND_TOP = 0; // % of stage height the band starts at — flush to the top
const BAND_HEIGHT = 60; // % of stage height — the *most* the band may take
const BAND_MIN = 34; // …and the least, on very short screens
const CARD_PAD = 40; // the cards' own bottom padding (pb-10)
const CARD_GAP = 24; // breathing room between footage and text

function towerCentre(t: number) {
  const p = TOWER_TRACK;
  if (t <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    if (t <= p[i][0]) {
      const [t0, x0] = p[i - 1];
      const [t1, x1] = p[i];
      return x0 + ((x1 - x0) * (t - t0)) / (t1 - t0);
    }
  }
  return p[p.length - 1][1];
}

/** Cross-fade between two cards, in seconds of video time. */
const FADE = 0.35;

/**
 * When each card appears, in seconds of the footage — matched to where that
 * year is legible on the tower shaft. The last one holds to the end.
 */
const EDITIONS = [
  {
    year: "2023",
    at: 2.8,
    venue: "Maharagama Youth Centre",
    crowd: "2,000+",
  },
  {
    year: "2024",
    at: 5.2,
    venue: "Viharamahadevi Open Air Theatre",
    crowd: "4,500+",
  },
  {
    year: "2025",
    at: 7.4,
    venue: "Lotus Tower Open Arena",
    crowd: "7,500+",
    sponsors: "SLIC General · Y FM",
    sponsorLogos: [
      {
        src: "/img/sponsors/slic.png",
        name: "SLIC General",
        title: "Official Insurer",
        alt: "SLIC General - Sri Lanka Insurance",
      },
      {
        src: "/img/sponsors/yfm.png",
        name: "Y FM 92.7",
        title: "Official Media",
        alt: "Y FM - The Original Youth Channel",
      },
    ],
    photos:
      "https://www.facebook.com/media/set/?set=a.122160864974672421&type=3",
  },
  {
    year: "2026",
    at: 9.0,
    venue: "Lotus Tower Open Arena",
    crowd: "10,000+",
    date: "Saturday, 12 December 2026",
    upcoming: true,
  },
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * A card holds from its own cue until the next one's, cross-fading at each
 * boundary. The final card has no successor, so it holds to the end — fading
 * it out left the bottom of the section showing nothing at all.
 */
function cardAlpha(t: number, i: number) {
  const start = EDITIONS[i].at;
  const next = EDITIONS[i + 1];
  const rampIn = clamp01((t - start) / FADE);
  const rampOut = next ? clamp01((next.at - t) / FADE) : 1;
  return Math.min(rampIn, rampOut);
}

export default function TowerTimeline({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const video = videoRef.current;
      const timeline = timelineRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!video || !timeline) return;

      video.muted = true;
      video.pause();

      let target = 0;
      let current = 0;
      /* 0 = inset hero framing, 1 = full bleed. */
      let framingTarget = 0;
      let framing = 0;

      /* One-shot entrance, decayed by the ticker alongside everything else. */
      const intro = { v: 1 };

      /**
       * Chooses the `object-position` that puts the tower where we want it in
       * the container, given how hard cover is cropping at this size. Wide
       * screens crop little, so they keep the default framing.
       */
      const pan = (t: number) => {
        /* The video's own box, not the stage: on narrow screens it shrinks to a
           band, and once it is 16:9 there is nothing left to crop or pan. */
        const w = video.clientWidth;
        const h = video.clientHeight;
        const stage = video.parentElement;
        if (!stage || !w || !h || stage.clientWidth >= NARROW) {
          video.style.objectPosition = "";
          return;
        }
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const rendered = vw * Math.max(w / vw, h / vh);
        if (rendered <= w) {
          video.style.objectPosition = "";
          return;
        }
        const f = towerCentre(t) / 100;
        const x = ((NARROW_TARGET * w - f * rendered) / (w - rendered)) * 100;
        video.style.objectPosition = `${clamp01(x / 100) * 100}% 50%`;
      };

      /**
       * The band takes whatever height is left once the tallest card has its
       * room. A fixed percentage cannot work: card content is a fixed pixel
       * height, so on a short phone it eats proportionally more of the screen —
       * 60% was fine at 812px tall and overlapped by 44px at 667px.
       */
      let bandPct = BAND_HEIGHT;
      let measuredAtHeight = 0;
      const measureBand = () => {
        const stage = video.parentElement;
        const h = stage?.clientHeight ?? 0;
        if (!h || !cards.length) return;
        let tallest = 0;
        for (const c of cards) {
          const kids = Array.from(c.children).filter(
            (k) => (k as HTMLElement).offsetHeight > 0,
          );
          if (!kids.length) continue;
          const rects = kids.map((k) => k.getBoundingClientRect());
          const height =
            Math.max(...rects.map((r) => r.bottom)) - Math.min(...rects.map((r) => r.top));
          if (height > tallest) tallest = height;
        }
        if (!tallest) return;
        const available = ((h - tallest - CARD_PAD - CARD_GAP) / h) * 100;
        bandPct = Math.max(BAND_MIN, Math.min(BAND_HEIGHT, available));
        measuredAtHeight = h;
      };

      const frame = (f: number) => {
        const stage = video.parentElement;
        const w = stage?.clientWidth ?? 0;
        const h = stage?.clientHeight ?? 0;

        if (w && h && w < NARROW) {
          /* Re-measure whenever the viewport height changes. The observer alone
             is not enough: its callbacks arrive on the rendering step, which a
             backgrounded tab does not run, so the band can come back stale. */
          if (h !== measuredAtHeight) measureBand();
          /* Ease from full-bleed to the band as the timeline takes over. */
          video.style.top = `${(BAND_TOP * f).toFixed(2)}%`;
          video.style.height = `${(100 + (bandPct - 100) * f).toFixed(2)}%`;
        } else {
          video.style.top = "";
          video.style.height = "";
        }

        const scale = FRAME_SCALE + (1 - FRAME_SCALE) * f;
        const shift = FRAME_SHIFT * (1 - f) + INTRO_RISE * intro.v;
        video.style.transform = `translateY(${shift.toFixed(2)}%) scale(${scale.toFixed(4)})`;
        /* Opaque by the time it is halfway up, so the rise reads as movement
           rather than a fade. */
        video.style.opacity = String(clamp01((1 - intro.v) / 0.5));
      };

      /* Cards key off the same eased time the video is seeking to, so a card
         and the year behind it never drift apart. */
      const paint = (t: number) => {
        cards.forEach((card, i) => {
          const a = cardAlpha(t, i);
          card.style.opacity = String(a);
          card.style.transform = `translateY(${((1 - a) * 26).toFixed(1)}px)`;
          card.style.pointerEvents = a > 0.6 ? "auto" : "none";
        });
      };

      const st = ScrollTrigger.create({
        trigger: timeline,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          target = self.progress * (video.duration || 10);
        },
      });

      /* Opens out across the hero's exit, so it is already full bleed by the
         time the timeline pins. */
      const framer = ScrollTrigger.create({
        trigger: heroRef.current ?? timeline,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          framingTarget = self.progress;
        },
      });

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        intro.v = 0;
        /* No lerp: jump straight to the frame the scroll position implies. */
        const snap = () => {
          if (Number.isFinite(video.duration)) video.currentTime = target;
          frame(framingTarget);
          pan(target);
          paint(target);
        };
        st.vars.onUpdate = (self: { progress: number }) => {
          target = self.progress * (video.duration || 10);
          snap();
        };
        framer.vars.onUpdate = (self: { progress: number }) => {
          framingTarget = self.progress;
          snap();
        };
        snap();
        return () => {
          st.kill();
          framer.kill();
        };
      }

      /* Seeking every frame to a lerped time: the ease is what keeps a
         scrubbed video from looking like it is stuttering between keyframes. */
      const tick = () => {
        current += (target - current) * 0.16;
        /* One frame is 1/30s; seeking finer than half a frame is wasted work
           even now that every frame is a keyframe. */
        if (Number.isFinite(video.duration) && Math.abs(current - video.currentTime) > 1 / 60) {
          video.currentTime = current;
        }
        framing += (framingTarget - framing) * 0.16;
        frame(framing);
        pan(current);
        paint(current);
      };

      gsap.to(intro, { v: 0, duration: 1.7, delay: 0.3, ease: "gen" });

      measureBand();
      const bandRO = new ResizeObserver(() => measureBand());
      if (video.parentElement) bandRO.observe(video.parentElement);

      gsap.ticker.add(tick);
      frame(0);
      pan(0);
      paint(0);

      return () => {
        st.kill();
        framer.kill();
        bandRO.disconnect();
        gsap.ticker.remove(tick);
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative">
      {/*
        A full-height sticky whose height is cancelled by an equal negative
        margin: it pins for the whole hero + timeline run, costs no layout
        space, and it stops sticking with its bottom edge exactly on the section
        boundary — then scrolls away on its own as Vision arrives. So the tower
        stays fully visible to the last frame and never bleeds over the next
        section. Fading it out early did the second job but broke the first.

        The height cancellation lives on the hero below, not here: sticky release
        is measured from the *margin box*, so a negative margin on this element
        collapsed it to nothing and it never released at all.

        z-index -1 puts it beneath the starfield, which is what lets stars show
        over the tower. The page is pure black to match the footage, so the
        frame's own black has no visible edge.

        An earlier attempt used `mix-blend-mode: screen` to knock the black out.
        That cannot work here: `position: sticky` always establishes a stacking
        context, so the video had no backdrop to blend against.
      */}
      <div className="pointer-events-none sticky top-0 z-[-1] h-[100svh] overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `translateY(${FRAME_SHIFT + INTRO_RISE}%) scale(${FRAME_SCALE})`,
            opacity: 0,
          }}
          src={SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
      </div>

      {/* Pulled up over the pinned frame — this is what makes the video layer
          cost no layout height, without touching the sticky element itself. */}
      <div ref={heroRef} className="relative" style={{ marginTop: "-100svh" }}>
        {children}
      </div>

      <section
        id="timeline"
        ref={timelineRef}
        className="relative h-[400svh]"
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-(--maxw) items-center px-(--gutter)">
            {/* `md`, not `lg`: between 768 and 1024 this was still full width,
                so the text sat straight on top of the tower. */}
            <div className="relative ml-auto h-full w-full md:h-[62vh] md:w-[52%]">
              {EDITIONS.map((e, i) => (
                <article
                  key={e.year}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="absolute inset-0 flex flex-col justify-end pb-10 opacity-0 will-change-transform md:justify-center md:pb-0"
                >
                  <span className="badge-pill mb-4 w-fit">
                    {e.upcoming ? (
                      <>
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: "var(--red-hot)" }}
                        />
                        Upcoming
                      </>
                    ) : (
                      "Past edition"
                    )}
                  </span>

                  <h3 className="font-display text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.88] tracking-[-0.02em] text-white">
                    {e.year}
                  </h3>

                  <span
                    aria-hidden
                    className="mt-6 block h-1 w-24 rounded-full"
                    style={{ background: "var(--grad-red)" }}
                  />

                  {/* Highlighted Event Telemetry Matrix */}
                  <div className="mt-8 flex flex-col gap-3 max-w-[48ch]">
                    {e.date && (
                      <div className="cut-card-red group relative overflow-hidden p-4 backdrop-blur-md">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono-ui text-[11px] font-bold tracking-[0.22em] text-red-hot uppercase flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-hot animate-ping" />
                            Confirmed Event Date
                          </span>
                          <span className="badge-pill border-red-hot/30 bg-red-hot/20 text-[10px] font-bold text-red-hot py-0.5">
                            COLOMBO 2026
                          </span>
                        </div>
                        <p className="mt-2 text-base font-extrabold tracking-tight text-white sm:text-lg">
                          {e.date}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {/* Venue Card */}
                      <div className="cut-card group relative flex flex-col justify-between overflow-hidden p-3.5 backdrop-blur-md">
                        <span className="font-mono-ui text-[10px] font-bold tracking-[0.2em] text-muted uppercase flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-dim group-hover:bg-red-hot transition-colors" />
                          Venue
                        </span>
                        <p className="mt-2 text-sm font-bold leading-snug text-bone group-hover:text-white transition-colors sm:text-base">
                          {e.venue}
                        </p>
                      </div>

                      {/* Crowd Card */}
                      <div className="cut-card group relative flex flex-col justify-between overflow-hidden p-3.5 backdrop-blur-md">
                        <span className="font-mono-ui text-[10px] font-bold tracking-[0.2em] text-muted uppercase flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-dim group-hover:bg-red-hot transition-colors" />
                          {e.upcoming ? "Expected Crowd" : "Recorded Crowd"}
                        </span>
                        <p className="font-display mt-1 text-2xl font-normal leading-none tracking-tight text-white sm:text-3xl">
                          {e.crowd}
                        </p>
                      </div>
                    </div>

                    {e.sponsors && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-hot" />
                          <span className="font-mono-ui text-[10px] font-bold tracking-[0.22em] text-muted uppercase">
                            Official Partners & Sponsors
                          </span>
                        </div>

                        {e.sponsorLogos && e.sponsorLogos.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {e.sponsorLogos.map((logo, idx) => (
                              <div
                                key={idx}
                                className="cut-card group relative flex items-center gap-3 overflow-hidden p-3 backdrop-blur-md"
                              >
                                <div className="cut-shape-xs flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden bg-white p-1 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                  <img
                                    src={logo.src}
                                    alt={logo.alt}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-mono-ui text-[9px] font-bold tracking-wider text-muted uppercase">
                                    {logo.title || "Official Partner"}
                                  </p>
                                  <p className="mt-0.5 truncate text-sm font-extrabold text-white">
                                    {logo.name || logo.alt}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="cut-card p-3.5 backdrop-blur-md">
                            <p className="text-xs font-semibold text-bone-muted">{e.sponsors}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {e.photos ? (
                    <a
                      href={e.photos}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-cursor="link"
                      className="cut-btn-outline pointer-events-auto mt-6 w-fit text-xs hover:shadow-[0_4px_16px_rgba(255,59,47,0.3)]"
                    >
                      <span>VIEW EVENT ARCHIVE</span> <span aria-hidden>↗</span>
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
