import type { Shot } from "@/components/ui/Lightbox";

export type Photo = Shot & { w: number; ratio: string };

/**
 * The Generation 25 photographs, shared by the fly-through on the home page
 * and the gallery page. Each carries the frame it is shown in, so portrait
 * subjects sit in portrait frames and landscape in landscape or square ones,
 * and its own width, which `photoSrcSet` needs.
 */
export const PHOTOS: Photo[] = [
  { src: "/img/photos/IAP09789.webp", alt: "A singer between the flame jets", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP06765.webp", alt: "A singer mid-phrase at the microphone", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/MNP-1424.webp", alt: "The crowd from the back of the field", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/IAP07837.webp", alt: "Two dancers in Kandyan costume mid-routine", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/IAP06752.webp", alt: "A duet in front of a wall of falling petals", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/MNP-1065.webp", alt: "Dancers in a row before the rock fortress backdrop", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP09542.webp", alt: "A performer in the crossfire of white beams", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/IAP06937.webp", alt: "Two performers in a blue wash on the open stage", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/IAP07843.webp", alt: "A Kandyan dancer with an arm raised", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/MNP-1186.webp", alt: "Beams over the stage and a standing crowd", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP06884.webp", alt: "A singer in the warm wash with the band behind her", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP06459.webp", alt: "A singer in a white gown against a starfield wall", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/IAP09052.webp", alt: "A dance troupe in line across the stage", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/MNP-1133.webp", alt: "A guitarist singing through the haze", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/MNP-1073.webp", alt: "The full troupe before the temple backdrop", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP09629.webp", alt: "A pair dancing between the teal panels", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP09467.webp", alt: "A singer in a cap mid-verse at the microphone", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/MNP-1583.webp", alt: "Faces at the barrier, lit from the stage", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/IAP07460.webp", alt: "A singer against a swirl of pink light", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/MNP-1129.webp", alt: "A singer against a wall of lights", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP07140.webp", alt: "A drama piece playing out on the open stage", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP09212.webp", alt: "Two singers sharing the microphone line", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/MNP-1194.webp", alt: "The stage in full, one performer at the centre", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/MNP-1121.webp", alt: "Two hosts on stage with the running order", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/IAP08170.webp", alt: "A singer on the chevron-lit stage", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/MNP-1200.webp", alt: "A singer alone in the green light", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP09701.webp", alt: "A dancer arched back in the haze", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/IAP06958.webp", alt: "A troupe in white spread across the stage", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/MNP-1023.webp", alt: "A host on stage with the running order", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/MNP-1174.webp", alt: "The room seated, one singer on the stage", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/MNP-1239.webp", alt: "A troupe in white across the stage", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/MNP-1151.webp", alt: "Two voices in the green wash", w: 1280, ratio: "3 / 4" },
  { src: "/img/photos/IAP06665.webp", alt: "A singer against a green stage wash", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/IAP07571.webp", alt: "A performer facing a full open-air crowd at dusk", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/MNP-1007.webp", alt: "A singer alone on the runway under the arena roof", w: 1920, ratio: "4 / 3" },
  { src: "/img/photos/IAP08596.webp", alt: "A singer on stage behind a curtain of sparks", w: 1920, ratio: "1 / 1" },
  { src: "/img/photos/IAP09433.webp", alt: "A speaker at the microphone in front of the stage wall", w: 1920, ratio: "4 / 3" },
];

/**
 * The sizes a photograph is stored at, for `srcset`: a 640 and a 1280 copy in
 * the folders beside it, then the original (1920 wide, or 1280 for a
 * portrait, which has no separate 1280 copy). Nothing on the page shows a
 * print anywhere near 1920 except the lightbox, and the fly-through has the
 * whole set on screen at once: decoded at full size that was some 360MB of
 * bitmaps, at 640 it is a tenth of that.
 */
export function photoSrcSet(src: string): string {
  const cut = src.lastIndexOf("/");
  const dir = src.slice(0, cut);
  const name = src.slice(cut + 1);
  const w = PHOTOS.find((p) => p.src === src)?.w ?? 1920;
  const set = [`${dir}/640/${name} 640w`];
  if (w > 1280) set.push(`${dir}/1280/${name} 1280w`);
  set.push(`${src} ${w}w`);
  return set.join(", ");
}
