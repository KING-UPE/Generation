"use client";

import React, { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";

type Props = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  className?: string;
  /** Granularity of the reveal. `chars` is for short display lines only. */
  type?: "lines" | "words" | "chars";
  delay?: number;
  stagger?: number;
  start?: string;
  y?: number;
};

/**
 * Masked reveal built on GSAP SplitText. `autoSplit` re-splits on resize and
 * webfont load, so lines never end up measured against a fallback face.
 */
export default function RevealText({
  children,
  as: Tag = "p",
  className = "",
  type = "lines",
  delay = 0,
  stagger = 0.08,
  start = "top 86%",
  y = 118,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      let anim: gsap.core.Tween | null = null;
      let split: SplitText | null = null;

      try {
        split = SplitText.create(el, {
          type,
          mask: type,
        });

        const targets =
          type === "chars" ? split.chars : type === "words" ? split.words : split.lines;

        if (targets && targets.length > 0) {
          /*
           * Set the hidden state, then tween away from it — deliberately not a
           * `from`.
           *
           * A `from` tween owns the hidden state: it applies it on creation and
           * only gives it back by playing forward. Its trigger runs `once`, so
           * the moment that trigger is gone there is nothing left that can
           * restore the text, and any later refresh re-renders the tween at its
           * start and parks the characters back under their masks for good.
           * Caught on the hero: ten characters at translate(0%, 104%), none of
           * them visible, with the pointer-lit duplicate on top still fading in
           * — which is why the wordmark appeared only under the cursor.
           *
           * Split in two, a refresh has nothing to rewind: the `to` has already
           * run and the characters stay where it put them.
           */
          gsap.set(targets, { yPercent: y, opacity: 0 });

          anim = gsap.to(targets, {
            yPercent: 0,
            opacity: 1,
            duration: 1.05,
            ease: "gen",
            stagger,
            delay,
            scrollTrigger: { trigger: el, start, once: true },
          });
        }
      } catch {
        gsap.set(el, { opacity: 1 });
      }

      return () => {
        if (anim) {
          anim.scrollTrigger?.kill();
          anim.kill();
        }
        if (split) {
          split.revert();
        }
      };
    },
    { scope: ref, dependencies: [children, type, delay, stagger, start, y] },
  );

  return React.createElement(
    Tag,
    {
      ref,
      className,
    },
    children
  );
}
