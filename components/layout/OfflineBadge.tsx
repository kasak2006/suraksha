"use client";

import { Check, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/*
 * A small connectivity indicator (spec §5.8): "Works offline ✓" normally, and
 * "You're offline" when the network drops — proof to the user (and the jury)
 * that the app keeps working with no data plan. Renders nothing until mounted to
 * avoid an SSR/CSR mismatch on navigator.onLine.
 */
export function OfflineBadge() {
  const t = useTranslations("pwa");
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setMounted(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!mounted) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      role="status"
    >
      {online ? (
        <>
          <Check className="size-4" aria-hidden />
          {t("worksOffline")}
        </>
      ) : (
        <>
          <WifiOff className="size-4" aria-hidden />
          {t("offline")}
        </>
      )}
    </span>
  );
}
