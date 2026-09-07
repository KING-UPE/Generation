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
      url: `${SITE_URL}/auditions`,
      lastModified: new Date(),
      /* The form list changes while calls are open, then stops. */
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
