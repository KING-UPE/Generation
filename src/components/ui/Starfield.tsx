"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type Star = {
  x: number;      // 0..1 of width
  y: number;      // 0..1 of the virtual sky
  r: number;      // radius in css px
  a: number;      // base alpha
  speed: number;  // twinkle rate
  phase: number;
  depth: number;  // 0 = far, 1 = near — drives parallax
  warm: boolean;  // a minority take the red accent
};

/** Cached halo sprite — cheaper than building a gradient per star per frame. */
function makeGlow(color: string, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color.replace(/[\d.]+\)$/, "0.22)"));
  grad.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/**
 * Fixed starfield sky. Stars twinkle, drift with scroll by depth, and lean
 * with the pointer. Runs on the GSAP ticker so it shares the site's clock.
 */
export default function Starfield() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    const glowCool = makeGlow("rgba(226,238,250,0.55)", 64);
    const glowWarm = makeGlow("rgba(255,90,60,0.55)", 64);

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      /* Measure the container: it can mount at zero size (background tab,
         a pane that gets sized later) and only the observer will tell us. */
      w = wrap.clientWidth || window.innerWidth;
      h = wrap.clientHeight || window.innerHeight;
      if (!w || !h) return false;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(280, Math.max(90, Math.round((w * h) / 8200)));
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random(),
          y: Math.random(),
          r: 0.5 + Math.random() * (0.7 + depth * 1.5),
          a: 0.18 + Math.random() * 0.62,
          speed: 0.4 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          depth,
          warm: Math.random() < 0.12,
        };
      });
      return true;
    };

    /* pointer lean */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / w - 0.5) * 2;
      mouse.ty = (e.clientY / h - 0.5) * 2;
    };

    const draw = () => {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      const t = reduced ? 0 : performance.now() / 1000;

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const scroll = window.scrollY || 0;
      const span = h * 1.9; // virtual sky height stars wrap within

      for (const s of stars) {
        const drift = scroll * (0.04 + s.depth * 0.16);
        let y = s.y * span - drift + mouse.y * (4 + s.depth * 16);
        y = ((y % span) + span) % span;
        if (y > h + 40) continue;

        const x = s.x * w + mouse.x * (4 + s.depth * 18);
        const twinkle = reduced ? 1 : 0.45 + 0.55 * Math.sin(t * s.speed + s.phase);
        const alpha = s.a * twinkle;
        if (alpha <= 0.02) continue;

        if (s.r > 1.5) {
          const size = s.r * 16;
          ctx.globalAlpha = alpha * 0.5;
          ctx.drawImage(s.warm ? glowWarm : glowCool, x - size / 2, y - size / 2, size, size);
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.warm ? "#FF8A6B" : "#E6EEFA";
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const rebuild = () => {
      if (build()) draw();
    };

    rebuild();

    const ro = new ResizeObserver(rebuild);
    ro.observe(wrap);

    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      gsap.ticker.add(draw);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(draw);
    };
  }, []);

  return (
    /*
     * Canvas only — no backdrop. This layer sits above the hero footage, so an
     * opaque gradient here would hide the tower. The page black comes from
     * <html> instead.
     */
    <div ref={wrapRef} aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
