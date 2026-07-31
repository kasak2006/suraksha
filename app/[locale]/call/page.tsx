import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { CallClient } from "./CallClient";

export default function CallPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return <CallClient />;
}
