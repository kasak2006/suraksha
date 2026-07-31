import { GraduationCap, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Link } from "@/lib/i18n/navigation";
import { LangSwitcher } from "./LangSwitcher";

export function SiteHeader() {
  const t = useTranslations("app");
  const tl = useTranslations("learn");

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
        <div className="flex items-center gap-2">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GraduationCap className="size-5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{tl("nav")}</span>
          </Link>
          {/* LangSwitcher reads useSearchParams (to preserve ?q= across locales),
              which needs a Suspense boundary for static rendering. */}
          <Suspense fallback={<div className="h-11" aria-hidden />}>
            <LangSwitcher />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
