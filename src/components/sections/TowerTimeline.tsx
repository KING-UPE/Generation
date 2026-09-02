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
    at: 1.6,
    venue: "Maharagama Youth Centre",
    crowd: "2,000+",
  },
  {
    year: "2024",
    at: 4.6,
    venue: "Viharamahadevi Open Air Theatre",
    crowd: "4,500+",
  },
  {
    year: "2025",
    at: 6.9,
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
    at: 8.6,
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
        // Smooth continuous centroid tracking: keeps the tower body centered throughout scroll
        const f = towerCentre(t) / 100;
        const x = ((NARROW_TARGET * w - f * rendered) / (w - rendered)) * 100;
        video.style.objectPosition = `${clamp01(x / 100) * 100}% 50%`;
      };

      const frame = (f: number) => {
        video.style.top = "";
        video.style.height = "100%";

        const scale = FRAME_SCALE + (1 - FRAME_SCALE) * f;
        const shift = FRAME_SHIFT * (1 - f) + INTRO_RISE * intro.v;
        video.style.transform = `translateY(${shift.toFixed(2)}%) scale(${scale.toFixed(4)})`;
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

      gsap.ticker.add(tick);
      frame(0);
      pan(0);
      paint(0);

      return () => {
        st.kill();
        framer.kill();
        gsap.ticker.remove(tick);
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative">
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

      {/* Pulled up over the pinned frame */}
      <div ref={heroRef} className="relative" style={{ marginTop: "-100svh" }}>
        {children}
      </div>

      <section
        id="timeline"
        ref={timelineRef}
        className="relative h-[500svh]"
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-(--maxw) items-center px-(--gutter)">
            <div className="relative mx-auto h-full w-full max-w-[480px] md:mx-0 md:ml-auto md:h-[62vh] md:w-[52%] md:max-w-none">
              {EDITIONS.map((e, i) => (
                <article
                  key={e.year}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="absolute inset-0 flex flex-col justify-end pb-8 opacity-0 will-change-transform sm:pb-10 md:justify-center md:pb-0"
                >
                  <span className="badge-pill mb-2 sm:mb-4 w-fit">
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
                    className="mt-3 sm:mt-6 block h-1 w-20 sm:w-24 rounded-full"
                    style={{ background: "var(--grad-red)" }}
                  />

                  {/* Highlighted Event Telemetry Matrix */}
                  <div className="mt-4 sm:mt-8 flex flex-col gap-2.5 sm:gap-3 max-w-[48ch]">
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
