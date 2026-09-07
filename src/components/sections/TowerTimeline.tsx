"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { mediaPath, mediaSrc, onMediaResolved } from "@/lib/media-cache";
import { smoothScroll } from "@/lib/smooth-scroll";

/**
 * The seek-optimised build of the RIFE footage.
 *
 * Source: new-4x-RIFE-RIFE3.1-120fps.mp4 — the original 10s clip put through
 * RIFE 3.1 neural frame interpolation at 4x and retimed to half speed, giving
 * 20s at 60fps. 1200 frames where the original had 300.
 *
 * That frame count is the whole point. Every animation here is scroll-scrubbed,
 * so what you see is frames per *second of scrolling*, and that depends on how
 * fast the reader moves. At 300 frames across this runway a slow reading pace
 * showed about 14fps and the picture visibly landed on each frame. At 1200 it
 * is four times that, which is past the point where the eye stops resolving
 * individual frames.
 *
 * RIFE beat both ffmpeg interpolators. Measured as edge energy, its synthesised
 * frames sit 6.0% off the real ones — against 6.8% for `minterpolate` mci and
 * 44% for mci's `blend` mode, which averages neighbours into ghosts and made
 * the file pulse sharp/soft at 30Hz. Do not re-interpolate with `blend`.
 *
 * The pipeline below still has to run over whatever the interpolator produces,
 * and every part of it is a fix rather than a preference:
 *
 *   ffmpeg -i new-4x-RIFE-RIFE3.1-120fps.mp4 -an  *     -vf "scale=1600:-2,colorlevels=rimin=0.028:gimin=0.028:bimin=0.028"  *     -c:v libx264 -g 1 -crf 25 -preset slow -pix_fmt yuv420p  *     -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709  *     -movflags +faststart Tower.seek.mp4
 *
 * `-g 1` makes it all-intra — every frame a keyframe. Verified on this build:
 * 1197 keyframes of 1197 frames. Without it a seek decodes from the previous
 * keyframe and scrubbing collapses; the original measured a ~534ms median seek
 * against ~3ms here.
 *
 * `colorlevels` crushes the black floor. A night sky is not black: this source
 * measured luma 17-21 where limited-range black is 16, so it rendered a few
 * levels above zero against a page at #000. The frame slides sideways to park
 * the tower, which puts its edge mid-screen, and a hard step from 6 to 0 there
 * is plainly visible as two different blacks. After the pass the sky sits on 16
 * and the seam is gone.
 *
 * The colour tags matter for the same reason — an untagged file leaves the
 * browser guessing how to expand the range.
 *
 * 1600x900, 60fps, 20s, 12.5MB. The size is the cost of the frame count; crf 27
 * gives 10.5MB and crf 28 gives 9.5MB if it ever needs to come down.
 *
 * Every time constant below is in seconds of THIS file. Change the footage
 * length and they all have to move with it.
 */
/* Paths live in MEDIA now — there is a wide and a narrow cut, and the
   preloader picks one. See src/lib/media-cache.ts. */

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
 * How tall the editions section is, in svh — which is really "how much scroll
 * the footage is stretched across", and therefore the single biggest control
 * over whether the scrub looks like motion or like a slideshow.
 *
 * The video holds 597 frames. Spread over the old 480svh the sequence spanned
 * 3360px, or 5.6px per frame — and what you see is frames per *second*, which
 * depends on how fast you scroll:
 *
 *     600 px/s -> 5.6s -> 107 fps    fine
 *     150 px/s -> 22s  ->  27 fps    acceptable
 *      80 px/s -> 42s  ->  14 fps    visibly frame by frame
 *
 * Reading pace is the slow end, which is exactly where it fell apart. The two
 * ways out are more frames or less scroll. More frames is the expensive one:
 * 120fps doubles the count and takes the file from 6.4MB to 10.4MB, and still
 * only reaches ~28fps at 80px/s. Less scroll costs nothing and helps just as
 * much, so this is the lever to pull first.
 *
 * The editions no longer get all of this, and no longer need all of it. The
 * drop is played once the hero has left, so the scrub carries 12.2s of footage
 * from INTRO_END to SHOW_T rather than the full 16.4 — a quarter less, which
 * is a quarter less runway at the same pixels per frame.
 *
 * 300 is that: ~180px held while the hero's copy leaves, then ~1620px of scrub
 * for 12.2s, which is the same 132px per second of footage the section has
 * always run at. The hold shrank with the hero runway — it only has to cover
 * the title going up, not a whole viewport of waiting.
 *
 * At 340 the sequence spanned 2240px and 3.75px per frame — half again as many
 * frames per second at every scroll speed, and roughly 480px of scroll per
 * edition card, which is still enough to read one. Turn it down further for
 * more smoothness at the cost of dwell time; the cue times are all in video
 * seconds, so they follow this automatically and nothing needs re-timing.
 */
