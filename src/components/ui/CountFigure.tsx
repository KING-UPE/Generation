"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = {
  /** The figure itself. Rendered server-side, then counted up to on scroll-in. */
  value: number;
  /**
   * Sits to the left of the number so the row can be read at a glance rather
   * than as a column of digits. Decorative — the label under it carries the
   * meaning, and every mark is aria-hidden.
   */
  icon?: React.ReactNode;
  /**
   * Edge of the mark's box, as a CSS length. Deliberately taller than the
   * number beside it: the point of the mark is to land before anyone reads a
   * word, so it has to carry the cell on its own.
   */
  iconSize?: string;
  /** Sits after the number in red. Every figure we publish is a floor, not a total. */
  suffix?: string;
  suffixClassName?: string;
  label: string;
  /**
   * Font size of the number, as a CSS length.
   *
   * Passed inline rather than as a utility class on purpose: the display sizes
   * in globals.css are unlayered, so they win over anything Tailwind emits into
   * `@layer utilities` no matter which order the classes are written in.
   *
   * The floor carries a phone, where the vw term is far too small to: one up
   * per row leaves a six-figure number and its mark using two thirds of a
   * 375px screen, so the clamp starts well above what the viewport asks for.
   */
  size?: string;
  /**
   * `row` sets the mark beside the number; `stack` puts it above.
   *
   * The stack is for the cards, where the number has to clear the card fanned
   * in front of it — side by side, mark plus six figures is wider than the
   * strip of card left showing.
   */
  layout?: "row" | "stack";
  /** Off where something else already names the figure — the cards put the
   *  platform above the number, and printing it twice reads as a mistake. */
  showLabel?: boolean;
  className?: string;
};

const FORMAT = new Intl.NumberFormat("en-US");

/**
 * One number and its label, counting up from zero the first time it scrolls in.
 *
 * The final value is what renders on the server, so the figure is in the HTML
 * for a crawler and for anyone without JS. The count only rewinds to zero when
 * the element is still below the fold at mount, which is the only case where a
 * reader would not see the value flip out from under them.
 */
export default function CountFigure({
  value,
  icon,
  iconSize = "clamp(3rem, 4.2vw, 3.5rem)",
  suffix = "+",
  suffixClassName = "",
  label,
  size = "clamp(2.5rem, 3.6vw, 2.9rem)",
  layout = "row",
  showLabel = true,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const num = numRef.current;
      if (!root || !num) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const belowFold = root.getBoundingClientRect().top > window.innerHeight;
      if (reduced || !belowFold) return;

      const counter = { n: 0 };
      const write = () => {
        num.textContent = FORMAT.format(Math.round(counter.n));
      };
      write();

      gsap.to(counter, {
        n: value,
        duration: 2.1,
        ease: "power2.out",
        onUpdate: write,
        scrollTrigger: { trigger: root, start: "top 88%", once: true },
      });
    },
    { scope: rootRef, dependencies: [value] },
  );

  return (
    <div ref={rootRef} className={className}>
      {/* inline-flex, so a centred column centres the whole pair as one block
          while the number and its label stay ranged left against the mark */}
      <div
        className={
          layout === "stack"
            ? "flex flex-col items-start gap-4 text-left"
            : "inline-flex items-center gap-3.5 text-left md:gap-5"
        }
      >
        {icon ? (
          <span
            className="inline-flex shrink-0 items-center justify-center text-red-hot"
            style={{ width: iconSize, height: iconSize }}
          >
            {icon}
          </span>
        ) : null}

        <div>
          <p
            className="font-display leading-[0.9] tracking-[-0.02em] text-bone tabular-nums"
            style={{ fontSize: size }}
          >
            <span ref={numRef}>{FORMAT.format(value)}</span>
            <span className={`inline-block ml-[0.25em] text-red-hot ${suffixClassName}`.trim()}>{suffix}</span>
          </p>
          {showLabel ? <p className="eyebrow mt-2">{label}</p> : null}
        </div>
      </div>
    </div>
  );
}
