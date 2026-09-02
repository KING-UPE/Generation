"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import LitTitle from "@/components/ui/LitTitle";
import RevealText from "@/components/ui/RevealText";
import { smoothScroll } from "@/lib/smooth-scroll";

const SRC = "/Video.mp4";

/** Slow-motion feel while silent; real speed if the viewer turns sound on. */
const RATE_SILENT = 0.7;
const RATE_SOUND = 1;

/**
 * How far past the pin the viewer must scroll before the tablet opens itself.
 * Small enough to feel like a nudge, large enough not to fire on arrival.
 */
const OPEN_AFTER = 140;

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
  "--ft": "calc(var(--fp) * 28%)",
  "--fr": "calc(var(--fp) * 6%)",
  "--fb": "calc(var(--fp) * 28%)",
  "--fl": "calc(var(--fp) * 50%)",
  "--bez": "calc(var(--fp) * 13px)",
  "--srad": "calc(var(--fp) * 9px)",
  "--brad": "calc(var(--fp) * 22px)",
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
  const soundRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const video = videoRef.current;
      if (!section || !stage || !video) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      video.muted = true;
      video.playbackRate = RATE_SILENT;

      /* Once it has run to the end it stays ended: scrolling back into the
         open frame must not silently restart it. Only rewinding to the closed
         tablet clears this. */
      let finished = false;

      /**
       * The page is held still while the film runs and released when it ends —
       * which is what the "Scroll to continue" card is announcing.
       *
       * Three things can always let a reader out: scrolling up, Escape, and the
       * Skip control. A watchdog releases the lock if playback never actually
       * starts, so a stalled download can never strand anyone.
       */
      let locked = false;
      let watchdog = 0;

      const unlock = () => {
        window.clearTimeout(watchdog);
        if (!locked) return;
        locked = false;
        smoothScroll.current?.start();
      };

      const lock = () => {
        /* No Lenis means reduced-motion: never freeze the page for that reader. */
        const lenis = smoothScroll.current;
        if (!lenis || locked) return;
        locked = true;
        lenis.stop();

        const startedAt = video.currentTime;
        window.clearTimeout(watchdog);
        watchdog = window.setTimeout(() => {
          if (video.paused || video.currentTime === startedAt) unlock();
        }, 4000);
      };

      const showEndCard = (on: boolean) =>
        gsap.to(endRef.current, {
          opacity: on ? 1 : 0,
          y: on ? 0 : 12,
          duration: on ? 0.7 : 0.25,
          ease: "gen",
          overwrite: "auto",
        });

      const onEnded = () => {
        finished = true;
        video.pause();
        unlock();
        showEndCard(true);
      };
      const onPlaying = () => showEndCard(false);

      const onTime = () => {
        const d = video.duration || 1;
        if (barRef.current) barRef.current.style.transform = `scaleX(${video.currentTime / d})`;
        if (timeRef.current) timeRef.current.textContent = fmt(video.currentTime) + " / " + fmt(d);
      };

      /* Scrolling up, Escape, or a media failure all release the hold. */
      const onWheel = (e: WheelEvent) => {
        if (locked && e.deltaY < 0) unlock();
      };
      let touchY = 0;
      const onTouchStart = (e: TouchEvent) => {
        touchY = e.touches[0]?.clientY ?? 0;
      };
      const onTouchMove = (e: TouchEvent) => {
        if (locked && (e.touches[0]?.clientY ?? 0) - touchY > 14) unlock();
      };
      const onKey = (e: KeyboardEvent) => {
        if (!locked) return;
        if (["Escape", "ArrowUp", "PageUp", "Home"].includes(e.key)) unlock();
      };

      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("keydown", onKey);

      video.addEventListener("error", unlock);
      video.addEventListener("stalled", unlock);
      video.addEventListener("ended", onEnded);
      video.addEventListener("playing", onPlaying);
      video.addEventListener("timeupdate", onTime);
      video.addEventListener("loadedmetadata", onTime);

      const onSound = () => {
        video.muted = !video.muted;
        video.playbackRate = video.muted ? RATE_SILENT : RATE_SOUND;
        if (soundRef.current) {
          soundRef.current.textContent = video.muted ? "Sound off" : "Sound on";
          soundRef.current.setAttribute("aria-pressed", String(!video.muted));
        }
      };
      soundRef.current?.addEventListener("click", onSound);

      const onSkip = () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }
        onEnded();
      };
      skipRef.current?.addEventListener("click", onSkip);

      /* Leaving the section entirely always parks it. */
      const visibility = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onLeave: () => video.pause(),
        onLeaveBack: () => video.pause(),
      });

      const teardown = () => {
        unlock();
        visibility.kill();
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("keydown", onKey);
        video.removeEventListener("error", unlock);
        video.removeEventListener("stalled", unlock);
        skipRef.current?.removeEventListener("click", onSkip);
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("timeupdate", onTime);
        video.removeEventListener("loadedmetadata", onTime);
        soundRef.current?.removeEventListener("click", onSound);
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

      /* The open runs on its own clock, not on the scrollbar: a nudge past the
         pin starts it and it carries itself to fullscreen. */
      const open = gsap.timeline({ paused: true });

      open
        /* the title clears out first */
        .to(textRef.current, { opacity: 0, y: -70, duration: 0.4, ease: "power2.in" }, 0)
        /* then the device opens out and the framing settles */
        .to(stage, { "--fp": 0, duration: 1.0, ease: "power3.inOut" }, 0.06)
        .to(video, { scale: 1, duration: 1.0, ease: "power3.inOut" }, 0.06)
        /* the tablet body has nothing left to frame */
        .to(chromeRef.current, { opacity: 0, duration: 0.34, ease: "power2.out" }, 0.74)
        .to(uiRef.current, { opacity: 1, duration: 0.34 }, 0.98);

      const opener = ScrollTrigger.create({
        trigger: section,
        start: `top+=${OPEN_AFTER} top`,
        end: "bottom bottom",
        onEnter: () => {
          open.play();
          if (!finished) {
            void video.play().catch(() => {});
            lock();
          }
        },
      });

      /**
       * Closing deliberately uses a different line from opening. Reversing at
       * the same +140 mark let the scroll settling either side of it toggle the
       * timeline, which stranded the tablet half-open.
       */
      const closer = ScrollTrigger.create({
        trigger: section,
        start: `top+=${CLOSE_BEFORE} top`,
        end: "bottom bottom",
        onLeaveBack: () => {
          unlock();
          open.reverse();
          video.pause();
          video.currentTime = 0;
          finished = false;
          showEndCard(false);
        },
      });

      return () => {
        opener.kill();
        closer.kill();
        teardown();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section id="film" ref={sectionRef as React.RefObject<HTMLElement>} className="relative h-[170vh]">
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
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
            src={SRC}
            muted
            playsInline
            preload="metadata"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/25" />
        </div>

        {/* ── left-hand title block ───────────────────────────── */}
        <div
          ref={textRef}
          /* Top-left on a phone: centring it there leaves the top of the screen
             empty while the device takes the side. Desktop keeps it centred,
             where it balances the tablet across the fold. */
          className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full max-w-(--maxw) flex-col justify-start px-(--gutter) pt-24 lg:w-[52%] lg:justify-center lg:pt-0"
        >
          <RevealText as="p" className="eyebrow mb-5" start="top 92%">
            06 — Film
          </RevealText>

          <LitTitle
            className="text-[clamp(3.5rem,11vw,10rem)] leading-[0.9] tracking-[-0.02em]"
            radius={280}
            weight={1.8}
            start="top 92%"
          >
            Film
          </LitTitle>

          <RevealText
            as="p"
            className="mt-7 max-w-[34ch] text-[clamp(0.95rem,1.05vw,1.05rem)] leading-[1.9] text-muted"
            start="top 92%"
          >
            Keep scrolling. The frame opens.
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
            className="eyebrow tap-target cursor-pointer border-b border-hairline pb-1 transition-colors duration-500 hover:border-red-hot hover:text-red-hot"
          >
            Skip
          </button>

          <button
            ref={soundRef}
            type="button"
            data-cursor="link"
            aria-pressed="false"
            className="eyebrow tap-target cursor-pointer border-b border-hairline pb-1 transition-colors duration-500 hover:border-red-hot hover:text-red-hot"
          >
            Sound off
          </button>
        </div>
      </div>
    </section>
  );
}
