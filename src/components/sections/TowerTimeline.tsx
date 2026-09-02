"use client";

import { useRef, useEffect } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { useTimelineConfig } from "@/context/TimelineTunerContext";

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
 * How fast the scrubbed video time chases the scroll, per 60Hz frame.
 *
 * This is deliberately the *only* smoothing left in the hero-to-timeline
 * transition. The frame's scale and offset are locked straight to the scroll
 * position instead: Lenis already eases that position, so easing it a second
 * time does not add smoothness, it adds lag — the frame carried on opening out
 * for roughly half a second after the page itself had stopped, which is what
 * read as the tower drifting on until it eventually settled.
 *
 * Video time is the one thing that still earns a lerp, for an unrelated
 * reason: the decoder cannot service a seek every frame, so the time it is
 * asked for has to be something it can actually follow.
 */
const SEEK_LERP = 0.22;

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
 *
 * `pan` subtracts this from the crop to hold the tower still, so an error here
 * does not blur the motion — it moves the tower the wrong way. Every value is
 * sampled off the footage — 0.1s apart where it accelerates, since the reading
 * between knots is a straight line and this stretch is the one that curves. Do
 * not interpolate the middle by hand. The tower holds dead centre until about
 * t=1.35 and only then goes, quickly. Guessing a straight ramp from t=1.0
 * instead put the reading 3.6% left of the truth at t=1.7, and that alone threw
 * the tower 57px to the right and back again — the crop panned away while the
 * tower stood still, and snapped back when the real motion caught up. Even at
 * 0.2s spacing the corner at t=1.75 was still worth 12px of that.
 *
 * Re-measure the same way after any change to the footage: draw each frame to
 * a canvas, take the brightness-weighted mean column over pixels above ~12%
 * luminance, and read it as a % of frame width.
 */
const TOWER_TRACK: ReadonlyArray<readonly [number, number]> = [
  [0, 49.7], [1.0, 49.8], [1.2, 49.8], [1.3, 49.7], [1.4, 49.3], [1.5, 48.4],
  [1.6, 47.2], [1.7, 45.7], [1.8, 43.3], [1.9, 41.2], [2.0, 38.1], [2.1, 36.3],
  [2.2, 34.3], [2.3, 31.9], [2.4, 30.5], [2.6, 28.1], [2.8, 26.7], [3.0, 26.0],
  [3.2, 25.9], [10, 26.0],
];

const NARROW = 768;

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

