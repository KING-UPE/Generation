"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { smoothScroll } from "@/lib/smooth-scroll";
import { MEDIA, mediaPath, resolveMedia, type MediaKey } from "@/lib/media-cache";

const VIDEO_SRC = "/Tower.seek.mp4";
/* Only used if the server withholds content-length; the real size is read from
   the response. Kept roughly honest so the bar is not wildly wrong when it is
   needed. */
const ESTIMATED_SIZE = 13_096_081; // ~12.5 MB

/**
 * How long to wait for the footage before letting the page through anyway.
 *
 * This was 7s, chosen when the file was 4MB. At 12.5MB a phone rarely finishes
 * in that, so the preloader handed over a video that had barely started
 * downloading — and the scrub then sat on frame 0, which reads as the footage
 * being missing rather than still arriving. Long enough now that a mid-range
 * mobile connection can realistically get there, and still bounded so nobody
 * is ever trapped behind it.
 */
const LOAD_TIMEOUT_MS = 25000;

/** Container type for the preloaded blobs — see the note where they are made. */
const MIME = "video/mp4";

/**
 * How far the bar may run on elapsed time before any bytes are counted, and
 * over how long. Small on purpose: it exists to cover connection setup, not to
 * flatter the download.
 */
const WARMUP_CEILING = 18;
const WARMUP_MS = 1800;

