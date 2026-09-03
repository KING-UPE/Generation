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
 *   ffmpeg -i new.mp4 -an \
 *     -vf "scale=1600:-2,fps=30,colorlevels=rimin=0.028:gimin=0.028:bimin=0.028" \
 *     -c:v libx264 -g 1 -crf 25 -preset slow -pix_fmt yuv420p \
 *     -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
 *     -movflags +faststart Tower.seek.mp4
 *
 * Cut from new.mp4 (1920x1080, 2 keyframes in 300 — unscrubbable as delivered).
 * 1600x900, 4.0MB, 3.4ms median seek.
 *
 * The `colorlevels` pass is not a look, it is a fix, and it must survive any
 * re-encode. The footage is a night sky, and a night sky is not black: the sky
 * measured luma 17-21 where limited-range black is 16, so it rendered 1-6 above
 * zero against a page at #000. The frame is slid sideways to park the tower,
 * which puts its edge in the middle of the screen — and a hard step from 6 to 0
 * at that edge is plainly visible as two different blacks. Crushing the floor
 * so the sky lands on 16 makes the video's background and the page's the same
 * colour, and there is no edge left to see. It also cut a megabyte, because
 * true black costs almost nothing to encode.
 *
 * The colour tags matter for the same reason: the first cut dropped them and
 * left the browser guessing how to expand the range.
 */
const SRC = "/Tower.seek.mp4";

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
const INTRO_RISE = 60;

const NARROW = 768;

/**
 * This footage holds the tower dead centre. Measured off every frame from t=0
 * to t=8.2, the brightness-weighted centroid sits at 49.8-49.9% of frame width
 * and never leaves — a spread of a tenth of a percent.
 *
 * That deletes a whole mechanism. The previous footage craned sideways, so the
 * crop had to be panned frame by frame off a measured table just to hold the
 * tower still, and every error in that table threw it across the screen. Here
 * there is nothing to cancel: the tower is where the frame says it is, and the
 * only reason to move it is that the cards need the space.
 */

/** Where the tower should sit, as a fraction of screen width, while the
 *  editions are reading. Cards are left of it on phones and right of it from
 *  `md` up, so it moves the other way on each. */
const TOWER_PARK_NARROW = 0.78;
const TOWER_PARK_WIDE = 0.28;

/** The placement is a function of video time, not of scroll stage, so it can
 *  never disagree with the footage underneath it. Out by 8.5 matters: past
 *  that the concert fills the frame edge to edge, and an offset frame would
 *  show a black bar where the crowd should be. */
const PARK_IN = [0.8, 2.0] as const;
const PARK_OUT = [7.4, 8.5] as const;

/** Where the tower sequence ends and the concert takes the frame. The lower
 *  band of the image goes from ~2,200 lit pixels to 3,400 at t=8.4 and 10,600
 *  by t=8.8; 8.2 is the last moment that is still unambiguously the tower. */
const SHOW_T = 8.2;

/**
 * Where the last card clears — earlier than SHOW_T, deliberately.
 *
 * Fading 2026 against SHOW_T kept it on screen through the drop to the base,
 * so it was still sitting there while the shot had visibly moved on. Gone by
 * 7.75 leaves a clean beat of nothing but footage between the last card and
 * the stage arriving.
 */
const CARDS_END = 7.75;

/**
 * Scroll position to video time across the editions.
 *
 * The footage does not move at a constant rate, so mapping scroll to it
 * linearly does not either. Measured frame-to-frame difference through this
 * stretch runs 3.5-6 while the labels change, but drops to 0.65-0.9 from
 * t=6.0 to t=7.2: the camera holds for over a second while GENERATION 26 sits
 * still. Linearly that hold cost 450px of scrolling against a frozen picture,
 * which reads as the page having stopped responding to you.
 *
 * These knots spend scroll on what is actually happening. The hold still
 * passes and the 2026 card is still up long enough to read, but it costs a
 * twentieth of the scroll rather than a seventh. The rate either side of it is
 * deliberately equal — 7.4 vs 7.5 seconds of footage per unit of scroll — so
 * the only speed change is through the part where nothing is moving anyway.
 */
const EDITION_MAP: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0.81, 6.0], [0.86, 7.15], [1, SHOW_T],
];

function editionTime(p: number) {
  const k = EDITION_MAP;
  if (p <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (p <= k[i][0]) {
      const [p0, t0] = k[i - 1];
      const [p1, t1] = k[i];
      return t0 + ((t1 - t0) * (p - p0)) / (p1 - p0);
    }
  }
  return k[k.length - 1][1];
}

