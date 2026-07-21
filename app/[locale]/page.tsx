import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { UniversalInput } from "@/components/input/UniversalInput";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold text-balance sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="text-lg text-balance text-muted-foreground">
          {t("subheading")}
        </p>
      </div>
      <UniversalInput />
    </div>
  );
}
