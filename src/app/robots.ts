import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/login",
          "/login/",
          "/portal",
          "/portal/",
          "/tech",
          "/tech/",
          "/work-orders",
          "/work-orders/",
          "/subscription",
          "/speed-test/r/",
          "/uploads/private",
        ],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}
