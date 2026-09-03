"use client";

import { useEffect, useState, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { smoothScroll } from "@/lib/smooth-scroll";

const VIDEO_SRC = "/HeroVideo.seek.mp4";
const ESTIMATED_SIZE = 2713449; // ~2.7 MB

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

  useEffect(() => {
    // Lock scrolling while preloader is active
    if (smoothScroll.current) smoothScroll.current.stop();
    document.body.style.overflow = "hidden";

    let isCancelled = false;
    let actualLoaded = 0;

    // 1. Fetch the video footage with real-time stream tracking
    const downloadVideo = async () => {
      try {
        const response = await fetch(VIDEO_SRC);
        if (!response.ok) throw new Error("Video fetch failed");

        const contentLength = response.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : ESTIMATED_SIZE;

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        let received = 0;
        while (!isCancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.length;
          actualLoaded = Math.min(100, (received / total) * 100);
        }
      } catch (err) {
        // Fallback simulation if fetch stream fails or is blocked
        actualLoaded = 100;
      }
    };

    downloadVideo();

    // 2. Fallback timer: ensure preloader never gets stuck regardless of network conditions
    const fallbackTimer = setTimeout(() => {
      actualLoaded = 100;
    }, 6000);

    // 3. Smooth animation ticker for progress counter
    const tick = () => {
      if (isCancelled) return;

      // Smoothly ease progress towards actualLoaded
      const delta = (actualLoaded - progressVal.current) * 0.12;
      progressVal.current += Math.max(0.4, delta);

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
        setStatusText("CACHING 300 INTRA-FRAME KEYFRAMES");
      } else {
        setStatusText("CALIBRATING 3D TIMELINE MATRIX");
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, []);

  // 4. Exit Animation when progress reaches 100%
  useEffect(() => {
    if (!isReady || isDone) return;

    setStatusText("GENERATION 26 · ALL SYSTEMS READY");

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const tl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          document.body.style.overflow = "";
          if (smoothScroll.current) smoothScroll.current.start();
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
              className="font-display ml-2 text-[clamp(1.8rem,6vw,4.5rem)] text-red-hot drop-shadow-[0_0_16px_rgba(255,59,47,0.5)]"
            >
              26
            </span>
          </div>

          <p className="font-mono-ui mt-2 text-[11px] font-bold tracking-[0.24em] text-bone-muted uppercase">
            Talents by ECheM · Colombo
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
                boxShadow: "0 0 12px rgba(255, 59, 47, 0.8), 0 0 4px #FF3B2F",
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
