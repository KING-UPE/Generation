import type Lenis from "lenis";

/**
 * The live Lenis instance, published by the SmoothScroll provider so sections
 * can hold the page still (the film locks scrolling while it plays).
 *
 * Null when smooth scrolling is not running — which is the case under
 * `prefers-reduced-motion`. Callers must treat that as "cannot lock" rather
 * than falling back to freezing the document, so a reader who has asked for
 * less motion is never trapped in a section.
 */
export const smoothScroll: { current: Lenis | null; held: boolean } = {
  current: null,
  /**
   * Someone wants the page still, and may have asked before there was anything
   * to ask.
   *
   * Effects run deepest-first, so the preloader — which the provider wraps from
   * the layout — takes its lock a tick before Lenis exists, and a bare
   * `smoothScroll.current?.stop()` there goes nowhere. The provider reads this
   * as it creates the instance, so the hold survives the ordering instead of
   * depending on it.
   */
  held: false,
};
