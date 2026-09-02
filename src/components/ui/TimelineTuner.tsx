"use client";

import { useState } from "react";
import { useTimelineConfig, TimelineConfig, DEFAULT_CONFIG } from "@/context/TimelineTunerContext";

export default function TimelineTuner() {
  const { config, updateConfig, resetConfig, isOpen, setIsOpen } = useTimelineConfig();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `// Best Timings Configuration:
const TIMINGS = {
  heroRunway: ${config.heroRunway}vh,
  timelineHeight: ${config.timelineHeight}svh,
  fadeDuration: ${config.fadeDuration}s,
  narrowTarget: ${config.narrowTarget},
  editions: [
    { year: "2023", at: ${config.edition2023}s },
    { year: "2024", at: ${config.edition2024}s },
    { year: "2025", at: ${config.edition2025}s },
    { year: "2026", at: ${config.edition2026}s },
  ]
};`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      aria-label="Timeline Live Timing Controller"
      className="fixed bottom-6 left-6 z-[9999] font-mono-ui select-none"
    >
      {/* Floating Toggle Pill Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="cut-btn group flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold tracking-wider text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            boxShadow: "0 8px 32px rgba(255, 59, 47, 0.35)",
            background: "linear-gradient(135deg, rgba(20,20,26,0.95), rgba(10,10,14,0.98))",
          }}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-red-hot animate-pulse" />
          <span>⚙️ TIMELINE TUNER</span>
        </button>
      )}

      {/* Expanded Live Controller Side Panel */}
      {isOpen && (
        <div
          className="cut-card flex max-h-[85vh] w-[92vw] max-w-[380px] flex-col overflow-hidden bg-ink/95 p-5 text-white backdrop-blur-xl transition-all duration-300 sm:w-[380px]"
          style={{
            boxShadow: "0 24px 60px rgba(0,0,0,0.85), 0 0 32px rgba(255,59,47,0.25)",
            border: "1px solid rgba(255, 59, 47, 0.4)",
          }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-hot animate-ping" />
              <h4 className="font-mono-ui text-xs font-bold tracking-widest text-white uppercase">
                Live Timeline Tuner
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="cut-shape-xs flex h-7 w-7 cursor-pointer items-center justify-center bg-ink-2 text-xs text-bone-muted transition-colors hover:bg-red-hot hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Sliders Container */}
          <div className="custom-scroll my-3 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {/* 1. Hero Exit Runway */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone-muted">Hero Exit Runway</span>
                <span className="font-bold text-red-hot">{config.heroRunway}vh</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={config.heroRunway}
                onChange={(e) => updateConfig("heroRunway", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
              <span className="text-[10px] text-dim">
                Scroll distance spent dissolving Hero title and expanding stage
              </span>
            </div>

            {/* 2. Timeline Scroll Height */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone-muted">Timeline Scroll Height</span>
                <span className="font-bold text-red-hot">{config.timelineHeight}svh</span>
              </div>
              <input
                type="range"
                min="250"
                max="750"
                step="25"
                value={config.timelineHeight}
                onChange={(e) => updateConfig("timelineHeight", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
              <span className="text-[10px] text-dim">
                Total scroll runway across all 4 editions (longer = slower pacing)
              </span>
            </div>

            {/* 3. 2023 Edition Cue */}
            <div className="flex flex-col gap-1.5 border-t border-hairline/40 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone">2023 Arrival Cue</span>
                <span className="font-bold text-red-hot">{config.edition2023.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.1"
                value={config.edition2023}
                onChange={(e) => updateConfig("edition2023", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
            </div>

            {/* 4. 2024 Edition Cue */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone">2024 Arrival Cue</span>
                <span className="font-bold text-red-hot">{config.edition2024.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.5"
                step="0.1"
                value={config.edition2024}
                onChange={(e) => updateConfig("edition2024", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
            </div>

            {/* 5. 2025 Edition Cue */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone">2025 Arrival Cue</span>
                <span className="font-bold text-red-hot">{config.edition2025.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="7.8"
                step="0.1"
                value={config.edition2025}
                onChange={(e) => updateConfig("edition2025", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
            </div>

            {/* 6. 2026 Edition Cue */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone">2026 Arrival Cue</span>
                <span className="font-bold text-red-hot">{config.edition2026.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="6.5"
                max="9.6"
                step="0.1"
                value={config.edition2026}
                onChange={(e) => updateConfig("edition2026", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
            </div>

            {/* 7. Crossfade Duration */}
            <div className="flex flex-col gap-1.5 border-t border-hairline/40 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone-muted">Card Crossfade Duration</span>
                <span className="font-bold text-red-hot">{config.fadeDuration.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={config.fadeDuration}
                onChange={(e) => updateConfig("fadeDuration", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
            </div>

            {/* 8. Mobile Tower X Position */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-bone-muted">Mobile Tower Target (X)</span>
                <span className="font-bold text-red-hot">{Math.round(config.narrowTarget * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.85"
                step="0.02"
                value={config.narrowTarget}
                onChange={(e) => updateConfig("narrowTarget", Number(e.target.value))}
                className="accent-red-hot h-1.5 w-full cursor-pointer rounded-lg bg-hairline"
              />
              <span className="text-[10px] text-dim">
                50% = centered in middle, 74% = right side
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 border-t border-hairline/60 pt-3">
            <button
              type="button"
              onClick={handleCopy}
              className="cut-btn-outline flex-1 cursor-pointer py-2 text-center text-xs font-bold text-white transition-all hover:border-red-hot hover:text-red-hot"
            >
              {copied ? "✓ COPIED CONFIG!" : "📋 COPY TIMINGS"}
            </button>
            <button
              type="button"
              onClick={resetConfig}
              className="cut-shape-xs bg-ink-2 px-3 py-2 text-xs font-bold text-bone-muted transition-colors hover:bg-red-hot/20 hover:text-red-hot"
            >
              ↺ RESET
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
