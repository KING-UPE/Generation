"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A panel for trying the site's accent colour on, live.
 *
 * The whole palette hangs off two custom properties — `--brand-h` and
 * `--brand-s`, at the top of globals.css — so picking a colour is picking two
 * numbers. Reading those off a hex code is guesswork, and editing them in the
 * stylesheet means a reload between every guess. Dragging them here repaints
 * every accent, gradient, glow and card as you move, which is the only honest
 * way to judge a colour this much of the page is painted with.
 *
 * This one ships. The people who have to agree on the colour are not the
 * people editing the stylesheet, so the panel goes where they are.
 *
 * What a visitor changes is theirs alone: the override is set on the root
 * element and remembered in their own localStorage, and reaches nobody else.
 * Copy hands them the two lines to send back, and pasting those into :root in
 * globals.css is what makes a colour the site's.
 */

const STORAGE_KEY = "gen26_theme_tuner";

/** The values currently committed in globals.css — the panel's baseline. */
const SHIPPED = { h: 3, s: 100 };

type Values = typeof SHIPPED;

/**
 * A hue on its own does not tell you what the site will look like, so each
 * preset is named for the thing it actually produces.
 */
const PRESETS: { name: string; h: number; s: number }[] = [
  { name: "Red", h: 3, s: 100 },
  { name: "Hot pink", h: 340, s: 100 },
  { name: "Orange", h: 20, s: 100 },
  { name: "Violet", h: 280, s: 90 },
  { name: "Cyan", h: 190, s: 95 },
];

/** The ramp, mirrored from globals.css, purely to draw the swatch strip. */
const RAMP: { label: string; dh: number; ds: number; l: number }[] = [
  { label: "--tint", dh: 9, ds: 0, l: 62 },
  { label: "--red-hot", dh: 0, ds: 0, l: 59 },
  { label: "--red-mid", dh: -3, ds: 0, l: 59 },
  { label: "--red", dh: -1, ds: 0, l: 44 },
  { label: "--red-deep", dh: -11, ds: -4, l: 28 },
  { label: "--red-black", dh: -15, ds: -9, l: 9 },
];

export default function ThemeTuner() {
  const [values, setValues] = useState<Values>(SHIPPED);
  /* Collapsed everywhere until it is asked for. It is a control panel sitting
     over the page, not part of it, so it stays a header on arrival whatever
     the screen -- which is also the safe first render, matching what the
     server sends. */
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);

  /* Restore before the first apply, so a reload does not flash the defaults.
   *
   * This has to be an effect rather than a lazy initial state: the panel is
   * rendered on the server too, and seeding it from localStorage would make
   * the first client render disagree with that markup.
   */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setValues({ ...SHIPPED, ...JSON.parse(raw) });
    } catch {
      /* private mode, cleared storage — the defaults are fine */
    }

    loaded.current = true;
  }, []);

  /**
   * Override the two properties on the root element.
   *
   * Everything that paints through CSS follows immediately, because it reads
   * the ramp rather than holding a copy of it. The starfield is the exception:
   * it paints to a canvas, which takes resolved colour strings, so it is told
   * to go and read them again.
   */
  useEffect(() => {
    if (!loaded.current) return;
    const root = document.documentElement;
    root.style.setProperty("--brand-h", String(values.h));
    root.style.setProperty("--brand-s", `${values.s}%`);
    window.dispatchEvent(new Event("brand:change"));

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      /* not worth failing the panel over */
    }
  }, [values]);

  const snippet = `--brand-h: ${values.h};\n--brand-s: ${values.s}%;`;
  const dirty = values.h !== SHIPPED.h || values.s !== SHIPPED.s;
  const swatch = (dh: number, ds: number, l: number) =>
    `hsl(${values.h + dh} ${Math.max(0, values.s + ds)}% ${l}%)`;

  return (
    <div
      /* Lenis must keep its hands off the panel, or dragging a slider scrolls
         the page underneath it. */
      data-lenis-prevent
      className="fixed bottom-4 left-4 z-[9999] w-[268px] select-none rounded-lg border border-white/15 bg-black/85 font-mono text-[11px] text-white shadow-2xl backdrop-blur-md"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 font-bold tracking-wider text-white/90">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full"
            style={{ background: swatch(0, 0, 59) }}
          />
          THEME COLOUR
          {dirty && <span className="text-red-hot">•</span>}
        </span>
        <span className="text-white/40">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="max-h-[70svh] overflow-y-auto border-t border-white/10 px-3 pb-3 pt-2">
          {/* The ramp itself, so you are judging the palette rather than one
              swatch — the deep end is what most of the page is painted with. */}
          <div className="mb-3 flex h-7 overflow-hidden rounded">
            {RAMP.map((r) => (
              <span
                key={r.label}
                title={r.label}
                className="flex-1"
                style={{ background: swatch(r.dh, r.ds, r.l) }}
              />
            ))}
          </div>

          <label className="mb-3 block">
            <span className="flex items-baseline justify-between">
              <span className="text-white/70">Hue</span>
              <span className="tabular-nums font-bold">{values.h}°</span>
            </span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={values.h}
              onChange={(e) => setValues((v) => ({ ...v, h: Number(e.target.value) }))}
              className="mt-1 w-full accent-red-hot"
              style={{
                /* The track carries the choice, so the slider is the picker. */
                background:
                  "linear-gradient(90deg, hsl(0 100% 55%), hsl(60 100% 55%), hsl(120 100% 55%), hsl(180 100% 55%), hsl(240 100% 55%), hsl(300 100% 55%), hsl(360 100% 55%))",
                borderRadius: 999,
              }}
            />
            <span className="block text-[10px] leading-tight text-white/35">
              where the whole palette sits on the colour wheel
            </span>
          </label>

          <label className="mb-3 block">
            <span className="flex items-baseline justify-between">
              <span className="text-white/70">Saturation</span>
              <span className="tabular-nums font-bold">{values.s}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={values.s}
              onChange={(e) => setValues((v) => ({ ...v, s: Number(e.target.value) }))}
              className="mt-1 w-full accent-red-hot"
            />
            <span className="block text-[10px] leading-tight text-white/35">
              drop it to mute every accent on the site at once
            </span>
          </label>

          <div className="mb-3 flex gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                title={p.name}
                onClick={() => setValues({ h: p.h, s: p.s })}
                className="h-6 flex-1 rounded border border-white/20 hover:border-white/60"
                style={{ background: `hsl(${p.h} ${p.s}% 55%)` }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setValues(SHIPPED)}
              className="flex-1 rounded border border-white/20 py-1.5 text-white/70 hover:bg-white/10"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="flex-1 rounded border border-red-hot/60 bg-red-hot/15 py-1.5 font-bold text-white hover:bg-red-hot/25"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-white/5 p-2 text-[10px] leading-relaxed text-white/60">
            {snippet}
          </pre>
          <p className="mt-1 text-[10px] leading-tight text-white/30">
            Send these two lines back to make it the site&apos;s colour.
          </p>
        </div>
      )}
    </div>
  );
}
