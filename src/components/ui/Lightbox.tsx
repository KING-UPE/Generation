"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { smoothScroll } from "@/lib/smooth-scroll";

export type Shot = { src: string; alt: string };

type Props = {
  shots: Shot[];
  /** Index of the shot to show, or null for closed. */
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
};

/**
 * A full-frame view of one photograph.
 *
 * Rendered through a portal rather than in place. The gallery lives inside a
 * sticky wrapper that clips its overflow, and its field carries a transform —
 * either of which makes a `fixed` child position against that ancestor instead
 * of the viewport, so an overlay written where it is used would be trapped in
 * the tunnel it is trying to cover.
 *
 * The tunnel is scroll-driven, so Lenis is stopped for as long as this is up:
 * a wheel gesture over the overlay would otherwise fly the prints behind it.
 */
export default function Lightbox({ shots, index, onClose, onIndex }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const open = index !== null;

  const go = useCallback(
    (step: number) => {
      if (index === null) return;
      onIndex((index + step + shots.length) % shots.length);
    },
    [index, onIndex, shots.length],
  );

  /*
   * Opening and closing only.
   *
   * Deliberately not keyed on the index: `go` changes with every step, and
   * with the whole thing in one effect a prev/next tore this down and replayed
   * it -- which fades the backdrop from zero, so the page behind flashed
   * through between photographs. The backdrop is put up once and stays up
   * until it comes down.
   */
  useEffect(() => {
    if (!open) return;

    /* Animated rather than transitioned from React state: a state flag set on
       open is a render inside an effect, and the entrance is one tween. */
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: "gen" });
    closeRef.current?.focus();

    const lenis = smoothScroll.current;
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [open]);

  /* Rebinding a listener as the index moves costs nothing and shows nothing. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  /* The photograph changes, the backdrop does not. */
  useEffect(() => {
    if (index === null) return;
    gsap.fromTo(
      figureRef.current,
      { opacity: 0.4, scale: 0.985 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "gen" },
    );
  }, [index]);

  /* Nothing to portal into on the server -- and by the time this is open, a
     click has happened, so the document is certainly there. */
  if (index === null || typeof document === "undefined") return null;
  const shot = shots[index];

  return createPortal(
    <div
      ref={overlayRef}
      /* Lenis is stopped anyway, but this also keeps it off the overlay's own
         scrolling on a short screen. */
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt}
      onClick={onClose}
      className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-16 sm:px-8"
      style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        data-cursor="link"
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center border border-hairline text-bone transition-colors hover:border-red-hot hover:text-red-hot sm:right-8 sm:top-8"
      >
        <svg
          aria-hidden
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </button>

      {shots.length > 1 && (
        <>
          <Arrow side="left" onClick={() => go(-1)} />
          <Arrow side="right" onClick={() => go(1)} />
        </>
      )}

      {/* Stops a click on the photograph itself from closing. */}
      <figure
        ref={figureRef}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shot.src}
          alt={shot.alt}
          className="cut-shape max-h-[82svh] w-auto max-w-full object-contain"
        />
      </figure>
    </div>,
    document.body,
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      data-cursor="link"
      aria-label={side === "left" ? "Previous photograph" : "Next photograph"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={
        "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-hairline text-bone transition-colors hover:border-red-hot hover:text-red-hot " +
        (side === "left" ? "left-2 sm:left-8" : "right-2 sm:right-8")
      }
    >
      <svg
        aria-hidden
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: side === "left" ? "rotate(180deg)" : undefined }}
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  );
}
