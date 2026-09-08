import type { Metadata, Viewport } from "next";
import { Anton, Inter_Tight, JetBrains_Mono, Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/providers/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import Grain from "@/components/ui/Grain";
import Starfield from "@/components/ui/Starfield";
import ThemeTuner from "@/components/ui/ThemeTuner";

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
 * The Sinhala face, for the auditions copy.
 *
 * None of the three families above carry Sinhala glyphs, so without this the
 * block renders in whatever the device happens to ship — Nirmala UI on Windows,
 * something else on Android — and the line rhythm changes per platform. Declared
 * here because a font has to be in the root layout to expose its variable, but
 * the files are only fetched by a page that actually paints Sinhala.
 */
const notoSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-sinhala",
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
  "Ten thousand people, one stage, produced by ECheM — the fourth event of Sri Lanka's " +
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
      className={`${anton.variable} ${interTight.variable} ${jetbrains.variable} ${notoSinhala.variable} h-full antialiased`}
    >
      {/* No background here: it is set on <html>, so the hero footage can sit on a
          negative z-index and still be seen. */}
      <body className="min-h-full text-bone">
        {/*
          Refuse the browser's scroll restoration, before it happens.
          
          On a reload the browser puts the page back where it was, and this one
          is scroll-driven: every animation on it reads a scroll position. The
          page would come up at the old offset with the hero timeline already at
          its end -- wordmark, badges and button faded out, the tower seeked to a
          late frame -- and only then get pulled to the top. Measured at 220ms of
          it, and whether the hero came back depended on whether ScrollTrigger
          was told about the correction in time.

          SmoothScroll asks for `manual` too, but it asks from an effect: by then
          the restore has already happened, and the router sets the flag back to
          `auto` about 50ms later, so the request never survives to the reload it
          was meant to prevent. Asking here runs before hydration and before the
          restore, and runs again on every load, which is what makes it stick.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'if("scrollRestoration" in history)history.scrollRestoration="manual";',
          }}
        />
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
        {/* Ships. The point is for whoever is looking at the site to be able
            to try a colour on it, not just whoever is building it. */}
        <ThemeTuner />
      </body>
    </html>
  );
}
