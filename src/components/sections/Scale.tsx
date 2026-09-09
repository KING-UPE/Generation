"use client";

import { useEffect, useRef, useState } from "react";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import CountFigure from "@/components/ui/CountFigure";
import {
  IconStudents,
  IconYouTube,
  IconTelegram,
  IconFacebook,
  IconTikTok,
} from "@/components/ui/icons";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

type Card = {
  value: number;
  label: string;
  icon: React.ReactNode;
  /** Top and bottom of the card's own gradient. */
  from: string;
  to: string;
  /** Where it sits in the fan: degrees, and how far it drops. */
  rotate: number;
  drop: number;
};

/**
 * Echem's standing audience, before a single ticket moves.
 *
 * The gradients run bright to deep left to right, so the fan reads as one
 * graded sweep rather than five cards that happen to be red. Each is still
 * built from the ramp — --red-hot down through --red-deep and past it — with
 * the card's own black underneath, which is what keeps them apart without
 * reaching for a second hue. Every stop is stated as an offset from
 * --brand-h, so the fan follows the site's accent wherever it is set.
 */
const CARDS: Card[] = [
  {
    value: 20000,
    label: "Students Across Batches",
    icon: <IconStudents />,
    from: "var(--red-hot)",
    to: "var(--red-deep)",
    rotate: -14,
    drop: 46,
  },
  {
    value: 325000,
    label: "YouTube Community",
    icon: <IconYouTube />,
    from: "hsl(calc(var(--brand-h) - 3) calc(var(--brand-s) - 9%) 54%)",
    to: "hsl(calc(var(--brand-h) - 12) calc(var(--brand-s) - 4%) 22%)",
    rotate: -7,
    drop: 13,
  },
  {
    value: 209000,
    label: "Telegram Community",
    icon: <IconTelegram />,
    from: "var(--red)",
    to: "hsl(calc(var(--brand-h) - 15) calc(var(--brand-s) - 5%) 15%)",
    rotate: 0,
    drop: 0,
  },
  {
    value: 86000,
    label: "Facebook Community",
    icon: <IconFacebook />,
    from: "hsl(calc(var(--brand-h) - 11) calc(var(--brand-s) - 13%) 41%)",
    to: "hsl(calc(var(--brand-h) - 14) calc(var(--brand-s) - 6%) 12%)",
    rotate: 7,
    drop: 13,
  },
  {
    value: 41000,
    label: "TikTok Community",
    icon: <IconTikTok />,
    from: "hsl(calc(var(--brand-h) - 12) calc(var(--brand-s) - 5%) 32%)",
    to: "hsl(calc(var(--brand-h) - 14) calc(var(--brand-s) - 19%) 8%)",
    rotate: 14,
    drop: 46,
  },
];

/**
 * Card width and how much of it the next card covers, per breakpoint.
 *
 * The overlap is the whole design problem here: fanned tightly the deck looks
 * better and every figure but the last is cut in half by the card in front. So
 * the exposed strip is set from the widest number the section carries, and the
 * cards are made wide enough to be worth looking at on top of that rather than
 * the other way round.
 *
 * The fan is desktop only, and not for want of trying to keep it. It measures
 * 1060px across; fitting that into a 375px screen is a scale of 0.32, which
 * puts a six-figure number at about eight pixels. Below lg the same cards are
 * laid out two up instead — small, but readable, which the fan would not be.
 */
const CARD_W = 260;
const STRIP = 200;

/**
 * Card order for the two-up grid.
 *
 * Five cards over two columns leaves one alone on the last row, and that row is
 * full width — so it goes to whichever figure is widest, which is the one that
 * most wants the space. Derived rather than written down, so it follows the
 * numbers if they change. The fan keeps the declared order, where the gradients
 * run bright to deep across it.
 */
const WIDEST = CARDS.reduce((a, b) => (b.value > a.value ? b : a));
const PHONE_CARDS = [...CARDS.filter((c) => c !== WIDEST), WIDEST];

const EASE = "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * The card itself: the paint, and the lift when it is the one being pointed at.
 *
 * It carries no hover handlers of its own. Which card is hovered is decided by
 * the deck, from geometry -- see the notes there.
 */
