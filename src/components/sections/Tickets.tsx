/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import LitTitle from "@/components/ui/LitTitle";
import Magnetic from "@/components/ui/Magnetic";
import { useReveal } from "@/lib/use-reveal";
import { EVENT, TICKET_URL } from "@/lib/event";
import { photoSrcSet } from "@/lib/photos";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

const LABEL = "font-mono-ui text-[11px] font-semibold uppercase tracking-[0.2em] text-dim";

/**
 * One ticket, drawn as one: a photograph from last year as the stub, the
 * event on the body, and a perforation between them with a bite out of each
 * edge (`.ticket` in globals.css). There is a single kind of ticket and no
 * price on the page, so the only thing to do here is book.
 */
export default function Tickets() {
  const headRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useReveal(headRef, { children: true, y: 34, stagger: 0.1 });
  useReveal(ticketRef, { y: 60 });

  return (
    <section id="tickets" className="relative py-20 md:py-28">
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <div ref={headRef}>
          <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
            Tickets
          </LitTitle>
          <p className="text-lead mt-5 max-w-[34ch] md:mt-6">
            One ticket, the whole night. Book yours online.
          </p>
        </div>

        {/* The outline is drawn on this wrapper, so it follows the chamfers
            and the bites the ticket itself is cut to. */}
        <div ref={ticketRef} className="ticket-edge mt-10 md:mt-14">
          {/* Stacked, stub on top, until there is room for the body beside
              it: at tablet width the body column was too narrow for the date. */}
          <div className="ticket cut-shape-sm grid bg-ink-3 lg:grid-cols-[1.15fr_1fr]">
            <div className="relative h-56 sm:h-64 md:h-72 lg:h-auto lg:min-h-[26rem]">
              <img
                src="/img/photos/IAP07571.webp"
                srcSet={photoSrcSet("/img/photos/IAP07571.webp")}
                sizes="(max-width: 1024px) 100vw, 54vw"
                alt="The crowd at Generation 25, facing the stage at dusk"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/40 lg:bg-gradient-to-r" />
            </div>

            <div
              className="relative flex flex-col justify-between gap-10 border-t-2 border-dashed border-hairline-bold p-7 sm:p-10 lg:border-t-0 lg:border-l-2 lg:p-12"
              style={{
                background:
                  "radial-gradient(120% 80% at 100% 0%, hsl(var(--red-black-c) / 0.9), transparent 62%)",
              }}
            >
              <div>
                <p className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-red-hot">
                  Admit one
                </p>
                <p className="font-display mt-4 text-[clamp(2.5rem,4.6vw,4.5rem)] leading-[0.9] text-white">
                  Generation <span className="text-red-hot">26</span>
                </p>
              </div>

              {/* Each fact two lines, the label and its value on one line, so
                  they stack: side by side the venue has no room to stay on
                  one line and wrapped to a third. */}
              <dl className="flex flex-col gap-5">
                <div>
                  <dt className={LABEL}>Date</dt>
                  <dd className="mt-2 text-sm font-bold leading-snug text-bone sm:text-base">
                    {EVENT.date}
                  </dd>
                </div>
                <div>
                  <dt className={LABEL}>Venue</dt>
                  <dd className="mt-2 text-sm font-bold leading-snug text-bone sm:text-base">
                    {EVENT.venue}, Colombo
                  </dd>
                </div>
              </dl>

              {TICKET_URL ? (
                <div>
                  <Magnetic strength={14} className="inline-block">
                    <a
                      href={TICKET_URL}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor="link"
                      className="cut-btn cut-btn-lg group"
                    >
                      Book Now
                      <span
                        aria-hidden
                        className="transition-transform duration-500 group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </a>
                  </Magnetic>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  {/* No link yet: shown, but not something to press. */}
                  {/* The outline button, dimmed: a faded red one read as a
                      broken button rather than one that is not open yet.
                      Inline, because the cut classes are unlayered and
                      would beat a utility on colour and hover. */}
                  <span
                    role="link"
                    aria-disabled="true"
                    className="cut-btn-outline cut-btn-lg"
                    style={{ color: "var(--muted)", pointerEvents: "none" }}
                  >
                    Book Now
                  </span>
                  <span className="text-sm font-medium text-muted">Ticket sales open soon.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
