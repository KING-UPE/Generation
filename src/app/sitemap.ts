import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://generation26.lk";

/**
 * One route, because the site is one page — the sections are anchors on it,
 * not URLs, and listing anchors as separate entries is a well-known way to
 * look like duplicate content. Add entries here when real routes exist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
