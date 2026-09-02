import type { Metadata, Viewport } from "next";
import { Anton, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/providers/SmoothScroll";
import Cursor from "@/components/ui/Cursor";
import Grain from "@/components/ui/Grain";
import Starfield from "@/components/ui/Starfield";

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

export const metadata: Metadata = {
  title: "Generation 26 — Talents by ECheM",
  description:
    "Generation 26. One night of live music in Colombo, produced by ECheM.",
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
        <Starfield />
        <SmoothScroll>
          <main className="relative flex min-h-full flex-col">{children}</main>
        </SmoothScroll>
        <Cursor />
        <Grain />
      </body>
    </html>
  );
}
