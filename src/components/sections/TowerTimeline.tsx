"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { END_T } from "@/lib/lotus-tower/path";
import type { LotusTower } from "@/lib/lotus-tower";
import { TICKET_URL, bookHref } from "@/lib/event";

/**
 * The tower is a scene now, not footage.
 *
 * This section used to scrub a 12.5MB all-intra encode of a drone descent —
 * 1197 keyframes, so every scroll position had a frame to seek to, and a
 * canvas cross-fade on top so slow scrolling did not step. All of that existed
 * to make a video behave like something you could hold at any instant. The
 * tower is now built in code (src/lib/lotus-tower) and drawn for whatever
 * instant the scroll asks for, so there is nothing to download, decode or
 * seek: the picture is exact at every scroll speed.
 *
 * The footage's clock survived the change. Every time constant below is still
 * in its seconds (0..END_T), and the scene's camera path is written against
 * the same clock — so the cards, the park and the concert hand-off all land
 * where they always did.
 */

/**
 * How the camera follows the scroll: a critically damped spring, stiffness in
 * radians per second.
 *
 * This replaced an exponential chase, and the difference is the start. A
 * chase moves fastest the instant the target moves — a jolt on every wheel
 * notch, and the drop leaving the bud like a dropped stone. A spring carries
 * velocity, so the camera eases out of rest, glides, and eases into the next
 * rest: one continuous, liquid move whatever the scroll does. Critically
 * damped, so it never overshoots and swings back.
 *
 * At 6.5 it is ~90% of the way in 0.6s. The framing is not on it: that stays
 * locked to the scroll, which Lenis already eases.
 */
const SPRING = 6.5;

/**
 * How tall the editions section is, in svh — how much scroll the descent is
 * stretched across.
 *
 * With footage this was the lever against the scrub turning into a slideshow
 * at reading pace. The scene has no frames to run out of, so that pressure is
 * gone. 340 is the old 300 — the dwell the cards were tuned to — plus room for
 * the descent from the bud, which is scrolled now rather than played. The cue
 * times are all in timeline seconds, so they follow any change here.
 */
const EDITIONS_RUNWAY = 340;

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

/** Where the tower should sit, as a fraction of screen width, while the
 *  editions are reading. Cards are left of it on phones and right of it from
 *  `md` up, so it moves the other way on each. */
const TOWER_PARK_NARROW = 0.78;
const TOWER_PARK_WIDE = 0.28;

/** The placement is a function of timeline time, not of scroll stage, so it
 *  can never disagree with the camera. Out before the stage arrives: the
 *  concert is framed square on, edge to edge. */
const PARK_IN = [1.6, 4.0] as const;
const PARK_OUT = [14.8, 17.0] as const;

/** Where the tower sequence ends and the concert takes the frame — the camera
 *  has reached the foot of the shaft and starts pulling back over the crowd. */
const SHOW_T = 16.4;

/**
 * Where the last card clears — earlier than SHOW_T, deliberately.
 *
 * Fading 2026 against SHOW_T kept it on screen through the drop to the base,
 * so it was still sitting there while the shot had visibly moved on. Gone by
 * 15.5 leaves a clean beat of nothing but the tower between the last card and
 * the stage arriving.
 */
const CARDS_END = 15.5;

/**
 * Scroll position to timeline time across the editions.
 *
 * Not linear, inherited from the footage: from 12.0 to 14.3 its camera held
 * still on GENERATION 26, and spending scroll on a frozen picture read as the
 * page not responding — so that stretch costs a twentieth of the scroll. The
 * camera path (lotus-tower/path.ts) keeps the hold, barely moving between
 * those two knots, so the fast stretch of scroll is still a quiet one on
 * screen.
 */
/**
 * Where the descent from the bud reaches the lettering.
 *
 * This used to be a played shot: the hero left, the page locked, and a spring
 * dropped the camera here in under a second. With footage that was the only
 * way to stop the move becoming a slideshow at reading pace. A scene has no
 * frames to run short of, so it is scrolled now — over the first sixth of the
 * section, through the camera path's own ease — which makes it exactly as
 * smooth and as slow as the reader wants, and reversible, and nothing ever
 * takes the scroll away from them.
 */
const INTRO_END = 4.2;

const EDITION_MAP: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0.16, INTRO_END], [0.82, 12.0], [0.87, 14.3], [1, SHOW_T],
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

/** Cross-fade between edition cards, in timeline seconds. */
const FADE = 0.9;

const smoothstep = (v: number) => v * v * (3 - 2 * v);

