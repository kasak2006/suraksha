"use client";

import { PhoneOff, ShieldX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { ArchetypeMatch } from "@/lib/engine/archetypes";
import { Link } from "@/lib/i18n/navigation";
import { cancelSpeech, speak } from "@/lib/speech/tts";

/*
 * The full-screen DANGER interrupt (spec §5.3). When the live call score hits
 * DANGER, everything else is covered by a red overlay, the warning is spoken
 * aloud, and the phone vibrates — so a panicking user cannot miss it. Reserved
 * verdict colours are allowed here (eslint allowlist).
 */
export function DangerInterrupt({
  archetype,
  onDismiss,
}: {
  archetype: ArchetypeMatch | null;
  onDismiss: () => void;
}) {
  const t = useTranslations("call");
  const locale = useLocale();

  // Speak the warning and buzz the phone once, when the overlay appears.
  useEffect(() => {
    speak(t("dangerWarning"), locale);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([400, 150, 400]);
    }
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-verdict-danger p-6 text-center text-verdict-danger-foreground"
      role="alertdialog"
      aria-modal="true"
      aria-label={t("dangerTitle")}
    >
      <ShieldX className="size-20" aria-hidden />
      <h2 className="text-3xl font-bold text-balance">{t("dangerTitle")}</h2>
      <p className="max-w-md text-xl leading-relaxed text-balance">
        {t("dangerWarning")}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button
          type="button"
          onClick={onDismiss}
          className="w-full bg-card text-lg font-bold text-foreground hover:bg-muted"
        >
          <PhoneOff aria-hidden />
          {t("dangerAck")}
        </Button>
        {archetype && (
          <Button
            asChild
            variant="outline"
            className="w-full border-verdict-danger-foreground bg-transparent text-verdict-danger-foreground hover:bg-verdict-danger-foreground/10"
          >
            <Link href={`/playbook/${archetype.id}`}>{t("viewPlaybook")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
