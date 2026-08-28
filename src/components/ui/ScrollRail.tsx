"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

type Marker = { id: string; index: string; label: string };

/**
 * Fixed right-hand rail: a gradient progress thread plus the label of the
 * section currently under the fold line.
 */
export default function ScrollRail({ markers }: { markers: Marker[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      gsap.set(fillRef.current, { scaleY: 0, transformOrigin: "top" });

      const st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => gsap.set(fillRef.current, { scaleY: self.progress }),
      });

      const triggers: ScrollTrigger[] = [];
      markers.forEach((m, i) => {
        const el = document.getElementById(m.id);
        if (el) {
          triggers.push(
            ScrollTrigger.create({
              trigger: el,
              start: "top 55%",
              end: "bottom 55%",
              onToggle: (self) => self.isActive && setActive(i),
            }),
          );
        }
      });

      gsap.fromTo(
        rootRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 1, delay: 1.6, ease: "gen" },
      );

      return () => {
        st.kill();
        triggers.forEach((t) => t.kill());
      };
    },
    { dependencies: [markers] },
  );

  const current = markers[active];

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none fixed right-[max(1rem,2.2vw)] top-1/2 z-40 hidden -translate-y-1/2 lg:flex lg:flex-col lg:items-center lg:gap-5"
    >
      <span className="font-mono-ui text-[10px] tracking-[0.3em] text-bone/80">
        {current?.index}
      </span>

      <div className="relative h-40 w-px bg-hairline">
        <div
          ref={fillRef}
          className="absolute inset-x-0 top-0 h-full origin-top"
          style={{ background: "var(--grad-red)" }}
        />
      </div>

      <span
        className="font-mono-ui text-[10px] tracking-[0.3em] text-dim"
        style={{ writingMode: "vertical-rl" }}
      >
        {current?.label}
      </span>
    </div>
  );
}
