"use client";

import { useState } from "react";
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
 * ECheM's standing audience, before a single ticket moves.
 *
 * The gradients run bright to deep left to right, so the fan reads as one
 * graded sweep rather than five cards that happen to be red. Each is still
 * built from the palette — #FF3B2F through #8B0212 — with the card's own black
 * underneath, which is what keeps them apart without reaching for a second hue.
 */
const CARDS: Card[] = [
  {
    value: 20000,
    label: "Students",
    icon: <IconStudents />,
    from: "#FF3B2F",
    to: "#8B0212",
    rotate: -14,
    drop: 46,
  },
  {
    value: 325000,
    label: "YouTube",
    icon: <IconYouTube />,
    from: "#F42020",
    to: "#6E0212",
    rotate: -7,
    drop: 13,
  },
  {
    value: 209000,
    label: "Telegram",
    icon: <IconTelegram />,
    from: "#E10600",
    to: "#4A0210",
    rotate: 0,
    drop: 0,
  },
  {
    value: 86000,
    label: "Facebook",
    icon: <IconFacebook />,
    from: "#C40E26",
    to: "#3A020C",
    rotate: 7,
    drop: 13,
  },
  {
    value: 41000,
    label: "TikTok",
    icon: <IconTikTok />,
    from: "#A0041A",
    to: "#26040A",
    rotate: 14,
    drop: 46,
  },
];

/**
 * Card width and how much of it the next card covers.
 *
 * The overlap is the whole design problem here: fanned tightly the deck looks
 * better and every figure but the last is cut in half by the card in front. So
 * the exposed strip — 200px — is set from the widest number the section
 * carries, and the cards are made wide enough to be worth looking at on top of
 * that rather than the other way round.
 */
const CARD_W = 260;
const STRIP = 200;

const EASE = "all 0.45s cubic-bezier(0.16, 1, 0.3, 1)";

function ScaleCard({
  card,
  lifted,
  dimmed,
  onEnter,
  onLeave,
  className = "",
  style,
}: {
  card: Card;
  lifted?: boolean;
  dimmed?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={
        "relative flex flex-col justify-between overflow-hidden rounded-[26px] p-6 " +
        className
      }
      style={{
        background: `linear-gradient(158deg, ${card.from} 0%, ${card.to} 58%, #0B0509 100%)`,
        boxShadow: lifted
          ? "0 26px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.16) inset"
          : "0 18px 44px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.10) inset",
        opacity: dimmed ? 0.62 : 1,
        transition: EASE,
        ...style,
      }}
    >
      <span
        aria-hidden
        className="inline-flex h-11 w-11 items-center justify-center text-white/90"
      >
        {card.icon}
      </span>

      {/* The figure gets its own ground: the gradient is at its lightest under
          the top of the card, and white numerals on it would sit flat. */}
      <div className="rounded-2xl bg-black/45 px-4 py-4 backdrop-blur-sm">
        <CountFigure
          layout="stack"
          value={card.value}
          label={card.label}
          size="clamp(1.75rem, 2.6vw, 2.1rem)"
        />
      </div>
    </div>
  );
}

export default function Scale() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      id="scale"
      className="relative flex min-h-[100svh] w-full items-center py-24 md:py-32"
    >
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter)">
        <span className="badge-pill">Community</span>

        <div className="mt-6">
          <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
            Scale
          </LitTitle>
        </div>

        <ScrollCopy className="mt-5 max-w-[42ch] text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone">
          They already show up. Every day, on every screen.
        </ScrollCopy>

        {/* ── The fan. Wide screens only: five overlapping cards need about a
            thousand pixels before the exposed strip is worth anything. ── */}
        <div className="mt-16 hidden justify-center lg:flex">
          {CARDS.map((card, i) => {
            const lifted = hovered === i;
            return (
              <ScaleCard
                key={card.label}
                card={card}
                lifted={lifted}
                dimmed={hovered !== null && !lifted}
                onEnter={() => setHovered(i)}
                onLeave={() => setHovered(null)}
                className="h-[310px] shrink-0 cursor-pointer"
                style={{
                  width: CARD_W,
                  marginLeft: i === 0 ? 0 : STRIP - CARD_W,
                  zIndex: lifted ? 20 : i + 1,
                  transformOrigin: "bottom center",
                  transform: lifted
                    ? `translateY(${card.drop - 26}px) rotate(${card.rotate * 0.35}deg) scale(1.05)`
                    : `translateY(${card.drop}px) rotate(${card.rotate}deg)`,
                }}
              />
            );
          })}
        </div>

        {/* ── Below that the fan becomes a plain deck, one or two up. ── */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:hidden">
          {CARDS.map((card) => (
            <ScaleCard key={card.label} card={card} className="min-h-[210px]" />
          ))}
        </div>

        <p className="eyebrow mt-14 md:mt-16">
          Island-wide <span className="text-red-hot">·</span> physical and digital
        </p>
      </div>
    </section>
  );
}
