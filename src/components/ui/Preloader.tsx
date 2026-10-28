"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { smoothScroll } from "@/lib/smooth-scroll";
import {
  MEDIA,
  mediaPath,
  registerPreloadCancel,
  resolveMedia,
  type MediaKey,
} from "@/lib/media-cache";

/**
 * When to give up on the footage and let the page through without it.
 *
 * This used to be a flat 25s from the start of the load, and that is what put
 * the tower twenty seconds behind the loader. 18.9MB does not arrive in 25s on
 * an ordinary connection, so on a cold visit the timer fired mid-download: it
 * declared the tower ready when no frame existed, released the page, and threw
 * away the bytes already in hand -- `resolveMedia({})` leaves the players with
 * the plain path, so the video element then started the same 12.5MB download
 * again from nothing. The loader was gone and the tower was still arriving,
 * which is a page you can scroll with nothing in it.
 *
 * Slow is not the same as broken, so the wait is measured from the last byte
 * received rather than from the beginning. A download that is still moving is
 * never abandoned however long it takes; one that has genuinely stopped is
 * released quickly. The hard cap is the backstop for a connection that trickles
 * forever without ever finishing.
 */
const STALL_MS = 12000;
const HARD_CAP_MS = 120000;

/**
 * How long the loader will wait for the tower to report a frame.
 *
 * The tower is the only thing the page waits for now. The gate below will not
 * reach 100 until the tower says it has drawn, which is what makes the page
 * arrive with the tower already on it. But the tower has to be able to say
 * so -- no WebGL, a lost context -- so the wait is bounded, measured from the
 * start of the load.
 */
const TOWER_WAIT_MS = 8000;

/** Container type for the preloaded blobs — see the note where they are made. */
const MIME = "video/mp4";

/**
 * How the bar runs while the tower is being built: on time, easing toward 90
 * and holding there until the tower reports its first frame. There are no
 * bytes to count any more -- the film is not waited for -- and building the
 * scene is one job with no progress of its own to read.
 */
const WARMUP_CEILING = 90;
const WARMUP_MS = 1400;

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
    /* The witness the release guard reads: set on every chunk, so a slow
       download keeps renewing its own deadline. */
    let lastByteAt = performance.now();

    // Check if DOM video element is ready
    if (typeof window !== "undefined" && (window as any).__TOWER_READY) {
      towerReadyRef.current = true;
    }

    /* The film waits for the tower: on a slow connection it would otherwise
       compete with the scene for the same bandwidth and hold up the only
       thing the page opens on. */
    let started = false;
    let startedLoad = 0;
    const startDownload = () => {
      if (started || isCancelled) return;
      started = true;
      startedLoad = performance.now();
      lastByteAt = startedLoad;
      downloadAll();
    };

    const onTowerReady = () => {
      towerReadyRef.current = true;
      startDownload();
    };
    window.addEventListener("tower:ready", onTowerReady, { once: true });

    /* 1. Fetch every piece of footage in full, behind the page, tracking real
     *    bytes.
     *
     * Both files are kept as blobs and handed to the players as object URLs.
     * Counting bytes and throwing them away would leave the players to fetch
     * again — and these are served `max-age=0`, so that second fetch
     * revalidates rather than being free. Holding the bytes is what actually
     * guarantees nothing touches the network once the page is running, which
     * is the whole point of waiting here. */
    const downloadAll = async () => {
      /* The player cancels this if it is reached before the bytes are all
         in, and streams instead -- see `needMedia`. */
      const controller = new AbortController();
      registerPreloadCancel(() => controller.abort());
      const keys = Object.keys(MEDIA) as MediaKey[];
      const paths = keys.map(mediaPath);
      const urls: Partial<Record<MediaKey, string>> = {};

      const progress = () => {
        lastByteAt = performance.now();
      };

      try {
        const responses = await Promise.all(
          paths.map(async (path) => {
            /* Low priority: it should never hold up anything on screen. */
            const res = await fetch(path, {
              signal: controller.signal,
              priority: "low",
            } as RequestInit);
            if (!res.ok) throw new Error(`fetch ${path}`);
            lastByteAt = performance.now();
            return res;
          }),
        );

        await Promise.all(
          responses.map(async (res, i) => {
            const reader = res.body?.getReader();
            if (!reader) {
              const blob = await res.blob();
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
        /* Nothing left to give up on. Without this the guard keeps ticking
           against a `lastByteAt` that has stopped moving, and twelve seconds
           later calls resolveMedia again -- harmless, since that is guarded,
           but it should not be relying on that. */
        clearInterval(releaseGuard);
      } catch {
        /* Blocked, offline, or out of memory — let the players fall back to
           the plain paths rather than leaving them without a source. */
        resolveMedia({});
      }
    };

    if (towerReadyRef.current) startDownload();

    /* 2. The escape hatch, for a connection that has stopped rather than one
     *    that is merely slow.
     *
     * Releasing here is a last resort: the player falls back to the plain
     * path and streams the footage itself. It is keyed to the download having
     * actually stalled, never to it merely being slow. */
    const releaseGuard = setInterval(() => {
      if (isCancelled || !started) return;
      const now = performance.now();
      if (now - lastByteAt < STALL_MS && now - startedLoad < HARD_CAP_MS) return;
      clearInterval(releaseGuard);
      resolveMedia({});
    }, 1000);

    // 3. Smooth animation ticker for progress counter
    const startedAt = performance.now();
    let lastTickAt = startedAt;

    const tick = () => {
      if (isCancelled) return;
      lastTickAt = performance.now();

      const elapsed = lastTickAt - startedAt;
      const warm = WARMUP_CEILING * (1 - Math.exp(-elapsed / WARMUP_MS));

      /* The gate: 100 only once the tower has drawn its first frame, or
         once it has had TOWER_WAIT_MS to try. The film is not part of it. */
      const maxTarget =
        towerReadyRef.current || elapsed > TOWER_WAIT_MS ? 100 : Math.min(90, warm);

      const remaining = maxTarget - progressVal.current;
      const step = remaining > 0 ? Math.max(0.25, remaining * 0.12) : 0;
      progressVal.current = Math.min(maxTarget, progressVal.current + step);

      if (progressVal.current >= 100) {
        progressVal.current = 100;
        setProgress(100);
        setIsReady(true);
        return;
      }

      const p = Math.floor(progressVal.current);
      setProgress(p);

      if (p < 40) {
        setStatusText("INITIALIZING SYSTEM CORE");
      } else if (p < 85) {
        setStatusText("BUILDING LOTUS TOWER GEOMETRY");
      } else if (p < 99) {
        setStatusText(
          !towerReadyRef.current
            ? "SYNCHRONIZING LOTUS TOWER STAGE"
            : "FINALIZING STAGE PRESENTATION"
        );
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
        towerReadyRef.current
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
      clearInterval(releaseGuard);
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
              {/* Two digits for the whole climb -- 00 through 99 -- and three
                  only at 100, which needs them. Padding to three all the way
                  put a leading zero on every reading but the last. */}
              [{String(progress).padStart(2, "0")}%]
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
        <span>REAL-TIME 3D // WEBGL</span>
        <span className="text-bone-muted">PRELOADING HIGH-DEFINITION ASSETS</span>
      </footer>
    </div>
  );
}
