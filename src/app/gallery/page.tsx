import type { Metadata } from "next";
import Link from "next/link";
import RevealText from "@/components/ui/RevealText";
import GalleryGrid from "@/components/sections/GalleryGrid";
import Footer from "@/components/sections/Footer";
import { PHOTOS } from "@/lib/photos";
import { EVENT, TICKET_URL, bookHref } from "@/lib/event";

const DESCRIPTION =
  "Photographs from Generation 25 at the Lotus Tower Open Arena, Colombo. " +
  "Generation 26 is on Saturday 12 December 2026.";

export const metadata: Metadata = {
  title: "Gallery",
  description: DESCRIPTION,
  alternates: { canonical: "/gallery" },
  openGraph: {
    type: "website",
    siteName: "Generation 26",
    title: "Gallery, Generation 25",
    description: DESCRIPTION,
    url: "/gallery",
    locale: "en_LK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gallery, Generation 25",
    description: DESCRIPTION,
  },
};

/* Plain anchors, not Link: off the home page Book Now goes to /#tickets,
   and a full load is what lets the home page follow the hash once its
   preloader is done. */
const bookProps = TICKET_URL ? { target: "_blank", rel: "noreferrer" } : {};

export default function GalleryPage() {
  return (
    <div className="relative w-full">
      <header className="mx-auto flex w-full max-w-(--maxw) items-center justify-between gap-4 px-(--gutter) pt-8 md:pt-10">
        <Link href="/" scroll={false} data-cursor="link" className="badge-pill tap-target">
          ← Generation 26
        </Link>
        <a href={bookHref(false)} {...bookProps} data-cursor="link" className="cut-btn text-xs">
          Book Now <span aria-hidden>→</span>
        </a>
      </header>

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-14 md:pt-20">
        <RevealText
          as="h1"
          type="chars"
          stagger={0.038}
          y={104}
          /* Line height left at 1.05, not the 0.85 the other display titles
             use: the reveal masks each line to its line box, and at 0.85
             the descender of the y was cut off. */
          className="font-display select-none text-[clamp(2.75rem,10vw,8.5rem)] leading-[1.05] tracking-[-0.015em] text-white md:text-bone"
        >
          Gallery
        </RevealText>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-3 md:mt-8">
          <p className="text-lead max-w-[36ch]">
            Generation 25 at the {EVENT.venue}.
          </p>
          <p className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.2em] text-dim">
            {PHOTOS.length} photographs
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-10 md:pt-14">
        <GalleryGrid />
      </section>

      <section className="mx-auto flex w-full max-w-(--maxw) flex-col items-start gap-6 px-(--gutter) py-20 md:flex-row md:items-center md:justify-between md:py-28">
        <p className="font-display text-[clamp(2.25rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.015em] text-white">
          See you at Generation <span className="text-red-hot">26</span>
          <span className="mt-2 block text-[0.45em] tracking-normal text-bone-muted">
            {EVENT.date}
          </span>
        </p>
        <a href={bookHref(false)} {...bookProps} data-cursor="link" className="cut-btn cut-btn-lg group">
          Book Now
          <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">
            →
          </span>
        </a>
      </section>

      <Footer />
    </div>
  );
}
