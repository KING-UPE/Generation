"use client";

import { useEffect, useRef, useState } from "react";
import { smoothScroll } from "@/lib/smooth-scroll";

/**
 * A development-only panel for finding the right scroll feel.
 *
 * Every animation on this page is scroll-scrubbed, so "how fast the animation
 * runs" is not a duration anywhere in the code — it is how much scroll one
 * gesture produces. That is what these three control. Drag, scroll, judge, and
 * when a setting feels right, read the numbers off the panel and bake them
 * into SmoothScroll.tsx.
 *
 * Values persist in localStorage, so a reload keeps whatever you were trying
 * and you can compare two settings without losing the first.
 *
 * Never ships: the whole component returns null outside development, and the
 * mount point in layout.tsx is compiled out of production too.
 */

const STORAGE_KEY = "gen26_scroll_tuner";

/** The values currently committed in SmoothScroll.tsx — the panel's baseline. */
const SHIPPED = { wheel: 1, touch: 1.6, duration: 1.15 };

type Values = typeof SHIPPED;

const FIELDS: {
  key: keyof Values;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "wheel",
    label: "Wheel sensitivity",
    hint: "distance per notch — the main speed knob on a desktop",
    min: 0.2,
    max: 3,
    step: 0.05,
  },
  {
    key: "touch",
    label: "Touch sensitivity",
    hint: "distance per swipe on a phone",
    min: 0.4,
    max: 4,
    step: 0.1,
  },
  {
    key: "duration",
    label: "Glide",
    hint: "seconds of coasting after you let go",
    min: 0,
    max: 2.5,
    step: 0.05,
  },
];

export default function ScrollTuner() {
  const [values, setValues] = useState<Values>(SHIPPED);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);

  /* Restore before the first apply, so a reload does not flash the defaults. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setValues({ ...SHIPPED, ...JSON.parse(raw) });
    } catch {
      /* private mode, cleared storage — the defaults are fine */
    }
    loaded.current = true;
  }, []);

  /**
   * Push the values into the live Lenis instance.
   *
   * `duration` sits on `lenis.options` and is read on every scroll event, so
   * assigning it is enough. The two multipliers are not: Lenis copies them
   * into its VirtualScroll at construction, and that copy is what the wheel
   * and touch handlers actually read. Writing to `lenis.options.wheelMultiplier`
   * looks like it works and changes nothing — it has to go to the copy.
   *
   * Retried on an interval because SmoothScroll creates the instance in its
   * own effect, which may not have run yet.
   */
  useEffect(() => {
    if (!loaded.current) return;

    const apply = () => {
      const lenis = smoothScroll.current;
      if (!lenis) return false;
      lenis.options.duration = values.duration;
      const vs = (lenis as unknown as {
        virtualScroll?: { options: { wheelMultiplier: number; touchMultiplier: number } };
      }).virtualScroll;
      if (vs) {
        vs.options.wheelMultiplier = values.wheel;
        vs.options.touchMultiplier = values.touch;
      }
      return true;
    };

    if (apply()) return;
    const id = setInterval(() => {
      if (apply()) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [values]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      /* not worth failing the panel over */
    }
  }, [values]);

  if (process.env.NODE_ENV === "production") return null;

  const snippet =
    `duration: ${values.duration},\n` +
    `touchMultiplier: ${values.touch},\n` +
    `wheelMultiplier: ${values.wheel},`;

  const dirty =
    values.wheel !== SHIPPED.wheel ||
    values.touch !== SHIPPED.touch ||
    values.duration !== SHIPPED.duration;

  return (
    <div
      /* Lenis must keep its hands off the panel, or dragging a slider scrolls
         the page underneath it. */
      data-lenis-prevent
      className="fixed bottom-4 right-4 z-[9999] w-[268px] select-none rounded-lg border border-white/15 bg-black/85 font-mono text-[11px] text-white shadow-2xl backdrop-blur-md"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="font-bold tracking-wider text-white/90">
          SCROLL FEEL
          {dirty && <span className="ml-2 text-[#FF3B2F]">•</span>}
        </span>
        <span className="text-white/40">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-3 pb-3 pt-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="mb-3 block">
              <span className="flex items-baseline justify-between">
                <span className="text-white/70">{f.label}</span>
                <span className="tabular-nums font-bold">
                  {values[f.key].toFixed(2)}
                </span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: Number(e.target.value) }))
                }
                className="mt-1 w-full accent-[#FF3B2F]"
              />
              <span className="block text-[10px] leading-tight text-white/35">
                {f.hint}
              </span>
            </label>
          ))}

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
              className="flex-1 rounded border border-[#FF3B2F]/60 bg-[#FF3B2F]/15 py-1.5 font-bold text-white hover:bg-[#FF3B2F]/25"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <pre className="mt-2 whitespace-pre-wrap break-all rounded bg-white/5 p-2 text-[10px] leading-relaxed text-white/60">
            {snippet}
          </pre>
        </div>
      )}
    </div>
  );
}