const EDITIONS_BASE = [
  {
    year: "2023",
    venue: "Maharagama Youth Centre",
    crowd: "2,000+",
  },
  {
    year: "2024",
    venue: "Viharamahadevi Open Air Theatre",
    crowd: "4,500+",
  },
  {
    year: "2025",
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
    venue: "Lotus Tower Open Arena",
    crowd: "10,000+",
    date: "Saturday, 12 December 2026",
    upcoming: true,
  },
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function TowerTimeline({ children }: { children: React.ReactNode }) {
  const { config } = useTimelineConfig();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const configRef = useRef(config);
  configRef.current = config;

  const editions = [
    { ...EDITIONS_BASE[0], at: config.edition2023 },
    { ...EDITIONS_BASE[1], at: config.edition2024 },
    { ...EDITIONS_BASE[2], at: config.edition2025 },
    { ...EDITIONS_BASE[3], at: config.edition2026 },
  ];

  function cardAlpha(t: number, i: number) {
    const start = editions[i].at;
    const next = editions[i + 1];
    const fade = configRef.current.fadeDuration;
    const rampIn = clamp01((t - start) / fade);
    const rampOut = next ? clamp01((next.at - t) / fade) : 1;
    return Math.min(rampIn, rampOut);
  }

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [config.heroRunway, config.timelineHeight]);

  useGSAP(
    () => {
      const video = videoRef.current;
      const timeline = timelineRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!video || !timeline) return;

      video.muted = true;
      video.pause();

      if (!video.getAttribute("src")) {
        video.src = SRC;
        video.load();
      }

      let target = 0;
      let current = 0;
      let framingTarget = 0;
      const intro = { v: 1 };

      let lastPan = -1;
      const pan = (t: number) => {
        const w = video.clientWidth;
        const h = video.clientHeight;
        const stage = video.parentElement;
        if (!stage || !w || !h || stage.clientWidth >= NARROW) {
          if (lastPan !== -1) {
            lastPan = -1;
            video.style.objectPosition = "";
          }
          return;
        }
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const rendered = vw * Math.max(w / vw, h / vh);
        if (rendered <= w) {
          if (lastPan !== -1) {
            lastPan = -1;
            video.style.objectPosition = "";
          }
          return;
        }
        // Lock directly to narrowTarget (right side) so the tower never swings to the left
        const targetScreen = configRef.current.narrowTarget;

        const f = towerCentre(t) / 100;
        const x = clamp01(((targetScreen * w - f * rendered) / (w - rendered))) * 100;
        const travel = Math.abs(w - rendered);
        const minDelta = travel > 0 ? (0.5 / travel) * 100 : 0.05;
        if (lastPan < 0 || Math.abs(x - lastPan) >= minDelta) {
          lastPan = x;
          video.style.objectPosition = `${x.toFixed(3)}% 50%`;
        }
      };

      let lastShift = NaN;
      let lastScale = NaN;
      let lastAlpha = NaN;

      const frame = (f: number) => {
        /* Smoothstep, not the raw scroll fraction. Mapped linearly the frame
           starts opening the instant the hero moves and stops dead the moment
           it ends — both boundaries read as a jolt. This eases in and out of
           rest while staying exactly scroll-locked in between.

           The easing lives here, in the mapping from scroll to framing, rather
           than in a lerp that chases it over time. Same softness at both ends,
           but it arrives when the scroll arrives instead of trailing it. */
        const e = f * f * (3 - 2 * f);

        const scale = FRAME_SCALE + (1 - FRAME_SCALE) * e;
        /* The entrance rise is folded into the hero's own offset rather than
           added on top of it. Added on top, it survived `e` reaching 1: flick
           from the hero into the timeline inside the two seconds the entrance
           takes and the footage arrived displaced by up to a whole INTRO_RISE
           — 40% of the viewport — then slid up into place on its own while the
           timeline was already running. Folded in, it is gone the moment the
           hero is, however early that happens. */
        const shift = (FRAME_SHIFT + INTRO_RISE * intro.v) * (1 - e);
        const alpha = clamp01((1 - intro.v) / 0.5);

        if (shift === lastShift && scale === lastScale && alpha === lastAlpha) return;
        lastShift = shift;
        lastScale = scale;
        lastAlpha = alpha;
        video.style.transform = `translateY(${shift.toFixed(2)}%) scale(${scale.toFixed(4)})`;
        video.style.opacity = String(alpha);
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

      /**
       * Only ever one seek in flight.
       *
       * Setting `currentTime` every frame queues seeks faster than the decoder
       * can service them. The backlog does not play out in order — frames
       * arrive late and out of sequence, which is why the tower jumped between
       * the crown and the shaft instead of scrubbing. Waiting for `seeked`
       * before issuing the next one means the decoder is always working on the
       * most recent scroll position and never falls behind.
       */
      let seekBusy = false;
      let seekIssuedAt = 0;
      const onSeeked = () => { seekBusy = false; };
      video.addEventListener("seeked", onSeeked);

      let lastTick = performance.now();

      const tick = () => {
        const now = performance.now();

        /* Per second, not per frame. A flat per-frame factor decays twice as
           fast on a 120Hz phone as on a 60Hz one, so the identical scroll
           settles at two different speeds on two different devices. Long
           frames — a tab coming back to the foreground — are clamped so the
           scrub cannot leap on the first tick back. */
        const dt = Math.min((now - lastTick) / 1000, 0.05);
        lastTick = now;

        current += (target - current) * (1 - Math.pow(1 - SEEK_LERP, dt * 60));

        /* Exponential decay closes on the target without ever reaching it, so
           the tower keeps inching for as long as you look at it. Inside half a
           frame of footage there is nothing left to render: land on it. */
        if (Math.abs(target - current) < 1 / 120) current = target;

        /* If `seeked` never arrives — coalesced, dropped, or the element is in
           a state that will not fire it — the guard must not latch forever, or
           the video freezes for good. After 180ms assume it is not coming. */
        const stalled = seekBusy && now - seekIssuedAt > 180;

        if (
          (!seekBusy || stalled) &&
          Number.isFinite(video.duration) &&
          Math.abs(current - video.currentTime) > 1 / 60
        ) {
          seekBusy = true;
          seekIssuedAt = now;
          video.currentTime = current;
        }

        frame(framingTarget);
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
        video.removeEventListener("seeked", onSeeked);
        gsap.ticker.remove(tick);
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative">
      <div className="pointer-events-none sticky top-0 z-[-1] h-[100svh] overflow-hidden bg-black">
        {/* No `src` here on purpose: the effect picks the phone-sized or the
            full-sized build from the viewport width. Hard-coding it would
            either ship 1600x900 to phones or disagree with the server. */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `translateY(${FRAME_SHIFT + INTRO_RISE}%) scale(${FRAME_SCALE})`,
            opacity: 0,
          }}
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
      </div>

      {/* Pulled up over the pinned frame: dynamic scroll runway for stage expansion */}
      <div
        ref={heroRef}
        className="relative"
        style={{ marginTop: "-100svh", height: `${config.heroRunway}vh` }}
      >
        <div className="h-[100svh] w-full overflow-hidden">{children}</div>
      </div>

      <section
        id="timeline"
        ref={timelineRef}
        className="relative"
        style={{ height: `${config.timelineHeight}svh` }}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-(--maxw) items-center px-(--gutter)">
            <div className="relative mr-auto h-full w-full max-w-[280px] sm:max-w-[340px] md:mx-0 md:ml-auto md:h-[62vh] md:w-[52%] md:max-w-[460px]">
              {editions.map((e, i) => (
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
                  <div className="mt-4 sm:mt-8 flex flex-col gap-2.5 sm:gap-3 max-w-[280px] sm:max-w-[340px] md:max-w-[460px]">
                    {e.date && (
                      <div className="cut-card-red group relative overflow-hidden p-4 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-ui text-[11px] font-bold tracking-[0.22em] text-red-hot uppercase flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-hot animate-ping" />
                            Confirmed Event Date
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
