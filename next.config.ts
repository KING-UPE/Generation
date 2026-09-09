import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Who may pull dev-only assets off the dev server.
   *
   * Next blocks cross-origin requests to /_next/static and /_next/hmr in
   * development, and the origin it allows is the one the server was started
   * with -- localhost. Open the site on a phone over the LAN and every
   * JavaScript chunk is refused: the HTML still arrives, so the preloader
   * paints its server-rendered frame and stops there. Nothing hydrates, the
   * counter never leaves 00, and it reads as the site failing to load.
   *
   * Development only. A production build serves its assets normally and is
   * unaffected by this.
   */
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
