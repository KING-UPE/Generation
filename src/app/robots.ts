import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://generation26.lk";

/**
 * Generated rather than a static file, so the sitemap line carries the same
 * origin as the rest of the metadata instead of a hard-coded domain that goes
 * stale the first time the site moves.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
