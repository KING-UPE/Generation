import LitTitle from "@/components/ui/LitTitle";
import ScrollCopy from "@/components/ui/ScrollCopy";
import CountFigure from "@/components/ui/CountFigure";

const TITLE_SIZE = "text-[clamp(2.6rem,7.5vw,8.5rem)] leading-[0.9] tracking-[-0.025em]";

/** The 26 outlook, broken out of the headline figure. */
const SPLIT = [
  { value: 13500, label: "In the room" },
  { value: 240000, label: "Livestream" },
  { value: 300000, label: "Social" },
  { value: 200000, label: "Elsewhere" },
];

export default function Projection() {
  return (
    <section
      id="projection"
      className="relative flex min-h-[100svh] w-full items-center py-24 md:py-32"
    >
      <div className="mx-auto flex w-full max-w-(--maxw) flex-col items-center px-(--gutter) text-center">
        <span className="badge-pill">Generation 26</span>

        <div className="mt-6">
          <LitTitle className={TITLE_SIZE} radius={340} weight={1.9}>
            Projection
          </LitTitle>
        </div>

        <ScrollCopy className="mt-5 max-w-[36ch] text-[clamp(0.875rem,1.05vw,1.15rem)] font-medium leading-[1.65] text-bone">
          Once in the room. Everywhere else after.
        </ScrollCopy>

        <CountFigure
          value={650000}
          label="Total reach and engagement"
          size="clamp(3rem, 11vw, 8.5rem)"
          className="mt-14 md:mt-20"
        />

        <div className="mt-14 grid w-full grid-cols-2 gap-x-6 gap-y-10 text-left md:mt-20 md:grid-cols-4">
          {SPLIT.map((s) => (
            <CountFigure
              key={s.label}
              value={s.value}
              label={s.label}
              className="border-t border-hairline pt-5"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