const EDITIONS_RUNWAY = 300;

/**
 * Frame rate of the encode above. The cross-fade divides video time into
 * frames with it, so it has to match the file: read it off `ffmpeg -i`, and
 * change it here the moment the encode changes, or the two layers will hold
 * frames that are not actually adjacent.
 */
const SOURCE_FPS = 60;

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
 * through the whole tower sequence, the brightness-weighted centroid sits at
 * 49.8-49.9% of frame width
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
const PARK_IN = [1.6, 4.0] as const;
const PARK_OUT = [14.8, 17.0] as const;

/** Where the tower sequence ends and the concert takes the frame. The lower
 *  band of the image goes from ~2,200 lit pixels to 3,400 at t=8.4 and 10,600
 *  by t=8.8; 8.2 is the last moment that is still unambiguously the tower. */
const SHOW_T = 16.4;

/**
 * Where the last card clears — earlier than SHOW_T, deliberately.
 *
 * Fading 2026 against SHOW_T kept it on screen through the drop to the base,
 * so it was still sitting there while the shot had visibly moved on. Gone by
 * 7.75 leaves a clean beat of nothing but footage between the last card and
 * the stage arriving.
 */
const CARDS_END = 15.5;

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
/**
 * Where the played opening ends and the scroll takes over.
 *
 * Past the 2023 card's cue at 2.6 rather than stopping on it, so the card is up
 * and has been held for a beat before anyone has to scroll for it — the drop
 * and the first edition read as one shot instead of a shot that stops dead the
 * instant its subject appears. Short of the 2024 card at 6.0, which is where
 * the section becomes a list and the reader should be setting the pace.
 *
 * Everything before this is played rather than scrubbed, so it is also the
 * first knot of the map below: the scroll picks the footage up here, and these
 * seconds never belong to a scroll position at all.
 */
const INTRO_END = 4.2;

/**
 * How long the page is held while the drop runs, in seconds.
 *
 * Not a playback rate — there is no longer a tween to set one. Going up, the
 * reset snaps target to 0 and SEEK_LERP carries the picture the whole way, and
 * that chase is what reads as fast. Going down was a tween feeding the same
 * lerp, so it could only ever be slower than the direction it was being
 * compared against: first the tween's own 0.55s, then the lerp's tail on top.
 *
 * Now both directions are the same move — snap the target, let the lerp run —
 * so they take the same time by construction. At 0.22 per frame the chase is
 * better than 99% done in 0.35s, which is all this has to cover.
 */
const INTRO_HOLD = 0.35;

