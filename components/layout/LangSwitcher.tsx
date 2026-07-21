"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

export function LangSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languages");
  const router = useRouter();
  const pathname = usePathname();
  // next-intl's usePathname() strips the query string; preserve it so
  // switching language on a state-carrying route (e.g. /check?q=…) keeps the
  // message instead of dropping to the empty state.
  const searchParams = useSearchParams();

  return (
    <nav
      aria-label={t("switchLabel")}
      className="flex items-center gap-1 rounded-full border border-border bg-card p-1"
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-current={l === locale ? "true" : undefined}
          onClick={() => {
            const query = searchParams.toString();
            router.replace(
              query ? `${pathname}?${query}` : pathname,
              { locale: l },
            );
          }}
          className={cn(
            "h-11 min-w-16 rounded-full px-3 text-sm font-semibold transition-colors",
            l === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {t(l)}
        </button>
      ))}
    </nav>
  );
}
