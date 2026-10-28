/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import LitTitle from "@/components/ui/LitTitle";
import { useReveal } from "@/lib/use-reveal";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

/*
 * Last year's partners, as the 2025 card in the timeline lists them, and in
 * the same form: a dark cut card holding the mark on a small white chip. Both
 * marks are drawn on white, and set full size on white tiles they turned the
 * section into two lit panels.
 */
const PARTNERS = [
  {
    src: "/img/sponsors/slic.png",
    alt: "SLIC General, Sri Lanka Insurance",
    name: "SLIC General",
    title: "Official Insurer",
  },
  {
    src: "/img/sponsors/yfm.webp",
    alt: "Y FM, the original youth channel",
    name: "Y FM 92.7",
    title: "Official Media",
  },
];

export default function Partners() {
  const headRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useReveal(headRef, { children: true, y: 34, stagger: 0.1 });
  useReveal(listRef, { children: true, y: 30, stagger: 0.12 });

  return (
    <section id="partners" className="relative py-20 md:py-28">
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <div ref={headRef}>
          <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
            Partners
          </LitTitle>
          <p className="text-lead mt-5 max-w-[34ch] md:mt-6">
            Generation 25 was made possible by the partners who backed it.
          </p>
        </div>

        <ul ref={listRef} className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 md:mt-14 lg:max-w-[56rem]">
          {PARTNERS.map((p) => (
            <li key={p.src} className="cut-card group flex items-center gap-5 p-4 sm:p-5">
              <div className="cut-shape-xs flex h-20 w-28 shrink-0 items-center justify-center bg-white p-2 sm:h-24 sm:w-32">
                <img src={p.src} alt={p.alt} loading="lazy" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[0.2em] text-muted sm:text-[11px]">
                  {p.title}
                </p>
                <p className="mt-1.5 text-lg font-extrabold leading-tight text-white sm:text-xl">
                  {p.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
