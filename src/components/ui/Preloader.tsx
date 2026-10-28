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
import { PHOTOS, photoSmall } from "@/lib/photos";

/* Only used if the server withholds content-length; the real size is read from
   the response. Kept roughly honest so the bar is not wildly wrong when it is
   needed. */
const ESTIMATED_SIZE = 8_624_921; // the aftermovie, ~8.2 MB

/* The fly-through's prints are counted as images, not bytes, and weighed as
   this much each against the film -- roughly what a 640 copy is. */
const PRINT_WEIGHT = 44_000;

/* Held for the life of the page, so the prints stay in the document's image
   cache and the fly-through draws them without asking the network again. */
const heldPrints: HTMLImageElement[] = [];

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
 * How long the bar will hold at 95 waiting for the tower to report a frame,
 * once everything else is in.
 *
 * The gate below will not pass 95 until the tower says it has drawn, which is
 * what makes the page arrive with the tower already on it. But the tower has
 * to be able to say so -- no WebGL, a lost context -- so the wait is bounded.
 */
const TOWER_WAIT_MS = 8000;

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
    /* 0..100 over the film's bytes and the fly-through's prints together. */
    let actualLoaded = 0;
    /* The witness the release guard reads: set on every chunk and print, so a
       slow download keeps renewing its own deadline. */
    let lastByteAt = performance.now();

    if (typeof window !== "undefined" && (window as Window & { __TOWER_READY?: boolean }).__TOWER_READY) {
      towerReadyRef.current = true;
    }
    const onTowerReady = () => {
      towerReadyRef.current = true;
    };
    window.addEventListener("tower:ready", onTowerReady, { once: true });

    /*
     * 1. Everything the page plays, in full, before it opens: the after movie
     *    and the fly-through's prints.
     *
     * The page was opened on the tower alone once, with these following in
     * the background. On a slow connection the film was then reached before
     * it had arrived and stuttered as it streamed, and the prints were still
     * coming down as they flew past. So the bar is the download again.
     *
     * The film is kept as a blob and handed to the player as an object URL:
     * it is served `max-age=0`, so a second request would revalidate rather
     * than be free. The prints are loaded as images and held, which keeps
     * them in the document's image cache for the fly-through.
     */
    const controller = new AbortController();
    registerPreloadCancel(() => controller.abort());

    const keys = Object.keys(MEDIA) as MediaKey[];
    const paths = keys.map(mediaPath);
    const sizes = new Array(keys.length).fill(0);
    const got = new Array(keys.length).fill(0);
    const prints = PHOTOS.map((p) => photoSmall(p.src));
    let printsDone = 0;

    const measure = () => {
      lastByteAt = performance.now();
      const total = sizes.reduce((x, y) => x + y, 0) + prints.length * PRINT_WEIGHT;
      const done = got.reduce((x, y) => x + y, 0) + printsDone * PRINT_WEIGHT;
      if (total > 0) actualLoaded = Math.min(99, (done / total) * 100);
    };

    const downloadFilm = async () => {
      const urls: Partial<Record<MediaKey, string>> = {};
      try {
        /* Sized first so the bar reflects the whole job from the start. */
        const responses = await Promise.all(
          paths.map(async (path, i) => {
            const res = await fetch(path, { signal: controller.signal });
            if (!res.ok) throw new Error(`fetch ${path}`);
            const len = res.headers.get("content-length");
            sizes[i] = len ? parseInt(len, 10) : ESTIMATED_SIZE;
            measure();
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
              measure();
              return;
            }
            const chunks: BlobPart[] = [];
            for (;;) {
              const { done, value } = await reader.read();
              if (done || isCancelled) break;
              chunks.push(value);
              got[i] += value.length;
              measure();
            }
            /* The type is not optional. A blob URL with an empty type gives
               the element nothing to identify the container by; Chrome sniffs
               it and copes, other browsers refuse to decode and the video
               simply never appears. */
            urls[keys[i]] = URL.createObjectURL(new Blob(chunks, { type: MIME }));
          }),
        );
        if (!isCancelled) resolveMedia(urls);
      } catch {
        /* Blocked, offline, or out of memory: let the player fall back to
           the plain path rather than leaving it without a source. */
        resolveMedia({});
      }
    };

    /* Loaded and decoded, so the first frame they appear in does not wait on
       either. A print that fails still counts: one missing photograph must
       not hold the page. */
    const loadPrints = () =>
      Promise.all(
        prints.map(
          (src) =>
            new Promise<void>((done) => {
              const img = new Image();
              img.decoding = "async";
              const settle = () => {
                printsDone++;
                measure();
                done();
              };
              img.onload = () => {
                img.decode().then(settle, settle);
              };
              img.onerror = settle;
              img.src = src;
              heldPrints.push(img);
            }),
        ),
      );

    Promise.all([downloadFilm(), loadPrints()]).then(() => {
      /* Finishing is the authoritative signal, whatever the headers claimed:
         a withheld content-length leaves the ratio short of 100 for good. */
      actualLoaded = 100;
      clearInterval(releaseGuard);
    });

    /* 2. The escape hatch, for a connection that has stopped rather than one
     *    that is merely slow.
     *
     * Releasing here is a last resort: the player falls back to the plain
     * path and streams the footage itself. It is keyed to the download having
     * actually stalled, never to it merely being slow. */
    const startedLoad = performance.now();
    const releaseGuard = setInterval(() => {
      if (isCancelled) return;
      const now = performance.now();
      if (now - lastByteAt < STALL_MS && now - startedLoad < HARD_CAP_MS) return;
      clearInterval(releaseGuard);
      controller.abort();
      resolveMedia({});
      actualLoaded = 100;
    }, 1000);

    // 3. Smooth animation ticker for progress counter
    const startedAt = performance.now();
    let lastTickAt = startedAt;
    /* When everything finished arriving, so the wait for the tower's first
       frame can be given a limit. Zero until it has. */
    let downloadedAt = 0;

    const tick = () => {
      if (isCancelled) return;
      lastTickAt = performance.now();

      /* Connection setup and the response headers both land before a single
         byte is counted, and a bar sitting at 0 through that reads as broken.
         This lets it creep on time alone for a moment, bounded hard. */
      const warm = Math.min(1, (lastTickAt - startedAt) / WARMUP_MS) * WARMUP_CEILING;

      /* The gate: up to 90 on the bytes, 95 once they are all in, and 100
         only once the tower has drawn as well (or has had TOWER_WAIT_MS). */
      let maxTarget = 0;
      if (actualLoaded < 100) {
        maxTarget = Math.min(90, Math.max(actualLoaded * 0.9, warm));
        downloadedAt = 0;
      } else if (!towerReadyRef.current) {
        if (!downloadedAt) downloadedAt = lastTickAt;
        maxTarget = lastTickAt - downloadedAt > TOWER_WAIT_MS ? 100 : 95;
      } else {
        maxTarget = 100;
      }

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

      if (p < 20) {
        setStatusText("INITIALIZING SYSTEM CORE");
      } else if (p < 70) {
        setStatusText("BUFFERING AFTERMOVIE FOOTAGE");
      } else if (p < 90) {
        setStatusText("LOADING GENERATION 25 GALLERY");
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
        towerReadyRef.current &&
        actualLoaded >= 100
      ) {
        progressVal.current = 100;
        setProgress(100);
        setIsReady(true);
        clearInterval(stallGuard);
      }
    }, 600);

    return () => {
      isCancelled = true;
      /* Stop the download with the component: left running, a remount (dev
         mode mounts every effect twice) fetched the whole film a second time. */
      controller.abort();
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
