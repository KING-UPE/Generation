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

/** ECheM's standing audience, before a single ticket moves. */
const FIGURES = [
  { value: 20000, label: "Students", icon: <IconStudents /> },
  { value: 325000, label: "YouTube", icon: <IconYouTube /> },
  { value: 209000, label: "Telegram", icon: <IconTelegram /> },
  { value: 86000, label: "Facebook", icon: <IconFacebook /> },
  { value: 41000, label: "TikTok", icon: <IconTikTok /> },
];

export default function Scale() {
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

        {/* One up on a phone: a mark this size plus a six-figure number will
            not sit in half of a 375px screen. */}
        <div className="mt-14 grid gap-x-8 gap-y-9 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
          {FIGURES.map((f) => (
            <CountFigure
              key={f.label}
              value={f.value}
              icon={f.icon}
              label={f.label}
              className="border-t border-hairline pt-5"
            />
          ))}
        </div>

        <p className="eyebrow mt-12 md:mt-16">
          Island-wide <span className="text-red-hot">·</span> physical and digital
        </p>
      </div>
    </section>
  );
}
