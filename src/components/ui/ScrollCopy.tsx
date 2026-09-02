"use client";

import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";

/* Token values mirrored from globals.css — GSAP needs resolved colors. */
const DIM = "#9E9EAA";
const BONE = "#FFFFFF";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Scrub range as a share of the viewport. Larger = slower illumination. */
  end?: string;
};

/**
 * Justified body copy that lights up word by word as it scrolls through the
 * viewport. SplitText leaves the inter-word whitespace intact, so the
 * `text-align: justify` rhythm survives the split.
 */
export default function ScrollCopy({
  children,
  className = "",
  end = "bottom 62%",
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      let split: SplitText | null = null;
      let anim: gsap.core.Tween | null = null;

      try {
        split = SplitText.create(el, {
          type: "words",
          wordsClass: "sc-word",
        });

        if (split.words && split.words.length > 0) {
          anim = gsap.fromTo(
            split.words,
            { color: DIM },
            {
              color: BONE,
              ease: "none",
              stagger: 0.9,
              scrollTrigger: {
                trigger: el,
                start: "top 78%",
                end,
                scrub: 0.6,
              },
            },
          );
        }
      } catch {
        gsap.set(el, { color: BONE });
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
    { scope: ref, dependencies: [children, end] },
  );

  return (
    <p ref={ref} className={"copy-justify " + className} style={{ color: DIM }}>
      {children}
    </p>
  );
}