const EDITIONS = [
  {
    year: "2023",
    /* Its own cue on the timeline, deliberately short of INTRO_END: the card
       arrives while the camera is still coming down to its lettering, so the
       two land together. */
    at: 2.6,
    venue: "Maharagama Youth Centre",
    crowd: "2,000+",
  },
  {
    year: "2024",
    at: 6.0,
    venue: "Viharamahadevi Open Air Theatre",
    crowd: "4,500+",
  },
  {
    year: "2025",
    at: 8.6,
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
        src: "/img/sponsors/yfm.webp",
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
    at: 11.4,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const showRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      const timeline = timelineRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!canvas || !timeline) return;

      let target = 0;
      let current = 0;
      /* The spring's velocity, in timeline seconds per second. */
      let vel = 0;
      let framingTarget = 0;
      const intro = { v: 1 };

      /* The scene arrives asynchronously — three.js is its own chunk, fetched
         once the page is up — so everything below drives it through this and
         simply skips while it is still null. */
      let scene: LotusTower | null = null;
      let disposed = false;

      /**
       * How far the picture is offset sideways, as a % of its width, so the
       * tower stands clear of the cards.
       *
       * Applied in the lens rather than by sliding an element. With footage the
       * slide was free because the sky either side was black; a scene has
       * beams and haze reaching the frame edge, and moving the element would
       * have shown where it stops. Shifting the projection moves the picture
       * and nothing else.
       *
       * Off by PARK_OUT, because the stage fills the frame edge to edge.
       */
      const offset = (t: number) => {
        const stage = canvas.parentElement;
        const wide = !stage || stage.clientWidth >= NARROW;
        const park = wide ? TOWER_PARK_WIDE : TOWER_PARK_NARROW;
        const inP = smoothstep(clamp01((t - PARK_IN[0]) / (PARK_IN[1] - PARK_IN[0])));
        const outP = smoothstep(clamp01((t - PARK_OUT[0]) / (PARK_OUT[1] - PARK_OUT[0])));
        return (park - 0.5) * 100 * (inP - outP);
      };

      let lastShift = NaN;
      let lastScale = NaN;
      let lastAlpha = NaN;
      let lastX = NaN;
      /* Set whenever the framing changes, so the next draw cannot be skipped. */
      let framed = true;

      const frame = (f: number, x: number) => {
        /* Smoothstep, not the raw scroll fraction. Mapped linearly the frame
           starts opening the instant the hero moves and stops dead the moment
           it ends — both boundaries read as a jolt. This eases in and out of
           rest while staying exactly scroll-locked in between. */
        const e = f * f * (3 - 2 * f);

        const scale = FRAME_SCALE + (1 - FRAME_SCALE) * e;
        /* The entrance rise is folded into the hero's own offset rather than
           added on top of it, so it is gone the moment the hero is, however
           early that happens. */
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
        framed = true;
        scene?.setFraming({ x, y: shift, scale });
        canvas.style.opacity = String(alpha);
      };

      /* Cards key off the same eased time the camera is at, so a card and the
         lettering behind it never drift apart. */
      const paint = (t: number) => {
        cards.forEach((card, i) => {
          const a = cardAlpha(t, i);
          card.style.opacity = String(a);
          card.style.transform = `translateY(${((1 - a) * 26).toFixed(1)}px)`;
          card.style.pointerEvents = a > 0.6 ? "auto" : "none";
        });
      };

      let inShowcaseMode = false;

      /* The scroll owns the camera from the first pixel of the section: down
         from the bud to the lettering, then through the editions. */
      const setEditions = (p: number) => {
        if (inShowcaseMode) return;
        target = Math.max(0, Math.min(SHOW_T, editionTime(clamp01(p))));
      };

      const setShowcase = (p: number) => {
        if (p > 0.01) {
          inShowcaseMode = true;
          target = SHOW_T + p * (END_T - SHOW_T);
        } else {
          inShowcaseMode = false;
        }
      };

      const st = ScrollTrigger.create({
        trigger: timeline,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setEditions(self.progress),
        onLeaveBack: () => {
          target = 0;
        },
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
          if (heroRef.current) {
            const isGone = self.progress >= 0.99;
            heroRef.current.style.visibility = isGone ? "hidden" : "visible";
            heroRef.current.style.pointerEvents = isGone ? "none" : "auto";
            heroRef.current.style.opacity = String(Math.max(0, 1 - self.progress * 1.15));
          }
        },
        onLeave: () => {
          if (heroRef.current) {
            heroRef.current.style.visibility = "hidden";
            heroRef.current.style.pointerEvents = "none";
            heroRef.current.style.opacity = "0";
          }
        },
        onEnterBack: () => {
          if (heroRef.current) {
            heroRef.current.style.visibility = "visible";
            heroRef.current.style.pointerEvents = "auto";
          }
        },
      });

      if (heroRef.current && framer.progress >= 0.99) {
        heroRef.current.style.visibility = "hidden";
        heroRef.current.style.pointerEvents = "none";
        heroRef.current.style.opacity = "0";
      }

      /**
       * The frame fades as it leaves, rather than simply scrolling away. Its
       * sticky box spends a full screen travelling upward while Vision scrolls
       * in underneath it, and the descent is finished by then.
       */
      const exit = gsap.to(stageRef.current ?? canvas, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current ?? timeline,
          start: "bottom bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      /**
       * Readiness. The preloader will not pass 95 until this fires, which is
       * what makes the page arrive with the tower already on it — so it fires
       * once the scene has compiled and drawn a frame, and also if the scene
       * cannot be built at all. A tower that is missing is a far smaller thing
       * than a page that never opens.
       */
      let isTowerReady = false;
      const markReady = () => {
        if (isTowerReady) return;
        isTowerReady = true;
        (window as Window & { __TOWER_READY?: boolean }).__TOWER_READY = true;
        window.dispatchEvent(new CustomEvent("tower:ready"));
      };
      const readyBackstop = setTimeout(markReady, 15000);

      /* Only draw while the section is on screen. Below it the stage has
         faded out and scrolled away, and the GPU has better things to do. */
      let onScreen = true;
      /* Released by the entrance (startIntro) when the loader reaches 100, or
         by the backstop if no loader ever reports. */
      let heldBehindLoader = true;
      const loaderBackstop = setTimeout(() => {
        heldBehindLoader = false;
      }, 20000);
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
      });
      if (rootRef.current) io.observe(rootRef.current);

      /* Resizing a canvas clears it, so draw straight away rather than leave
         it blank until the next tick — a blank frame reads as a flicker. */
      const ro = new ResizeObserver(() => {
        if (!scene) return;
        scene.resize();
        framed = true;
        draw(performance.now(), true);
      });
      if (canvas.parentElement) ro.observe(canvas.parentElement);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* Nothing moving and nothing changed: the scene still has slow life in
         it — the bud breathing, the beacon on the mast, the beams — but that
         does not need sixty frames a second. */
      let lastDrawnT = -1;
      let lastDrawnAt = 0;
      const draw = (now: number, force = false) => {
        if (!scene || !onScreen) return;
        /* Behind the loader the first frame is all that is needed (it is what
           reports ready). Drawing on underneath only took frames from the
           loader's own bar, which on a phone held it up for seconds. */
        if (heldBehindLoader && !force) return;
        if (stageRef.current?.style.opacity === "0") return;
        /* Except at the concert: sweeping beams at twenty frames a second
           read as stepping. */
        const live = current > SHOW_T + 0.2;
        const still = current === lastDrawnT && !framed && !live;
        if (!force && still && now - lastDrawnAt < 48) return;
        lastDrawnT = current;
        lastDrawnAt = now;
        framed = false;
        scene.render(now, !still);
      };

      import("@/lib/lotus-tower")
        .then(({ createLotusTower }) => (disposed ? null : createLotusTower(canvas)))
        .then((s) => {
          if (!s) return;
          if (disposed) {
            s.dispose();
            return;
          }
          scene = s;
          scene.setTime(current);
          scene.setFraming({ x: lastX || 0, y: lastShift || 0, scale: lastScale || 1 });
          scene.render(performance.now());
          markReady();
        })
        .catch(() => {
          /* No WebGL, or it was lost: open the page without the tower. */
          markReady();
        });

      if (reduced) {
        intro.v = 0;
        /* No chase: jump straight to where the scroll position puts the
           camera. */
        const snap = () => {
          current = target;
          scene?.setTime(current);
          frame(framingTarget, offset(target));
          paint(target);
          draw(performance.now(), true);
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
          disposed = true;
          clearTimeout(readyBackstop);
          io.disconnect();
          ro.disconnect();
          st.kill();
          shower.kill();
          framer.kill();
          exit.scrollTrigger?.kill();
          exit.kill();
          scene?.dispose();
          scene = null;
        };
      }

      let lastTick = performance.now();

      const tick = () => {
        const now = performance.now();

        /* Per second, not per frame. */
        const dt = Math.min((now - lastTick) / 1000, 0.05);
        lastTick = now;

        /* Above the section the camera belongs at the top, re-asserted every
           frame rather than left to a callback: any return to the top that
           does not deliver one — a route change back, a refresh landing
           mid-page — would otherwise leave it wherever it last was. */
        if (!inShowcaseMode && window.scrollY < st.start) target = 0;

        const targetClamped = Math.max(0, Math.min(END_T, target));
        /* Critically damped spring, stepped exactly rather than integrated,
           so it is stable at any frame rate. */
        const x0 = current - targetClamped;
        const e = Math.exp(-SPRING * dt);
        const x1 = (x0 + (vel + SPRING * x0) * dt) * e;
        vel = (vel - SPRING * (vel + SPRING * x0) * dt) * e;
        current = targetClamped + x1;
        if (Math.abs(x1) < 1e-4 && Math.abs(vel) < 1e-3) {
          current = targetClamped;
          vel = 0;
        }

        scene?.setTime(current);
        frame(framingTarget, offset(current));
        paint(current);
        draw(now);
      };

      /**
       * The entrance plays behind the loader, not across its exit:
       * `preloader:ready` fires when the bar reaches 100, before the panel
       * moves, so the tower is fully up by the time anything is uncovered. The
       * later two remain as fallbacks for anyone arriving without a preloader.
       * Guarded because more than one of these fires in a normal load.
       */
      let introStarted = false;
      const startIntro = () => {
        heldBehindLoader = false;
        if (introStarted) return;
        introStarted = true;
        if (intro.v <= 0.01) {
          intro.v = 0;
          return;
        }
        gsap.to(intro, {
          v: 0,
          duration: 2.0,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      window.addEventListener("preloader:ready", startIntro, { once: true });
      window.addEventListener("preloader:opening", startIntro, { once: true });
      window.addEventListener("preloader:complete", startIntro, { once: true });

      gsap.ticker.add(tick);
      frame(0, offset(0));
      paint(0);

      return () => {
        disposed = true;
        clearTimeout(readyBackstop);
        clearTimeout(loaderBackstop);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("preloader:ready", startIntro);
        window.removeEventListener("preloader:opening", startIntro);
        window.removeEventListener("preloader:complete", startIntro);
        st.kill();
        shower.kill();
        framer.kill();
        exit.scrollTrigger?.kill();
        exit.kill();
        gsap.ticker.remove(tick);
        scene?.dispose();
        scene = null;
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
        {/* The tower, drawn. Framing, the park offset and the entrance rise
            all happen in the scene's lens, so this element never moves; only
            its opacity is written, for the entrance. */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block h-full w-full"
          style={{ opacity: 0 }}
          aria-hidden
        />
      </div>

      {/* Pulled up over the pinned frame. 40vh of runway: the stage expands
          across it and the hero's copy leaves across the same stretch, so the
          two read as one move and the drop can follow immediately. */}
      <div
        ref={heroRef}
        className="relative"
        style={{ marginTop: "-100svh", height: "40vh" }}
      >
        <div className="h-[100svh] w-full overflow-hidden">{children}</div>
      </div>

      <section
        id="timeline"
        ref={timelineRef}
        className="relative"
        style={{ height: `${EDITIONS_RUNWAY}svh` }}
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
                      "Past event"
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
                          {e.crowd.endsWith("+") ? (
                            <>
                              <span>{e.crowd.slice(0, -1)}</span>
                              <span className="inline-block ml-[0.28em] scale-[1.22] origin-center text-red-hot">+</span>
                            </>
                          ) : (
                            e.crowd
                          )}
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
                      /* No pointer-events class of its own: the card turns
                         pointer events on only while it is showing, and an
                         explicit `auto` here left this link live, invisible,
                         over the 2026 card. */
                      className="cut-btn-outline mt-6 w-fit text-xs hover:shadow-[0_4px_16px_hsl(var(--red-hot-c)/0.3)]"
                    >
                      <span>VIEW EVENT ARCHIVE</span> <span aria-hidden>↗</span>
                    </a>
                  ) : null}

                  {e.upcoming ? (
                    <a
                      href={bookHref()}
                      {...(TICKET_URL ? { target: "_blank", rel: "noreferrer" } : {})}
                      data-cursor="link"
                      className="cut-btn mt-6 w-fit text-xs"
                    >
                      <span>Book Now</span> <span aria-hidden>→</span>
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The stage. Same pinned frame, same camera move — it just carries on
          past where the editions stop, so the camera reaching the base and
          the section changing are one movement rather than two.

          Deliberately empty. This section is scroll runway and nothing else:
          it exists so the trigger above has a range to map t=SHOW_T..END_T
          onto, and the concert plays over it with no overlay at all.

          220svh — 120 of them scroll — because the descent to the arena runs
          across it and it is the longest move in the piece; give it too little
          room and it reads as a fall.

          Pulled up by one viewport so it takes over exactly as the editions
          release — a sticky child lets go a viewport before its section ends,
          and without this there was a full screen of scrolling between the
          last card leaving and the stage arriving, the picture frozen
          throughout. */}
      <section
        id="showcase"
        ref={showRef}
        className="relative h-[220svh]"
        style={{ marginTop: "-100svh" }}
      />
    </div>
  );
}
