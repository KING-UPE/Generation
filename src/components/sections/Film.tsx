"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { mediaPath, mediaSrc, onMediaResolved } from "@/lib/media-cache";
import LitTitle from "@/components/ui/LitTitle";
import RevealText from "@/components/ui/RevealText";
import { smoothScroll } from "@/lib/smooth-scroll";
import { scrollState } from "@/lib/scroll-state";

/* Paths live in MEDIA now — see src/lib/media-cache.ts. */

/**
 * Two speeds, and how much scrolling it takes to change gear.
 *
 * This was a continuous ramp: velocity fed a target, a lerp chased it, and any
 * change past a threshold was written to the element. Measured on a production
 * build, a sustained scroll came out at six writes -- and the halts in playback
 * tracked the number of writes, not the speed. Every write makes the media
 * pipeline resync, and that resync is the stutter. The decoder itself is
 * blameless: it holds 4x at 97-99% of what is asked, with `waiting` never
 * firing at any rate, and frame times stay under 26ms at the 99th percentile
 * through the whole thing.
 *
 * So the rate stops being a curve and becomes a switch. Cruising, or pushed,
 * and nothing in between -- which is two writes across a scroll instead of
 * six. The two thresholds are apart on purpose: one scroll that hovers around
 * a single threshold would change gear repeatedly, which is the fault this is
 * meant to remove.
 *
 * PUSHED is 1.4 rather than the 4.0 it once was. That was fast-forward, not a
 * film running on with you.
 */
const RATE_PUSHED = 1.4;
const PUSH_ON = 0.55;
const PUSH_OFF = 0.25;

/**
 * How hard the scroll is allowed to push, and how fast it may build.
 *
 * Scrolling gently never reaches the top; scrolling continuously -- one push
 * after another without a pause -- pins it there, because the boost each wheel
 * event adds arrives faster than the decay takes it away. Smaller per event
 * and a lower bank, so it takes a sustained scroll to change gear at all.
 */
const BOOST_CEILING = 1.6;
const BOOST_PER_WHEEL = 0.005;
const BOOST_PER_TOUCH = 0.012;

/*
 * Resting playback speed. Slow motion, which is what the section is built
 * around -- scrolling drives it faster, up to the ceilings above.
 *
 * There is no second case any more. The video plays muted and has no control
 * to unmute it, so nothing ever asks for real-time speed.
 */
const RATE_SILENT = 0.7;

/**
 * Where the video is held on its first frame, and where it is allowed to run.
 *
 * These were 0.05 and 0.08, a gap of three hundredths, and the pause branch
 * also rewound to zero every time it ran. On a phone that is a video that
 * stops and starts under your thumb: a touch never leaves the page perfectly
 * still, the scrub carries on easing for most of a second after it, and
 * progress crosses a boundary that narrow again and again -- pausing,
 * rewinding, playing, pausing. The frame ticker made it worse by playing
 * anything paused above 0.05, so the two were fighting inside the gap itself.
 *
 * Far apart now, and the same two numbers answer both, so nothing can want the
 * video playing and paused at once. Wide enough that no amount of settling
 * after a touch can span it.
 */
const HOLD_BELOW = 0.02;
const PLAY_ABOVE = 0.12;

/**
 * How far past the pin the viewer must scroll before the tablet opens itself.
 * Small enough to feel like a nudge, large enough not to fire on arrival.
 */
const OPEN_AFTER = 140;

/**
 * Where the lock lands, taken from the timeline instead of guessed at.
 *
 * `--fp` reaches 0 — the tablet fully open — at 0.82 on a timeline running to
 * about 1.03, so progress 0.796. The old threshold of 0.70 sat before that:
 * once the scroll stopped there the scrub settled on a frame still a couple of
 * per cent inset, so what got held was never quite the full-bleed video. The
 * dwell puts the lock just inside the trailing spacer, which exists for it.
 *
 * Derived at runtime from `tl.duration()` so retuning the timeline cannot
 * quietly leave this pointing at the wrong moment.
 */