/** On a phone the frame is cropped to its middle quarter, which is fine for a
 *  vertical tower and useless for a wide stage. Through the reveal the box
 *  eases open; the bars it opens are black on a black page. Wide screens
 *  already match the footage and are left alone. */
const SHOW_FIT = [8.2, 9.0] as const;

/**
 * How much of the screen the stage gets on a phone, as a fraction of viewport
 * height. 1 is full bleed — the stage fills the viewport like every other
 * section, and `object-cover` crops the sides to do it.
 *
 * The trade runs one way: on a phone the only way to show more of the frame's
 * width is to give up height. At 1 the central stage fills the screen and the
 * outer LED screens and the far crowd are cropped away; at 0.37 the whole
 * width is nearly there but the band is a third of the screen. Full bleed is
 * the call here — turn this down if the crop ever costs too much.
 */
const SHOW_BAND = 1;

const FADE = 0.45;

const smoothstep = (v: number) => v * v * (3 - 2 * v);

const EDITIONS = [
  {
    year: "2023",
    at: 1.3,
    venue: "Maharagama Youth Centre",
    crowd: "2,000+",
  },
  {
    year: "2024",
    at: 3.0,
    venue: "Viharamahadevi Open Air Theatre",
    crowd: "4,500+",
  },
  {
    year: "2025",
    at: 4.3,
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
    at: 5.7,
    venue: "Lotus Tower Open Arena",
    crowd: "10,000+",
    date: "Saturday, 12 December 2026",
    upcoming: true,
  },
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function cardAlpha(t: number, i: number) {
  const start = EDITIONS[i].at;
  const next = EDITIONS[i + 1];
  /* Cross-fades straddle the cue rather than meeting at it. Ramping one card
     out over the window *before* its successor's cue, and the successor in
     over the window after, left both at zero at the cue itself — a blink of
     empty frame at every handover. Centred, the outgoing card is at 0.5
     exactly where the incoming one is and the pair sums to 1 throughout.

     The last card has no successor to cross with, so it clears by CARDS_END,
     before the drop to the base rather than during it. */
  const rampIn = clamp01((t - (start - FADE / 2)) / FADE);
  const rampOut = next
    ? clamp01((next.at + FADE / 2 - t) / FADE)
    : clamp01((CARDS_END - t) / FADE);
  return Math.min(rampIn, rampOut);
}

export default function TowerTimeline({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const showRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const video = videoRef.current;
      const timeline = timelineRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!video || !timeline) return;

      video.muted = true;
      video.pause();

      const markReady = () => {
        if (typeof window !== "undefined") {
          (window as any).__TOWER_READY = true;
          window.dispatchEvent(new CustomEvent("tower:ready"));
        }
      };

      if (!video.getAttribute("src")) {
        video.src = SRC;
        video.load();
      }

      if (video.readyState >= 2) {
        markReady();
      } else {
        video.addEventListener("canplay", markReady, { once: true });
        video.addEventListener("loadeddata", markReady, { once: true });
        video.addEventListener("loadedmetadata", markReady, { once: true });
      }

      let target = 0;
      let current = 0;
      let framingTarget = 0;
      const intro = { v: 1 };

      /**
       * How far the frame is offset sideways, as a % of its own width, so the
       * tower stands clear of the cards.
       *
       * This slides the whole element rather than the crop. It can, because
       * everything around the tower in this footage is night sky and the stage
       * behind it is black: the strip the element uncovers is the same colour
       * as the strip it covers, so there is no seam to see. That also makes it
       * a compositor-only transform, where panning the crop was a repaint of
       * the video layer every frame.
       *
       * Off by PARK_OUT, because from t=8.5 the concert reaches both edges and
       * an offset frame would show black where the crowd is.
       */
      const offset = (t: number) => {
        const stage = video.parentElement;
        const wide = !stage || stage.clientWidth >= NARROW;
        const park = wide ? TOWER_PARK_WIDE : TOWER_PARK_NARROW;
        const inP = smoothstep(clamp01((t - PARK_IN[0]) / (PARK_IN[1] - PARK_IN[0])));
        const outP = smoothstep(clamp01((t - PARK_OUT[0]) / (PARK_OUT[1] - PARK_OUT[0])));
        return (park - 0.5) * 100 * (inP - outP);
      };

      /**
       * Narrow screens crop this 16:9 frame to their middle quarter. A tower is
       * vertical and survives that; a stage is not. Through the reveal the box
       * eases down to the footage's own aspect, at which point `object-cover`
       * has nothing left to crop and the full width is on screen.
       *
       * Height, not transform: `object-fit` resolves against the layout box, so
       * scaling the element magnifies the crop it already made instead of
       * widening it. Absolutely positioned, so nothing else reflows.
       */
      let lastH = -1;
      const fit = (t: number) => {
        const stage = video.parentElement;
        if (!stage) return;
        const sw = stage.clientWidth;
        const sh = stage.clientHeight;
        if (!sw || !sh) return;

        const full = sw >= NARROW ? 0 : smoothstep(
          clamp01((t - SHOW_FIT[0]) / (SHOW_FIT[1] - SHOW_FIT[0])),
        );
        /* Never tighter than the frame's own aspect — that is the point at
           which `object-cover` has nothing left to crop — and never taller
           than the stage itself. Between those, SHOW_BAND decides. So a wide
           phone opens to the full frame and a tall one trades a little width
           for a stage worth looking at. */
        const frameH = (sw * (video.videoHeight || 900)) / (video.videoWidth || 1600);
        const band = Math.min(Math.max(frameH, sh * SHOW_BAND), sh);
        const h = sh + (band - sh) * full;
        if (lastH >= 0 && Math.abs(h - lastH) < 0.5) return;
        lastH = h;
        video.style.height = `${h.toFixed(1)}px`;
        video.style.top = `${((sh - h) / 2).toFixed(1)}px`;
      };

      let lastShift = NaN;
      let lastScale = NaN;
      let lastAlpha = NaN;
      let lastX = NaN;

      const frame = (f: number, x: number) => {
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

        if (
          shift === lastShift && scale === lastScale &&
          alpha === lastAlpha && x === lastX
        ) return;
        lastShift = shift;
        lastScale = scale;
        lastAlpha = alpha;
        lastX = x;
        video.style.transform =
          `translate(${x.toFixed(2)}%, ${shift.toFixed(2)}%) scale(${scale.toFixed(4)})`;
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

      /* Two sections share one strip of footage, and they must agree at the
         seam or the frame jumps as the second takes over: the editions run to
         SHOW_T, the showcase starts there.
         We clamp target strictly below duration to prevent EOF 'ended' events
         which cause mobile browsers to snap the video back to frame 0 (the top). */
      const dur = () => video.duration || 10;
      const safeMax = () => Math.min(dur() - 0.15, 9.85);

      let inShowcaseMode = false;

      const setEditions = (p: number) => {
        if (inShowcaseMode) return;
        target = Math.max(0, Math.min(SHOW_T, editionTime(p)));
      };

      const setShowcase = (p: number) => {
        if (p > 0.01) {
          inShowcaseMode = true;
          target = SHOW_T + p * (safeMax() - SHOW_T);
        } else {
          inShowcaseMode = false;
        }
      };

      const st = ScrollTrigger.create({
        trigger: timeline,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setEditions(self.progress),
      });

      const shower = ScrollTrigger.create({
        trigger: showRef.current ?? timeline,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setShowcase(self.progress),
        onLeaveBack: () => {
          inShowcaseMode = false;
          target = SHOW_T;
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

      /**
       * The frame fades as it leaves, rather than simply scrolling away.
       *
       * Its sticky box is a viewport tall and sits at the end of this section,
       * so it spends a full screen of scrolling travelling upward — and Vision
       * is scrolling in underneath it for that whole stretch. Measured at
       * 1280x800 the two were both on screen from 4720 to 5520: nearly 700px
       * with the tower still behind the Vision title. The scrub is finished by
       * then, so there is nothing left to see in it.
       *
       * Runs from where the showcase releases to where the section ends, which
       * is exactly the span it is drifting through.
       */
      const exit = gsap.to(stageRef.current ?? video, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current ?? timeline,
          start: "bottom bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        intro.v = 0;
        /* No lerp: jump straight to the frame the scroll position implies. */
        const snap = () => {
          if (Number.isFinite(video.duration)) video.currentTime = target;
          frame(framingTarget, offset(target));
          fit(target);
          paint(target);
        };
        st.vars.onUpdate = (self: { progress: number }) => {
          setEditions(self.progress);
          snap();
        };
        shower.vars.onUpdate = (self: { progress: number }) => {
          setShowcase(self.progress);
          snap();
        };
        framer.vars.onUpdate = (self: { progress: number }) => {
          framingTarget = self.progress;
          snap();
        };
        snap();
        return () => {
          st.kill();
          shower.kill();
          framer.kill();
          exit.scrollTrigger?.kill();
          exit.kill();
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

      // Mobile touch-gesture video unlock
      const unlockTowerVideo = () => {
        if (video.paused && target >= SHOW_T - 0.2) {
          video.play().catch(() => {});
        }
      };
      window.addEventListener("touchstart", unlockTowerVideo, { passive: true });
      window.addEventListener("pointerdown", unlockTowerVideo, { passive: true });

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

        const maxT = safeMax();
        const targetClamped = Math.max(0, Math.min(maxT, target));

        // When in the musical show section at the bottom of the tower:
        // Play the concert footage through to the end and hold on the final frame (no repeated looping)
        const isShowSection = targetClamped >= SHOW_T - 0.15;

        if (isShowSection) {
          if (video.currentTime >= maxT) {
            if (!video.paused) video.pause();
            current = maxT;
          } else {
            if (video.paused) {
              video.play().catch(() => {});
            }
            current = Math.min(maxT, video.currentTime);
          }
        } else {
          // In the tower timeline: pause and scrub smoothly
          if (!video.paused) {
            video.pause();
          }

          current += (targetClamped - current) * (1 - Math.pow(1 - SEEK_LERP, dt * 60));

          /* Exponential decay closes on the target without ever reaching it, so
             the tower keeps inching for as long as you look at it. Inside half a
             frame of footage there is nothing left to render: land on it. */
          if (Math.abs(targetClamped - current) < 1 / 120) current = targetClamped;

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
            video.currentTime = Math.max(0, Math.min(maxT, current));
          }
        }

        frame(framingTarget, offset(current));
        fit(current);
        paint(current);
      };

      const startIntro = () => {
        gsap.to(intro, {
          v: 0,
          duration: 2.0,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      // Start the rise as soon as the preloader begins lifting
      window.addEventListener("preloader:opening", startIntro, { once: true });
      window.addEventListener("preloader:complete", startIntro, { once: true });

      gsap.ticker.add(tick);
      frame(0, offset(0));
      fit(0);
      paint(0);

      return () => {
        window.removeEventListener("preloader:opening", startIntro);
        window.removeEventListener("preloader:complete", startIntro);
        window.removeEventListener("touchstart", unlockTowerVideo);
        window.removeEventListener("pointerdown", unlockTowerVideo);
        st.kill();
        shower.kill();
        framer.kill();
        exit.scrollTrigger?.kill();
        exit.kill();
        video.removeEventListener("seeked", onSeeked);
        gsap.ticker.remove(tick);
      };
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={stageRef}
        className="pointer-events-none sticky top-0 z-[-1] h-[100svh] overflow-hidden bg-black"
      >
        <video
          ref={videoRef}
          src={SRC}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `translateY(${FRAME_SHIFT + INTRO_RISE}%) scale(${FRAME_SCALE})`,
            opacity: 0,
          }}
          muted
          autoPlay
          playsInline
          preload="auto"
          aria-hidden
        />
      </div>

      {/* Pulled up over the pinned frame: 20vh scroll runway for swift, responsive stage expansion */}
      <div
        ref={heroRef}
        className="relative"
        style={{ marginTop: "-100svh", height: "20vh" }}
      >
        <div className="h-[100svh] w-full overflow-hidden">{children}</div>
      </div>

      <section
        id="timeline"
        ref={timelineRef}
        className="relative h-[480svh]"
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-(--maxw) items-center px-(--gutter)">
            <div className="relative mr-auto h-full w-full max-w-[280px] sm:max-w-[340px] md:mx-0 md:ml-auto md:h-[62vh] md:w-[52%] md:max-w-[460px]">
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

      {/* The stage. Same pinned frame, same strip of footage — it just carries
          on past where the editions stop, so the camera reaching the base and
          the section changing are one movement rather than two.

          Deliberately empty. This section is scroll runway and nothing else:
          it exists so the trigger above has a range to map t=SHOW_T..duration
          onto, and the footage plays over it with no overlay at all.

          Pulled up by one viewport so it takes over exactly as the editions
          release — a sticky child lets go a viewport before its section ends,
          and without this there was a full screen of scrolling between the
          last card leaving and the stage arriving, footage frozen throughout. */}
      <section
        id="showcase"
        ref={showRef}
        className="relative h-[240svh]"
        style={{ marginTop: "-100svh" }}
      />
    </div>
  );
}
