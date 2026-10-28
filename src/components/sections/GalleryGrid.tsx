/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Lightbox from "@/components/ui/Lightbox";
import { PHOTOS, photoSrcSet } from "@/lib/photos";

/**
 * Every Generation 25 photograph, laid out to be looked through rather than
 * flown through: a masonry of columns, each print in its own frame, opening
 * full size on a tap. Columns rather than a grid, so portrait and landscape
 * prints keep their shapes without leaving holes between rows.
 */
export default function GalleryGrid() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
        {PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`View: ${p.alt}`}
            data-cursor="view"
            data-cursor-label="VIEW"
            className="cut-shape-sm group relative mb-3 block w-full break-inside-avoid overflow-hidden bg-ink-2 sm:mb-4"
            style={{ aspectRatio: p.ratio }}
          >
            <img
              src={p.src}
              srcSet={photoSrcSet(p.src)}
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              alt=""
              loading={i < 8 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute inset-0 border border-hairline/60 transition-colors duration-300 group-hover:border-red-hot/70" />
          </button>
        ))}
      </div>

      <Lightbox
        shots={PHOTOS}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndex={setOpenIndex}
      />
    </>
  );
}