const FRAME_OPEN_AT = 0.82;
const LOCK_DWELL = 0.04;

/**
 * Where it folds back into the tablet on the way up. This sits inside the
 * pinned range, not at the section edge — closing at the edge meant the stage
 * was already unsticking, so the fold-back happened off screen. The gap to
 * OPEN_AFTER is the hysteresis that stops scroll settling from oscillating it.
 *
 * The section is 170vh: the pin only has to cover the open threshold plus a
 * little dwell. It was 260vh back when scrolling drove the expansion, which
 * left a screenful of scroll where nothing moved and made getting back up to
 * the fold-back a long trip.
 */
const CLOSE_BEFORE = 50;

/**
 * The closed tablet, as percentages of the stage. A single `--fp` (1 → 0)
 * scales the insets, the bezel and both corner radii together, so the device
 * opens into a full-bleed frame and its corners square off on the same curve.
 *
 * 50%/6% wide by 28%/28% tall lands near 16:10 — a landscape tablet, and a
 * reasonable window onto a 21:9 source.
 */
const FRAME_VARS = {
  "--fp": 1,
  /* The insets come from `.film-stage` in globals.css, which sets them per
     breakpoint: equal left and right below 64rem, so the screen sits in the
     middle of a phone; the 50/6 pair above it, which puts it in the right-hand
     half beside the title. The fallbacks are the phone values. */
  "--ft": "calc(var(--fp) * var(--ft-base))",
  "--fr": "calc(var(--fp) * var(--fr-base))",
  "--fb": "calc(var(--fp) * var(--fb-base))",
  "--fl": "calc(var(--fp) * var(--fl-base))",
  "--bez": "calc(var(--fp) * 13px)",
  /* Square. The rounded pair -- 9px on the screen, 22px on the body -- read as
     a tablet held up to the camera; the closed frame is meant to be a plain
     rectangle. Both still scale with --fp, so there is nothing to unwind as it
     opens. */
  "--srad": "calc(var(--fp) * 0px)",
  "--brad": "calc(var(--fp) * 0px)",
} as React.CSSProperties;

/** The screen itself. */
const SCREEN_CLIP =
  "inset(var(--ft) var(--fr) var(--fb) var(--fl) round var(--srad))";

/** The device body, `out` px outside the screen edge. */
function bezelClip(out: number) {
  const o = `calc(var(--bez) + ${out}px)`;
  return (
    `inset(calc(var(--ft) - ${o}) calc(var(--fr) - ${o}) ` +
    `calc(var(--fb) - ${o}) calc(var(--fl) - ${o}) ` +
    `round calc(var(--brad) + ${out}px))`
  );
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
};

