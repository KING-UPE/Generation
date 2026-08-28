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
export const smoothScroll: { current: Lenis | null } = { current: null };
