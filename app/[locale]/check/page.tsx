import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { CheckClient } from "./CheckClient";

export default function CheckPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <Suspense>
      <CheckClient />
    </Suspense>
  );
}