export default function Film() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const video = videoRef.current;
      if (!section || !stage || !video) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      /* `defaultPlaybackRate` as well as the live one: the source arrives from
         the preloader later and `load()` resets playback rate to the default,
         so setting only the live rate here was undone the moment the film got
         its blob. The rate loop used to paper over that by writing a corrected
         rate on the next frame; with that loop off on touch devices, the
         footage would simply have run at 1.0 instead of the slow motion the
         section is built around. */
      video.defaultPlaybackRate = RATE_SILENT;
      video.playbackRate = RATE_SILENT;

      let finished = false;
      let locked = false;
      let scrollBoost = 0;
      let lockSafetyTimer: ReturnType<typeof setTimeout> | undefined;

      /* Which gear the film is in. See RATE_PUSHED. */
      let pushed = false;
      /*
       * Whether scrolling is allowed to drive the playback rate at all.
       *
       * On a mouse it is the good part of this section: push the page and the
       * film runs on with you. On a phone it is the reason the film stops.
       * Every write to `playbackRate` makes the media pipeline resync, and
       * scrolling produces a stream of them -- on iOS the decoder does not
       * absorb that while it is also being asked to keep up, and playback
       * judders and then halts. Capping the rate lower helped and did not fix
       * it, because the cost is in the changing, not in the speed.
       *
       * So a touch device gets one rate, set once, and never written again:
       * the film simply plays, which is all it was ever being asked to do
       * there. Skip is still the way out of it.
       */
      const rateFollowsScroll = !window.matchMedia(
        "(hover: none), (pointer: coarse)",
      ).matches;

      const showEndCard = (on: boolean) => {
        if (endRef.current) {
          gsap.to(endRef.current, {
            opacity: on ? 1 : 0,
            y: on ? 0 : 12,
            duration: on ? 0.7 : 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      };

      const unlock = () => {
        if (lockSafetyTimer) clearTimeout(lockSafetyTimer);
        if (!locked) return;
        locked = false;
        const lenis = smoothScroll.current;
        if (!lenis) return;
        /* Kill an in-flight settle first. Without this it keeps pulling back
           toward the lock point after the viewer has asked to leave, which
           reads as the page refusing to let go. */
        lenis.scrollTo(lenis.animatedScroll, { immediate: true, force: true });
        lenis.start();
      };

      /** Progress at which the frame is open and the hold should begin. */
      const lockProgress = () =>
        Math.min(0.98, FRAME_OPEN_AT / (tl.duration() || 1) + LOCK_DWELL);

      const lock = () => {
        if (reduced || finished || locked) return;
        const lenis = smoothScroll.current;
        if (!lenis) return;
        locked = true;

        /* Settle onto the exact lock point before freezing.
         *
         * `onUpdate` runs once a frame, and a fast flick covers a lot of
         * ground inside one: by the time the threshold is seen the scroll is
         * already past it — on a phone far enough to have come out from under
         * the sticky stage and shown what sits below the video. Stopping there
         * froze that overshoot, so where it locked depended on how hard the
         * swipe was. Easing back to the computed position lands the same frame
         * every time. */
        const st = tl.scrollTrigger;
        const y = st ? st.start + lockProgress() * (st.end - st.start) : null;
        if (y !== null && Math.abs(lenis.animatedScroll - y) > 2) {
          lenis.scrollTo(y, {
            duration: 0.35,
            lock: true,
            force: true,
            onComplete: () => {
              if (locked) lenis.stop();
            },
          });
        } else {
          lenis.stop();
        }

        // Safety fallback: if video is blocked by mobile autoplay restrictions, unlock after 3.5s
        if (lockSafetyTimer) clearTimeout(lockSafetyTimer);
        lockSafetyTimer = setTimeout(() => {
          if (locked && (video.paused || video.readyState < 2)) {
            unlock();
          }
        }, 3500);
      };

      const onTime = () => {
        const d = video.duration || 1;
        if (barRef.current) barRef.current.style.transform = `scaleX(${video.currentTime / d})`;
        if (timeRef.current) timeRef.current.textContent = fmt(video.currentTime) + " / " + fmt(d);
      };

      const onEnded = () => {
        finished = true;
        video.pause();
        unlock();
        showEndCard(true);
      };

      video.addEventListener("timeupdate", onTime);
      video.addEventListener("loadedmetadata", onTime);
      video.addEventListener("ended", onEnded);

      /*
       * A gesture to fall back on where a browser refuses to autoplay.
       *
       * It exists for the case where the element is muted and playsinline and
       * the browser still will not start it on its own. What it must not do is
       * start the film at a moment the page is deliberately holding it still:
       * it asked only whether the section was on screen, so a tap while the
       * tablet was still closed played the video, and the scrub paused it again
       * on the next update. Touch, play, pause, touch, play, pause -- which
       * from the outside is a video that stops and starts when you touch it.
       *
       * It now answers to the same threshold as everything else, so a tap can
       * only ever start a film that was already supposed to be running.
       */
      const tryUserPlay = () => {
        const rect = section.getBoundingClientRect();
        const inSection = rect.bottom > 0 && rect.top < window.innerHeight;
        const running = (tl.scrollTrigger?.progress ?? 0) > PLAY_ABOVE;
        if (inSection && running && !finished && video.paused) {
          video.play().catch(() => {});
        }
      };
      window.addEventListener("touchstart", tryUserPlay, { passive: true });
      window.addEventListener("pointerdown", tryUserPlay, { passive: true });

      /* While locked in view:
         - Scrolling DOWN boosts video playback speed
         - Scrolling UP or hitting Escape unlocks upward navigation
         - Clicking Skip instantly unlocks */
      const onWheel = (e: WheelEvent) => {
        if (locked) {
          if (e.deltaY > 0) {
            scrollBoost = Math.min(BOOST_CEILING, scrollBoost + Math.abs(e.deltaY) * BOOST_PER_WHEEL);
          } else if (e.deltaY < -20) {
            unlock();
          }
        }
      };

      let touchY = 0;
      const onTouchStart = (e: TouchEvent) => {
        touchY = e.touches[0]?.clientY ?? 0;
        tryUserPlay();
      };
      const onTouchMove = (e: TouchEvent) => {
        if (locked) {
          const dy = touchY - (e.touches[0]?.clientY ?? 0);
          if (dy > 0) {
            scrollBoost = Math.min(BOOST_CEILING, scrollBoost + dy * BOOST_PER_TOUCH);
          } else if (dy < -20) {
            unlock();
          }
        }
      };

      const onKey = (e: KeyboardEvent) => {
        if (!locked) return;
        if (["Escape", "ArrowUp", "PageUp", "Home"].includes(e.key)) unlock();
      };

      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("keydown", onKey);

      const onSkip = () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }
        onEnded();
      };
      skipRef.current?.addEventListener("click", onSkip);

      /* Dynamic Video Playback Controller:
         - Plays automatically while in view and not finished
         - When scrolling: accelerates proportional to scroll velocity / wheel boost
         - When scroll stops: smoothly returns to normal average speed and keeps playing!
         - When finished: stays held on the end frame! */
      const tick = () => {
        const rect = section.getBoundingClientRect();
        const inView = rect.bottom > -100 && rect.top < window.innerHeight + 100;

        if (inView && !finished) {
          if (video.paused && tl.scrollTrigger && tl.scrollTrigger.progress > PLAY_ABOVE) {
            void video.play().catch(() => {});
          }

          if (rateFollowsScroll) {
            // Decay manual wheel/touch boost
            scrollBoost *= 0.88;

            // Combine real scroll velocity with active wheel boost
            const vel = Math.abs(scrollState.velocity) + scrollBoost;
            /* Hysteresis: it takes more to start pushing than to keep it. */
            const wants = pushed ? vel > PUSH_OFF : vel > PUSH_ON;
            if (wants !== pushed && !video.paused && video.readyState >= 2) {
              pushed = wants;
              video.playbackRate = pushed ? RATE_PUSHED : RATE_SILENT;
            }
          }
        } else if (!inView) {
          if (!video.paused) {
            video.pause();
          }
        }
      };

      gsap.ticker.add(tick);

      const teardown = () => {
        unlock();
        if (lockSafetyTimer) clearTimeout(lockSafetyTimer);
        gsap.ticker.remove(tick);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchstart", tryUserPlay);
        window.removeEventListener("pointerdown", tryUserPlay);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("keydown", onKey);
        video.removeEventListener("timeupdate", onTime);
        video.removeEventListener("loadedmetadata", onTime);
        video.removeEventListener("ended", onEnded);
        skipRef.current?.removeEventListener("click", onSkip);
      };

      gsap.set(endRef.current, { opacity: 0, y: 12 });

      if (reduced) {
        gsap.set(stage, { "--fp": 0 });
        gsap.set([textRef.current, chromeRef.current], { opacity: 0 });
        gsap.set(uiRef.current, { opacity: 1 });
        return teardown;
      }

      gsap.set(stage, { "--fp": 1 });
      gsap.set(video, { scale: 1.12 });
      gsap.set(uiRef.current, { opacity: 0 });

      /* If the preloaded blob will not decode — an unsupported type, memory
         pressure, a revoked URL — fall back to the plain path once rather
         than leaving the element with a source it cannot play. Losing the
         preload costs a stall; losing this costs the whole video. */
      let usedFallback = false;
      const onSrcError = () => {
        if (usedFallback) return;
        usedFallback = true;
        video.src = mediaPath("film");
        video.load();
      };
      video.addEventListener("error", onSrcError);

      /* Take the preloaded bytes as soon as they exist. No scroll-triggered
         warming any more: the file is already downloaded by the time the page
         is shown, so there is nothing left to fetch on approach. */
      const stopWaiting = onMediaResolved(() => {
        const src = mediaSrc("film");
        if (video.getAttribute("src") !== src) {
          video.src = src;
          video.load();
        }
      });

      // Bidirectional Scrubbed Timeline:
      // In small tablet screen (progress <= 0.05): stays on first frame (currentTime 0)
      // On expansion: plays and accelerates with scroll
      // Always locks downward scroll whenever meeting the video until it totally ends
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          onEnter: () => {
            if (video.currentTime < (video.duration || 1) - 0.5) {
              finished = false;
            }
          },
          onLeaveBack: () => {
            video.pause();
            video.currentTime = 0;
            finished = false;
            showEndCard(false);
            unlock();
          },
          onUpdate: (self) => {
            if (self.progress <= HOLD_BELOW) {
              /* Held on the first frame inside the closed tablet. Both of
                 these are guarded: pausing an already paused element is
                 harmless, but rewinding one that is already at the start is
                 what made a touch look like it restarted the film. */
              if (!video.paused) video.pause();
              if (video.currentTime > 0.05) video.currentTime = 0;
              finished = false;
              showEndCard(false);
              unlock();
            } else if (self.progress > PLAY_ABOVE && !finished && video.paused) {
              void video.play().catch(() => {});
            }

            // Always lock when going down into the full video until it totally ends
            if (self.progress >= lockProgress() && !finished && !locked) {
              lock();
            }
          },
        },
      });

      tl.to(textRef.current, { opacity: 0, y: -50, duration: 0.4, ease: "power2.inOut" }, 0)
        .to(stage, { "--fp": 0, duration: 0.82, ease: "power2.inOut" }, 0)
        .to(video, { scale: 1, duration: 0.82, ease: "power2.inOut" }, 0)
        .to(chromeRef.current, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0.2)
        .to(uiRef.current, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.5)
        .to({}, { duration: 0.18 });

      return () => {
        stopWaiting();
        video.removeEventListener("error", onSrcError);
        tl.kill();
        teardown();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section id="film" ref={sectionRef as React.RefObject<HTMLElement>} className="relative h-[135vh]">
      <div
        ref={stageRef}
        /* Full width, and the frame is inset within it.

           Interpolating the stage from the column to the viewport looked like
           the way to keep the closed frame on the page's measure, but the
           frame's width is a share of the stage while its height is a share of
           the viewport -- so shrinking the stage squashed the rectangle from
           1.60 to about 1.40. The frame's proportions have to come first. */
        className="film-stage sticky top-0 h-[100svh] w-full overflow-hidden"
        style={FRAME_VARS}
      >
        {/* ── the tablet body ─────────────────────────────────── */}
        <div ref={chromeRef} aria-hidden className="absolute inset-0">
          {/* edge highlight, 1px proud of the body, casting the device shadow */}
          <div
            className="absolute inset-0 will-change-[clip-path]"
            style={{
              clipPath: bezelClip(1),
              background: "linear-gradient(150deg, rgba(237,237,240,0.30), rgba(237,237,240,0.06) 42%, rgba(237,237,240,0.16))",
              filter: "drop-shadow(0 42px 80px rgba(0,0,0,0.75))",
            }}
          />
          {/* body */}
          <div
            className="absolute inset-0 will-change-[clip-path]"
            style={{ clipPath: bezelClip(0), background: "#0B0B0E" }}
          />
          {/* camera, centred on the top bezel */}
          <span
            className="absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              top: "calc(var(--ft) - var(--bez) / 2)",
              left: "calc((var(--fl) + 100% - var(--fr)) / 2)",
              background: "radial-gradient(circle, #2A2A31 0%, #111116 70%)",
              boxShadow: "0 0 0 1px rgba(237,237,240,0.10)",
            }}
          />
        </div>

        {/* ── the screen ──────────────────────────────────────── */}
        <div className="absolute inset-0 will-change-[clip-path]" style={{ clipPath: SCREEN_CLIP }}>
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover will-change-transform"

            muted
            autoPlay
            playsInline
            /* No `src` and no preloading here: the preloader fetches this
               file up front and hands over the bytes, so anything set in the
               markup would only start a second download of the same 10MB. */
            preload="none"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/25" />
        </div>

        {/* ── left-hand title block ───────────────────────────── */}
        <div
          ref={textRef}
          /* Top-left on a phone: centring it there leaves the top of the screen
             empty while the device takes the side. Desktop keeps it centred,
             where it balances the tablet across the fold. */
          /* In the column, ranged left, like every other section's copy. The
             right padding keeps it clear of the frame, which occupies the
             column's right 46%. */
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 flex w-full max-w-(--maxw) -translate-x-1/2 flex-col justify-start px-(--gutter) pt-24 lg:justify-center lg:pt-0"
          style={{ paddingRight: "calc(var(--gutter) + var(--text-reserve))" }}
        >
          <div className="badge-pill border-red-hot/40 bg-red-black/50 text-red-hot mb-4 w-fit">
            ✦ OFFICIAL TRAILER // REEL
          </div>

          <LitTitle
            className="text-[clamp(3.5rem,11vw,10rem)] leading-[0.9] tracking-[-0.02em]"
            radius={280}
            weight={1.8}
            start="top 92%"
          >
            After Movie
          </LitTitle>

          <RevealText
            as="p"
            /* Balanced so the line cannot break with a single word stranded
               on its own */
            className="mt-6 max-w-[36ch] text-balance text-lead text-bone"
            start="top 92%"
          >
            One stage. Pure frequency. Relive the night a generation showed up loud.
          </RevealText>
        </div>

        {/* ── end card ────────────────────────────────────────── */}
        <div
          ref={endRef}
          className="pointer-events-none absolute inset-x-0 bottom-[18%] z-20 flex flex-col items-center gap-4"
        >
          <span className="eyebrow text-bone">Scroll to continue</span>
          <span className="block h-10 w-px" style={{ background: "var(--grad-red)" }} />
        </div>

        {/* ── fullscreen furniture ────────────────────────────── */}
        <div
          ref={uiRef}
          className="absolute inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-(--maxw) items-end justify-between gap-5 px-(--gutter) pb-8"
        >
          <span ref={timeRef} className="eyebrow hidden tabular-nums sm:inline">
            00:00 / 00:00
          </span>

          <div className="flex flex-1 items-center px-6">
            <span className="relative h-px w-full overflow-hidden bg-hairline">
              <span
                ref={barRef}
                className="absolute inset-0 origin-left"
                style={{ background: "var(--grad-red)", transform: "scaleX(0)" }}
              />
            </span>
          </div>

          <button
            ref={skipRef}
            type="button"
            data-cursor="link"
            className="cut-btn-outline cursor-pointer px-4 py-1.5 text-xs transition-all duration-300 hover:border-red-hot hover:text-white"
          >
            Skip
          </button>
        </div>
      </div>
    </section>
  );
}
