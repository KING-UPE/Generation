/**
 * Shared, mutable scroll telemetry written by the Lenis provider and read
 * per-frame by effects that need velocity (marquee skew, image drift, etc).
 * Kept outside React so reads never trigger renders.
 */
export const scrollState = {
  velocity: 0,
  direction: 1 as number,
  progress: 0,
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
