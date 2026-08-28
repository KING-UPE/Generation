"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = {
  /** The edition it starts on — last year's. */
  from?: string;
  /** The edition it turns into. */
  to?: string;
  /** Sizing utility — the rule and digit columns scale from this in `em`. */
  className?: string;
  delay?: number;
};

/**
 * Cell height, in em.
 *
 * Anton's digits carry 0.87em of ink above the baseline and 0.01em below, but
 * the font's own line box is 1.505em. Left at the default the digits would sit
 * in cells nearly twice their height and a blank band would slide through the
 * window between them. Sizing the cell — and its line-height — to the ink
 * makes consecutive digits tile, with ~0.02em of relief so nothing clips.
 */
const CELL = "0.9em";

export default function EditionMark({
  from = "25",
  to = "26",
  className = "",
  delay = 1.2,
}: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const stripRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const fromDigits = from.split("");
  const columns = to.split("").map((d, i) => {
    const start = Number(fromDigits[i] ?? d);
    const end = Number(d);
    const steps = (end - start + 10) % 10; // counts forward, so 9 → 0 works
    return {
      steps,
      rest: steps === 0 ? 0 : -(steps / (steps + 1)) * 100,
      items: Array.from({ length: steps + 1 }, (_, k) => (start + k) % 10),
    };
  });

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const strips = stripRefs.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        columns.forEach((c, i) => strips[i] && gsap.set(strips[i], { yPercent: c.rest }));
        return;
      }

      const moving = strips.filter(Boolean) as HTMLSpanElement[];
      gsap.set(moving, { yPercent: 0 });

      /* Turns over once, on load. */
      gsap.delayedCall(delay, () =>
        columns.forEach((c, i) => {
          const s = strips[i];
          if (!s || !c.steps) return;
          gsap.to(s, { yPercent: c.rest, duration: 1.7, ease: "power3.inOut" });
        }),
      );
    },
    { scope: rootRef, dependencies: [from, to] },
  );

  const cell = { height: CELL, lineHeight: CELL };

  return (
    <span
      ref={rootRef}
      className={"inline-flex shrink-0 items-stretch gap-[0.3em] " + className}
    >
      <span aria-hidden className="w-px shrink-0" style={{ background: "var(--grad-red)" }} />

      <span className="font-display flex select-none" style={{ color: "var(--red-hot)" }}>
        {columns.map((col, i) =>
          col.steps === 0 ? (
            /* Nothing to roll — render the digit flat, with no strip to move. */
            <span key={i} className="block text-center" style={cell}>
              {col.items[0]}
            </span>
          ) : (
            <span key={i} className="block overflow-hidden" style={{ height: CELL }}>
              <span
                ref={(el) => {
                  stripRefs.current[i] = el;
                }}
                className="block will-change-transform"
              >
                {col.items.map((n, j) => (
                  <span key={j} className="block text-center" style={cell}>
                    {n}
                  </span>
                ))}
              </span>
            </span>
          ),
        )}
      </span>
    </span>
  );
}
