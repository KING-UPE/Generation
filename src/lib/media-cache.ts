"use client";

/**
 * The footage the preloader fetches in full before the page is shown, and the
 * handoff that lets the players use those exact bytes.
 *
 * Both videos are scrubbed or rate-controlled rather than simply played, so
 * either one hitting the network mid-page shows up as a stall you cannot
 * scroll past. Downloading them up front only helps if the players then reuse
 * the download: the files are served `Cache-Control: public, max-age=0` with
 * an ETag, so a second request revalidates rather than being served outright,
 * and a range request against that is not guaranteed to reuse anything. The
 * preloader therefore keeps the bytes and hands each player an object URL, so
 * there is no second request to get wrong.
 *
 * `resolve` is always called — with real URLs on success, empty on failure or
 * timeout — because a player waiting on it must never be left without a src.
 */

export const PRELOAD_MEDIA = ["/Tower.seek.mp4", "/Video.mp4"] as const;

const resolved = new Map<string, string>();
let settled = false;
const waiting = new Set<() => void>();

/** The object URL for a path once downloaded, or the path itself as fallback. */
export function mediaSrc(path: string): string {
  return resolved.get(path) ?? path;
}

export function resolveMedia(entries: Record<string, string>) {
  if (settled) return;
  for (const [path, url] of Object.entries(entries)) resolved.set(path, url);
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
