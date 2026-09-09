import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";
import { IconTelegram, IconWhatsApp } from "@/components/ui/icons";
import Footer from "@/components/sections/Footer";

const DESCRIPTION =
  "Auditions for Generation 26 — singing, dancing, drama, announcing, instruments, " +
  "script writing, art and photography. Talents by Echem, Lotus Tower Open Arena, " +
  "Colombo, 12 December 2026.";

export const metadata: Metadata = {
  title: "Auditions",
  description: DESCRIPTION,
  alternates: { canonical: "/auditions" },
  openGraph: {
    type: "website",
    siteName: "Generation 26",
    title: "Auditions — Generation 26",
    description: DESCRIPTION,
    url: "/auditions",
    locale: "en_LK",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auditions — Generation 26",
    description: DESCRIPTION,
  },
};

/** The eight talent forms, in the order they were announced. */
const AUDITIONS = [
  { index: "01", title: "Singing", href: "https://forms.gle/Rn31tLkLLpUdeTWx6" },
  { index: "02", title: "Dancing", href: "https://forms.gle/UjFWe64ufTXyCmYx6" },
  { index: "03", title: "Drama", href: "https://forms.gle/t85Y7u51RmWHkzxR8" },
  { index: "04", title: "Announcing", href: "https://forms.gle/JZwDGXeQxrJw14AB6" },
  { index: "05", title: "Instruments", href: "https://forms.gle/KGgmTK2mYqE71nCZ6" },
  { index: "06", title: "Script Writing", href: "https://forms.gle/r8BaksCqAmEzJnrD8" },
  { index: "07", title: "Art & Photography", href: "https://forms.gle/8VUeYiSTGNo7d2989" },
  { index: "08", title: "Other Talents", href: "https://forms.gle/nD8bXMiFtDTH7wVW8" },
];

/** Ways in that are not a performance. */
const JOIN = [
  { index: "09", title: "Let's Make It Happen", href: "https://forms.gle/pRJgDrHWDcFGiEkT8" },
  { index: "10", title: "Talent Show Concepts", href: "https://forms.gle/Py5kFDyjVurvJ67FA" },
  { index: "11", title: "Organizing Team", href: "https://forms.gle/G1RGdgCAx7HNsK7F8" },
];

const CHANNELS = [
  {
    title: "Telegram",
    href: "https://t.me/Generation_26",
    icon: <IconTelegram className="h-7 w-7" />,
  },
  {
    title: "WhatsApp",
    href: "https://whatsapp.com/channel/0029Vb41Gqw1iUxZyLIiYX0M",
    icon: <IconWhatsApp className="h-7 w-7" />,
  },
];

const TAGS = ["#8th_Batch", "#Generation26", "#Talents_By_Echem"];

type Form = { index: string; title: string; href: string };

/**
 * A form link, built as a button rather than a card.
 *
 * These are the one thing on the page a reader is meant to press, and as cards
 * — a number, a title and an arrow in a panel — they read as something to look
 * at. `cut-btn-outline` is the site's own button: chamfered, hairline-ringed,
 * uppercase mono, and it goes red under the pointer, so there is no question
 * what it is. Full width and spread, so it fills its cell in the grid.
 */
function FormButton({ form }: { form: Form }) {
  return (
    <a
      href={form.href}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="link"
      className="cut-btn-outline group w-full flex-wrap justify-between gap-x-3 gap-y-1.5 sm:flex-col sm:gap-2"
    >
      <span className="flex items-center gap-3 whitespace-nowrap text-left sm:w-full">
        <span className="text-red-hot">{form.index}</span>
        {form.title}
      </span>

      {/* Beside the title on a phone, under it everywhere else.
          
          A phone shows one button per row, 290px of interior, and the longest
          title -- "07 Art & Photography" -- is 178px against an 80px label:
          292px for one line, two over. Tightening the label's tracking from
          0.2em to 0.14em buys back seven, so the full width gets used instead
          of the button growing a second line it does not need.

          From sm up the grid takes over and a cell is 227-259px, where one
          line cannot fit, so it stacks. w-full there rather than items-start:
          .cut-btn-outline sets align-items:center in unlayered CSS, which
          beats the utility, so the row is stretched to the button instead and
          its contents fall left on their own. */}
      <span className="flex shrink-0 items-center gap-2 text-red-hot sm:w-full">
        <span className="text-[11px] tracking-[0.14em]">Apply now</span>

        <svg
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </a>
  );
}

