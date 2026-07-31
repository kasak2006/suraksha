import type { MetadataRoute } from "next";

/*
 * PWA manifest (spec §5.8, §11) — how we ship a "mobile app" with no mobile
 * toolchain (C3): the browser install prompt. Served at /manifest.webmanifest.
 *
 * The manifest is static and locale-agnostic, so the name stays in Latin script
 * (readable everywhere) while start_url points at the Gujarati-first entry (C6).
 * Colours come from the design tokens in globals.css (§8): indigo theme, warm
 * off-white background.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suraksha — Scam defence",
    short_name: "Suraksha",
    description:
      "Check a suspicious message, call, UPI request or link before you trust it — in Gujarati, Hindi and English. Works offline.",
    start_url: "/gu",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f3",
    theme_color: "#27346b",
    lang: "gu",
    dir: "ltr",
    categories: ["utilities", "education", "finance"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
