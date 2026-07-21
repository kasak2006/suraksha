import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-background">
      <p className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground">
        {t("disclaimer")}
      </p>
    </footer>
  );
}
