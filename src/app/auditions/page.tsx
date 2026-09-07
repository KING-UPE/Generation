import type { Metadata } from "next";
import Link from "next/link";
import RevealText from "@/components/ui/RevealText";
import Magnetic from "@/components/ui/Magnetic";

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
  { title: "Telegram", href: "https://t.me/Generation_26" },
  {
    title: "WhatsApp",
    href: "https://whatsapp.com/channel/0029Vb41Gqw1iUxZyLIiYX0M",
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
        <span className="font-mono-ui text-[11px] tracking-[0.26em] text-red-hot">
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

      <section className="mx-auto w-full max-w-(--maxw) px-(--gutter) pt-16 md:pt-24">
        <RevealText
          as="h1"
          type="chars"
          stagger={0.038}
          y={104}
          className="font-display select-none text-[clamp(2.75rem,11vw,10rem)] leading-[0.85] tracking-[-0.015em] text-bone"
        >
          Auditions
        </RevealText>

        <div className="font-sinhala mt-10 flex max-w-[62ch] flex-col gap-5 text-[clamp(0.95rem,1.1vw,1.15rem)] leading-[1.9] text-bone-muted md:mt-14">
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

        <div className="cut-card-red mt-10 max-w-[62ch] p-6 md:p-7">
          <p className="eyebrow">Required on every form</p>
          <p className="font-sinhala mt-3 text-[clamp(0.9rem,1.05vw,1.05rem)] leading-[1.85] text-bone">
            එහි ඔබගේ නම, Contact Number, පන්තියට සහභාගී වූ ආකාරය (Online ලෙස හෝ
            භෞතිකව නම් සම්බන්ධ වූ ආයතනය), Batch එක සහ Student ID එක අනිවාර්යයෙන්
            සඳහන් කරන්න.
          </p>
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
        <div className="mt-7 flex flex-wrap items-center gap-4">
          {CHANNELS.map((c) => (
            <Magnetic key={c.href} strength={16}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="cut-btn-outline group gap-3"
              >
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
