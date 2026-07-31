"use client";

import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/*
 * PWA install prompt (spec §5.8, C3) — how Suraksha becomes an installable
 * "app" with no mobile toolchain. We capture the browser's beforeinstallprompt
 * event and surface our own localised button, so it fits the design system and
 * the user's language. Browsers that don't fire the event (iOS Safari, or an
 * already-installed app) simply never show the banner.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "suraksha:install-dismissed";

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e: Event) => {
      e.preventDefault(); // Stop Chrome's default mini-infobar; we show our own.
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  const dismiss = () => {
    setDeferred(null);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage blocked — dismissing for this session is fine.
    }
  };

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-4 shadow-lg">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
        <Download className="size-6 shrink-0 text-primary" aria-hidden />
        <p className="flex-1 text-base font-medium">{t("installPitch")}</p>
        <Button type="button" variant="accent" onClick={install}>
          {t("install")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={dismiss}
          aria-label={t("dismiss")}
        >
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}
