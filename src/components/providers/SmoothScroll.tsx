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
      touchMultiplier: 0.8,
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
    /* Asked for before this existed — see `held`. */
    if (smoothScroll.held) lenis.stop();

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /*
     * A floor under the scroll event.
     *
     * ScrollTrigger normally hears about movement through the handler above, so
     * a page that moves without Lenis emitting — because Lenis is stopped, and
     * two things stop it: the preloader while it downloads, and the tower's drop
     * while it plays — leaves every scrubbed animation holding whatever progress
     * it had. Caught on the hero: scroll down across the tower's cue, come back
     * to the top, and the wordmark, the badges and the button are all still
     * faded out at scroll 0, because the last thing ScrollTrigger was told was
     * the position they faded at.
     *
     * One number compared per frame against what it was last told, on a ticker
     * that is already running. `update` is idempotent, so overlapping with the
     * scroll handler costs nothing.
     */
    let lastSeen = -1;
    const watchScroll = () => {
      const y = window.scrollY;
      /* Also while Lenis is held: a position that goes stale during the hold
         does not change again on its own, so a delta check alone would leave it
         stale until the reader moved — which is why it looked like scrolling was
         what brought the hero back. */
      if (y === lastSeen && !lenis.isStopped) return;
      lastSeen = y;
      ScrollTrigger.update();
    };
    gsap.ticker.add(watchScroll);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.remove(watchScroll);
      smoothScroll.current = null;
      lenis.destroy();
    };
  }, []);

  /**
   * Re-measure once the preloader lets the page go.
   *
   * It holds the scroll while the footage downloads, so every trigger built
   * during that hold measured a locked document — and nothing was correcting
   * them afterwards. Start scrolling before the loader finishes and the page
   * keeps those bounds, which is how it ends up unable to reach the bottom.
   */
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("preloader:complete", refresh, { once: true });
    return () => window.removeEventListener("preloader:complete", refresh);
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
