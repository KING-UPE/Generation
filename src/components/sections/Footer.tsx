"use client";

import React from "react";
import Link from "next/link";
import {
  IconWhatsApp,
  IconTelegram,
  IconArrowUpRight,
} from "@/components/ui/icons";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-hairline bg-ink-2 text-bone">
      <div className="mx-auto w-full max-w-(--maxw) px-(--gutter) py-12 md:py-16">
        {/* Main Grid: Brand summary + Quick Columns */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand Identity */}
          <div className="flex flex-col justify-between">
            <div>
              <Link href="/" className="inline-block group">
                <span className="font-display text-2xl font-bold tracking-tight text-bone group-hover:text-red-hot transition-colors duration-200">
                  GENERATION <span className="text-red-hot">26</span>
                </span>
              </Link>
              <p className="mt-3 text-xs font-mono text-dim leading-relaxed max-w-xs">
                Live Stage & Arena Experience at Lotus Tower, Colombo. Produced by ECheM.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-dim">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-hot animate-pulse" />
              <span>COLOMBO · LOTUS TOWER ARENA</span>
            </div>
          </div>

          {/* Column 1: Auditions */}
          <div>
            <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
              Auditions
            </span>
            <ul className="space-y-3 font-medium text-xs sm:text-sm">
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>Talent Forms</span>
                  <IconArrowUpRight className="h-3.5 w-3.5 text-red-hot transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200"
                >
                  Singing & Dancing
                </Link>
              </li>
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200"
                >
                  Drama & Acting
                </Link>
              </li>
              <li>
                <Link
                  href="/auditions"
                  className="hover:text-red-hot transition-colors duration-200"
                >
                  Organizing Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Official Channels */}
          <div>
            <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
              Channels
            </span>
            <ul className="space-y-3 font-medium text-xs sm:text-sm">
              <li>
                <a
                  href="https://t.me/Generation_26"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                >
                  <IconTelegram className="h-4 w-4 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                  <span>Telegram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://whatsapp.com/channel/0029Vb41Gqw1iUxZyLIiYX0M"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-red-hot transition-colors duration-200 flex items-center gap-2 group"
                >
                  <IconWhatsApp className="h-4 w-4 text-red-hot/80 group-hover:text-red-hot transition-colors" />
                  <span>WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Event Info */}
          <div>
            <span className="font-mono uppercase text-dim tracking-[0.18em] text-[11px] mb-5 block">
              Event
            </span>
            <ul className="space-y-2 text-xs font-mono text-dim">
              <li className="text-bone font-medium">Generation 26</li>
              <li>Lotus Tower Open Arena</li>
              <li>Colombo, Sri Lanka</li>
              <li className="text-red-hot font-medium pt-1">Saturday, Dec 12, 2026</li>
              <li>Produced by ECheM</li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution & Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-dim uppercase tracking-wider mt-12 pt-6 border-t border-hairline/60 gap-4">
          <p className="text-center sm:text-left">
            © 2017 – 2026 Generation. All rights reserved.{" "}
            <span className="mx-2 hidden sm:inline text-hairline">/</span> Produced by ECheM
          </p>

          <p className="text-center sm:text-right">
            Developed by{" "}
            <a
              href="https://w3s.lk/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white hover:text-red-hot transition-colors duration-200 decoration-hairline hover:decoration-red-hot underline-offset-4"
            >
              W3S Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
