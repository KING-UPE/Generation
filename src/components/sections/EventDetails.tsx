/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useSyncExternalStore } from "react";
import LitTitle from "@/components/ui/LitTitle";
import { useReveal } from "@/lib/use-reveal";
import { EVENT } from "@/lib/event";
import { photoSrcSet } from "@/lib/photos";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

const LABEL =
  "font-mono-ui text-[10px] font-bold uppercase tracking-[0.2em] text-muted sm:text-[11px]";

/** Whole days from now until the event, or null once it has started. */
function daysToGo() {
  const ms = new Date(EVENT.iso).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : null;
}

/* The count only needs to be right when the page is opened. */
const noSubscription = () => () => {};

/**
 * The event at a glance, straight after the tower: the four things the old
 * site led with (date, venue, time, crowd) as cards in the same cut shape as
 * the timeline's, so the facts read as part of the page rather than as text
 * left on the black.
 *
 * Laid out as a block, not a row: the date is what people come for, so it
 * takes the large card and carries the countdown; the venue gets a photograph
 * of the arena; time and crowd share the remaining row. On a phone they stack
 * in that order, with time and crowd side by side.
 */
export default function EventDetails() {
  const headRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /* Counted on the client only: the server's clock and the reader's day can
     disagree, and a mismatch would be a hydration error. The server snapshot
     is null, so the first paint matches and the count fills in after. */
  const days = useSyncExternalStore(noSubscription, daysToGo, () => null);

  useReveal(headRef, { children: true, y: 34, stagger: 0.1 });
  useReveal(gridRef, { children: true, y: 30, stagger: 0.08 });

  return (
    <section id="details" className="relative py-20 md:py-28">
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <div ref={headRef}>
          <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
            The Event
          </LitTitle>
          <p className="text-lead mt-5 max-w-[36ch] md:mt-6">
            The fourth Generation, back at the Lotus Tower Open Arena.
          </p>
        </div>

        {/* One rhythm in every card: the label sits 0.75rem above its value,
            and everything is padded the same. From md up, time and crowd keep
            their content at the foot of the card, level with the venue's; on
            a phone they read from the top, so the two labels stay level when
            "To be announced" takes two lines. */}
        <div ref={gridRef} className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-14 md:grid-cols-4">
          {/* Date: the large card. */}
          <div className="cut-card-red col-span-2 flex flex-col gap-8 p-6 sm:p-8 md:row-span-2">
            <div className="flex flex-col gap-3">
              <span className={LABEL + " text-red-hot"}>Date</span>
              <p className="font-display text-[clamp(2.75rem,6.2vw,6rem)] leading-[0.9] tracking-[-0.02em] text-white">
                {EVENT.dayMonth}
                <span className="mt-[0.14em] block text-red-hot">{EVENT.year}</span>
              </p>
              <p className="text-base font-bold text-bone sm:text-lg">{EVENT.day}</p>
            </div>
            <div className="mt-auto flex items-baseline gap-3 border-t border-white/15 pt-5">
              {/* The space is held before the count arrives, so nothing shifts. */}
              <span className="font-display min-w-[2ch] text-[clamp(2.25rem,3.6vw,3.25rem)] leading-none tabular-nums text-white">
                {days ?? "\u00a0"}
              </span>
              <span className={LABEL}>
                {days === null ? "" : days === 1 ? "Day to go" : "Days to go"}
              </span>
            </div>
          </div>

          {/* Venue: over a photograph of the arena. */}
          <div className="cut-card relative col-span-2 flex min-h-[13rem] flex-col justify-end overflow-hidden p-6 sm:p-8">
            <img
              src="/img/photos/MNP-1186.webp"
              srcSet={photoSrcSet("/img/photos/MNP-1186.webp")}
              sizes="(max-width: 768px) 100vw, 50vw"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
            {/* Fades to the card's own colour, not to black: faded to black
                the card's lower edge and corner cut vanished into the page. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-3 via-ink-3/60 to-black/10" />
            <div className="relative flex flex-col gap-3">
              <span className={LABEL}>Venue</span>
              <div>
                <p className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  {EVENT.venue}
                </p>
                <p className="mt-1 text-sm font-medium text-bone-muted">{EVENT.city}</p>
              </div>
            </div>
          </div>

          <div className="cut-card flex flex-col justify-start gap-3 p-6 sm:p-8 md:justify-end">
            <span className={LABEL}>Time</span>
            <p className="text-lg font-extrabold leading-snug text-white sm:text-xl">{EVENT.time}</p>
          </div>

          <div className="cut-card flex flex-col justify-start gap-3 p-6 sm:p-8 md:justify-end">
            <span className={LABEL}>Expected crowd</span>
            <p className="font-display text-[clamp(2rem,3.4vw,3rem)] leading-none text-white">
              {EVENT.crowd.replace("+", "")}
              <span className="ml-1 text-red-hot">+</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
