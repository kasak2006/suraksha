import { useTranslations } from "next-intl";
import { OfflineBadge } from "./OfflineBadge";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-6">
        <OfflineBadge />
        <p className="text-sm text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
