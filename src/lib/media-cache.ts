"use client";

/**
 * The footage the preloader fetches in full before the page is shown, and the
 * handoff that lets the players use those exact bytes.
 *
 * Both videos are scrubbed or rate-controlled rather than simply played, so
 * either one reaching for the network mid-page shows up as a freeze you cannot
 * scroll past. Downloading them up front only helps if the players then reuse
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
 * Each player has a wide and a narrow cut of the same footage — identical
 * duration and frame rate, so every cue time and the cross-fade's frame maths
 * hold for either. Only one is ever fetched.
 *
 * The narrow cuts are not a compromise on what you see. `object-cover` crops
 * the tower to roughly a quarter of the frame's width on a phone, so 960px
 * across is still more detail than the screen can show; the saving is in
 * pixels that were being downloaded and then thrown away. Together they take
 * the blocking download from 22.8MB to 8.8MB.
 */
export const MEDIA = {
  tower: { wide: "/Tower.seek.mp4", narrow: "/Tower.seek.mobile.mp4" },
  film: { wide: "/Video.desktop.mp4", narrow: "/Video.mobile.mp4" },
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

/** Runs `fn` once the preloader has settled, immediately if it already has. */
export function onMediaResolved(fn: () => void): () => void {
  if (settled) {
    fn();
    return () => {};
  }
  waiting.add(fn);
  return () => waiting.delete(fn);
}