export default function AuditionsPage() {
  return (
    <div className="relative w-full">
      <header className="mx-auto flex w-full max-w-(--maxw) items-center justify-between gap-4 px-(--gutter) pt-8 md:pt-10">
        <Link
          href="/"
          scroll={false}
          data-cursor="link"
          className="badge-pill tap-target"
        >
          ← Generation 26
        </Link>
        <span className="badge-pill whitespace-nowrap">Colombo · 2026</span>
      </header>

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-14 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
          {/* Left Column: Heading, intro & requirements */}
          <div>
            <RevealText
              as="h1"
              type="chars"
              stagger={0.038}
              y={104}
              className="font-display select-none text-[clamp(2.75rem,10vw,8.5rem)] leading-[0.85] tracking-[-0.015em] text-bone"
            >
              Auditions
            </RevealText>

            <div className="font-sinhala mt-8 flex flex-col gap-4 text-[clamp(0.95rem,1.1vw,1.12rem)] leading-[1.85] text-bone-muted md:mt-12">
              <p>
                දෙසැම්බර් මාසේ 2026 ළමයින්ගේ විශේෂම මාසේ වෙන්න යන්නේ ඔන්න. 2026
                දෙසැම්බර් 12 වැනිදා, නෙළුම් කුළුණ එළිමහන් රංග පිටියේදී.
              </p>
              <p>අපි අද ඉඳලාම ඔයාලගේ හැකියාවන් එකතු කරන්න පටන් ගන්නවා.</p>
              <p>
                පහළින් එක එක දක්ෂතා සහ Generation 26 එකට සම්බන්ධ වෙන්න පුළුවන් ආකාර
                දක්වලා Google Forms දාලා තියෙනවා.
              </p>
            </div>

            <div className="cut-card-red mt-8 p-6 md:p-7">
              <p className="eyebrow">Required on every form</p>
              <p className="font-sinhala mt-3 text-[clamp(0.88rem,1.02vw,1.02rem)] leading-[1.8] text-bone">
                එහි ඔබගේ නම, Contact Number, පන්තියට සහභාගී වූ ආකාරය (Online ලෙස හෝ
                භෞතිකව නම් සම්බන්ධ වූ ආයතනය), Batch එක සහ Student ID එක අනිවාර්යයෙන්
                සඳහන් කරන්න.
              </p>
            </div>
          </div>

          {/* Right Column: Hero Stage Image */}
          <div className="relative mx-auto mt-4 w-full max-w-[440px] lg:mt-0 lg:max-w-none">
            {/* Ambient crimson glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 bg-red-hot/15 blur-3xl"
            />

            {/* Chamfered, not rounded: every card on this page is cut, and a
                rounded panel beside them reads as borrowed from somewhere else. */}
            <div className="cut-shape relative isolate overflow-hidden border border-hairline bg-ink-3 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
              <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5] lg:aspect-[3/4]">
                <Image
                  src="/img/auditions/hero.jpg"
                  alt="Live stage audition performance at Generation Lotus Tower"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                />

                {/* Cinematic bottom gradient fade */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />


                {/* Bottom caption */}
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <span className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-red-hot">
                      December 12, 2026
                    </span>
                    <p className="font-display text-lg tracking-[-0.01em] text-bone sm:text-xl">
                      Lotus Tower Open Arena
                    </p>
                  </div>
                  <span className="font-mono-ui text-[11px] tracking-[0.2em] text-dim">
                    GEN &apos;26
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-20 md:pt-28">
        <p className="eyebrow">Talents</p>
        {/* Four across only once a cell can hold the longest title: at 1024
            a quarter of the row leaves 170px of interior for a 210px line. */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AUDITIONS.map((f) => (
            <FormButton key={f.href} form={f} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-16 md:pt-24">
        <p className="eyebrow">Behind it</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {JOIN.map((f) => (
            <FormButton key={f.href} form={f} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-16 md:pt-24">
        <p className="eyebrow">Stay on it</p>
        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          {CHANNELS.map((c) => (
            <Magnetic key={c.href} strength={16} className="w-full sm:w-auto">
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="cut-btn-outline cut-btn-lg group w-full justify-center sm:w-auto"
              >
                <span className="text-red-hot">{c.icon}</span>
                {c.title}
                <svg
                  aria-hidden
                  className="h-4 w-4 text-red-hot transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </Magnetic>
          ))}
        </div>
      </section>

      <div className="mt-20 md:mt-28">
        <div className="mx-auto mb-8 w-full max-w-(--maxw) px-(--gutter) flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <p className="font-mono text-[11px] tracking-[0.22em] text-dim">
            {TAGS.join("  ")}
          </p>
          <p className="font-sinhala text-[11px] tracking-[0.12em] text-dim">
            Chemistry | අමිල දසනායක
          </p>
        </div>
        <Footer />
      </div>
    </div>
  );
}
