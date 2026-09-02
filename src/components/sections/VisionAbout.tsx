"use client";

import CardStack from "@/components/ui/CardStack";
import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";

const VISION_CARDS = [
  { src: "/img/stage.svg", alt: "Performer under stage lights" },
  { src: "/img/poster.svg", alt: "Generation 26 key art" },
];

const ABOUT_CARDS = [
  { src: "/img/lights.svg", alt: "Stage beams over the floor" },
  { src: "/img/crowd.svg", alt: "Crowd with hands raised" },
];

const TITLE_SIZE = "text-[clamp(4rem,15vw,13rem)] leading-[0.9] tracking-[-0.02em]";

type PanelProps = {
  id: string;
  title: string;
  copy: string;
  cards: { src: string; alt: string }[];
  reverse?: boolean;
};

function Panel({ id, title, copy, cards, reverse = false }: PanelProps) {
  return (
    <section
      id={id}
      className="relative mx-auto w-full max-w-(--maxw) scroll-mt-24 px-(--gutter) py-20 md:py-28"
    >
      <div className={reverse ? "lg:text-right" : undefined}>
        <LitTitle className={TITLE_SIZE} radius={300} weight={1.8}>
          {title}
        </LitTitle>
      </div>

      <div className="mt-8 grid gap-8 md:mt-10 lg:grid-cols-12 lg:gap-12">
        <div
          className={
            "pull-into-title lg:row-start-1 lg:self-start lg:col-span-7 " +
            (reverse ? "lg:col-start-1" : "lg:col-start-6")
          }
        >
          <CardStack cards={cards} parallax={reverse ? 34 : 46} />
        </div>

        <div
          className={
            "pull-into-title-half lg:row-start-1 lg:self-center lg:col-span-4 " +
            (reverse ? "lg:col-start-9" : "lg:col-start-1")
          }
        >
          <ScrollCopy className="max-w-[44ch] text-[clamp(0.95rem,1.05vw,1.05rem)] leading-[1.9]">
            {copy}
          </ScrollCopy>
        </div>
      </div>
    </section>
  );
}

export default function VisionAbout() {
  return (
    <>
      <Panel
        id="vision"
        title="Vision"
        copy="One night where a generation shows up loud. We build the stage, the sound and the room around them, so the music is the only thing anyone leaves remembering."
        cards={VISION_CARDS}
      />

      <Panel
        id="about"
        title="About"
        copy="Generation is produced by ECheM. Live performance, design and sound engineering held to a single production standard, for an audience that still turns up in person."
        cards={ABOUT_CARDS}
        reverse
      />
    </>
  );
}
