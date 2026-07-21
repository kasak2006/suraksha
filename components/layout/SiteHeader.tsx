import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Link } from "@/lib/i18n/navigation";
import { LangSwitcher } from "./LangSwitcher";

export function SiteHeader() {
  const t = useTranslations("app");

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-primary"
        >
          <ShieldCheck className="size-6 shrink-0" aria-hidden />
          {t("name")}
        </Link>
        {/* LangSwitcher reads useSearchParams (to preserve ?q= across locales),
            which needs a Suspense boundary for static rendering. */}
        <Suspense fallback={<div className="h-11" aria-hidden />}>
          <LangSwitcher />
        </Suspense>
      </div>
    </header>
  );
}
