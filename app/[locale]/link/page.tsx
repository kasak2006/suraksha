import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LinkClient } from "./LinkClient";

export default function LinkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <LinkClient />;
}