function ScaleCard({
  card,
  lifted,
  dimmed,
  className = "",
  style,
}: {
  card: Card;
  lifted?: boolean;
  dimmed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={
        "relative flex flex-col justify-between overflow-hidden rounded-[26px] p-5 sm:p-6 " +
        className
      }
      style={{
        background: `linear-gradient(158deg, ${card.from} 0%, ${card.to} 58%, hsl(calc(var(--brand-h) - 20) 38% 3%) 100%)`,
        boxShadow: lifted
          ? "0 26px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.16) inset"
          : "0 18px 44px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.10) inset",
        /* Darkened, never faded. At opacity 0.62 the card behind showed through
           every overlap in the fan, so dimming one card revealed the edges of
           two others — brightness keeps them solid. */
        filter: dimmed ? "brightness(0.5)" : "none",
        transition: EASE,
        ...style,
      }}
    >
      <span
        aria-hidden
        className="inline-flex h-12 w-12 items-center justify-center text-white/90"
      >
        {card.icon}
      </span>

      {/* The platform names the figure here rather than under it. Pinned top and
          bottom with nothing between, the card was mostly empty gradient. */}
      <div>
        {/* Wrapped to whatever the fan actually leaves visible. The deck
            overlaps, so a label wider than the exposed strip slides under the
            next card -- "Students Across Batches" did. The phone grid, where
            nothing overlaps, gets the full width. */}
        <h3
          className="font-display leading-[1.05] tracking-[-0.01em] text-white/95"
          style={{
            fontSize: "clamp(1rem, 1.6vw, 1.3rem)",
            maxWidth: "var(--label-max, 100%)",
          }}
        >
          {card.label}
        </h3>

        <div className="mt-3 rounded-2xl bg-black/45 px-3.5 py-3 backdrop-blur-sm sm:px-4 sm:py-3.5">
          <CountFigure
            layout="stack"
            showLabel={false}
            value={card.value}
            label={card.label}
            size="clamp(1.5rem, 2.4vw, 2rem)"
          />
        </div>
      </div>
    </div>
  );
}

