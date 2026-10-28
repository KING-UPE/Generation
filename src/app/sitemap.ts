import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://generation26.lk";

/**
 * Real routes only. The landing page's sections are anchors on it, not URLs,
 * and listing anchors as separate entries is a well-known way to look like
 * duplicate content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: new Date(),
      /* Last year's photographs: they only change when a new set is added. */
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];
}
