"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollState } from "@/lib/scroll-state";
import { smoothScroll } from "@/lib/smooth-scroll";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    });

    lenis.scrollTo(0, { immediate: true });

    lenis.on("scroll", (inst: Lenis) => {
      scrollState.velocity = inst.velocity;
      scrollState.direction = inst.direction;
      scrollState.progress = inst.progress;
      ScrollTrigger.update();
    });

    smoothScroll.current = lenis;

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      smoothScroll.current = null;
      lenis.destroy();
    };
  }, []);

  /**
   * Top of the page on every route change, and a fresh set of trigger bounds.
   *
   * Lenis outlives navigation — it is created once, up here in the layout — so
   * a route swap leaves it holding the previous page's scroll position, and the
   * links pass `scroll={false}` rather than let Next's own scroll handling
   * fight it for the same number. Both jobs land here instead.
   *
   * The refresh waits a frame: this effect runs after the incoming sections
   * have mounted and registered their triggers, but before the browser has laid
   * them out, so measuring now would measure the page mid-swap.
   */
  useEffect(() => {
    const lenis = smoothScroll.current;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);

    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <>{children}</>;
}