export default function Scale() {
  const [hovered, setHovered] = useState<number | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  /*
   * Which card is under the pointer, worked out from geometry rather than from
   * what the browser reports is under it.
   *
   * Hover used to be mouseenter and mouseleave on the cards themselves, and in
   * a fan that overlaps by sixty pixels those events describe a shape that
   * hover is busy changing. The lifted card rises 26px, unwinds most of its
   * rotation, scales to 1.05 and jumps to z-index 20 -- so the instant it
   * lights up it owns area it did not own a frame earlier, and gives up area
   * it did. Near an edge that oscillates; inside an overlap the two cards
   * trade places for the pointer, which is the switching.
   *
   * The wrapper measured here sits at the resting pose and never moves, and
   * the lift is applied to the card inside it. Testing the pointer against
   * those boxes makes the answer a pure function of position, so there is no
   * path from the visual state back into the hover state.
   *
   * Front-most first by resting order, deliberately not by z-index: z-index is
   * one of the things hover changes.
   */
  const zones = useRef<{ index: number; r: DOMRect }[]>([]);
  const deckAt = useRef({ x: 0, y: 0 });

  const measure = () => {
    const deck = deckRef.current;
    if (!deck) return zones.current;
    zones.current = Array.from(
      deck.querySelectorAll<HTMLElement>("[data-card-index]"),
    ).map((el) => ({ index: Number(el.dataset.cardIndex), r: el.getBoundingClientRect() }));
    const dr = deck.getBoundingClientRect();
    deckAt.current = { x: dr.left, y: dr.top };
    return zones.current;
  };

  /* The boxes are viewport coordinates, so a scroll invalidates them while the
     pointer sits still. The deck's own box is laid out rather than transformed,
     which makes it a cheap witness: if it has moved, measure again. */
  const refresh = () => {
    const deck = deckRef.current;
    if (!deck || !zones.current.length) return measure();
    const dr = deck.getBoundingClientRect();
    if (Math.abs(dr.left - deckAt.current.x) > 0.5 || Math.abs(dr.top - deckAt.current.y) > 0.5) {
      return measure();
    }
    return zones.current;
  };

  const onDeckMove = (e: React.PointerEvent) => {
    const list = refresh();
    for (let i = list.length - 1; i >= 0; i--) {
      const { r } = list[i];
      if (
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      ) {
        const index = list[i].index;
        setHovered((prev) => (prev === index ? prev : index));
        return;
      }
    }
    /* A gap between two boxes belongs to neither. Keeping the last card lit
       there stops a crossing from reading as a blink; leaving the fan still
       clears it, below. */
  };

  /*
   * Clearing is driven from the pointer's own position, not from a boundary
   * event. The deck's box does not contain the fan -- the cards are translated
   * down out of it -- so its leave fires while the pointer is still on a card,
   * and it is the one event that must not be believed.
   */
  useEffect(() => {
    if (hovered === null) return;
    const onMove = (ev: PointerEvent) => {
      const list = zones.current;
      if (!list.length) return;
      const pad = 32;
      const left = Math.min(...list.map((z) => z.r.left)) - pad;
      const right = Math.max(...list.map((z) => z.r.right)) + pad;
      const top = Math.min(...list.map((z) => z.r.top)) - pad;
      const bottom = Math.max(...list.map((z) => z.r.bottom)) + pad;
      if (ev.clientX < left || ev.clientX > right || ev.clientY < top || ev.clientY > bottom) {
        setHovered(null);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [hovered]);

  return (
    <section
      id="scale"
      className="relative flex min-h-[100svh] w-full items-center py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <span className="badge-pill">Community</span>

        <div className="mt-6">
          <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
            Built at Scale
          </LitTitle>
        </div>

        <ScrollCopy className="mt-5 max-w-[42ch] text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone">
          Echem&apos;s strength goes beyond classroom attendance. Our physical and
          digital platforms create continuous connections with students throughout
          their A/L journey.
        </ScrollCopy>

        {/* ── The fan. Wide screens only: 1060px of deck needs the room. ── */}
        <div
          ref={deckRef}
          onPointerEnter={measure}
          onPointerMove={onDeckMove}
          className="mt-14 hidden justify-center md:mt-16 lg:flex"
        >
          {CARDS.map((card, i) => {
            const lifted = hovered === i;
            return (
              /* The hit target. It sits at the resting pose and stays there;
                 everything hover does happens to the card inside it. */
              <div
                key={card.label}
                data-card-index={i}
                className="shrink-0 cursor-pointer"
                style={{
                  width: CARD_W,
                  marginLeft: i === 0 ? 0 : STRIP - CARD_W,
                  zIndex: lifted ? 20 : i + 1,
                  transformOrigin: "bottom center",
                  transform: `translateY(${card.drop}px) rotate(${card.rotate}deg)`,
                }}
              >
                <ScaleCard
                  card={card}
                  lifted={lifted}
                  dimmed={hovered !== null && !lifted}
                  className="h-[250px]"
                  style={{
                    /* The card is 260 wide but only STRIP of it is uncovered,
                       and the padding eats into that. */
                    ["--label-max" as string]: `${STRIP - 24}px`,
                    transformOrigin: "bottom center",
                    /* The lift, written as what it adds to the pose the wrapper
                       already holds rather than as an absolute one. It composes
                       inside the wrapper's rotation, so the 26px rise leans a
                       few pixels with the card -- six at the ends of the fan,
                       where the tilt is 14 degrees. */
                    transform: lifted
                      ? `translateY(-26px) rotate(${(card.rotate * 0.35 - card.rotate).toFixed(2)}deg) scale(1.05)`
                      : "none",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Below that, the same cards two up. Five of them leaves the last
            one alone on its row, which is why it is the widest number. ── */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
          {PHONE_CARDS.map((card, i) => (
            <ScaleCard
              key={card.label}
              card={card}
              className={
                "min-h-[190px] sm:min-h-[210px] " +
                (i === PHONE_CARDS.length - 1 ? "col-span-2" : "")
              }
            />
          ))}
        </div>

        {/* The proposal's sixth cell. It carries no figure, so it stays a line
            rather than a card -- but it keeps both halves of what the slide
            says, the claim and what the claim covers. */}
        <p className="eyebrow mt-14 text-center md:mt-16">
          Island-Wide <span className="text-red-hot">·</span> Physical + Digital
          Student Reach
        </p>
      </div>
    </section>
  );
}
