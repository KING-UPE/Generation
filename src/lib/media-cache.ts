"use client";

/**
 * The footage the preloader fetches in full before the page is shown, and the
 * handoff that lets the player use those exact bytes.
 *
 * Only the aftermovie is footage now — the tower is drawn in code (see
 * src/lib/lotus-tower). It is rate-controlled rather than simply played, so
 * reaching for the network mid-page shows up as a freeze you cannot scroll
 * past. Downloading them up front only helps if the players then reuse
 * the download: the files are served `Cache-Control: public, max-age=0` with an
 * ETag, so a second request revalidates rather than being served outright, and
 * a range request against that is not guaranteed to reuse anything. The
 * preloader therefore keeps the bytes and hands each player an object URL, so
 * there is no second request to get wrong.
 *
 * `resolve` is always called — with real URLs on success, empty on failure or
 * timeout — because a player waiting on it must never be left without a src.
 */

/** Matches the `md` breakpoint the sections lay out against. */
const NARROW = 768;

/**
 * A wide and a narrow cut of the same footage — identical duration and frame
 * rate, so every cue time holds for either. Only one is ever fetched.
 *
 * The aftermovie uses one file for both. On a phone the film fills the full
 * screen height and is cropped at the sides, so a phone needs every one of
 * the 720 lines — a narrower cut would be upscaled further and look softer.
 * The file is a visually lossless re-encode of the delivered edit, video only:
 * it always plays muted, so it carries no audio track.
 */
export const MEDIA = {
  film: { wide: "/Aftermovie.mp4", narrow: "/Aftermovie.mp4" },
} as const;

export type MediaKey = keyof typeof MEDIA;

/**
 * Which cut this device gets. Read once per call rather than cached, but only
 * ever called before the fetch and when a player takes its source — a viewport
 * that crosses the breakpoint mid-visit keeps whatever it already downloaded,
 * which is the right trade against fetching a second copy.
 */
export function mediaPath(key: MediaKey): string {
  const narrow =
    typeof window !== "undefined" && window.innerWidth < NARROW;
  return narrow ? MEDIA[key].narrow : MEDIA[key].wide;
}

const resolved = new Map<MediaKey, string>();
let settled = false;
const waiting = new Set<() => void>();

/** The object URL for a player once downloaded, or its path as a fallback. */
export function mediaSrc(key: MediaKey): string {
  return resolved.get(key) ?? mediaPath(key);
}

export function resolveMedia(entries: Partial<Record<MediaKey, string>>) {
  if (settled) return;
  for (const [key, url] of Object.entries(entries) as [MediaKey, string][]) {
    resolved.set(key, url);
  }
  settled = true;
  waiting.forEach((fn) => fn());
  waiting.clear();
}

/**
 * The preloader waits for the film, so the player normally finds it settled.
 * If the download stalled and the loader let the page through anyway, the
 * player asks for it here as it comes near: the download is cancelled and the
 * player streams the plain path, so it is never reached empty.
 */
let cancelPreload: (() => void) | null = null;

export function registerPreloadCancel(fn: () => void) {
  cancelPreload = fn;
}

/** Called by a player about to be seen: settle now, streaming if need be. */
export function needMedia() {
  if (settled) return;
  cancelPreload?.();
  resolveMedia({});
}

/** Runs `fn` once the preloader has settled, immediately if it already has. */
export function onMediaResolved(fn: () => void): () => void {
  if (settled) {
    fn();
    return () => {};
  }
  waiting.add(fn);
  return () => waiting.delete(fn);
}
