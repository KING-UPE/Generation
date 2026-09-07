import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";
import { IconTelegram, IconWhatsApp } from "@/components/ui/icons";

const DESCRIPTION =
  "Auditions for Generation 26 — singing, dancing, drama, announcing, instruments, " +
  "script writing, art and photography. Talents by ECheM, Lotus Tower Open Arena, " +
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

const TAGS = ["#8th_Batch", "#Generation26", "#Talents_By_ECHEM"];

type Form = { index: string; title: string; href: string };

function FormCard({ form }: { form: Form }) {
  return (
    <a
      href={form.href}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="link"
      className="cut-card group flex items-end justify-between gap-5 p-6 md:p-7"
    >
      <span className="flex flex-col gap-2.5">
        <span
          className="font-display leading-none text-red-hot"
          style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}
        >
          {form.index}
        </span>
        <span
          className="font-display leading-none tracking-[-0.01em] text-bone"
          style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.6rem)" }}
        >
          {form.title}
        </span>
      </span>
      <span
        aria-hidden
        className="text-red-hot transition-transform duration-500 group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  );
}

export default function AuditionsPage() {
  return (
    <div className="relative w-full pb-28 md:pb-40">
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
              className="pointer-events-none absolute -inset-4 rounded-[36px] bg-red-hot/15 blur-3xl"
            />

            <div className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0E0E14] shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
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

                {/* Top badge */}
                <div className="absolute left-5 top-5 flex items-center gap-2">
                  <span className="badge-pill bg-black/65 backdrop-blur-md">
                    Live Stage · Lotus Tower
                  </span>
                </div>

                {/* Bottom caption */}
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-red-hot">
                      December 12, 2026
                    </span>
                    <p className="font-display text-lg tracking-[-0.01em] text-bone sm:text-xl">
                      Lotus Tower Open Arena
                    </p>
                  </div>
                  <span className="font-mono-ui text-[11px] tracking-[0.2em] text-white/50">
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
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDITIONS.map((f) => (
            <FormCard key={f.href} form={f} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-16 md:pt-24">
        <p className="eyebrow">Behind it</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {JOIN.map((f) => (
            <FormCard key={f.href} form={f} />
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
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </Magnetic>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-20 w-full max-w-(--maxw) border-t border-hairline px-(--gutter) pt-8 md:mt-28">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <p className="font-mono-ui text-[11px] tracking-[0.22em] text-dim">
            {TAGS.join("  ")}
          </p>
          <p className="font-sinhala text-[11px] tracking-[0.12em] text-dim">
            Chemistry | අමිල දසනායක
          </p>
        </div>
      </footer>
    </div>
  );
}
