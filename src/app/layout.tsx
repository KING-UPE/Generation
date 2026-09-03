import type { Metadata, Viewport } from "next";
import { Anton, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/providers/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import Grain from "@/components/ui/Grain";
import Starfield from "@/components/ui/Starfield";
import dynamic from "next/dynamic";

/**
 * The scroll-feel panel, kept out of production entirely.
 *
 * A plain import plus a `NODE_ENV` guard around the JSX is not enough — the
 * guard drops the element but the module stays in the graph, and it was
 * measurably shipping in a chunk the built page referenced. Behind a dynamic
 * import the ternary resolves at build time and the production branch has no
 * import to follow.
 */
const ScrollTuner =
  process.env.NODE_ENV === "production"
    ? () => null
    : dynamic(() => import("@/components/dev/ScrollTuner"));

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * The canonical origin, used to make every URL in the metadata absolute.
 *
 * Crawlers and the social scrapers will not resolve a relative `og:image`, so
 * without a real value here the card silently fails to render anywhere it is
 * shared. Set NEXT_PUBLIC_SITE_URL in the deploy environment; the fallback is
 * only so local builds resolve.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://generation26.lk";

const TITLE = "Generation 26 — Talents by ECheM";
const DESCRIPTION =
  "Generation 26 lands at the Lotus Tower Open Arena, Colombo on Saturday 12 December 2026. " +
  "Ten thousand people, one stage, produced by ECheM — the fourth edition of Sri Lanka's " +
  "Generation live music series.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    /* Any future route gets its own name in front of the brand. */
    template: "%s — Generation 26",
  },
  description: DESCRIPTION,
  applicationName: "Generation 26",
  keywords: [
    "Generation 26",
    "ECheM",
    "Colombo concert",
    "Lotus Tower Open Arena",
    "Sri Lanka live music",
    "music festival Sri Lanka",
    "Colombo events 2026",
    "live music Colombo",
  ],
  authors: [{ name: "ECheM" }],
  creator: "ECheM",
  publisher: "ECheM",
  category: "music",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Generation 26",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    locale: "en_LK",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  /* `opengraph-image.png` and `twitter-image.png` sit beside this file, so Next
     emits og:image and twitter:image — with dimensions and type — on its own.
     Listing them here as well would duplicate the tags. */
};

/**
 * Structured data for the event itself.
 *
 * The page reads as a brand site to a crawler — the date and venue only ever
 * appear inside a scroll-driven card. This states them in a form Google can
 * actually use, which is what makes an event eligible for the date-and-venue
 * rich result rather than a plain blue link.
 */
const EVENT_JSONLD = {
  "@context": "https://schema.org",
  "@type": "MusicEvent",
  name: "Generation 26",
  description: DESCRIPTION,
  /* Date only, deliberately. Doors and set times are not known here, and a
     guessed clock time in structured data is a wrong fact served to Google.
     Add the time — and a `performer` and `offers` block once the line-up and
     ticketing exist — when they are real. */
  startDate: "2026-12-12",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  image: [`${SITE_URL}/opengraph-image.png`],
  url: SITE_URL,
  location: {
    "@type": "Place",
    name: "Lotus Tower Open Arena",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Colombo",
      addressCountry: "LK",
    },
  },
  organizer: { "@type": "Organization", name: "ECheM", url: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${interTight.variable} ${jetbrains.variable} h-full antialiased`}
    >
      {/* No background here: it is set on <html>, so the hero footage can sit on a
          negative z-index and still be seen. */}
      <body className="min-h-full text-bone">
        <script
          type="application/ld+json"
          /* Serialised through JSON.stringify from a literal we control — no
             user input reaches it. */
          dangerouslySetInnerHTML={{ __html: JSON.stringify(EVENT_JSONLD) }}
        />
        <Starfield />
        <SmoothScroll>
          <main className="relative flex min-h-full flex-col">{children}</main>
        </SmoothScroll>
        <Cursor />
        <Grain />
        {/* Delete this line and the component once the scroll feel is settled. */}
        <ScrollTuner />
      </body>
    </html>
  );
}
