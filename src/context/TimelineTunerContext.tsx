"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface TimelineConfig {
  heroRunway: number; // in vh, e.g. 55
  timelineHeight: number; // in svh, e.g. 500
  fadeDuration: number; // in seconds, e.g. 0.35
  narrowTarget: number; // 0.30 - 0.85, e.g. 0.50
  edition2023: number; // in seconds, e.g. 0.6
  edition2024: number; // in seconds, e.g. 3.6
  edition2025: number; // in seconds, e.g. 6.4
  edition2026: number; // in seconds, e.g. 8.4
}

export const DEFAULT_CONFIG: TimelineConfig = {
  heroRunway: 55,
  timelineHeight: 500,
  fadeDuration: 0.35,
  narrowTarget: 0.5,
  edition2023: 0.6,
  edition2024: 3.6,
  edition2025: 6.4,
  edition2026: 8.4,
};

interface TunerContextType {
  config: TimelineConfig;
  updateConfig: (key: keyof TimelineConfig, value: number) => void;
  resetConfig: () => void;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TimelineTunerContext = createContext<TunerContextType | null>(null);

const STORAGE_KEY = "gen26_timeline_tuner_config";

export function TimelineTunerProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<TimelineConfig>(DEFAULT_CONFIG);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const updateConfig = (key: keyof TimelineConfig, value: number) => {
    setConfig((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <TimelineTunerContext.Provider
      value={{ config, updateConfig, resetConfig, isOpen, setIsOpen }}
    >
      {children}
    </TimelineTunerContext.Provider>
  );
}

export function useTimelineConfig() {
  const ctx = useContext(TimelineTunerContext);
  if (!ctx) {
    return {
      config: DEFAULT_CONFIG,
      updateConfig: () => {},
      resetConfig: () => {},
      isOpen: false,
      setIsOpen: () => {},
    };
  }
  return ctx;
}
