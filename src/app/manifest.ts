import type { MetadataRoute } from "next";

import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { THEME_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: DEFAULT_SETTINGS.companyName,
    short_name: "WirelessCom",
    description: DEFAULT_SETTINGS.description,
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: THEME_COLOR,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
