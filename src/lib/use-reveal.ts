"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

type Options = {
  /** Reveal the element's children in sequence rather than the element itself. */
  children?: boolean;
  /** How far the targets rise, in px. */
  y?: number;
  stagger?: number;
};

/**
 * Fade-and-rise the first time the element is actually on screen.
 *
 * Watched rather than scroll-triggered, which is why this exists alongside the
 * ScrollTrigger reveals used everywhere else. The page is not at its final
 * height while these effects run: the tower and the film hold pins whose
 * spacers only reach full size once their footage resolves, and measured on
 * load the document is about 6700px against a settled 13100. A ScrollTrigger
 * built inside that window computes a start the page has already passed, fires
 * immediately, and `once: true` then kills it — spending the reveal while the
 * section is thousands of pixels below the fold. A `from` tween is worse still:
 * the next refresh rewinds it to its hidden state with nothing left alive to
 * play it forward, and the content is simply gone. An observer has no cached
 * geometry to go stale.
 *
 * The hidden state is armed inside the callback rather than before it, so that
 * hiding and revealing cannot come apart: if the callback never runs, nothing
 * was ever hidden and the targets render as themselves. The cost is that a
 * reader who lands on the section directly gets it without the reveal, which is
 * the right way round for a flourish.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, options: Options = {}) {
  const { children = false, y = 46, stagger = 0 } = options;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = children
      ? gsap.utils.toArray<HTMLElement>(root.children)
      : [root];
    if (targets.length === 0) return;

    let armed = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (!entry.isIntersecting) {
          if (!armed) {
            armed = true;
            gsap.set(targets, { y, opacity: 0 });
          }
          return;
        }

        io.disconnect();
        if (!armed) return;

        gsap.to(targets, {
          y: 0,
          opacity: 1,
          duration: 1.05,
          ease: "gen",
          stagger,
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    io.observe(root);
    return () => io.disconnect();
  }, [ref, children, y, stagger]);
}