const EDITION_MAP: ReadonlyArray<readonly [number, number]> = [
  [0, INTRO_END], [0.81, 12.0], [0.86, 14.3], [1, SHOW_T],
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
const SHOW_FIT = [16.4, 18.0] as const;

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

/** Cross-fade between edition cards, in seconds of video. Doubled along with
 *  every other time constant when the footage went from 10s to 20s — left at
 *  0.45 it would still work, but cover half the scroll it used to and so read
 *  as twice as abrupt. */
const FADE = 0.9;

const smoothstep = (v: number) => v * v * (3 - 2 * v);

const EDITIONS = [
  {
    year: "2023",
    /* Its own cue in the footage, deliberately not INTRO_END. The played
       opening runs past this so the card is up and held before the reader has
       to scroll; tying the two together moved the cue every time that shot was
       lengthened, and left the card sitting at half opacity when it stopped. */
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const showRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const video = videoRef.current;
      const box = boxRef.current;
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

      /* If the preloaded blob will not decode — an unsupported type, memory
         pressure, a revoked URL — fall back to the plain path once rather
         than leaving the element with a source it cannot play. Losing the
         preload costs a stall; losing this costs the whole video. */
      let usedFallback = false;
      const onSrcError = () => {
        if (usedFallback) return;
        usedFallback = true;
        video.src = mediaPath("tower");
        video.load();
      };
      video.addEventListener("error", onSrcError);

      /* Wait for the preloader to settle, then take whatever it resolved —
         an object URL over its own download, or the plain path if it could
         not finish. It always settles, so this always runs. */
      const stopWaiting = onMediaResolved(() => {
        const src = mediaSrc("tower");
        if (video.getAttribute("src") !== src) {
          video.src = src;
          video.load();
        }
      });

      /**
       * Ready means a frame exists, not that the header parsed.
       *
       * This used to also fire on `loadedmetadata`, which is readyState 1: the
       * container has been read and nothing has been decoded. The preloader
       * took that as done and lifted, so the page arrived with the tower still
       * blank for a moment while the first frame was decoded — which looked
       * like the video failing to load rather than the loader leaving early.
       *
       * `requestVideoFrameCallback` is the only signal that a frame has
       * actually been presented; `loadeddata` (readyState 2, first frame
       * available) is the fallback where it does not exist. A seek to 0 is
       * issued alongside, because a paused element will happily sit on
       * metadata without ever decoding anything to show.
       */
      type WithRVFC = HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      };
      const armReady = () => {
        if (video.readyState >= 2) {
          markReady();
          return;
        }
        const rvfc = (video as WithRVFC).requestVideoFrameCallback;
        if (typeof rvfc === "function") {
          rvfc.call(video, () => markReady());
        }
        video.addEventListener("loadeddata", markReady, { once: true });
        video.addEventListener("canplay", markReady, { once: true });
        /* Nudge the decoder into producing that first frame. */
        video.addEventListener(
          "loadedmetadata",
          () => {
            if (video.currentTime === 0) video.currentTime = 0.001;
          },
          { once: true },
        );
      };
      armReady();

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
        const target = box ?? video;
        target.style.height = `${h.toFixed(1)}px`;
        target.style.top = `${((sh - h) / 2).toFixed(1)}px`;
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
        const target = box ?? video;
        target.style.transform =
          `translate(${x.toFixed(2)}%, ${shift.toFixed(2)}%) scale(${scale.toFixed(4)})`;
        target.style.opacity = String(alpha);
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
      /* Relative to the file's own length, never an absolute second. This was
         `Math.min(dur() - 0.15, 9.85)`, and the 9.85 was the old ten-second
         cut's near-end written down as a number. Against a twenty-second file
         it pinned video time at 9.85 forever, so everything past it — the 2026
         card and the whole concert — was simply unreachable, with no error to
         say so. Anything compared against video time has to be derived from
         `duration`. */
      const safeMax = () => Math.max(0, dur() - 0.15);

      let inShowcaseMode = false;

      /*
       * The drop to the base plays; it is not scrubbed.
       *
       * Tying it to scroll made the one genuinely cinematic move in the section
       * hostage to how fast someone happened to be turning a wheel — and at
       * reading pace that is a slideshow, which is the whole problem
       * EDITIONS_RUNWAY exists to manage. So the footage from the top of the
       * tower down to the 2023 card runs at its own fixed rate the moment the
       * section arrives, and the scroll map starts at INTRO_END rather than 0.
       * Those seconds are a shot, and a shot has a speed.
       *
       * `ease: "none"` on purpose: `current` already chases this through
       * SEEK_LERP, and easing a value that is itself being eased is how this
       * file has produced drift every previous time.
       */
      let introFinish: ReturnType<typeof setTimeout> | undefined;
      let introStartedAt = 0;
      let introRunning = false;
      let introDone = false;
      /* Where along the editions the shot handed over, so the map can start
         there instead of at the top of the section. */
      let introAtP = 0;

      /*
       * The page holds still for the shot.
       *
       * Without this the shot fires and the scroll runs away underneath it:
       * measured on a steady downward scroll it played while the reader
       * travelled from 900 to 2786 — most of the editions — and the moment it
       * finished the scrub cut in at 10.82 and raced to the end. The shot was
       * playing the whole time and could not be seen, which is exactly the
       * complaint. A timed shot and a scrubbed one cannot share the same
       * pixels; for its 1.35s the shot owns them.
       *
       * Released on a timer as well as on completion, so a killed or stalled
       * tween can never leave the page unscrollable — the same belt Film wears
       * around its own lock.
       */
      let introUnlock: ReturnType<typeof setTimeout> | undefined;

      const releaseScroll = () => {
        if (introUnlock) clearTimeout(introUnlock);
        introUnlock = undefined;
        smoothScroll.current?.start();
      };

      const endIntro = () => {
        if (introFinish) clearTimeout(introFinish);
        introFinish = undefined;
        if (!introRunning) return;
        introRunning = false;
        introDone = true;
        /* Anchor where the drop actually let go. With the scroll held that is
           where it started, but it stays correct if the lock ever fails and the
           reader has moved. */
        introAtP = Math.min(st.progress, 0.9);
        releaseScroll();
      };

      const playIntro = (p: number) => {
        if (introDone || introRunning) return;
        introRunning = true;
        introAtP = Math.min(p, 0.9);

        /* The whole drop, in one line: put the target at the far end and let
           SEEK_LERP chase it, which is precisely what the reset does in the
           other direction. Same mechanism, same speed, nothing to keep in
           sync. */
        target = INTRO_END;

        smoothScroll.current?.stop();
        introStartedAt = performance.now();
        /* The tick ends it; these only cover a tick that has stopped running,
           because a lock released by nothing is a page that cannot scroll. */
        introFinish = setTimeout(endIntro, INTRO_HOLD * 1000 + 200);
        introUnlock = setTimeout(releaseScroll, INTRO_HOLD * 1000 + 900);
      };

      /**
       * Past this much of the section the shot is written off and the scrub
       * takes over wherever the reader is.
       *
       * Without it the section can strand: video time is held at 0 until the
       * shot has run, so a hero trigger that never fires would leave the tower
       * frozen at its top for the whole of the editions with no way out. The
       * shot is the thing worth losing here, not the section.
       */
      const INTRO_GIVE_UP = 0.45;

      const setEditions = (p: number) => {
        if (inShowcaseMode) return;
        /* The tween owns video time until it lets go. */
        if (introRunning) return;

        if (!introDone) {
          if (p < INTRO_GIVE_UP) {
            /* The hero is still on its way out and the tower is its backdrop:
               hold the top of the frame rather than start the descent under
               text that has not finished leaving. */
            target = 0;
            return;
          }
          introDone = true;
          introAtP = p;
        }

        /* The scroll picks the footage up where the shot put it down, so the
           handover is continuous no matter where the shot happened to fire. */
        const q = introAtP >= 1 ? 1 : (p - introAtP) / (1 - introAtP);
        target = Math.max(0, Math.min(SHOW_T, editionTime(clamp01(q))));
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
        onLeaveBack: () => {
          if (introFinish) clearTimeout(introFinish);
          introFinish = undefined;
          introRunning = false;
          introDone = false;
          introAtP = 0;
          target = 0;
          releaseScroll();
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
        },
      });

      /*
       * The shot starts when the hero is gone, not when the section arrives.
       *
       * These two overlap by design — the timeline begins 180px down while the
       * hero runs a full viewport — so firing on the section's own start put
       * the drop under a wordmark that had barely begun to fade, and left the
       * 2023 card sitting on top of GENERATION 26. The hero's mark does not
       * finish clearing until its own bottom reaches the top of the screen, so
       * that is the cue.
       */
      /* The end of the hero runway: the frame has finished opening out and
         the wordmark has finished leaving, because both are now scrubbed
         across it. Cueing off the hero section instead put the drop a full
         viewport later, with the footage frozen at the top of the tower for
         everything in between — the reader scrolling a still picture waiting
         for something to happen. */
      const introCue = ScrollTrigger.create({
        trigger: heroRef.current ?? timeline,
        start: "bottom top",
        end: "bottom top",
        onEnter: () => playIntro(st.progress),
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
          introCue.kill();
          if (introFinish) clearTimeout(introFinish);
          releaseScroll();
          st.kill();
          shower.kill();
          framer.kill();
          exit.scrollTrigger?.kill();
          exit.kill();
        };
      }

      /**
       * One decoder, cross-faded against a snapshot of the frame it just left.
       *
       * A scrubbed video can only show frames that exist, and scrolling slowly
       * means seeing few of them per second — which is what reads as playing
       * frame by frame. More frames only makes the steps smaller; they are
       * still steps. The way out is to stop showing one frame at a time: hold
       * frame N underneath, frame N+1 on top, and fade the top one up across
       * the gap. The picture then dissolves continuously at any scroll speed.
       *
       * The obvious way to do that is two <video> elements, and it works, but
       * it is unaffordable: they fetch independently, so the network showed
       * two full 200s for the same 12.5MB file — 25MB on a phone — and two
       * decoders running at once, which mobile browsers ration hard.
       *
       * A canvas holding the previous frame does the same job for one download
       * and one decoder. Before the video leaves frame N it is painted into
       * the canvas, then seeks to N+1 and fades up over it. `object-fit:cover`
       * applies to a canvas exactly as it does to a video, so both layers crop
       * identically without reimplementing the fit maths.
       */
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext("2d") : null;

      let videoFrame = -1;      // frame index the video was last asked for
      let videoReady = false;   // has the decoder confirmed it
      let canvasFrame = -1;     // frame index painted into the canvas
      let scrubDir = 1;         // which way the scrub is travelling
      let lastTarget = -1;      // previous scroll-driven target, for direction
      let seekBusy = false;
      let seekIssuedAt = 0;

      const onSeeked = () => { seekBusy = false; videoReady = true; };
      video.addEventListener("seeked", onSeeked);

      /**
       * Give the decoder one play/pause on the first gesture.
       *
       * iOS will not reliably attach a decoder to a <video> that has never
       * played. Seeks on such an element can silently do nothing — no error,
       * no `seeked`, the frame simply never changes — which is the other way
       * this ends up stuck on frame 0. The element is muted and playsInline,
       * so starting and immediately stopping it is neither seen nor heard, and
       * it has to hang off a real gesture or the play() is refused.
       */
      let primed = false;
      const prime = () => {
        if (primed) return;
        primed = true;
        try {
          const played = video.play();
          if (played && typeof played.then === "function") {
            played.then(() => video.pause()).catch(() => {
              /* refused — seeking may still work, so this is not fatal */
            });
          } else {
            video.pause();
          }
        } catch {
          /* same: best effort */
        }
      };
      const primeEvents = ["touchstart", "pointerdown", "wheel", "keydown"] as const;
      primeEvents.forEach((e) =>
        window.addEventListener(e, prime, { once: true, passive: true }),
      );

      /* Recovery watchdog. A decoder that has been dropped — iOS reclaims them
         under memory pressure — leaves a seek that never answers, and the
         scrub would then hold one frame for the rest of the page with nothing
         to indicate why. If the picture has not moved at all while the scroll
         has clearly asked it to, force the guard open and ask again; if that
         does not take either, reload the element, which is the only reset that
         reliably works. */
      let lastMovedAt = performance.now();
      let lastSeenTime = -1;
      let recoveries = 0;

      /** Is this moment already downloaded? A seek inside a buffered range is a
       *  decode and lands in milliseconds; one outside it is a network fetch. */
      const isBuffered = (t: number) => {
        const b = video.buffered;
        for (let i = 0; i < b.length; i++) {
          if (t >= b.start(i) && t <= b.end(i)) return true;
        }
        return false;
      };

      const seekToFrame = (frameIdx: number, maxT: number, now: number) => {
        if (videoFrame === frameIdx) return;
        /* Stall release: if `seeked` never lands the guard must not latch, or
           the video freezes for good.
         *
         * The wait has to depend on what the seek actually has to do. At a flat
         * 180ms — fine for a decode — a phone seeking into an unbuffered part
         * of a 12MB file never finished one: the round trip takes longer than
         * that, so every 180ms the in-flight seek was abandoned and replaced.
         * Nothing ever landed and the video sat on frame 0 for the whole page,
         * which looked like the footage was missing rather than still loading.
         * Give a fetch room to complete; keep the decode case tight. */
        const wantsNetwork = !isBuffered((frameIdx + 0.5) / SOURCE_FPS);
        const stalled = seekBusy && now - seekIssuedAt > (wantsNetwork ? 2500 : 180);
        if (seekBusy && !stalled) return;
        if (!Number.isFinite(video.duration)) return;
        videoFrame = frameIdx;
        videoReady = false;
        seekBusy = true;
        seekIssuedAt = now;
        /* Aim at the middle of the frame, not its edge — landing exactly on a
           boundary is a coin toss between the two frames either side of it. */
        const t = (frameIdx + 0.5) / SOURCE_FPS;
        video.currentTime = Math.max(0, Math.min(maxT, t));
      };

      const snapshot = () => {
        if (!canvas || !ctx || !video.videoWidth) return false;
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0);
        return true;
      };

      let lastTick = performance.now();

      const tick = () => {
        const now = performance.now();

        /* Per second, not per frame. */
        const dt = Math.min((now - lastTick) / 1000, 0.05);
        lastTick = now;

        /*
         * Above the section the tower belongs at the top of its footage, and
         * that is re-asserted here every frame rather than left to a callback.
         *
         * `onLeaveBack` was the only thing resetting it, so any return to the
         * top that does not deliver one — a route change back from /auditions,
         * a refresh landing mid-page, a jump the trigger reads as a single step
         * — left the tower parked on whatever frame it happened to be showing
         * while the hero faded back in over it. Read off the scroll position
         * instead, it cannot be missed, and it costs one comparison.
         */
        /* The drop ends on the frame clock, not on a timer. A timer cannot run
           while the main thread is busy, and the one thing that must not
           outlive a stall is a scroll lock. */
        if (introRunning && now - introStartedAt >= INTRO_HOLD * 1000) endIntro();

        if (!inShowcaseMode && !introRunning && window.scrollY < st.start) {
          if (target !== 0) target = 0;
          introDone = false;
          introAtP = 0;
        }

        const maxT = safeMax();
        const targetClamped = Math.max(0, Math.min(maxT, target));

        /* Which way the scroll is going, taken from the target rather than
           from the target-to-current gap: the lerp closes that gap within a
           frame or two of a small scroll, so it reads as no movement at all
           for exactly the slow scrolling this is here to smooth. The target is
           what the wheel actually moved. Unchanged target keeps the previous
           direction, so coming to rest does not flip to forward and re-seek. */
        if (lastTarget >= 0 && Math.abs(targetClamped - lastTarget) > 1e-4) {
          scrubDir = targetClamped > lastTarget ? 1 : -1;
        }
        lastTarget = targetClamped;

        // Always smoothly interpolate current towards targetClamped with zero pause on rewind
        current += (targetClamped - current) * (1 - Math.pow(1 - SEEK_LERP, dt * 60));
        if (Math.abs(targetClamped - current) < 1 / 120) current = targetClamped;

        /* Where the scrub is, in frames. `i` is the frame behind us; how far
           past it we have travelled is what the cross-fade below spends. */
        const f = current * SOURCE_FPS;
        const i = Math.max(0, Math.floor(f));

        if (Math.abs(video.currentTime - lastSeenTime) > 0.001) {
          lastSeenTime = video.currentTime;
          lastMovedAt = now;
          recoveries = 0;
        } else if (
          Math.abs(current - video.currentTime) > 0.25 &&
          now - lastMovedAt > 3000
        ) {
          lastMovedAt = now;
          seekBusy = false;
          videoFrame = -1;
          if (++recoveries > 2) {
            recoveries = 0;
            video.load();
          }
        }

        /**
         * Blend the frame behind us against the frame ahead of us.
         *
         * The blend only means anything if the video is holding a frame we
         * have not reached yet. Seeking it to `round(f)` — the frame the
         * scrub is already on — leaves nothing to fade into: the fade is
         * complete the moment it is computed, so every tick painted a whole
         * frame and the picture stepped. The seek therefore aims one frame
         * ahead, at `i + 1`, and `frac` — how far past frame `i` the scrub
         * has travelled — is exactly the opacity that frame should be at.
         *
         * The canvas takes a copy immediately before each new seek, so it
         * holds frame `i` while the video fetches `i + 1`. That ordering is
         * also why the blend must not wait on `videoReady`: the seek it was
         * waiting on is issued on the same tick and clears the flag, so
         * requiring it sent every moving tick down the un-blended path. While
         * a seek is in flight the element still displays its pre-seek frame —
         * the same picture the canvas just took — so blending the two is a
         * no-op until it lands, and a true dissolve once it does.
         */
        const wanted = scrubDir >= 0 ? i + 1 : i;

        if (canvas && videoReady && videoFrame !== wanted && videoFrame >= 0) {
          /* About to move: keep what is on screen before it is replaced. */
          if (snapshot()) canvasFrame = videoFrame;
        }
        seekToFrame(wanted, maxT, now);

        /* `span` is +/-1 while scrolling normally, so `t` reduces to how far
           past the canvas's frame we have travelled. It is signed on purpose:
           scrolling up puts the canvas ahead of the video and both terms flip
           together, so one expression covers either direction. After a jump
           the canvas is further away and this dissolves across the whole gap
           rather than cutting. */
        const span = videoFrame - canvasFrame;
        if (canvas && canvasFrame >= 0 && span !== 0) {
          canvas.style.opacity = "1";
          video.style.opacity = clamp01((f - canvasFrame) / span).toFixed(3);
        } else {
          /* Nothing behind us yet — the first frames of the page. */
          if (canvas) canvas.style.opacity = "0";
          video.style.opacity = "1";
        }

        frame(framingTarget, offset(current));
        fit(current);
        paint(current);
      };

      /**
       * The entrance plays behind the loader, not across its exit.
       *
       * `frame()` fades the tower in from `intro.v`, and alpha only reaches 1
       * once `intro.v` has fallen to 0.5 — about 0.41s into the 2s ease. Tied
       * to `preloader:opening`, that clock started on the same frame the
       * panel began its 0.85s slide, so the fade played out across the first
       * half of the reveal and the page was uncovered with the tower still
       * transparent. It read as the page arriving without it.
       *
       * `preloader:ready` fires when the bar reaches 100, a further 0.75s
       * before the panel moves, so the tower is fully opaque by the time
       * anything is uncovered. The later two remain as fallbacks for anyone
       * arriving without a preloader at all.
       *
       * Guarded because more than one of these will fire in a normal load, and
       * re-entering would restart a 2s tween from wherever the first had got
       * to — stretching the entrance rather than leaving it alone.
       */
      let introStarted = false;
      const startIntro = () => {
        if (introStarted) return;
        introStarted = true;
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
      fit(0);
      paint(0);

      return () => {
        window.removeEventListener("preloader:opening", startIntro);
        window.removeEventListener("preloader:complete", startIntro);
        introCue.kill();
        if (introFinish) clearTimeout(introFinish);
        releaseScroll();
        st.kill();
        shower.kill();
        framer.kill();
        exit.scrollTrigger?.kill();
        exit.kill();
        stopWaiting();
        video.removeEventListener("error", onSrcError);
        video.removeEventListener("seeked", onSeeked);
        primeEvents.forEach((e) => window.removeEventListener(e, prime));
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
        {/* One box carries the framing — transform, height, offset — so those
            are written once, and the two layers inside it differ only in
            opacity, which the compositor blends for free. */}
        <div
          ref={boxRef}
          className="absolute inset-0"
          style={{
            transform: `translateY(${FRAME_SHIFT + INTRO_RISE}%) scale(${FRAME_SCALE})`,
            opacity: 0,
          }}
        >
          {/* The frame the video just left, painted here so it can be faded
              across instead of cut. A canvas rather than a second <video>:
              same blend, one download, one decoder. `object-fit: cover`
              applies to a canvas exactly as to a video, so the two crop
              identically without duplicating the fit maths. */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0 }}
            aria-hidden
          />
          {/* No `src` here on purpose. The preloader downloads this file and
              hands over the bytes; a src in the markup would start a second,
              competing download of the same 12MB. */}
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            preload="auto"
            aria-hidden
          />
        </div>
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
        className="relative h-[140svh]"
        style={{ marginTop: "-100svh" }}
      />
    </div>
  );
}
