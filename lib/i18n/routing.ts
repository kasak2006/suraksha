import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["gu", "hi", "en"],
  defaultLocale: "gu",
  // Gujarati-first is the whole pitch (spec §6, C6). Without this, the bare "/"
  // detects the browser's Accept-Language and an English phone would never see
  // Gujarati first. Disabling detection makes "/" always land on /gu; users
  // switch languages explicitly with the header control.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