export default function Preloader({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING SYSTEM CORE");
  const [isReady, setIsReady] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const progressVal = useRef(0);
  const towerReadyRef = useRef(false);
  const announcedRef = useRef(false);
  /** Lifts the input gate below. Held in a ref because the lock is set up in one
   *  effect and released from the exit timeline in another. */
  const openScrollRef = useRef<() => void>(() => {});

  useEffect(() => {
    /*
     * Lock scrolling while the preloader is active.
     *
     * This used to be a bare `if (smoothScroll.current) stop()`, and it was
     * doing nothing at all. Effects run deepest-first, and SmoothScroll wraps
     * this component from the layout — so on the first pass Lenis does not
     * exist yet, the guard falls through, and the page spends the whole load
     * with a live scroller behind the panel. Everything that moved it then left
     * the hero's scrubbed timeline holding the progress it reached, which is
     * why the wordmark, the badges and the button were all still faded once the
     * panel lifted.
     *
     * Take the lock the moment Lenis appears instead.
     */
    smoothScroll.held = true;
    smoothScroll.current?.stop();
    document.body.style.overflow = "hidden";

    /*
     * Refuse the input as well as the movement.
     *
     * `overflow: hidden` stops the document scrolling, and a stopped Lenis
     * ignores what it is handed — but the events still fire, and everything
     * downstream of them still runs: momentum banks up, triggers evaluate
     * against a page that is being held, and the reader arrives at a section
     * whose bounds were measured while it could not move. Refusing wheel, touch
     * and the scroll keys outright means nothing is queued to apply the moment
     * the panel lifts.
     *
     * These come off in the same place the lock does, so the gate cannot outlive
     * the panel that put it there.
     */
    const swallow = (e: Event) => e.preventDefault();
    const SCROLL_KEYS = new Set([
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
      " ",
      "Spacebar",
    ]);
    const swallowKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };

    window.addEventListener("wheel", swallow, { passive: false });
    window.addEventListener("touchmove", swallow, { passive: false });
    window.addEventListener("keydown", swallowKey);

    const openScroll = () => {
      window.removeEventListener("wheel", swallow);
      window.removeEventListener("touchmove", swallow);
      window.removeEventListener("keydown", swallowKey);
    };
    openScrollRef.current = openScroll;

    let isCancelled = false;
    let actualLoaded = 0;

    // Check if DOM video element is ready
    if (typeof window !== "undefined" && (window as any).__TOWER_READY) {
      towerReadyRef.current = true;
    }

    const onTowerReady = () => {
      towerReadyRef.current = true;
    };
    window.addEventListener("tower:ready", onTowerReady, { once: true });

    /* 1. Fetch every piece of footage in full, tracking real bytes.
     *
     * Both files are kept as blobs and handed to the players as object URLs.
     * Counting bytes and throwing them away would leave the players to fetch
     * again — and these are served `max-age=0`, so that second fetch
     * revalidates rather than being free. Holding the bytes is what actually
     * guarantees nothing touches the network once the page is running, which
     * is the whole point of waiting here. */
    const downloadAll = async () => {
      const keys = Object.keys(MEDIA) as MediaKey[];
      const paths = keys.map(mediaPath);
      const sizes = new Array(keys.length).fill(0);
      const got = new Array(keys.length).fill(0);
      const urls: Partial<Record<MediaKey, string>> = {};

      const progress = () => {
        const total = sizes.reduce((a, b) => a + b, 0);
        const done = got.reduce((a, b) => a + b, 0);
        if (total > 0) actualLoaded = Math.min(100, (done / total) * 100);
      };

      try {
        /* Sized first so the bar reflects the whole job from the start rather
           than jumping when the second file appears. */
        const responses = await Promise.all(
          paths.map(async (path, i) => {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`fetch ${path}`);
            const len = res.headers.get("content-length");
            sizes[i] = len ? parseInt(len, 10) : ESTIMATED_SIZE;
            return res;
          }),
        );

        await Promise.all(
          responses.map(async (res, i) => {
            const reader = res.body?.getReader();
            if (!reader) {
              const blob = await res.blob();
              got[i] = sizes[i];
              urls[keys[i]] = URL.createObjectURL(
                blob.type ? blob : new Blob([blob], { type: MIME }),
              );
              progress();
              return;
            }
            const chunks: BlobPart[] = [];
            for (;;) {
              const { done, value } = await reader.read();
              if (done || isCancelled) break;
              chunks.push(value);
              got[i] += value.length;
              progress();
            }
            /* The type is not optional. A blob URL with an empty type gives
               the element nothing to identify the container by; Chrome sniffs
               it and copes, other browsers refuse to decode and the video
               simply never appears. */
            urls[keys[i]] = URL.createObjectURL(
              new Blob(chunks, { type: MIME }),
            );
          }),
        );

        if (!isCancelled) resolveMedia(urls);
      } catch {
        /* Blocked, offline, or out of memory — let the players fall back to
           the plain paths rather than leaving them without a source. */
        resolveMedia({});
        actualLoaded = 100;
      }
    };

    downloadAll();

    // 2. Fallback timer: ensure preloader never gets stuck regardless of network conditions
    const fallbackTimer = setTimeout(() => {
      /* Never trap anyone behind a bad connection: release the page and let
         the players stream from the network as they used to. */
      resolveMedia({});
      actualLoaded = 100;
      towerReadyRef.current = true;
    }, LOAD_TIMEOUT_MS);

    // 3. Smooth animation ticker for progress counter
    const startedAt = performance.now();
    let lastTickAt = startedAt;

    const tick = () => {
      if (isCancelled) return;
      lastTickAt = performance.now();

      /* Connection setup and the response headers both land before a single
         byte is counted, and a bar sitting at 0 through that reads as broken.
         This lets it creep on time alone for a moment, bounded hard, so it can
         never be more than a fifth ahead of work actually done. */
      const warm = Math.min(1, (lastTickAt - startedAt) / WARMUP_MS) * WARMUP_CEILING;

      // Cap at 95% until the DOM video is actually decoded and ready to render
      const maxTarget = towerReadyRef.current
        ? 100
        : Math.min(95, Math.max(actualLoaded, warm));

      /* Approach the cap; never cross it.
       *
       * `progressVal += Math.max(0.35, delta)` ignored the cap entirely: once
       * the bar reached it, delta was zero or negative and the minimum step
       * still added 0.35 every frame. The counter therefore climbed about 21%
       * a second on frame count alone and reached 100 in roughly five seconds
       * no matter how the download was going. A warm reload served the footage
       * from cache inside that window so it looked correct; a cold one had the
       * loader announce itself finished while the video was still arriving,
       * and the tower then turned up several seconds into the page.
       *
       * The minimum step stays — it is what keeps the approach from crawling
       * — but it can only ever move toward the cap. */
      const step = Math.max(0.35, (maxTarget - progressVal.current) * 0.12);
      progressVal.current = Math.min(maxTarget, progressVal.current + step);

      if (progressVal.current >= 100) {
        progressVal.current = 100;
        setProgress(100);
        setIsReady(true);
        return;
      }

      const p = Math.floor(progressVal.current);
      setProgress(p);

      if (p < 25) {
        setStatusText("INITIALIZING SYSTEM CORE");
      } else if (p < 60) {
        setStatusText("BUFFERING LOTUS TOWER FOOTAGE");
      } else if (p < 85) {
        setStatusText("DECODING 1200 INTRA-FRAME KEYFRAMES");
      } else if (p < 99) {
        setStatusText("SYNCHRONIZING 3D TOWER STAGE");
      } else {
        setStatusText("GENERATION 26 · ALL SYSTEMS READY");
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    /* The counter above rides requestAnimationFrame, which a browser stops
       delivering to a backgrounded tab. Switch apps mid-load and the bar
       freezes, then the page is still sitting behind it on return. If the
       frames have stopped arriving while everything is in fact loaded, finish
       without them. */
    const stallGuard = setInterval(() => {
      if (
        !isCancelled &&
        performance.now() - lastTickAt > 1200 &&
        towerReadyRef.current &&
        actualLoaded >= 99
      ) {
        progressVal.current = 100;
        setProgress(100);
        setIsReady(true);
        clearInterval(stallGuard);
      }
    }, 600);

    return () => {
      isCancelled = true;
      clearInterval(stallGuard);
      window.removeEventListener("tower:ready", onTowerReady);
      clearTimeout(fallbackTimer);
      smoothScroll.held = false;
      /* Unmounting mid-load must not leave the page refusing to scroll. */
      openScroll();
      document.body.style.overflow = "";
      smoothScroll.current?.start();
    };
  }, []);

  // 4. Exit Animation when progress reaches 100%
  useEffect(() => {
    if (!isReady || isDone) return;

    setStatusText("GENERATION 26 · ALL SYSTEMS READY");

    /* Tell the page to start its entrance now, while the panel still covers
       it. Everything it needs is already decoded — that is what being at 100
       means — so the only thing left is the fade-in, and running that here
       buys it the 450ms hold plus the 300ms before the panel moves. Announced
       once: this effect also re-runs if `onComplete` changes identity. */
    if (!announcedRef.current) {
      announcedRef.current = true;
      window.dispatchEvent(new CustomEvent("preloader:ready"));
    }

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const tl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          openScrollRef.current();
          smoothScroll.held = false;
          document.body.style.overflow = "";
          window.scrollTo(0, 0);
          if (smoothScroll.current) {
            smoothScroll.current.scrollTo(0, { immediate: true });
            smoothScroll.current.start();
          }
          window.dispatchEvent(new CustomEvent("preloader:complete"));
          onComplete?.();
        },
      });

      tl.to(titleRef.current, {
        opacity: 0,
        y: -30,
        filter: "blur(8px)",
        duration: 0.5,
        ease: "power2.inOut",
      })
        .to(
          barRef.current,
          {
            scaleX: 0,
            opacity: 0,
            duration: 0.4,
            ease: "power2.inOut",
          },
          0.1,
        )
        .to(
          container,
          {
            yPercent: -100,
            duration: 0.85,
            ease: "power4.inOut",
            onStart: () => {
              window.dispatchEvent(new CustomEvent("preloader:opening"));
            },
          },
          0.3,
        );
    }, 450);

    return () => clearTimeout(timer);
  }, [isReady, isDone, onComplete]);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      aria-label="Loading Generation 26"
      className="fixed inset-0 z-[999999] flex flex-col justify-between bg-[#07070A] p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-[450px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "var(--red-hot)" }}
      />

      {/* Top Telemetry Header */}
      <header className="relative z-10 flex w-full max-w-(--maxw) mx-auto items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-hot animate-ping" />
          <span className="font-mono-ui text-xs font-bold tracking-widest text-white uppercase">
            GENERATION 26
          </span>
        </div>
        <span className="badge-pill border-hairline/40 text-[10px] text-bone-muted">
          BOOT_SEQUENCE // LIVE
        </span>
      </header>

      {/* Center Stage: Title + Precision Progress Bar */}
      <div className="relative z-10 mx-auto flex w-full max-w-(--maxw) flex-col items-center justify-center text-center">
        <div ref={titleRef} className="flex flex-col items-center">
          <div className="relative inline-flex items-center">
            <h1 className="font-display text-[clamp(3.5rem,14vw,9.5rem)] leading-none tracking-[-0.01em] text-white">
              GENERATION
            </h1>
            <span
              className="font-display ml-2 text-[clamp(1.8rem,6vw,4.5rem)] text-red-hot drop-shadow-[0_0_16px_hsl(var(--red-hot-c)/0.5)]"
            >
              26
            </span>
          </div>

          <p className="font-mono-ui mt-2 text-[11px] font-bold tracking-[0.24em] text-bone-muted uppercase">
            Talents by <span className="brand-name">Echem</span> · Colombo
          </p>
        </div>

        {/* Dynamic Progress Bar & Readout */}
        <div className="mt-8 sm:mt-12 flex w-full max-w-[340px] sm:max-w-[420px] flex-col items-center gap-3">
          {/* Status Ticker */}
          <div className="flex w-full items-center justify-between font-mono-ui text-[10px] font-semibold tracking-wider text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-hot" />
              <span className="text-bone-muted truncate max-w-[240px] sm:max-w-none">{statusText}</span>
            </span>
            <span ref={percentRef} className="font-bold text-red-hot tabular-nums">
              [{String(progress).padStart(3, "0")}%]
            </span>
          </div>

          {/* Glowing Track */}
          <div
            ref={barRef}
            className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full bg-gradient-to-r from-red-dark via-red-hot to-red-bright transition-all duration-150 ease-out"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 12px hsl(var(--red-hot-c) / 0.8), 0 0 4px var(--red-hot)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Footer */}
      <footer className="relative z-10 flex w-full max-w-(--maxw) mx-auto items-center justify-between text-muted font-mono-ui text-[10px]">
        <span>ALL-INTRA GOP=1 // 30 FPS</span>
        <span className="text-bone-muted">PRELOADING HIGH-DEFINITION ASSETS</span>
      </footer>
    </div>
  );
}
